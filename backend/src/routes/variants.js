const express = require('express');
const dbSingleton = require('../../dbSingleton.js');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');

const router = express.Router();
const db = dbSingleton.getConnection();

// =====================================================
// PRODUCT VARIANTS MANAGEMENT API
// This is developed in parallel and does NOT affect existing routes
// =====================================================

// Get all variants
router.get('/', async (req, res) => {
    try {
        const [variants] = await db.execute(`
            SELECT 
                pv.*,
                p.name as product_name,
                p.description as product_description
            FROM product_variants pv
            JOIN products p ON pv.product_id = p.product_id
            WHERE pv.is_active = 1
            ORDER BY p.name, pv.variant_name
        `);
        
        res.json(variants);
    } catch (err) {
        console.error('Error fetching variants:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get all variants for a specific product
router.get('/product/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        
        const [variants] = await db.execute(`
            SELECT 
                pv.*,
                p.name as product_name,
                p.description as product_description
            FROM product_variants pv
            JOIN products p ON pv.product_id = p.product_id
            WHERE pv.product_id = ? AND pv.is_active = 1
            ORDER BY pv.variant_name
        `, [productId]);
        
        res.json(variants);
    } catch (err) {
        console.error('Error fetching product variants:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get all variants with inventory summary
router.get('/with-inventory', async (req, res) => {
    try {
        const [variants] = await db.execute(`
            SELECT 
                pv.*,
                p.name as product_name,
                p.description as product_description,
                COUNT(ii.item_id) as total_items,
                COUNT(CASE WHEN ii.status = 'available' THEN 1 END) as available_items,
                COUNT(CASE WHEN ii.status = 'reserved' THEN 1 END) as reserved_items,
                COUNT(CASE WHEN ii.status = 'sold' THEN 1 END) as sold_items
            FROM product_variants pv
            JOIN products p ON pv.product_id = p.product_id
            LEFT JOIN inventory_items ii ON pv.variant_id = ii.variant_id
            WHERE pv.is_active = 1
            GROUP BY pv.variant_id
            ORDER BY p.name, pv.variant_name
        `);
        
        res.json(variants);
    } catch (err) {
        console.error('Error fetching variants with inventory:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Create a new variant
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { product_id, color, size, material, price, sku } = req.body;
        
        // Validate required fields
        if (!product_id || !color || !size || !price) {
            return res.status(400).json({ 
                message: 'Product ID, color, size, and price are required' 
            });
        }
        
        // Check if product exists
        const [productCheck] = await db.execute(
            'SELECT product_id FROM products WHERE product_id = ?',
            [product_id]
        );
        
        if (productCheck.length === 0) {
            return res.status(400).json({ message: 'Product not found' });
        }
        
        // Check if variant already exists
        const [existingVariant] = await db.execute(
            'SELECT variant_id FROM product_variants WHERE product_id = ? AND color = ? AND size = ?',
            [product_id, color, size]
        );
        
        if (existingVariant.length > 0) {
            return res.status(400).json({ 
                message: 'Variant with this color and size already exists for this product' 
            });
        }
        
        // Create new variant
        const [result] = await db.execute(`
            INSERT INTO product_variants (product_id, color, size, material, price, sku)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [product_id, color, size, material, price, sku]);
        
        const variantId = result.insertId;
        
        // Get the created variant
        const [newVariant] = await db.execute(
            'SELECT * FROM product_variants WHERE variant_id = ?',
            [variantId]
        );
        
        res.status(201).json({
            message: 'Variant created successfully',
            variant: newVariant[0]
        });
        
    } catch (err) {
        console.error('Error creating variant:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Update a variant
router.put('/:variantId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { variantId } = req.params;
        const { color, size, material, price, sku, is_active } = req.body;
        
        // Check if variant exists
        const [existingVariant] = await db.execute(
            'SELECT * FROM product_variants WHERE variant_id = ?',
            [variantId]
        );
        
        if (existingVariant.length === 0) {
            return res.status(404).json({ message: 'Variant not found' });
        }
        
        // Update variant
        await db.execute(`
            UPDATE product_variants 
            SET color = ?, size = ?, material = ?, price = ?, sku = ?, is_active = ?
            WHERE variant_id = ?
        `, [color, size, material, price, sku, is_active, variantId]);
        
        // Get updated variant
        const [updatedVariant] = await db.execute(
            'SELECT * FROM product_variants WHERE variant_id = ?',
            [variantId]
        );
        
        res.json({
            message: 'Variant updated successfully',
            variant: updatedVariant[0]
        });
        
    } catch (err) {
        console.error('Error updating variant:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Delete a variant (soft delete by setting is_active = 0)
router.delete('/:variantId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { variantId } = req.params;
        
        // Check if variant exists
        const [existingVariant] = await db.execute(
            'SELECT * FROM product_variants WHERE variant_id = ?',
            [variantId]
        );
        
        if (existingVariant.length === 0) {
            return res.status(404).json({ message: 'Variant not found' });
        }
        
        // Check if variant has inventory items
        const [inventoryCheck] = await db.execute(
            'SELECT COUNT(*) as count FROM inventory_items WHERE variant_id = ?',
            [variantId]
        );
        
        if (inventoryCheck[0].count > 0) {
            return res.status(400).json({ 
                message: 'Cannot delete variant with existing inventory items. Use soft delete instead.' 
            });
        }
        
        // Soft delete by setting is_active = 0
        await db.execute(
            'UPDATE product_variants SET is_active = 0 WHERE variant_id = ?',
            [variantId]
        );
        
        res.json({ message: 'Variant deactivated successfully' });
        
    } catch (err) {
        console.error('Error deleting variant:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get variant by ID
router.get('/:variantId', async (req, res) => {
    try {
        const { variantId } = req.params;
        
        const [variants] = await db.execute(`
            SELECT 
                pv.*,
                p.name as product_name,
                p.description as product_description
            FROM product_variants pv
            JOIN products p ON pv.product_id = p.product_id
            WHERE pv.variant_id = ? AND pv.is_active = 1
        `, [variantId]);
        
        if (variants.length === 0) {
            return res.status(404).json({ message: 'Variant not found' });
        }
        
        res.json(variants[0]);
    } catch (err) {
        console.error('Error fetching variant:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Search variants by color, size, or SKU
router.get('/search', async (req, res) => {
    try {
        const { color, size, sku, product_name } = req.query;
        
        let sql = `
            SELECT 
                pv.*,
                p.name as product_name,
                p.description as product_description
            FROM product_variants pv
            JOIN products p ON pv.product_id = p.product_id
            WHERE pv.is_active = 1
        `;
        
        const params = [];
        
        if (color) {
            sql += ' AND pv.color LIKE ?';
            params.push(`%${color}%`);
        }
        
        if (size) {
            sql += ' AND pv.size LIKE ?';
            params.push(`%${size}%`);
        }
        
        if (sku) {
            sql += ' AND pv.sku LIKE ?';
            params.push(`%${sku}%`);
        }
        
        if (product_name) {
            sql += ' AND p.name LIKE ?';
            params.push(`%${product_name}%`);
        }
        
        sql += ' ORDER BY p.name, pv.color, pv.size';
        
        const [variants] = await db.execute(sql, params);
        res.json(variants);
        
    } catch (err) {
        console.error('Error searching variants:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

module.exports = router;
