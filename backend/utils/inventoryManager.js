const dbSingleton = require('../dbSingleton.js');

/**
 * Safely updates variant inventory to prevent negative values
 * @param {number} variantId - The variant ID
 * @param {number} quantityChange - Positive for increase, negative for decrease
 * @param {Object} connection - Database connection (optional, for transactions)
 * @returns {Object} - Result object with success status and new stock
 */
async function safeUpdateVariantInventory(variantId, quantityChange, connection = null) {
    const db = connection || dbSingleton.getConnection();
    
    try {
        // Get current available inventory for this variant
        const [currentStockResult] = await db.query(
            `SELECT COUNT(*) as available_stock 
             FROM inventory_items 
             WHERE variant_id = ? AND status = 'available'`,
            [variantId]
        );
        
        if (currentStockResult.length === 0) {
            throw new Error('Variant not found');
        }
        
        const currentStock = currentStockResult[0].available_stock;
        const newStock = Math.max(0, currentStock + quantityChange);
        
        if (quantityChange < 0) {
            // We're reducing stock, so mark items as 'sold'
            const itemsToMark = Math.abs(quantityChange);
            const [updateResult] = await db.query(
                `UPDATE inventory_items 
                 SET status = 'sold' 
                 WHERE variant_id = ? AND status = 'available' 
                 LIMIT ?`,
                [variantId, itemsToMark]
            );
            
            if (updateResult.affectedRows < itemsToMark) {
                throw new Error(`Insufficient available inventory. Requested: ${itemsToMark}, Available: ${currentStock}`);
            }
        } else {
            // We're increasing stock, so add new available items
            const [insertResult] = await db.query(
                `INSERT INTO inventory_items (variant_id, location_id, status, condition, notes) 
                 VALUES (?, 1, 'available', 'new', 'Restocked')`,
                [variantId]
            );
            
            if (insertResult.affectedRows === 0) {
                throw new Error('Failed to add inventory items');
            }
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
 * Checks if a variant has sufficient stock for an order
 * @param {number} variantId - The variant ID
 * @param {number} requestedQuantity - The quantity requested
 * @param {Object} connection - Database connection (optional, for transactions)
 * @returns {Object} - Result object with availability status
 */
async function checkVariantStockAvailability(variantId, requestedQuantity, connection = null) {
    const db = connection || dbSingleton.getConnection();
    
    try {
        const [stockResult] = await db.query(
            `SELECT 
                p.name as product_name,
                pv.variant_name,
                COUNT(*) as available_stock
             FROM products p
             JOIN product_variants pv ON p.product_id = pv.product_id
             JOIN inventory_items ii ON pv.variant_id = ii.variant_id
             WHERE pv.variant_id = ? AND ii.status = 'available'
             GROUP BY pv.variant_id`,
            [variantId]
        );
        
        if (stockResult.length === 0) {
            return {
                available: false,
                error: 'Variant not found or no available inventory'
            };
        }
        
        const { product_name, variant_name, available_stock } = stockResult[0];
        const available = available_stock >= requestedQuantity;
        
        return {
            available,
            currentStock: available_stock,
            requestedQuantity,
            productName: product_name,
            variantName: variant_name,
            insufficientQuantity: available ? 0 : requestedQuantity - available_stock
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
 * @param {Array} orderItems - Array of order items with product_id, variant_id, and quantity
 * @param {Object} connection - Database connection (for transactions)
 * @returns {Object} - Result object with processing status
 */
async function processOrderInventory(orderItems, connection) {
    const results = [];
    
    for (const item of orderItems) {
        let result;
        
        if (item.variant_id) {
            // Update variant-specific inventory
            result = await safeUpdateVariantInventory(
                item.variant_id, 
                -item.quantity, // Negative for reduction
                connection
            );
        } else {
            // For products without variants, find the first available variant
            const [variantResult] = await connection.query(
                `SELECT pv.variant_id 
                 FROM product_variants pv
                 JOIN inventory_items ii ON pv.variant_id = ii.variant_id
                 WHERE pv.product_id = ? AND ii.status = 'available'
                 LIMIT 1`,
                [item.product_id]
            );
            
            if (variantResult.length === 0) {
                return {
                    success: false,
                    error: `No available inventory found for product ${item.product_id}`,
                    results
                };
            }
            
            result = await safeUpdateVariantInventory(
                variantResult[0].variant_id,
                -item.quantity,
                connection
            );
        }
        
        results.push({
            productId: item.product_id,
            variantId: item.variant_id,
            quantity: item.quantity,
            ...result
        });
        
        if (!result.success) {
            return {
                success: false,
                error: `Failed to update inventory for product ${item.product_id}${item.variant_id ? ` variant ${item.variant_id}` : ''}: ${result.error}`,
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
    safeUpdateVariantInventory,
    checkVariantStockAvailability,
    processOrderInventory
};
