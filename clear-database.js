const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/env.config' });

async function clearDatabase() {
    let connection;
    
    try {
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'bogartfashion2'
        });

        console.log('Connected to database. Starting cleanup...');

        // Clear in the correct order (respecting foreign key constraints)
        console.log('1. Clearing inventory items...');
        await connection.execute('DELETE FROM inventory_items');
        
        console.log('2. Clearing product variant attributes...');
        await connection.execute('DELETE FROM product_variant_attributes');
        
        console.log('3. Clearing product attribute options...');
        await connection.execute('DELETE FROM product_attribute_options');
        
        console.log('4. Clearing product variants...');
        await connection.execute('DELETE FROM product_variants');
        
        console.log('5. Clearing order items...');
        await connection.execute('DELETE FROM order_items');
        
        console.log('6. Clearing products...');
        await connection.execute('DELETE FROM products');

        // Reset auto-increment counters
        console.log('7. Resetting auto-increment counters...');
        await connection.execute('ALTER TABLE products AUTO_INCREMENT = 1');
        await connection.execute('ALTER TABLE product_variants AUTO_INCREMENT = 1');
        await connection.execute('ALTER TABLE inventory_items AUTO_INCREMENT = 1');
        await connection.execute('ALTER TABLE product_attribute_options AUTO_INCREMENT = 1');
        await connection.execute('ALTER TABLE product_variant_attributes AUTO_INCREMENT = 1');

        console.log('✅ All products and variants have been successfully cleared!');
        console.log('Database is now empty and ready for new products.');

    } catch (error) {
        console.error('❌ Error clearing database:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the cleanup
clearDatabase();
