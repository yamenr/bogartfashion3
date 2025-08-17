import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { formatPrice } from '../utils/currency';
import './ProductDetails.css';

// Helper to get currency symbol
const getCurrencySymbol = (currencyCode) => {
  const symbols = {
    'ILS': '₪',
    'USD': '$',
    'EUR': '€',
  };
  return symbols[currencyCode] || '$';
};

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user_id, username, currency } = useSettings();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cartMsg, setCartMsg] = useState('');

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        setProduct(data);
      } catch (err) {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    setCartMsg('');
    if (!user_id) {
      setCartMsg('Please log in to add items to your cart.');
      setTimeout(() => navigate('/login'), 1200);
      return;
    }
    addToCart(product, quantity);
    setCartMsg('Added to cart!');
  };

  if (loading) return <div className="loading-container">Loading...</div>;
  if (!product) return <div className="error-container">Product not found.</div>;

  // Enhanced inventory validation
  const hasValidStock = product.stock && product.stock >= 0;
  const isOutOfStock = !hasValidStock || product.stock === 0;
  const stockStatus = !hasValidStock ? 'Invalid Stock Data' : product.stock === 0 ? 'Out of Stock' : `In Stock (${product.stock} available)`;
  const stockColor = !hasValidStock ? '#ff6b35' : product.stock === 0 ? '#dc3545' : '#28a745';

  return (
    <div className="product-details-container">
      <button 
        onClick={() => navigate(-1)} 
        className="back-button"
      >
        ← Back to all products
      </button>
      
      <div className="product-layout">
        <div className="product-image-container">
          {product.image ? (
            <img
              src={product.image && product.image.startsWith('/uploads') ? `http://localhost:3001${product.image}` : product.image}
              alt={product.name}
              className="product-main-image"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className="product-placeholder">
            👜
          </div>
        </div>
        
        <div className="product-info-container">
          <h1 className="product-title">{product.name}</h1>
          <div className="product-price">{formatPrice(product.price, currency)}</div>
          <p className="product-description">{product.description}</p>
          
          {/* Fashion-specific details */}
          <div className="product-details-box">
            <h3 className="product-details-title">Product Details</h3>
            <div className="product-details-grid">
              {product.brand && (
                <div className="product-detail-item">
                  <span className="product-detail-label">Brand:</span>
                  <span className="product-detail-value">{product.brand}</span>
                </div>
              )}
              {product.size && (
                <div className="product-detail-item">
                  <span className="product-detail-label">Size:</span>
                  <span className="product-detail-value">{product.size}</span>
                </div>
              )}
              {product.color && (
                <div className="product-detail-item">
                  <span className="product-detail-label">Color:</span>
                  <span className="product-detail-value">{product.color}</span>
                </div>
              )}
              {product.material && (
                <div className="product-detail-item">
                  <span className="product-detail-label">Material:</span>
                  <span className="product-detail-value">{product.material}</span>
                </div>
              )}
              {product.season && (
                <div className="product-detail-item">
                  <span className="product-detail-label">Season:</span>
                  <span className="product-detail-value">{product.season}</span>
                </div>
              )}
              {product.gender && (
                <div className="product-detail-item">
                  <span className="product-detail-label">Gender:</span>
                  <span className="product-detail-value">{product.gender}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="product-stock-status">
            <span className="stock-text" style={{ color: stockColor }}>
              {stockStatus}
            </span>
          </div>
          
          {hasValidStock && product.stock > 0 && (
            <div className="quantity-selector">
              <span className="quantity-label">Quantity:</span>
              <div className="quantity-controls">
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))} 
                  className="quantity-button"
                >
                  -
                </button>
                <span className="quantity-display">{quantity}</span>
                <button 
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} 
                  className="quantity-button"
                >
                  +
                </button>
              </div>
            </div>
          )}
          
          <button
            className="add-to-cart-button"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            title={!hasValidStock ? 'Invalid stock data' : product.stock === 0 ? 'Out of stock' : 'Add to cart'}
          >
            {!hasValidStock ? 'Invalid Stock' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
          
          {cartMsg && (
            <div className={`cart-message ${cartMsg.includes('Added') ? 'success' : 'error'}`}>
              {cartMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 