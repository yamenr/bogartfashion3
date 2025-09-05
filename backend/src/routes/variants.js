const express = require('express');
const dbSingleton = require('../../dbSingleton.js');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');

const router = express.Router();
const db = dbSingleton.getConnection();

// =====================================================
// PRODUCT VARIANTS MANAGEMENT API
// This is developed in parallel and does NOT affect existing routes
// =====================================================

// Get all variants (public - no authentication required)
router.get('/public', async (req, res) => {
    try {
        const [variants] = await db.execute(`
            SELECT 
                pv.variant_id,
                pv.product_id,
                pv.variant_name,
                pv.variant_sku,
                pv.variant_price,
                p.name as product_name
            FROM product_variants pv
            JOIN products p ON pv.product_id = p.product_id
            WHERE pv.is_active = 1
            ORDER BY p.name, pv.variant_name
        `);
        
        res.json(variants);
    } catch (err) {
        console.error('Error fetching public variants:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get all variants (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [variants] = await db.execute(`
            SELECT 
                pv.*,
                p.name as product_name,
                p.description as product_description,
                COUNT(ii.item_id) as stock_quantity
            FROM product_variants pv
            JOIN products p ON pv.product_id = p.product_id
            LEFT JOIN inventory_items ii ON pv.variant_id = ii.variant_id AND ii.status = 'available'
            WHERE pv.is_active = 1
            GROUP BY pv.variant_id
            ORDER BY p.name, pv.variant_name
        `);
        
        res.json(variants);
    } catch (err) {
        console.error('Error fetching variants:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get all variants for a specific product (public - no authentication required)
router.get('/product/:productId/public', async (req, res) => {
    try {
        const { productId } = req.params;
        
        const [variants] = await db.execute(`
            SELECT 
                pv.variant_id,
                pv.product_id,
                pv.variant_name,
                pv.variant_sku,
                pv.variant_price
            FROM product_variants pv
            WHERE pv.product_id = ? AND pv.is_active = 1
            ORDER BY pv.variant_name
        `, [productId]);
        
        res.json(variants);
    } catch (err) {
        console.error('Error fetching public product variants:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get all variants for a specific product (admin only)
router.get('/product/:productId', authenticateToken, requireAdmin, async (req, res) => {
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
router.get('/with-inventory', authenticateToken, requireAdmin, async (req, res) => {
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
        const { product_id, variant_name, variant_sku, variant_price, stock_quantity, attributes } = req.body;
        
        // Validate required fields
        if (!product_id || !variant_name || !variant_sku || !variant_price) {
            return res.status(400).json({ 
                message: 'Product ID, variant name, SKU, and price are required' 
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
            'SELECT variant_id FROM product_variants WHERE product_id = ? AND variant_sku = ?',
            [product_id, variant_sku]
        );
        
        if (existingVariant.length > 0) {
            return res.status(400).json({ 
                message: 'Variant with this SKU already exists for this product' 
            });
        }
        
        // Create new variant
        const [result] = await db.execute(`
            INSERT INTO product_variants (product_id, variant_name, variant_sku, variant_price)
            VALUES (?, ?, ?, ?)
        `, [product_id, variant_name, variant_sku, variant_price]);
        
        const variantId = result.insertId;
        
        // Link variant to attributes if provided
        if (attributes && typeof attributes === 'object') {
            for (const [attributeSlug, attributeValue] of Object.entries(attributes)) {
                // Get attribute ID
                const [attributeRows] = await db.execute(
                    'SELECT attribute_id FROM product_attributes WHERE slug = ?',
                    [attributeSlug]
                );
                
                if (attributeRows.length > 0) {
                    const attributeId = attributeRows[0].attribute_id;
                    
                    // Get attribute value ID
                    const [valueRows] = await db.execute(
                        'SELECT value_id FROM product_attribute_values WHERE attribute_id = ? AND slug = ?',
                        [attributeId, attributeValue]
                    );
                    
                    if (valueRows.length > 0) {
                        const valueId = valueRows[0].value_id;
                        
                        // Link variant to attribute value
                        await db.execute(`
                            INSERT INTO product_variant_attributes (variant_id, attribute_id, value_id)
                            VALUES (?, ?, ?)
                        `, [variantId, attributeId, valueId]);
                        
                        console.log(`Linked variant ${variantId} to ${attributeSlug}:${attributeValue}`);
                    } else {
                        console.warn(`Attribute value not found: ${attributeSlug}:${attributeValue}`);
                    }
                } else {
                    console.warn(`Attribute not found: ${attributeSlug}`);
                }
            }
        }
        
        // Create inventory items for the stock quantity
        if (stock_quantity && stock_quantity > 0) {
            // Get the first location (assuming location_id = 1 exists)
            const [locations] = await db.execute('SELECT location_id FROM locations LIMIT 1');
            const locationId = locations.length > 0 ? locations[0].location_id : 1;
            
            // Create inventory items
            for (let i = 0; i < stock_quantity; i++) {
                await db.execute(`
                    INSERT INTO inventory_items (variant_id, location_id, status, \`condition\`, created_at)
                    VALUES (?, ?, 'available', 'new', NOW())
                `, [variantId, locationId]);
            }
        }
        
        // Get the created variant with stock information
        const [newVariant] = await db.execute(`
            SELECT 
                pv.*,
                COUNT(ii.item_id) as stock_quantity
            FROM product_variants pv
            LEFT JOIN inventory_items ii ON pv.variant_id = ii.variant_id AND ii.status = 'available'
            WHERE pv.variant_id = ?
            GROUP BY pv.variant_id
        `, [variantId]);
        
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
        const { variant_name, variant_sku, variant_price, is_active, stock_quantity } = req.body;
        
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
            SET variant_name = ?, variant_sku = ?, variant_price = ?, is_active = ?
            WHERE variant_id = ?
        `, [variant_name, variant_sku, variant_price, is_active, variantId]);
        
        // Handle stock quantity changes
        if (stock_quantity !== undefined) {
            // Get current stock count
            const [currentStock] = await db.execute(`
                SELECT COUNT(*) as count FROM inventory_items 
                WHERE variant_id = ? AND status = 'available'
            `, [variantId]);
            
            const currentCount = currentStock[0].count;
            const targetCount = parseInt(stock_quantity) || 0;
            
            if (targetCount > currentCount) {
                // Add more inventory items
                const [locations] = await db.execute('SELECT location_id FROM locations LIMIT 1');
                const locationId = locations.length > 0 ? locations[0].location_id : 1;
                
                for (let i = currentCount; i < targetCount; i++) {
                    await db.execute(`
                        INSERT INTO inventory_items (variant_id, location_id, status, \`condition\`, created_at)
                        VALUES (?, ?, 'available', 'new', NOW())
                    `, [variantId, locationId]);
                }
            } else if (targetCount < currentCount) {
                // Remove excess inventory items (mark as sold)
                const [excessItems] = await db.execute(`
                    SELECT item_id FROM inventory_items 
                    WHERE variant_id = ? AND status = 'available'
                    LIMIT ?
                `, [variantId, currentCount - targetCount]);
                
                for (const item of excessItems) {
                    await db.execute(`
                        UPDATE inventory_items SET status = 'sold' WHERE item_id = ?
                    `, [item.item_id]);
                }
            }
        }
        
        // Get updated variant with stock information
        const [updatedVariant] = await db.execute(`
            SELECT 
                pv.*,
                COUNT(ii.item_id) as stock_quantity
            FROM product_variants pv
            LEFT JOIN inventory_items ii ON pv.variant_id = ii.variant_id AND ii.status = 'available'
            WHERE pv.variant_id = ?
            GROUP BY pv.variant_id
        `, [variantId]);
        
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
