const dbSingleton = require('../dbSingleton.js');

/**
 * Calculate similarity score between two products
 * @param {Object} product1 - First product object
 * @param {Object} product2 - Second product object
 * @returns {number} - Similarity score (0-100)
 */
function calculateSimilarity(product1, product2) {
    let score = 0;
    let totalWeight = 0;

    // Name similarity (highest weight - 40%)
    if (product1.name && product2.name) {
        const name1 = product1.name.toLowerCase().trim();
        const name2 = product2.name.toLowerCase().trim();
        
        if (name1 === name2) {
            score += 40;
        } else {
            // Check for partial matches
            const words1 = name1.split(/\s+/);
            const words2 = name2.split(/\s+/);
            let commonWords = 0;
            
            words1.forEach(word => {
                if (words2.includes(word) && word.length > 2) {
                    commonWords++;
                }
            });
            
            if (commonWords > 0) {
                score += (commonWords / Math.max(words1.length, words2.length)) * 30;
            }
        }
        totalWeight += 40;
    }

    // Brand similarity (25% weight)
    if (product1.brand && product2.brand) {
        if (product1.brand.toLowerCase().trim() === product2.brand.toLowerCase().trim()) {
            score += 25;
        }
        totalWeight += 25;
    }

    // Category similarity (15% weight)
    if (product1.category_id && product2.category_id) {
        if (product1.category_id === product2.category_id) {
            score += 15;
        }
        totalWeight += 15;
    }

    // Size similarity (10% weight)
    if (product1.size && product2.size) {
        if (product1.size.toLowerCase().trim() === product2.size.toLowerCase().trim()) {
            score += 10;
        }
        totalWeight += 10;
    }

    // Color similarity (10% weight)
    if (product1.color && product2.color) {
        if (product1.color.toLowerCase().trim() === product2.color.toLowerCase().trim()) {
            score += 10;
        }
        totalWeight += 10;
    }

    // Normalize score to 0-100 range
    return totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0;
}

/**
 * Find similar products in the database
 * @param {Object} newProduct - The new product to check
 * @param {number} threshold - Minimum similarity score (default: 70)
 * @returns {Array} - Array of similar products with similarity scores
 */
async function findSimilarProducts(newProduct, threshold = 70) {
    const db = dbSingleton.getConnection();
    
    try {
        // Get all active products for comparison
        const [existingProducts] = await db.query(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.category_id 
            WHERE p.stock >= 0
        `);

        const similarProducts = [];

        existingProducts.forEach(existingProduct => {
            const similarity = calculateSimilarity(newProduct, existingProduct);
            
            if (similarity >= threshold) {
                similarProducts.push({
                    ...existingProduct,
                    similarity: similarity,
                    isExactMatch: similarity === 100
                });
            }
        });

        // Sort by similarity score (highest first)
        similarProducts.sort((a, b) => b.similarity - a.similarity);

        return similarProducts;
    } catch (error) {
        console.error('Error finding similar products:', error);
        return [];
    }
}

/**
 * Check if a product is an exact duplicate
 * @param {Object} newProduct - The new product to check
 * @returns {Object|null} - Exact duplicate product or null
 */
async function findExactDuplicate(newProduct) {
    const db = dbSingleton.getConnection();
    
    try {
        const [duplicates] = await db.query(`
            SELECT * FROM products 
            WHERE name = ? 
            AND brand = ? 
            AND category_id = ? 
            AND size = ? 
            AND color = ?
        `, [
            newProduct.name,
            newProduct.brand || null,
            newProduct.category_id || null,
            newProduct.size || null,
            newProduct.color || null
        ]);

        return duplicates.length > 0 ? duplicates[0] : null;
    } catch (error) {
        console.error('Error finding exact duplicate:', error);
        return null;
    }
}

/**
 * Get similarity analysis for a new product
 * @param {Object} newProduct - The new product to analyze
 * @returns {Object} - Analysis result with similar products and recommendations
 */
async function analyzeProductSimilarity(newProduct) {
    try {
        const similarProducts = await findSimilarProducts(newProduct, 60);
        const exactDuplicate = await findExactDuplicate(newProduct);

        let recommendation = 'safe_to_add';
        let message = '';

        if (exactDuplicate) {
            recommendation = 'exact_duplicate';
            message = 'This product appears to be an exact duplicate. Consider adding to inventory instead.';
        } else if (similarProducts.length > 0) {
            const highestSimilarity = similarProducts[0].similarity;
            
            if (highestSimilarity >= 90) {
                recommendation = 'very_similar';
                message = 'This product is very similar to existing products. Please review before adding.';
            } else if (highestSimilarity >= 70) {
                recommendation = 'similar';
                message = 'This product is similar to existing products. Please review before adding.';
            }
        }

        return {
            recommendation,
            message,
            similarProducts,
            exactDuplicate,
            shouldWarn: recommendation !== 'safe_to_add'
        };
    } catch (error) {
        console.error('Error analyzing product similarity:', error);
        return {
            recommendation: 'error',
            message: 'Error analyzing product similarity',
            similarProducts: [],
            exactDuplicate: null,
            shouldWarn: false
        };
    }
}

module.exports = {
    calculateSimilarity,
    findSimilarProducts,
    findExactDuplicate,
    analyzeProductSimilarity
};
