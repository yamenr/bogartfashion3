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
  const { user_id, username, currency, isUserAdmin } = useSettings();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cartMsg, setCartMsg] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        setProduct(data);
        
        // If product has variants, select the first one by default
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
          // Extract size and color from variant name if possible
          const variantName = data.variants[0].variant_name;
          if (variantName.includes('Size')) {
            const sizeMatch = variantName.match(/Size\s+(\w+)/);
            if (sizeMatch) setSelectedSize(sizeMatch[1]);
          }
          if (variantName.includes('Blue')) setSelectedColor('Blue');
          if (variantName.includes('Black')) setSelectedColor('Black');
          if (variantName.includes('White')) setSelectedColor('White');
          if (variantName.includes('Red')) setSelectedColor('Red');
        }
      } catch (err) {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
    // Extract size and color from variant name
    const variantName = variant.variant_name;
    if (variantName.includes('Size')) {
      const sizeMatch = variantName.match(/Size\s+(\w+)/);
      if (sizeMatch) setSelectedSize(sizeMatch[1]);
    }
    if (variantName.includes('Blue')) setSelectedColor('Blue');
    if (variantName.includes('Black')) setSelectedColor('Black');
    if (variantName.includes('White')) setSelectedColor('White');
    if (variantName.includes('Red')) setSelectedColor('Red');
  };

  const handleAddToCart = () => {
    setCartMsg('');
    if (!user_id) {
      setCartMsg('Please log in to add items to your cart.');
      setTimeout(() => navigate('/login'), 1200);
      return;
    }
    
    // If product has variants, require variant selection
    if (product.hasVariants && !selectedVariant) {
      setCartMsg('Please select a variant before adding to cart.');
      return;
    }
    
    // Add to cart with variant information
    const itemToAdd = {
      ...product,
      selectedVariant: selectedVariant,
      selectedSize: selectedSize,
      selectedColor: selectedColor,
      variantPrice: selectedVariant ? selectedVariant.variant_price : product.price
    };
    
    addToCart(itemToAdd, quantity);
    setCartMsg('Added to cart!');
  };

  if (loading) return <div className="loading-container">Loading...</div>;
  if (!product) return <div className="error-container">Product not found.</div>;

  // Enhanced inventory validation
  const hasValidStock = product.stock && product.stock >= 0;
  const isOutOfStock = !hasValidStock || product.stock === 0;
  const stockStatus = !hasValidStock ? 'Invalid Stock Data' : product.stock === 0 ? 'Out of Stock' : `In Stock (${product.stock} available)`;
  const stockColor = !hasValidStock ? '#ff6b35' : product.stock === 0 ? '#dc3545' : '#28a745';

  // Get current price (variant price or product price)
  const currentPrice = selectedVariant ? selectedVariant.variant_price : product.price;
  const hasVariants = product.variants && product.variants.length > 0;

  return (
    <div className="product-details-container">
      {/* Admin Notice */}
      {isUserAdmin && (
        <div style={{
          backgroundColor: '#C2883A',
          color: 'white',
          padding: '15px',
          marginBottom: '20px',
          borderRadius: '8px',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          🔒 Admin Mode: You can view product details but cannot make purchases. Use the Manager link to manage the store.
        </div>
      )}
      
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
          {!product.image && (
            <div className="no-image-placeholder">
              <span>No Image Available</span>
            </div>
          )}
        </div>
        
        <div className="product-info">
          <h1 className="product-title">{product.name}</h1>
          
          {/* Variant Selection */}
          {hasVariants && (
            <div className="variant-selection">
              <h3>Select Variant:</h3>
              <div className="variants-grid">
                {product.variants.map((variant) => (
                  <div
                    key={variant.variant_id}
                    className={`variant-option ${selectedVariant?.variant_id === variant.variant_id ? 'selected' : ''}`}
                    onClick={() => handleVariantSelect(variant)}
                  >
                    <div className="variant-name">{variant.variant_name}</div>
                    <div className="variant-price">{formatPrice(variant.variant_price, currency)}</div>
                    <div className="variant-stock">
                      Stock: {variant.available_stock > 0 ? `${variant.available_stock} available` : 'Out of stock'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Size and Color Selection (if not handled by variants) */}
          {!hasVariants && product.size && (
            <div className="product-attribute">
              <label>Size:</label>
              <span className="attribute-value">{product.size}</span>
            </div>
          )}
          
          {!hasVariants && product.color && (
            <div className="product-attribute">
              <label>Color:</label>
              <span className="attribute-value">{product.color}</span>
            </div>
          )}
          
          {/* Price Display */}
          <div className="product-price">
            <span className="price-label">Price:</span>
            <span className="price-value">
              {hasVariants && selectedVariant 
                ? formatPrice(selectedVariant.variant_price, currency)
                : formatPrice(product.price, currency)
              }
            </span>
            {hasVariants && selectedVariant && selectedVariant.variant_price !== product.price && (
              <span className="original-price">{formatPrice(product.price, currency)}</span>
            )}
          </div>
          
          {/* Stock Status */}
          <div className="stock-status" style={{ color: stockColor }}>
            {hasVariants && selectedVariant 
              ? `Stock: ${selectedVariant.available_stock > 0 ? `${selectedVariant.available_stock} available` : 'Out of stock'}`
              : stockStatus
            }
          </div>
          
          {/* Description */}
          {product.description && (
            <div className="product-description">
              <h3>Description:</h3>
              <p>{product.description}</p>
            </div>
          )}
          
          {/* Additional Details */}
          <div className="product-details-grid">
            {product.brand && (
              <div className="detail-item">
                <label>Brand:</label>
                <span>{product.brand}</span>
              </div>
            )}
            {product.material && (
              <div className="detail-item">
                <label>Material:</label>
                <span>{product.material}</span>
              </div>
            )}
            {product.gender && (
              <div className="detail-item">
                <label>Gender:</label>
                <span>{product.gender}</span>
              </div>
            )}
            {product.season && (
              <div className="detail-item">
                <label>Season:</label>
                <span>{product.season}</span>
              </div>
            )}
          </div>
          
          {/* Add to Cart Section */}
          {!isUserAdmin && (
            <div className="add-to-cart-section">
              <div className="quantity-selector">
                <label htmlFor="quantity">Quantity:</label>
                <select
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  disabled={hasVariants ? (selectedVariant?.available_stock === 0) : isOutOfStock}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={handleAddToCart}
                className="add-to-cart-button"
                disabled={hasVariants ? (selectedVariant?.available_stock === 0) : isOutOfStock}
              >
                {hasVariants && selectedVariant?.available_stock === 0 
                  ? 'Out of Stock' 
                  : 'Add to Cart'
                }
              </button>
              
              {cartMsg && (
                <div className="cart-message" style={{ color: cartMsg.includes('error') ? '#dc3545' : '#28a745' }}>
                  {cartMsg}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 