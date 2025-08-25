const express = require('express');
const dbSingleton = require('../../dbSingleton.js');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');

const router = express.Router();
const db = dbSingleton.getConnection();

// =====================================================
// LOCATIONS MANAGEMENT API
// This is developed in parallel and does NOT affect existing routes
// =====================================================

// Get all locations
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [locations] = await db.execute(`
            SELECT * FROM locations 
            WHERE is_active = 1 
            ORDER BY type, name
        `);
        
        res.json(locations);
    } catch (err) {
        console.error('Error fetching locations:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get location by ID
router.get('/:locationId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { locationId } = req.params;
        
        const [locations] = await db.execute(
            'SELECT * FROM locations WHERE location_id = ? AND is_active = 1',
            [locationId]
        );
        
        if (locations.length === 0) {
            return res.status(404).json({ message: 'Location not found' });
        }
        
        res.json(locations[0]);
    } catch (err) {
        console.error('Error fetching location:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Create new location
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, type, address, city, country } = req.body;
        
        if (!name || !type) {
            return res.status(400).json({ 
                message: 'Location name and type are required' 
            });
        }
        
        // Check if location with same name already exists
        const [existingLocation] = await db.execute(
            'SELECT location_id FROM locations WHERE name = ? AND is_active = 1',
            [name]
        );
        
        if (existingLocation.length > 0) {
            return res.status(400).json({ 
                message: 'Location with this name already exists' 
            });
        }
        
        // Create new location
        const [result] = await db.execute(`
            INSERT INTO locations (name, type, address, city, country)
            VALUES (?, ?, ?, ?, ?)
        `, [name, type, address, city, country]);
        
        const locationId = result.insertId;
        
        // Get the created location
        const [newLocation] = await db.execute(
            'SELECT * FROM locations WHERE location_id = ?',
            [locationId]
        );
        
        res.status(201).json({
            message: 'Location created successfully',
            location: newLocation[0]
        });
        
    } catch (err) {
        console.error('Error creating location:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Update location
router.put('/:locationId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { locationId } = req.params;
        const { name, type, address, city, country, is_active } = req.body;
        
        // Check if location exists
        const [existingLocation] = await db.execute(
            'SELECT * FROM locations WHERE location_id = ?',
            [locationId]
        );
        
        if (existingLocation.length === 0) {
            return res.status(404).json({ message: 'Location not found' });
        }
        
        // Check if name is being changed and if new name already exists
        if (name && name !== existingLocation[0].name) {
            const [nameCheck] = await db.execute(
                'SELECT location_id FROM locations WHERE name = ? AND location_id != ? AND is_active = 1',
                [name, locationId]
            );
            
            if (nameCheck.length > 0) {
                return res.status(400).json({ 
                    message: 'Location with this name already exists' 
                });
            }
        }
        
        // Update location
        await db.execute(`
            UPDATE locations 
            SET name = ?, type = ?, address = ?, city = ?, country = ?, is_active = ?
            WHERE location_id = ?
        `, [name, type, address, city, country, is_active, locationId]);
        
        // Get updated location
        const [updatedLocation] = await db.execute(
            'SELECT * FROM locations WHERE location_id = ?',
            [locationId]
        );
        
        res.json({
            message: 'Location updated successfully',
            location: updatedLocation[0]
        });
        
    } catch (err) {
        console.error('Error updating location:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Delete location (soft delete)
router.delete('/:locationId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { locationId } = req.params;
        
        // Check if location exists
        const [existingLocation] = await db.execute(
            'SELECT * FROM locations WHERE location_id = ?',
            [locationId]
        );
        
        if (existingLocation.length === 0) {
            return res.status(404).json({ message: 'Location not found' });
        }
        
        // Check if location has inventory items
        const [inventoryCheck] = await db.execute(
            'SELECT COUNT(*) as count FROM inventory_items WHERE location_id = ?',
            [locationId]
        );
        
        if (inventoryCheck[0].count > 0) {
            return res.status(400).json({ 
                message: 'Cannot delete location with existing inventory items. Use soft delete instead.' 
            });
        }
        
        // Soft delete by setting is_active = 0
        await db.execute(
            'UPDATE locations SET is_active = 0 WHERE location_id = ?',
            [locationId]
        );
        
        res.json({ message: 'Location deactivated successfully' });
        
    } catch (err) {
        console.error('Error deleting location:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get locations by type
router.get('/type/:type', async (req, res) => {
    try {
        const { type } = req.params;
        
        const [locations] = await db.execute(
            'SELECT * FROM locations WHERE type = ? AND is_active = 1 ORDER BY name',
            [type]
        );
        
        res.json(locations);
    } catch (err) {
        console.error('Error fetching locations by type:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get location inventory summary
router.get('/:locationId/inventory-summary', async (req, res) => {
    try {
        const { locationId } = req.params;
        
        const [summary] = await db.execute(`
            SELECT 
                l.name as location_name,
                l.type as location_type,
                p.name as product_name,
                pv.color,
                pv.size,
                pv.material,
                pv.price,
                pv.sku,
                COUNT(ii.item_id) as total_items,
                COUNT(CASE WHEN ii.status = 'available' THEN 1 END) as available_items,
                COUNT(CASE WHEN ii.status = 'reserved' THEN 1 END) as reserved_items,
                COUNT(CASE WHEN ii.status = 'sold' THEN 1 END) as sold_items,
                COUNT(CASE WHEN ii.status = 'damaged' THEN 1 END) as damaged_items,
                COUNT(CASE WHEN ii.status = 'returned' THEN 1 END) as returned_items
            FROM locations l
            LEFT JOIN inventory_items ii ON l.location_id = ii.location_id
            LEFT JOIN product_variants pv ON ii.variant_id = pv.variant_id
            LEFT JOIN products p ON pv.product_id = p.product_id
            WHERE l.location_id = ? AND l.is_active = 1
            GROUP BY pv.variant_id
            ORDER BY p.name, pv.color, pv.size
        `, [locationId]);
        
        res.json(summary);
    } catch (err) {
        console.error('Error fetching location inventory summary:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Search locations
router.get('/search', async (req, res) => {
    try {
        const { name, type, city, country } = req.query;
        
        let sql = 'SELECT * FROM locations WHERE is_active = 1';
        const params = [];
        
        if (name) {
            sql += ' AND name LIKE ?';
            params.push(`%${name}%`);
        }
        
        if (type) {
            sql += ' AND type = ?';
            params.push(type);
        }
        
        if (city) {
            sql += ' AND city LIKE ?';
            params.push(`%${city}%`);
        }
        
        if (country) {
            sql += ' AND country LIKE ?';
            params.push(`%${country}%`);
        }
        
        sql += ' ORDER BY type, name';
        
        const [locations] = await db.execute(sql, params);
        res.json(locations);
        
    } catch (err) {
        console.error('Error searching locations:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

module.exports = router;
