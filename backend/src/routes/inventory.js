const express = require('express');
const dbSingleton = require('../../dbSingleton.js');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');

const router = express.Router();
const db = dbSingleton.getConnection();

// =====================================================
// INVENTORY MANAGEMENT API
// This is developed in parallel and does NOT affect existing routes
// =====================================================

// Get inventory summary (all variants with stock levels)
router.get('/summary', async (req, res) => {
    try {
        const [summary] = await db.execute(`
            SELECT 
                p.product_id,
                p.name as product_name,
                pv.variant_id,
                pv.variant_name,
                pv.variant_sku,
                pv.variant_price,
                l.location_id,
                l.name as location_name,
                l.type as location_type,
                COUNT(ii.item_id) as total_items,
                COUNT(CASE WHEN ii.status = 'available' THEN 1 END) as available_count,
                COUNT(CASE WHEN ii.status = 'reserved' THEN 1 END) as reserved_count,
                COUNT(CASE WHEN ii.status = 'sold' THEN 1 END) as sold_count,
                COUNT(CASE WHEN ii.status = 'damaged' THEN 1 END) as damaged_count,
                COUNT(CASE WHEN ii.status = 'returned' THEN 1 END) as returned_count
            FROM product_variants pv
            JOIN products p ON pv.product_id = p.product_id
            LEFT JOIN inventory_items ii ON pv.variant_id = ii.variant_id
            LEFT JOIN locations l ON ii.location_id = l.location_id
            WHERE pv.is_active = 1
            GROUP BY pv.variant_id, l.location_id
            ORDER BY p.name, pv.variant_name, l.name
        `);
        
        res.json(summary);
    } catch (err) {
        console.error('Error fetching inventory summary:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get inventory items for a specific variant
router.get('/variant/:variantId', async (req, res) => {
    try {
        const { variantId } = req.params;
        
        const [items] = await db.execute(`
            SELECT 
                ii.*,
                pv.variant_name,
                pv.variant_sku,
                pv.variant_price,
                p.name as product_name,
                l.name as location_name,
                l.type as location_type
            FROM inventory_items ii
            JOIN product_variants pv ON ii.variant_id = pv.variant_id
            JOIN products p ON pv.product_id = p.product_id
            JOIN locations l ON ii.location_id = l.location_id
            WHERE ii.variant_id = ?
            ORDER BY ii.status, ii.created_at DESC
        `, [variantId]);
        
        res.json(items);
    } catch (err) {
        console.error('Error fetching inventory items:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get inventory items by location
router.get('/location/:locationId', async (req, res) => {
    try {
        const { locationId } = req.params;
        
        const [items] = await db.execute(`
            SELECT 
                ii.*,
                pv.variant_name,
                pv.variant_sku,
                pv.variant_price,
                p.name as product_name,
                l.name as location_name
            FROM inventory_items ii
            JOIN product_variants pv ON ii.variant_id = pv.variant_id
            JOIN products p ON pv.product_id = p.product_id
            JOIN locations l ON ii.location_id = l.location_id
            WHERE ii.location_id = ?
            ORDER BY p.name, pv.variant_name, ii.status
        `, [locationId]);
        
        res.json(items);
    } catch (err) {
        console.error('Error fetching location inventory:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Add inventory items (bulk add)
router.post('/add-items', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { variant_id, location_id, quantity, purchase_cost, supplier_batch, notes } = req.body;
        
        if (!variant_id || !location_id || !quantity || quantity <= 0) {
            return res.status(400).json({ 
                message: 'Variant ID, location ID, and positive quantity are required' 
            });
        }
        
        // Check if variant exists and is active
        const [variantCheck] = await db.execute(
            'SELECT variant_id FROM product_variants WHERE variant_id = ? AND is_active = 1',
            [variant_id]
        );
        
        if (variantCheck.length === 0) {
            return res.status(400).json({ message: 'Variant not found or inactive' });
        }
        
        // Check if location exists and is active
        const [locationCheck] = await db.execute(
            'SELECT location_id FROM locations WHERE location_id = ? AND is_active = 1',
            [location_id]
        );
        
        if (locationCheck.length === 0) {
            return res.status(400).json({ message: 'Location not found or inactive' });
        }
        
        const addedItems = [];
        
        // Add multiple items
        for (let i = 0; i < quantity; i++) {
            const [result] = await db.execute(`
                INSERT INTO inventory_items (variant_id, location_id, purchase_cost, supplier_batch, notes)
                VALUES (?, ?, ?, ?, ?)
            `, [variant_id, location_id, purchase_cost, supplier_batch, notes]);
            
            const itemId = result.insertId;
            
            // Get the created item
            const [newItem] = await db.execute(
                'SELECT * FROM inventory_items WHERE item_id = ?',
                [itemId]
            );
            
            addedItems.push(newItem[0]);
        }
        
        res.status(201).json({
            message: `${quantity} inventory items added successfully`,
            items: addedItems
        });
        
    } catch (err) {
        console.error('Error adding inventory items:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Update inventory item status
router.put('/item/:itemId/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { itemId } = req.params;
        const { status, notes } = req.body;
        
        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }
        
        // Check if item exists
        const [existingItem] = await db.execute(
            'SELECT * FROM inventory_items WHERE item_id = ?',
            [itemId]
        );
        
        if (existingItem.length === 0) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }
        
        // Update status
        await db.execute(
            'UPDATE inventory_items SET status = ?, notes = ? WHERE item_id = ?',
            [status, notes, itemId]
        );
        
        // Get updated item
        const [updatedItem] = await db.execute(
            'SELECT * FROM inventory_items WHERE item_id = ?',
            [itemId]
        );
        
        res.json({
            message: 'Inventory item status updated successfully',
            item: updatedItem[0]
        });
        
    } catch (err) {
        console.error('Error updating inventory item status:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Transfer inventory items between locations
router.post('/transfer', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { item_ids, from_location_id, to_location_id, notes, performed_by } = req.body;
        
        if (!item_ids || !Array.isArray(item_ids) || item_ids.length === 0) {
            return res.status(400).json({ message: 'Item IDs array is required' });
        }
        
        if (!from_location_id || !to_location_id) {
            return res.status(400).json({ message: 'From and to location IDs are required' });
        }
        
        if (from_location_id === to_location_id) {
            return res.status(400).json({ message: 'From and to locations must be different' });
        }
        
        // Check if locations exist
        const [locationCheck] = await db.execute(
            'SELECT location_id FROM locations WHERE location_id IN (?, ?) AND is_active = 1',
            [from_location_id, to_location_id]
        );
        
        if (locationCheck.length !== 2) {
            return res.status(400).json({ message: 'One or both locations not found' });
        }
        
        const transferredItems = [];
        
        // Transfer each item
        for (const itemId of item_ids) {
            // Check if item exists and is at the from location
            const [itemCheck] = await db.execute(
                'SELECT * FROM inventory_items WHERE item_id = ? AND location_id = ? AND status = "available"',
                [itemId, from_location_id]
            );
            
            if (itemCheck.length === 0) {
                continue; // Skip this item
            }
            
            // Update item location
            await db.execute(
                'UPDATE inventory_items SET location_id = ? WHERE item_id = ?',
                [to_location_id, itemId]
            );
            
            // Record transaction
            await db.execute(`
                INSERT INTO inventory_transactions 
                (item_id, transaction_type, from_location_id, to_location_id, notes, performed_by)
                VALUES (?, 'transfer', ?, ?, ?, ?)
            `, [itemId, from_location_id, to_location_id, notes, performed_by]);
            
            // Get updated item
            const [updatedItem] = await db.execute(
                'SELECT * FROM inventory_items WHERE item_id = ?',
                [itemId]
            );
            
            transferredItems.push(updatedItem[0]);
        }
        
        res.json({
            message: `${transferredItems.length} items transferred successfully`,
            items: transferredItems
        });
        
    } catch (err) {
        console.error('Error transferring inventory:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get low stock alerts
router.get('/low-stock', async (req, res) => {
    try {
        const { threshold = 5 } = req.query;
        
        const [alerts] = await db.execute(`
            SELECT 
                p.name as product_name,
                pv.variant_name,
                pv.variant_sku,
                l.name as location_name,
                l.type as location_type,
                COUNT(CASE WHEN ii.status = 'available' THEN 1 END) as available_count
            FROM product_variants pv
            JOIN products p ON pv.product_id = p.product_id
            JOIN inventory_items ii ON pv.variant_id = ii.variant_id
            JOIN locations l ON ii.location_id = l.location_id
            WHERE pv.is_active = 1 AND l.is_active = 1
            GROUP BY pv.variant_id, l.location_id
            HAVING available_count < ?
            ORDER BY available_count ASC
        `, [threshold]);
        
        res.json(alerts);
    } catch (err) {
        console.error('Error fetching low stock alerts:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get inventory transactions for an item
router.get('/item/:itemId/transactions', async (req, res) => {
    try {
        const { itemId } = req.params;
        
        const [transactions] = await db.execute(`
            SELECT 
                it.*,
                u.username as performed_by_user,
                fl.name as from_location_name,
                tl.name as to_location_name
            FROM inventory_transactions it
            LEFT JOIN users u ON it.performed_by = u.user_id
            LEFT JOIN locations fl ON it.from_location_id = fl.location_id
            LEFT JOIN locations tl ON it.to_location_id = tl.location_id
            WHERE it.item_id = ?
            ORDER BY it.transaction_date DESC
        `, [itemId]);
        
        res.json(transactions);
    } catch (err) {
        console.error('Error fetching item transactions:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

module.exports = router;
