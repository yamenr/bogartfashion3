const express = require('express');
const multer = require('multer');
const path = require('path');
const dbSingleton = require('../../dbSingleton.js');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');
const { isValidPrice } = require('../../utils/validation.js');
const { analyzeProductSimilarity } = require('../../utils/productSimilarity.js');

const router = express.Router();
const db = dbSingleton.getConnection();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Get all products (public) - handles both variant and non-variant products
router.get('/', async (req, res) => {
    try {
        // Get all active products
        const [products] = await db.query('SELECT * FROM products ORDER BY name');
        
        // For each product, fetch its variants and calculate total stock
        const productsWithVariants = await Promise.all(products.map(async (product) => {
            const [variants] = await db.query(
                'SELECT variant_id, variant_name, variant_sku, variant_price FROM product_variants WHERE product_id = ? AND is_active = 1',
                [product.product_id]
            );
            
            let totalStock = 0;
            let hasVariants = variants.length > 0;
            
            if (hasVariants) {
                // Product has variants - calculate stock from inventory items
                const variantIds = variants.map(v => v.variant_id);
                const [stockResult] = await db.query(`
                    SELECT COALESCE(SUM(CASE WHEN ii.status = 'available' THEN 1 ELSE 0 END), 0) as total_stock
                    FROM inventory_items ii
                    WHERE ii.variant_id IN (${variantIds.map(() => '?').join(',')})
                `, variantIds);
                totalStock = parseInt(stockResult[0]?.total_stock) || 0;
                
                // Only return products with actual stock
                if (totalStock > 0) {
                    return {
                        ...product,
                        variants: variants,
                        hasVariants: hasVariants,
                        totalStock: totalStock
                    };
                }
            }
            
            // Skip products without variants or without stock
            return null;
        }));
        
        // Filter out null values (products without inventory)
        const availableProducts = productsWithVariants.filter(product => product !== null);
        
        res.json(availableProducts);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get a single product by ID (public) - handles both variant and non-variant products
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [products] = await db.query('SELECT * FROM products WHERE product_id = ?', [id]);
        if (products.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        const product = products[0];
        
        // Fetch variants for this product
        const [variants] = await db.query(
            'SELECT variant_id, variant_name, variant_sku, variant_price FROM product_variants WHERE product_id = ? AND is_active = 1',
            [id]
        );
        
        let totalStock = 0;
        let hasVariants = variants.length > 0;
        
        if (hasVariants) {
            // Product has variants - fetch inventory summary
            const [inventorySummary] = await db.query(`
                SELECT 
                    v.variant_id,
                    v.variant_name,
                    v.variant_sku,
                    v.variant_price,
                    COALESCE(SUM(CASE WHEN ii.status = 'available' THEN 1 ELSE 0 END), 0) as available_stock,
                    COALESCE(SUM(CASE WHEN ii.status = 'reserved' THEN 1 ELSE 0 END), 0) as reserved_stock,
                    COALESCE(SUM(CASE WHEN ii.status = 'sold' THEN 1 ELSE 0 END), 0) as sold_stock
                FROM product_variants v
                LEFT JOIN inventory_items ii ON v.variant_id = ii.variant_id
                WHERE v.product_id = ? AND v.is_active = 1
                GROUP BY v.variant_id, v.variant_name, v.variant_sku, v.variant_price
            `, [id]);
            
            // Calculate total available stock for the product
            totalStock = inventorySummary.reduce((sum, variant) => {
                const stock = parseInt(variant.available_stock) || 0;
                return sum + stock;
            }, 0);
            
            const productWithVariants = {
                ...product,
                variants: inventorySummary,
                hasVariants: hasVariants,
                totalStock: totalStock
            };
            
            res.json(productWithVariants);
        } else {
            // Product has no variants - no inventory available
            return res.status(404).json({ message: 'Product not available - no inventory' });
        }
    } catch (err) {
        console.error(`Error fetching product ${id}:`, err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Create a new product (admin only)
router.post('/', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
    const { 
        name, 
        description, 
        price, 
        supplier_id, 
        category_id,
        size,
        color,
        brand,
        gender
    } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : req.body.image;
  
    if (!name || !price || !image) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    if (!isValidPrice(price)) {
        return res.status(400).json({ message: 'Invalid price value' });
    }

    try {
        // Check for exact name duplicates first
        const [existingProducts] = await db.query('SELECT product_id FROM products WHERE name = ?', [name]);
        if (existingProducts.length > 0) {
            return res.status(400).json({ message: 'A product with this name already exists' });
        }

        // Analyze product similarity
        const newProduct = {
            name, description, price, image, supplier_id, category_id,
            size, color, brand, gender
        };
        
        const similarityAnalysis = await analyzeProductSimilarity(newProduct);
        
        if (similarityAnalysis.shouldWarn) {
            return res.status(409).json({
                message: similarityAnalysis.message,
                type: 'similarity_warning',
                analysis: similarityAnalysis,
                canProceed: true
            });
        }

        const sql = `INSERT INTO products (name, description, price, image, supplier_id, category_id, size, color, brand, gender) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await db.query(sql, [name, description, price, image, supplier_id, category_id, size, color, brand, gender]);
        
        const productId = result.insertId;
        
        // Automatically assign Color and Size attributes to the new product
        try {
            // Get Color and Size attribute IDs
            const [colorAttr] = await db.query('SELECT attribute_id FROM product_attributes WHERE slug = "color"');
            const [sizeAttr] = await db.query('SELECT attribute_id FROM product_attributes WHERE slug = "size"');
            
            if (colorAttr.length > 0 && sizeAttr.length > 0) {
                const colorAttrId = colorAttr[0].attribute_id;
                const sizeAttrId = sizeAttr[0].attribute_id;
                
                // Assign Color attribute (display order 1)
                await db.query(
                    'INSERT INTO product_attribute_options (product_id, attribute_id, display_order, is_required) VALUES (?, ?, ?, ?)',
                    [productId, colorAttrId, 1, 1]
                );
                
                // Assign Size attribute (display order 2)
                await db.query(
                    'INSERT INTO product_attribute_options (product_id, attribute_id, display_order, is_required) VALUES (?, ?, ?, ?)',
                    [productId, sizeAttrId, 2, 1]
                );
                
                console.log(`✅ Automatically assigned Color and Size attributes to product ${productId}`);
            }
        } catch (attrError) {
            console.error('Warning: Could not assign attributes to new product:', attrError.message);
            // Don't fail the product creation if attribute assignment fails
        }
        
        res.json({ message: 'Product added successfully' });
    } catch (err) {
        console.error('Database error adding product:', err);
        return res.status(500).json({ message: 'Database error', error: err.message });
    }
});

// Update a product (admin only)
router.put('/:id', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { 
        name, 
        description, 
        price, 
        supplier_id, 
        category_id,
        size,
        color,
        material,
        brand,
        season,
        gender
    } = req.body;
    let image = req.body.image;
    if (req.file) {
        image = `/uploads/${req.file.filename}`;
    }

    if (!name || !price || !image) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    if (!isValidPrice(price)) {
        return res.status(400).json({ message: 'Invalid price value' });
    }

    try {
        const [existingProducts] = await db.query('SELECT product_id FROM products WHERE name = ? AND product_id != ?', [name, id]);
        if (existingProducts.length > 0) {
            return res.status(400).json({ message: 'A product with this name already exists' });
        }

        // Check if product exists
        const [existingProduct] = await db.query('SELECT product_id FROM products WHERE product_id = ?', [id]);
        if (existingProduct.length === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        
        const sql = `UPDATE products SET name = ?, description = ?, price = ?, image = ?, supplier_id = ?, category_id = ?, size = ?, color = ?, brand = ?, gender = ? WHERE product_id = ?`;
        const [result] = await db.query(sql, [name, description, price, image, supplier_id, category_id, size, color, brand, gender, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        res.json({ message: 'Product updated successfully' });
    } catch (err) {
        console.error('Error updating product:', err);
        return res.status(500).json({ message: 'Database error', details: err.message });
    }
});

// Soft delete a product (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    
    try {
        // First check if product exists
        const [existingProduct] = await db.query('SELECT product_id FROM products WHERE product_id = ?', [id]);
        if (existingProduct.length === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        // Deactivate all variants for this product
        await db.query('UPDATE product_variants SET is_active = 0 WHERE product_id = ?', [id]);
        
        // Update inventory items to 'sold' status to remove from availability
        await db.query(`
            UPDATE inventory_items ii 
            JOIN product_variants pv ON ii.variant_id = pv.variant_id 
            SET ii.status = 'sold' 
            WHERE pv.product_id = ? AND ii.status = 'available'
        `, [id]);
        
        res.json({ message: 'Product deactivated successfully' });
    } catch (err) {
        console.error('Error deactivating product:', err);
        return res.status(500).json({ message: 'Database error', details: err.message });
    }
});

// Get all products for admin management (admin only)
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Get all products
        const [products] = await db.query('SELECT * FROM products ORDER BY name');
        
        // For each product, fetch its variants and calculate total stock
        const productsWithVariantInfo = await Promise.all(products.map(async (product) => {
            const [variants] = await db.query(
                'SELECT variant_id, variant_name, variant_sku, variant_price FROM product_variants WHERE product_id = ? AND is_active = 1',
                [product.product_id]
            );
            
            let totalStock = 0;
            let hasVariants = variants.length > 0;
            
            if (hasVariants) {
                // Product has variants - calculate stock from inventory items
                const variantIds = variants.map(v => v.variant_id);
                const [stockResult] = await db.query(`
                    SELECT COALESCE(SUM(CASE WHEN ii.status = 'available' THEN 1 ELSE 0 END), 0) as total_stock
                    FROM inventory_items ii
                    WHERE ii.variant_id IN (${variantIds.map(() => '?').join(',')})
                `, variantIds);
                totalStock = parseInt(stockResult[0]?.total_stock) || 0;
            }
            
            return {
                ...product,
                variants: variants,
                hasVariants: hasVariants,
                totalStock: totalStock,
                status: hasVariants ? (totalStock > 0 ? 'In Stock' : 'Out of Stock') : 'No Variants',
                needsVariants: !hasVariants
            };
        }));
        
        res.json(productsWithVariantInfo);
    } catch (err) {
        console.error('Error fetching all products:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get products that need variants (admin only)
router.get('/admin/need-variants', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Get products that don't have variants
        const [products] = await db.query(`
            SELECT p.* 
            FROM products p 
            LEFT JOIN product_variants pv ON p.product_id = pv.product_id AND pv.is_active = 1
            WHERE pv.variant_id IS NULL
            ORDER BY p.name
        `);
        
        // Add helpful information for each product
        const productsWithInfo = products.map(product => ({
            ...product,
            status: 'No Variants',
            needsVariants: true,
            message: 'This product needs variants to be visible to customers'
        }));
        
        res.json(productsWithInfo);
    } catch (err) {
        console.error('Error fetching products needing variants:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Restore a deactivated product (admin only)
router.patch('/:id/restore', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    
    try {
        // First check if product exists
        const [existingProduct] = await db.query('SELECT product_id FROM products WHERE product_id = ?', [id]);
        if (existingProduct.length === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        // Reactivate all variants for this product
        await db.query('UPDATE product_variants SET is_active = 1 WHERE product_id = ?', [id]);
        
        // Restore inventory items to 'available' status
        await db.query(`
            UPDATE inventory_items ii 
            JOIN product_variants pv ON ii.variant_id = pv.variant_id 
            SET ii.status = 'available' 
            WHERE pv.product_id = ? AND ii.status = 'sold'
        `, [id]);
        
        res.json({ message: 'Product restored successfully' });
    } catch (err) {
        console.error('Error restoring product:', err);
        return res.status(500).json({ message: 'Database error', details: err.message });
    }
});



module.exports = router; 