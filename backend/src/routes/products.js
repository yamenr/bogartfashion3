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

// Get all products (public) - only active products
router.get('/', async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM products WHERE stock > 0 ORDER BY name');
        res.json(products);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get a single product by ID (public) - only active products
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [products] = await db.query('SELECT * FROM products WHERE product_id = ? AND stock > 0', [id]);
        if (products.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(products[0]);
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