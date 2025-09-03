const express = require('express');
const dbSingleton = require('../../dbSingleton.js');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');

const router = express.Router();
const db = dbSingleton.getConnection();

// Get dashboard stats
router.get('/dashboard-stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [revenue] = await db.query("SELECT SUM(total_amount) as total_revenue FROM orders");
        const [orders] = await db.query("SELECT COUNT(*) as total_orders FROM orders");
        const [products] = await db.query("SELECT COUNT(*) as total_products FROM products");
        res.json({
            total_revenue: revenue[0].total_revenue || 0,
            total_orders: orders[0].total_orders || 0,
            total_products: products[0].total_products || 0,
        });
    } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Get sales over time data
router.get('/sales-over-time', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [sales] = await db.query(`
            SELECT
                DATE(order_date) as day,
                SUM(total_amount) as total_sales,
                COUNT(order_id) as order_count
            FROM orders
            GROUP BY day
            ORDER BY day
        `);
        res.json(sales);
    } catch (err) {
        console.error("Error fetching sales data:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Get top selling products
router.get('/top-products', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [products] = await db.query(`
            SELECT p.name, SUM(oi.quantity) as total_quantity, SUM(oi.price * oi.quantity) as total_sales
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            GROUP BY p.product_id, p.name
            ORDER BY total_sales DESC
            LIMIT 5
        `);
        res.json(products);
    } catch (err) {
        console.error("Error fetching top products:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Get ALL orders for the admin panel
router.get('/orders', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT 
                o.order_id, 
                o.order_date, 
                o.total_amount AS total_price, 
                o.status,
                u.username AS user_name,
                u.email AS user_email
            FROM orders o
            JOIN users u ON o.user_id = u.user_id
            ORDER BY o.order_date DESC
        `);
        res.json(orders);
    } catch (err) {
        console.error("Error fetching all orders:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Get order status distribution
router.get('/order-status-distribution', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [statuses] = await db.query(`
            SELECT status, COUNT(order_id) as count
            FROM orders
            GROUP BY status
        `);
        res.json(statuses);
    } catch (err) {
        console.error("Error fetching order status distribution:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Get individual order details by order ID
router.get('/orders/:orderId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { orderId } = req.params;
        
        // Get order details
        const [orderResult] = await db.query(`
            SELECT 
                o.order_id, 
                o.order_date, 
                o.total_amount AS total_price, 
                o.status,
                o.shipping_address,
                o.payment_method,
                u.username AS user_name,
                u.email AS user_email
            FROM orders o
            JOIN users u ON o.user_id = u.user_id
            WHERE o.order_id = ?
        `, [orderId]);
        
        if (orderResult.length === 0) {
            return res.status(404).json({ message: "Order not found" });
        }
        
        const order = orderResult[0];
        
        // Get order items with product details
        const [itemsResult] = await db.query(`
            SELECT 
                oi.product_id,
                oi.quantity,
                oi.price AS price_at_order,
                p.name AS product_name,
                p.image AS product_image
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            WHERE oi.order_id = ?
        `, [orderId]);
        
        // Combine order and items
        const orderWithItems = {
            ...order,
            products: itemsResult
        };
        
        res.json(orderWithItems);
    } catch (err) {
        console.error("Error fetching order details:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Get all customers (non-admin users) with their order stats
router.get('/customers', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [customers] = await db.query(`
            SELECT 
                u.user_id,
                u.username AS username,
                u.email,
                COUNT(o.order_id) AS order_count,
                COALESCE(SUM(o.total_amount), 0) AS total_spent
            FROM users u
            LEFT JOIN orders o ON u.user_id = o.user_id
            WHERE u.role != 'admin'
            GROUP BY u.user_id, u.username, u.email
            ORDER BY u.username
        `);
        res.json(customers);
    } catch (err) {
        console.error("Error fetching customers:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Delete customer (user)
router.delete('/customers/:userId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check if user exists and is not an admin
        const [userCheck] = await db.query(`
            SELECT user_id, role FROM users WHERE user_id = ?
        `, [userId]);
        
        if (userCheck.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        
        if (userCheck[0].role === 'admin') {
            return res.status(403).json({ message: "Cannot delete admin users" });
        }
        
        // Check if user has any orders
        const [ordersCheck] = await db.query(`
            SELECT COUNT(*) as order_count FROM orders WHERE user_id = ?
        `, [userId]);
        
        if (ordersCheck[0].order_count > 0) {
            return res.status(400).json({ 
                message: "Cannot delete customer with existing orders. Please handle their orders first." 
            });
        }
        
        // Delete the user
        const [result] = await db.query(`
            DELETE FROM users WHERE user_id = ?
        `, [userId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        
        res.json({ message: "Customer deleted successfully" });
    } catch (err) {
        console.error("Error deleting customer:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Fix negative inventory
router.post('/fix-inventory', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // First, get all products with negative inventory
        const [negativeProducts] = await db.query(`
            SELECT product_id, name, stock 
            FROM products 
            WHERE stock < 0
        `);
        
        if (negativeProducts.length === 0) {
            return res.json({ 
                message: 'No products with negative inventory found',
                affectedRows: 0
            });
        }
        
        // Fix negative inventory to zero
        const [result] = await db.query(`
            UPDATE products 
            SET stock = 0 
            WHERE stock < 0
        `);
        
        res.json({ 
            message: `Fixed ${result.affectedRows} products with negative inventory`,
            affectedRows: result.affectedRows,
            fixedProducts: negativeProducts.map(p => ({
                product_id: p.product_id,
                name: p.name,
                oldStock: p.stock
            }))
        });
    } catch (err) {
        console.error("Error fixing inventory:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Fix missing images by setting image to NULL for products with missing image files
router.post('/fix-missing-images', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        
        // Get all products with image paths
        const [products] = await db.query('SELECT product_id, name, image FROM products WHERE image IS NOT NULL');
        
        let fixedCount = 0;
        for (const product of products) {
            if (product.image && product.image.startsWith('/uploads/')) {
                const imagePath = path.join(__dirname, '../../..', product.image);
                if (!fs.existsSync(imagePath)) {
                    await db.query('UPDATE products SET image = NULL WHERE product_id = ?', [product.product_id]);
                    fixedCount++;
                    console.log(`Fixed missing image for product: ${product.name}`);
                }
            }
        }
        
        res.json({ 
            message: `Fixed ${fixedCount} products with missing images`,
            fixedCount: fixedCount
        });
    } catch (err) {
        console.error("Error fixing missing images:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// ========================================
// ADVANCED ANALYTICS DASHBOARD ENDPOINTS
// ========================================

// Get sales analytics with time range filters
router.get('/analytics/sales', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { timeRange = 'month', startDate, endDate } = req.query;
        
        let dateFilter = '';
        let groupBy = '';
        let dateFormat = '';
        
        switch(timeRange) {
            case 'day':
                dateFilter = startDate && endDate ? 
                    `WHERE DATE(order_date) BETWEEN ? AND ?` : 
                    `WHERE order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)`;
                groupBy = 'DATE(order_date)';
                dateFormat = '%Y-%m-%d';
                break;
            case 'week':
                dateFilter = startDate && endDate ? 
                    `WHERE DATE(order_date) BETWEEN ? AND ?` : 
                    `WHERE order_date >= DATE_SUB(NOW(), INTERVAL 12 WEEK)`;
                groupBy = 'YEARWEEK(order_date)';
                dateFormat = '%Y-W%u';
                break;
            case 'month':
                dateFilter = startDate && endDate ? 
                    `WHERE DATE(order_date) BETWEEN ? AND ?` : 
                    `WHERE order_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)`;
                groupBy = 'DATE_FORMAT(order_date, "%Y-%m")';
                dateFormat = '%Y-%m';
                break;
            case 'year':
                dateFilter = startDate && endDate ? 
                    `WHERE DATE(order_date) BETWEEN ? AND ?` : 
                    `WHERE order_date >= DATE_SUB(NOW(), INTERVAL 5 YEAR)`;
                groupBy = 'YEAR(order_date)';
                dateFormat = '%Y';
                break;
            default:
                dateFilter = `WHERE order_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)`;
                groupBy = 'DATE_FORMAT(order_date, "%Y-%m")';
                dateFormat = '%Y-%m';
        }
        
        const params = startDate && endDate ? [startDate, endDate] : [];
        
        const [sales] = await db.query(`
            SELECT 
                ${groupBy} as period,
                SUM(total_amount) as total_sales,
                COUNT(order_id) as order_count,
                AVG(total_amount) as avg_order_value,
                COUNT(DISTINCT user_id) as unique_customers
            FROM orders
            ${dateFilter}
            GROUP BY ${groupBy}
            ORDER BY period
        `, params);
        
        res.json(sales);
    } catch (err) {
        console.error("Error fetching sales analytics:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Get supplier breakdown analytics
router.get('/analytics/suppliers', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [supplierData] = await db.query(`
            SELECT 
                s.name as supplier_name,
                COUNT(DISTINCT p.product_id) as total_products,
                SUM(oi.quantity) as total_units_sold,
                SUM(oi.quantity * oi.price) as total_revenue,
                AVG(oi.price) as avg_product_price,
                COUNT(DISTINCT o.order_id) as total_orders
            FROM suppliers s
            LEFT JOIN products p ON s.supplier_id = p.supplier_id
            LEFT JOIN order_items oi ON p.product_id = oi.product_id
            LEFT JOIN orders o ON oi.order_id = o.order_id
            GROUP BY s.supplier_id, s.name
            ORDER BY total_revenue DESC
        `);
        
        res.json(supplierData);
    } catch (err) {
        console.error("Error fetching supplier analytics:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Get category breakdown analytics
router.get('/analytics/categories', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [categoryData] = await db.query(`
            SELECT 
                c.name as category_name,
                COUNT(DISTINCT p.product_id) as total_products,
                SUM(oi.quantity) as total_units_sold,
                SUM(oi.quantity * oi.price) as total_revenue,
                AVG(oi.price) as avg_product_price,
                COUNT(DISTINCT o.order_id) as total_orders
            FROM categories c
            LEFT JOIN products p ON c.category_id = p.category_id
            LEFT JOIN order_items oi ON p.product_id = oi.product_id
            LEFT JOIN orders o ON oi.order_id = o.order_id
            GROUP BY c.category_id, c.name
            ORDER BY total_revenue DESC
        `);
        
        res.json(categoryData);
    } catch (err) {
        console.error("Error fetching category analytics:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Get customer analytics (repeat customers, customer lifetime value)
router.get('/analytics/customers', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [customerData] = await db.query(`
            SELECT 
                u.user_id,
                u.username,
                u.email,
                COUNT(o.order_id) as order_count,
                SUM(o.total_amount) as total_spent,
                AVG(o.total_amount) as avg_order_value,
                MIN(o.order_date) as first_order,
                MAX(o.order_date) as last_order,
                DATEDIFF(MAX(o.order_date), MIN(o.order_date)) as customer_lifespan_days
            FROM users u
            LEFT JOIN orders o ON u.user_id = o.user_id
            WHERE u.role != 'admin'
            GROUP BY u.user_id, u.username, u.email
            HAVING order_count > 0
            ORDER BY total_spent DESC
        `);
        
        // Calculate repeat customer metrics
        const repeatCustomers = customerData.filter(c => c.order_count > 1).length;
        const totalCustomers = customerData.length;
        const repeatCustomerRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers * 100).toFixed(2) : 0;
        
        res.json({
            customers: customerData,
            metrics: {
                total_customers: totalCustomers,
                repeat_customers: repeatCustomers,
                repeat_customer_rate: repeatCustomerRate,
                avg_customer_lifetime_value: customerData.reduce((sum, c) => sum + parseFloat(c.total_spent || 0), 0) / totalCustomers || 0
            }
        });
    } catch (err) {
        console.error("Error fetching customer analytics:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Get inventory analytics (low stock alerts, stock turnover)
router.get('/analytics/inventory', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [inventoryData] = await db.query(`
            SELECT 
                p.product_id,
                p.name as product_name,
                COALESCE(SUM(CASE WHEN ii.status = 'available' THEN 1 ELSE 0 END), 0) as current_stock,
                c.name as category_name,
                s.name as supplier_name,
                p.price,
                COALESCE(SUM(oi.quantity), 0) as units_sold_last_30_days,
                CASE 
                    WHEN COALESCE(SUM(CASE WHEN ii.status = 'available' THEN 1 ELSE 0 END), 0) <= 10 THEN 'Critical'
                    WHEN COALESCE(SUM(CASE WHEN ii.status = 'available' THEN 1 ELSE 0 END), 0) <= 25 THEN 'Low'
                    WHEN COALESCE(SUM(CASE WHEN ii.status = 'available' THEN 1 ELSE 0 END), 0) <= 50 THEN 'Medium'
                    ELSE 'Good'
                END as stock_status
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
            LEFT JOIN product_variants pv ON p.product_id = pv.product_id
            LEFT JOIN inventory_items ii ON pv.variant_id = ii.variant_id
            LEFT JOIN order_items oi ON p.product_id = oi.product_id
            LEFT JOIN orders o ON oi.order_id = o.order_id AND o.order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY p.product_id, p.name, c.name, s.name, p.price
            ORDER BY current_stock ASC
        `);
        
        // Calculate inventory metrics
        const lowStockProducts = inventoryData.filter(p => p.stock_status === 'Critical' || p.stock_status === 'Low');
        const totalProducts = inventoryData.length;
        const lowStockPercentage = totalProducts > 0 ? (lowStockProducts.length / totalProducts * 100).toFixed(2) : 0;
        
        res.json({
            inventory: inventoryData,
            metrics: {
                total_products: totalProducts,
                low_stock_products: lowStockProducts.length,
                low_stock_percentage: lowStockPercentage,
                critical_stock: inventoryData.filter(p => p.stock_status === 'Critical').length,
                low_stock: inventoryData.filter(p => p.stock_status === 'Low').length
            }
        });
    } catch (err) {
        console.error("Error fetching inventory analytics:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Get order handling time analytics
router.get('/analytics/order-handling', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [handlingData] = await db.query(`
            SELECT 
                status,
                COUNT(order_id) as order_count,
                AVG(DATEDIFF(NOW(), order_date)) as avg_days_since_order,
                MIN(order_date) as oldest_order,
                MAX(order_date) as newest_order
            FROM orders
            GROUP BY status
            ORDER BY order_count DESC
        `);
        
        // Calculate average handling time for completed orders
        const completedOrders = handlingData.find(h => h.status === 'completed');
        const avgHandlingTime = completedOrders ? completedOrders.avg_days_since_order : 0;
        
        res.json({
            handling_times: handlingData,
            metrics: {
                avg_handling_time_days: avgHandlingTime,
                total_orders: handlingData.reduce((sum, h) => sum + h.order_count, 0),
                pending_orders: handlingData.find(h => h.status === 'pending')?.order_count || 0,
                completed_orders: completedOrders?.order_count || 0
            }
        });
    } catch (err) {
        console.error("Error fetching order handling analytics:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Export analytics data to CSV/Excel format
router.get('/analytics/export', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { type, timeRange, startDate, endDate } = req.query;
        
        let data = [];
        let filename = '';
        
        switch(type) {
            case 'sales':
                const salesRes = await db.query(`
                    SELECT 
                        DATE(order_date) as date,
                        order_id,
                        total_amount,
                        status,
                        payment_method
                    FROM orders
                    WHERE order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                    ORDER BY order_date DESC
                `);
                data = salesRes[0];
                filename = `sales_export_${new Date().toISOString().split('T')[0]}.csv`;
                break;
                
            case 'products':
                const productsRes = await db.query(`
                    SELECT 
                        p.name,
                        p.price,
                        p.stock,
                        c.name as category,
                        s.name as supplier
                    FROM products p
                    LEFT JOIN categories c ON p.category_id = c.category_id
                    LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
                    ORDER BY p.name
                `);
                data = productsRes[0];
                filename = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
                break;
                
            case 'customers':
                const customersRes = await db.query(`
                    SELECT 
                        u.username,
                        u.email,
                        COUNT(o.order_id) as total_orders,
                        SUM(o.total_amount) as total_spent
                    FROM users u
                    LEFT JOIN orders o ON u.user_id = o.user_id
                    WHERE u.role != 'admin'
                    GROUP BY u.user_id, u.username, u.email
                    ORDER BY total_spent DESC
                `);
                data = customersRes[0];
                filename = `customers_export_${new Date().toISOString().split('T')[0]}.csv`;
                break;
                
            default:
                return res.status(400).json({ message: "Invalid export type" });
        }
        
        // Convert to CSV format
        if (data.length > 0) {
            const headers = Object.keys(data[0]);
            const csvContent = [
                headers.join(','),
                ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
            ].join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(csvContent);
        } else {
            res.json({ message: "No data to export" });
        }
        
    } catch (err) {
        console.error("Error exporting analytics data:", err);
        res.status(500).json({ message: "Database error" });
    }
});

module.exports = router; 