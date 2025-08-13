import React, { useState } from 'react';
import axios from 'axios';
import './Modal.css';

const SimilarityWarningModal = ({ 
    isOpen, 
    onClose, 
    similarityData, 
    newProductData, 
    onSuccess,
    onAddInventory 
}) => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [isAddingInventory, setIsAddingInventory] = useState(false);
    const [message, setMessage] = useState('');
    const token = localStorage.getItem('token');

    if (!isOpen || !similarityData) {
        return null;
    }

    const handleAddAnyway = async () => {
        try {
            setMessage('Adding product...');
            
            const formData = new FormData();
            Object.keys(newProductData).forEach(key => {
                if (newProductData[key] !== undefined && newProductData[key] !== '') {
                    formData.append(key, newProductData[key]);
                }
            });

            const response = await axios.post('/api/products', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            setMessage('Product added successfully!');
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Error adding product');
        }
    };

    const handleAddToInventory = async () => {
        if (!selectedProduct) {
            setMessage('Please select a product to add inventory to');
            return;
        }

        try {
            setIsAddingInventory(true);
            setMessage('Adding inventory...');

            const response = await axios.patch(`/api/products/${selectedProduct.product_id}/add-inventory`, {
                quantity: parseInt(quantity)
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setMessage(response.data.message);
            setTimeout(() => {
                onAddInventory();
                onClose();
            }, 1500);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Error adding inventory');
        } finally {
            setIsAddingInventory(false);
        }
    };

    const getSimilarityColor = (similarity) => {
        if (similarity >= 90) return '#dc3545'; // Red for very similar
        if (similarity >= 70) return '#ffc107'; // Yellow for similar
        return '#28a745'; // Green for safe
    };

    const getSimilarityIcon = (similarity) => {
        if (similarity >= 90) return '⚠️';
        if (similarity >= 70) return '⚡';
        return '✅';
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content similarity-warning-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>⚠️ Similar Product Warning</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    <div className="warning-message">
                        <p><strong>{similarityData.message}</strong></p>
                    </div>

                    {similarityData.exactDuplicate && (
                        <div className="exact-duplicate-section">
                            <h3>🎯 Exact Duplicate Found</h3>
                            <div className="duplicate-product">
                                <strong>Product:</strong> {similarityData.exactDuplicate.name}<br/>
                                <strong>Current Stock:</strong> {similarityData.exactDuplicate.stock}<br/>
                                <strong>Brand:</strong> {similarityData.exactDuplicate.brand || 'N/A'}<br/>
                                <strong>Category:</strong> {similarityData.exactDuplicate.category_name || 'N/A'}
                            </div>
                            <p className="recommendation">
                                💡 <strong>Recommendation:</strong> Add inventory to the existing product instead of creating a duplicate.
                            </p>
                        </div>
                    )}

                    {similarityData.similarProducts.length > 0 && (
                        <div className="similar-products-section">
                            <h3>🔍 Similar Products Found</h3>
                            <div className="similar-products-list">
                                {similarityData.similarProducts.map((product, index) => (
                                    <div 
                                        key={product.product_id} 
                                        className={`similar-product ${selectedProduct?.product_id === product.product_id ? 'selected' : ''}`}
                                        onClick={() => setSelectedProduct(product)}
                                    >
                                        <div className="similarity-score">
                                            <span className="score-icon">{getSimilarityIcon(product.similarity)}</span>
                                            <span className="score-value" style={{ color: getSimilarityColor(product.similarity) }}>
                                                {product.similarity}%
                                            </span>
                                        </div>
                                        <div className="product-details">
                                            <strong>{product.name}</strong><br/>
                                            <span>Stock: {product.stock}</span><br/>
                                            <span>Brand: {product.brand || 'N/A'}</span><br/>
                                            <span>Size: {product.size || 'N/A'}</span><br/>
                                            <span>Color: {product.color || 'N/A'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedProduct && (
                        <div className="add-inventory-section">
                            <h3>📦 Add Inventory to Existing Product</h3>
                            <div className="inventory-form">
                                <label>
                                    Quantity to add:
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        className="quantity-input"
                                    />
                                </label>
                                <button 
                                    onClick={handleAddToInventory}
                                    disabled={isAddingInventory}
                                    className="add-inventory-btn"
                                >
                                    {isAddingInventory ? 'Adding...' : 'Add to Inventory'}
                                </button>
                            </div>
                        </div>
                    )}

                    {message && (
                        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
                            {message}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <div className="action-buttons">
                        {!similarityData.exactDuplicate && (
                            <button 
                                onClick={handleAddAnyway}
                                className="add-anyway-btn"
                            >
                                Add Product Anyway
                            </button>
                        )}
                        <button onClick={onClose} className="cancel-btn">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SimilarityWarningModal;
