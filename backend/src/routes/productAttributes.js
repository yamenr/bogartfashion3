const express = require('express');
const dbSingleton = require('../../dbSingleton.js');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');

const router = express.Router();
const db = dbSingleton.getConnection();

// Get all available attributes (public)
router.get('/attributes', async (req, res) => {
    try {
        const [attributes] = await db.query(
            'SELECT * FROM product_attributes WHERE is_active = 1 ORDER BY name'
        );
        res.json(attributes);
    } catch (err) {
        console.error('Error fetching attributes:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get attribute values for a specific attribute (public)
router.get('/attributes/:attributeSlug/values', async (req, res) => {
    const { attributeSlug } = req.params;
    try {
        const [values] = await db.query(`
            SELECT v.* 
            FROM product_attribute_values v
            JOIN product_attributes a ON v.attribute_id = a.attribute_id
            WHERE a.slug = ? AND v.is_active = 1 AND a.is_active = 1
            ORDER BY v.value
        `, [attributeSlug]);
        res.json(values);
    } catch (err) {
        console.error('Error fetching attribute values:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get product attributes and their values (public)
router.get('/products/:productId/attributes', async (req, res) => {
    const { productId } = req.params;
    try {
        // Get which attributes this product uses
        const [productAttributes] = await db.query(`
            SELECT 
                a.attribute_id,
                a.name,
                a.slug,
                pao.display_order,
                pao.is_required
            FROM product_attribute_options pao
            JOIN product_attributes a ON pao.attribute_id = a.attribute_id
            WHERE pao.product_id = ? AND a.is_active = 1
            ORDER BY pao.display_order
        `, [productId]);

        // Get values for each attribute
        const attributesWithValues = await Promise.all(
            productAttributes.map(async (attr) => {
                const [values] = await db.query(`
                    SELECT 
                        v.value_id,
                        v.value,
                        v.slug,
                        v.is_active
                    FROM product_attribute_values v
                    WHERE v.attribute_id = ? AND v.is_active = 1
                    ORDER BY v.value
                `, [attr.attribute_id]);

                return {
                    ...attr,
                    values: values
                };
            })
        );

        res.json(attributesWithValues);
    } catch (err) {
        console.error('Error fetching product attributes:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get available variant combinations for a product (public)
router.get('/products/:productId/variant-combinations', async (req, res) => {
    const { productId } = req.params;
    try {
        // Get all variants for this product with their attributes
        const [variants] = await db.query(`
            SELECT 
                v.variant_id,
                v.variant_name,
                v.variant_sku,
                v.variant_price,
                v.is_active,
                GROUP_CONCAT(
                    CONCAT(a.slug, ':', val.slug) 
                    ORDER BY pao.display_order 
                    SEPARATOR ','
                ) as attribute_combination
            FROM product_variants v
            LEFT JOIN product_variant_attributes pva ON v.variant_id = pva.variant_id
            LEFT JOIN product_attributes a ON pva.attribute_id = a.attribute_id
            LEFT JOIN product_attribute_values val ON pva.value_id = val.value_id
            LEFT JOIN product_attribute_options pao ON (pao.product_id = v.product_id AND pao.attribute_id = a.attribute_id)
            WHERE v.product_id = ? AND v.is_active = 1
            GROUP BY v.variant_id, v.variant_name, v.variant_sku, v.variant_price, v.is_active
            ORDER BY v.variant_name
        `, [productId]);

        // Get inventory summary for each variant
        const variantsWithInventory = await Promise.all(
            variants.map(async (variant) => {
                const [inventory] = await db.query(`
                    SELECT 
                        COALESCE(SUM(CASE WHEN ii.status = 'available' THEN 1 ELSE 0 END), 0) as available_stock,
                        COALESCE(SUM(CASE WHEN ii.status = 'reserved' THEN 1 ELSE 0 END), 0) as reserved_stock,
                        COALESCE(SUM(CASE WHEN ii.status = 'sold' THEN 1 ELSE 0 END), 0) as sold_stock
                    FROM inventory_items ii
                    WHERE ii.variant_id = ?
                `, [variant.variant_id]);

                return {
                    ...variant,
                    inventory: inventory[0] || { available_stock: 0, reserved_stock: 0, sold_stock: 0 }
                };
            })
        );

        res.json(variantsWithInventory);
    } catch (err) {
        console.error('Error fetching variant combinations:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get filtered variants based on selected attributes (public)
router.post('/products/:productId/filter-variants', async (req, res) => {
    const { productId } = req.params;
    const { selectedAttributes } = req.body; // e.g., { color: 'red', size: 'm' }
    
    try {
        let whereClause = 'v.product_id = ? AND v.is_active = 1';
        let params = [productId];

        if (selectedAttributes && Object.keys(selectedAttributes).length > 0) {
            const attributeConditions = [];
            
            for (const [attrSlug, attrValue] of Object.entries(selectedAttributes)) {
                attributeConditions.push(`
                    EXISTS (
                        SELECT 1 FROM product_variant_attributes pva
                        JOIN product_attributes a ON pva.attribute_id = a.attribute_id
                        JOIN product_attribute_values val ON pva.value_id = val.value_id
                        WHERE pva.variant_id = v.variant_id 
                        AND a.slug = ? 
                        AND val.slug = ?
                    )
                `);
                params.push(attrSlug, attrValue);
            }
            
            whereClause += ' AND ' + attributeConditions.join(' AND ');
        }

        const [variants] = await db.query(`
            SELECT 
                v.variant_id,
                v.variant_name,
                v.variant_sku,
                v.variant_price,
                v.is_active
            FROM product_variants v
            WHERE ${whereClause}
            ORDER BY v.variant_name
        `, params);

        // Get inventory for filtered variants
        const variantsWithInventory = await Promise.all(
            variants.map(async (variant) => {
                const [inventory] = await db.query(`
                    SELECT 
                        COALESCE(SUM(CASE WHEN ii.status = 'available' THEN 1 ELSE 0 END), 0) as available_stock
                    FROM inventory_items ii
                    WHERE ii.variant_id = ?
                `, [variant.variant_id]);

                return {
                    ...variant,
                    available_stock: inventory[0]?.available_stock || 0
                };
            })
        );

        res.json(variantsWithInventory);
    } catch (err) {
        console.error('Error filtering variants:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Admin: Create new attribute
router.post('/attributes', authenticateToken, requireAdmin, async (req, res) => {
    const { name, slug } = req.body;
    
    if (!name || !slug) {
        return res.status(400).json({ message: 'Name and slug are required' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO product_attributes (name, slug) VALUES (?, ?)',
            [name, slug]
        );
        
        const [newAttribute] = await db.query(
            'SELECT * FROM product_attributes WHERE attribute_id = ?',
            [result.insertId]
        );
        
        res.status(201).json(newAttribute[0]);
    } catch (err) {
        console.error('Error creating attribute:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ message: 'Attribute with this slug already exists' });
        } else {
            res.status(500).json({ message: 'Database error' });
        }
    }
});

// Admin: Create new attribute value
router.post('/attributes/:attributeId/values', authenticateToken, requireAdmin, async (req, res) => {
    const { attributeId } = req.params;
    const { value, slug } = req.body;
    
    if (!value || !slug) {
        return res.status(400).json({ message: 'Value and slug are required' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO product_attribute_values (attribute_id, value, slug) VALUES (?, ?, ?)',
            [attributeId, value, slug]
        );
        
        const [newValue] = await db.query(
            'SELECT * FROM product_attribute_values WHERE value_id = ?',
            [result.insertId]
        );
        
        res.status(201).json(newValue[0]);
    } catch (err) {
        console.error('Error creating attribute value:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ message: 'Value with this slug already exists for this attribute' });
        } else {
            res.status(500).json({ message: 'Database error' });
        }
    }
});

// Admin: Assign attributes to a product
router.post('/products/:productId/attributes', authenticateToken, requireAdmin, async (req, res) => {
    const { productId } = req.params;
    const { attributes } = req.body; // Array of { attribute_id, display_order, is_required }
    
    if (!Array.isArray(attributes)) {
        return res.status(400).json({ message: 'Attributes must be an array' });
    }

    try {
        // Remove existing assignments
        await db.query('DELETE FROM product_attribute_options WHERE product_id = ?', [productId]);
        
        // Add new assignments
        for (const attr of attributes) {
            await db.query(
                'INSERT INTO product_attribute_options (product_id, attribute_id, display_order, is_required) VALUES (?, ?, ?, ?)',
                [productId, attr.attribute_id, attr.display_order || 1, attr.is_required !== false ? 1 : 0]
            );
        }
        
        res.json({ message: 'Product attributes updated successfully' });
    } catch (err) {
        console.error('Error updating product attributes:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

module.exports = router;
