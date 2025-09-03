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

        // First, let's check if we have the required attributes
        const [colorAttr] = await connection.execute('SELECT * FROM product_attributes WHERE slug = "color"');
        const [sizeAttr] = await connection.execute('SELECT * FROM product_attributes WHERE slug = "size"');
        
        if (colorAttr.length === 0 || sizeAttr.length === 0) {
            console.log('Creating color and size attributes...');
            
            // Create color attribute
            await connection.execute(`
                INSERT INTO product_attributes (name, slug, type, is_required, display_order) 
                VALUES ('Color', 'color', 'select', 1, 1)
            `);
            
            // Create size attribute
            await connection.execute(`
                INSERT INTO product_attributes (name, slug, type, is_required, display_order) 
                VALUES ('Size', 'size', 'select', 1, 2)
            `);
            
            // Get the attribute IDs
            const [newColorAttr] = await connection.execute('SELECT * FROM product_attributes WHERE slug = "color"');
            const [newSizeAttr] = await connection.execute('SELECT * FROM product_attributes WHERE slug = "size"');
            
            const colorAttrId = newColorAttr[0].attribute_id;
            const sizeAttrId = newSizeAttr[0].attribute_id;
            
            // Create color values
            const colors = ['Black', 'White', 'Navy Blue', 'Gray', 'Red'];
            for (let i = 0; i < colors.length; i++) {
                await connection.execute(`
                    INSERT INTO product_attribute_values (attribute_id, value, slug, display_order) 
                    VALUES (?, ?, ?, ?)
                `, [colorAttrId, colors[i], colors[i].toLowerCase().replace(' ', '-'), i + 1]);
            }
            
            // Create size values
            const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
            for (let i = 0; i < sizes.length; i++) {
                await connection.execute(`
                    INSERT INTO product_attribute_values (attribute_id, value, slug, display_order) 
                    VALUES (?, ?, ?, ?)
                `, [sizeAttrId, sizes[i], sizes[i].toLowerCase(), i + 1]);
            }
            
            console.log('✅ Attributes created successfully');
        } else {
            console.log('✅ Attributes already exist');
        }

        // Get attribute IDs
        const [colorAttrFinal] = await connection.execute('SELECT * FROM product_attributes WHERE slug = "color"');
        const [sizeAttrFinal] = await connection.execute('SELECT * FROM product_attributes WHERE slug = "size"');
        const colorAttrId = colorAttrFinal[0].attribute_id;
        const sizeAttrId = sizeAttrFinal[0].attribute_id;

        // Get attribute values
        const [colorValues] = await connection.execute('SELECT * FROM product_attribute_values WHERE attribute_id = ? ORDER BY display_order', [colorAttrId]);
        const [sizeValues] = await connection.execute('SELECT * FROM product_attribute_values WHERE attribute_id = ? ORDER BY display_order', [sizeAttrId]);

        // Sample products
        const products = [
            {
                name: 'Classic Cotton T-Shirt',
                description: 'Premium quality cotton t-shirt perfect for everyday wear. Soft, comfortable, and durable.',
                price: 29.99,
                category_id: 1, // Assuming men's clothing category
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
            
            // Setup product attributes (color and size)
            await connection.execute(`
                INSERT INTO product_attribute_options (product_id, attribute_id, display_order, is_required) 
                VALUES (?, ?, 1, 1)
            `, [productId, colorAttrId]);
            
            await connection.execute(`
                INSERT INTO product_attribute_options (product_id, attribute_id, display_order, is_required) 
                VALUES (?, ?, 2, 1)
            `, [productId, sizeAttrId]);
            
            // Create 3 variants per product with different combinations
            const variantCombinations = [
                { color: 'Black', size: 'M' },
                { color: 'White', size: 'L' },
                { color: 'Navy Blue', size: 'XL' }
            ];
            
            for (let i = 0; i < variantCombinations.length; i++) {
                const combo = variantCombinations[i];
                const colorValue = colorValues.find(cv => cv.value === combo.color);
                const sizeValue = sizeValues.find(sv => sv.value === combo.size);
                
                if (!colorValue || !sizeValue) {
                    console.log(`Skipping variant - color or size not found: ${combo.color}, ${combo.size}`);
                    continue;
                }
                
                const variantName = `${product.name} - ${combo.color} ${combo.size}`;
                const variantSku = `${product.name.replace(/\s+/g, '').toUpperCase()}-${combo.color.toUpperCase()}-${combo.size}`;
                
                // Create variant
                const [variantResult] = await connection.execute(`
                    INSERT INTO product_variants (product_id, variant_name, variant_sku, variant_price, is_active, created_at) 
                    VALUES (?, ?, ?, ?, 1, NOW())
                `, [productId, variantName, variantSku, product.price]);
                
                const variantId = variantResult.insertId;
                
                // Add variant attributes
                await connection.execute(`
                    INSERT INTO product_variant_attributes (variant_id, attribute_id, value_id) 
                    VALUES (?, ?, ?)
                `, [variantId, colorAttrId, colorValue.value_id]);
                
                await connection.execute(`
                    INSERT INTO product_variant_attributes (variant_id, attribute_id, value_id) 
                    VALUES (?, ?, ?)
                `, [variantId, sizeAttrId, sizeValue.value_id]);
                
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
