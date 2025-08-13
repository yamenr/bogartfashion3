const dbSingleton = require('../dbSingleton.js');

/**
 * Safely updates product inventory to prevent negative values
 * @param {number} productId - The product ID
 * @param {number} quantityChange - Positive for increase, negative for decrease
 * @param {Object} connection - Database connection (optional, for transactions)
 * @returns {Object} - Result object with success status and new stock
 */
async function safeUpdateInventory(productId, quantityChange, connection = null) {
    const db = connection || dbSingleton.getConnection();
    
    try {
        // Get current stock
        const [currentStockResult] = await db.query(
            'SELECT stock FROM products WHERE product_id = ?',
            [productId]
        );
        
        if (currentStockResult.length === 0) {
            throw new Error('Product not found');
        }
        
        const currentStock = currentStockResult[0].stock;
        const newStock = Math.max(0, currentStock + quantityChange);
        
        // Update stock
        const [updateResult] = await db.query(
            'UPDATE products SET stock = ? WHERE product_id = ?',
            [newStock, productId]
        );
        
        if (updateResult.affectedRows === 0) {
            throw new Error('Failed to update inventory');
        }
        
        return {
            success: true,
            oldStock: currentStock,
            newStock: newStock,
            quantityChange: quantityChange,
            wasNegative: newStock === 0 && quantityChange < 0
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Checks if a product has sufficient stock for an order
 * @param {number} productId - The product ID
 * @param {number} requestedQuantity - The quantity requested
 * @param {Object} connection - Database connection (optional, for transactions)
 * @returns {Object} - Result object with availability status
 */
async function checkStockAvailability(productId, requestedQuantity, connection = null) {
    const db = connection || dbSingleton.getConnection();
    
    try {
        const [stockResult] = await db.query(
            'SELECT stock, name FROM products WHERE product_id = ?',
            [productId]
        );
        
        if (stockResult.length === 0) {
            return {
                available: false,
                error: 'Product not found'
            };
        }
        
        const { stock, name } = stockResult[0];
        const available = stock >= requestedQuantity;
        
        return {
            available,
            currentStock: stock,
            requestedQuantity,
            productName: name,
            insufficientQuantity: available ? 0 : requestedQuantity - stock
        };
        
    } catch (error) {
        return {
            available: false,
            error: error.message
        };
    }
}

/**
 * Processes inventory reduction for an order
 * @param {Array} orderItems - Array of order items with product_id and quantity
 * @param {Object} connection - Database connection (for transactions)
 * @returns {Object} - Result object with processing status
 */
async function processOrderInventory(orderItems, connection) {
    const results = [];
    
    for (const item of orderItems) {
        const result = await safeUpdateInventory(
            item.product_id, 
            -item.quantity, // Negative for reduction
            connection
        );
        
        results.push({
            productId: item.product_id,
            quantity: item.quantity,
            ...result
        });
        
        if (!result.success) {
            return {
                success: false,
                error: `Failed to update inventory for product ${item.product_id}: ${result.error}`,
                results
            };
        }
    }
    
    return {
        success: true,
        results
    };
}

module.exports = {
    safeUpdateInventory,
    checkStockAvailability,
    processOrderInventory
};
