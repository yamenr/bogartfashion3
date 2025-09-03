const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/env.config' });

async function addSampleProducts() {
    let connection;
    
    try {
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'bogartfashion2'
        });

        console.log('Connected to database. Adding sample products...');

        // Sample products
        const products = [
            {
                name: 'Classic Cotton T-Shirt',
                description: 'Premium quality cotton t-shirt perfect for everyday wear. Soft, comfortable, and durable.',
                price: 29.99,
                category_id: 1, // Men's category
                image_url: '/uploads/mens-clothing/white-tshirt.jpg',
                is_active: 1
            },
            {
                name: 'Denim Jacket',
                description: 'Stylish denim jacket with a modern fit. Perfect for layering and casual outings.',
                price: 89.99,
                category_id: 1,
                image_url: '/uploads/mens-clothing/denim-jacket.jpg',
                is_active: 1
            },
            {
                name: 'Polo Shirt',
                description: 'Classic polo shirt made from premium pique cotton. Ideal for smart casual occasions.',
                price: 49.99,
                category_id: 1,
                image_url: '/uploads/mens-clothing/polo-shirt.jpg',
                is_active: 1
            }
        ];

        // Add products
        for (const product of products) {
            console.log(`Adding product: ${product.name}`);
            
            const [result] = await connection.execute(`
                INSERT INTO products (name, description, price, category_id, image_url, is_active, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            `, [product.name, product.description, product.price, product.category_id, product.image_url, product.is_active]);
            
            const productId = result.insertId;
            
            // Create 3 variants per product with different combinations
            const variantCombinations = [
                { color: 'Black', size: 'M' },
                { color: 'White', size: 'L' },
                { color: 'Navy Blue', size: 'XL' }
            ];
            
            for (let i = 0; i < variantCombinations.length; i++) {
                const combo = variantCombinations[i];
                
                const variantName = `${product.name} - ${combo.color} ${combo.size}`;
                const variantSku = `${product.name.replace(/\s+/g, '').toUpperCase()}-${combo.color.toUpperCase()}-${combo.size}`;
                
                // Create variant
                const [variantResult] = await connection.execute(`
                    INSERT INTO product_variants (product_id, variant_name, variant_sku, variant_price, is_active, created_at) 
                    VALUES (?, ?, ?, ?, 1, NOW())
                `, [productId, variantName, variantSku, product.price]);
                
                const variantId = variantResult.insertId;
                
                // Add inventory (stock of 3)
                await connection.execute(`
                    INSERT INTO inventory_items (variant_id, location_id, quantity, reserved_quantity, created_at) 
                    VALUES (?, 1, 3, 0, NOW())
                `, [variantId]);
                
                console.log(`  ✅ Created variant: ${variantName} (Stock: 3)`);
            }
        }

        console.log('✅ All sample products and variants created successfully!');
        console.log('Products created:');
        console.log('1. Classic Cotton T-Shirt (Black M, White L, Navy Blue XL)');
        console.log('2. Denim Jacket (Black M, White L, Navy Blue XL)');
        console.log('3. Polo Shirt (Black M, White L, Navy Blue XL)');
        console.log('Each variant has 3 units in stock.');

    } catch (error) {
        console.error('❌ Error adding sample products:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the script
addSampleProducts();
