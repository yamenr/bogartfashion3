const express = require('express');
const multer = require('multer');
const path = require('path');
const dbSingleton = require('../../dbSingleton.js');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');
const { isValidPrice, isValidStock } = require('../../utils/validation.js');
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

// Get all products (public) - only active products with variants
router.get('/', async (req, res) => {
    try {
        // Get all active products (removed stock filter since stock is derived from variants)
        const [products] = await db.query('SELECT * FROM products ORDER BY name');
        
        // For each product, fetch its variants and calculate total stock
        const productsWithVariants = await Promise.all(products.map(async (product) => {
            const [variants] = await db.query(
                'SELECT variant_id, variant_name, variant_sku, variant_price FROM product_variants WHERE product_id = ? AND is_active = 1',
                [product.product_id]
            );
            
            // Calculate total stock from inventory items for this product
            let totalStock = 0;
            if (variants.length > 0) {
                const variantIds = variants.map(v => v.variant_id);
                const [stockResult] = await db.query(`
                    SELECT COALESCE(SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END), 0) as total_stock
                    FROM inventory_items 
                    WHERE variant_id IN (${variantIds.map(() => '?').join(',')})
                `, variantIds);
                totalStock = stockResult[0]?.total_stock || 0;
            }
            
            return {
                ...product,
                variants: variants,
                hasVariants: variants.length > 0,
                totalStock: totalStock
            };
        }));
        
        res.json(productsWithVariants);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get a single product by ID (public) - only active products with variants
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
        
        // Fetch inventory summary for variants
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
        const totalAvailableStock = inventorySummary.reduce((sum, variant) => sum + variant.available_stock, 0);
        
        const productWithVariants = {
            ...product,
            variants: inventorySummary,
            hasVariants: inventorySummary.length > 0,
            totalStock: totalAvailableStock
        };
        
        res.json(productWithVariants);
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
        stock, 
        supplier_id, 
        category_id,
        size,
        color,
        brand,
        gender
    } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : req.body.image;
  
    if (!name || !price || !stock || !image) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    if (!isValidPrice(price)) {
        return res.status(400).json({ message: 'Invalid price value' });
    }
    if (!isValidStock(stock)) {
        return res.status(400).json({ message: 'Invalid stock value' });
    }

    try {
        // Check for exact name duplicates first
        const [existingProducts] = await db.query('SELECT product_id FROM products WHERE name = ?', [name]);
        if (existingProducts.length > 0) {
            return res.status(400).json({ message: 'A product with this name already exists' });
        }

        // Analyze product similarity
        const newProduct = {
            name, description, price, stock, image, supplier_id, category_id,
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

        const sql = `INSERT INTO products (name, description, price, stock, image, supplier_id, category_id, size, color, brand, gender) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        await db.query(sql, [name, description, price, stock, image, supplier_id, category_id, size, color, brand, gender]);
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
        stock, 
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

    if (!name || !price || !stock || !image) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    if (!isValidPrice(price)) {
        return res.status(400).json({ message: 'Invalid price value' });
    }
    if (!isValidStock(stock)) {
        return res.status(400).json({ message: 'Invalid stock value' });
    }

    try {
        const [existingProducts] = await db.query('SELECT product_id FROM products WHERE name = ? AND product_id != ?', [name, id]);
        if (existingProducts.length > 0) {
            return res.status(400).json({ message: 'A product with this name already exists' });
        }

        // Additional safety check: ensure stock update won't result in negative value
        const [currentStock] = await db.query('SELECT stock FROM products WHERE product_id = ?', [id]);
        if (currentStock.length === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        
        // If this is a stock reduction, verify it won't go below zero
        if (parseInt(stock) < currentStock[0].stock) {
            const reduction = currentStock[0].stock - parseInt(stock);
            if (reduction > currentStock[0].stock) {
                return res.status(400).json({ message: 'Stock reduction would result in negative inventory' });
            }
        }
        
        const sql = `UPDATE products SET name = ?, description = ?, price = ?, stock = ?, image = ?, supplier_id = ?, category_id = ?, size = ?, color = ?, brand = ?, gender = ? WHERE product_id = ?`;
        const [result] = await db.query(sql, [name, description, price, stock, image, supplier_id, category_id, size, color, brand, gender, id]);
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
    const sql = `UPDATE products SET stock = 0 WHERE product_id = ?`;
    try {
        const [result] = await db.query(sql, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        res.json({ message: 'Product deactivated successfully' });
    } catch (err) {
        console.error('Error deactivating product:', err);
        return res.status(500).json({ message: 'Database error', details: err.message });
    }
});

// Get all products including inactive (admin only)
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM products ORDER BY name');
        res.json(products);
    } catch (err) {
        console.error('Error fetching all products:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Restore a deactivated product (admin only)
router.patch('/:id/restore', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { stock } = req.body;
    
    // Validate stock value
    const stockValue = stock || 1;
    if (!isValidStock(stockValue)) {
        return res.status(400).json({ message: 'Invalid stock value' });
    }
    
    const sql = `UPDATE products SET stock = ? WHERE product_id = ?`;
    try {
        const [result] = await db.query(sql, [stockValue, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        res.json({ message: 'Product restored successfully' });
    } catch (err) {
        console.error('Error restoring product:', err);
        return res.status(500).json({ message: 'Database error', details: err.message });
    }
});

// Add inventory to existing product (admin only)
router.patch('/:id/add-inventory', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || !isValidStock(quantity)) {
        return res.status(400).json({ message: 'Valid quantity is required' });
    }
    
    try {
        // Get current stock
        const [currentStock] = await db.query('SELECT stock, name FROM products WHERE product_id = ?', [id]);
        if (currentStock.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        const newStock = currentStock[0].stock + parseInt(quantity);
        
        // Update stock
        const [result] = await db.query('UPDATE products SET stock = ? WHERE product_id = ?', [newStock, id]);
        if (result.affectedRows === 0) {
            return res.status(500).json({ message: 'Failed to update inventory' });
        }
        
        res.json({ 
            message: `Inventory updated successfully. ${quantity} units added to ${currentStock[0].name}`,
            oldStock: currentStock[0].stock,
            newStock: newStock,
            addedQuantity: quantity
        });
    } catch (err) {
        console.error('Error adding inventory:', err);
        return res.status(500).json({ message: 'Database error', details: err.message });
    }
});

module.exports = router; 