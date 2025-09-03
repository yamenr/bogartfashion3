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
  
  // New hierarchical variant system states
  const [productAttributes, setProductAttributes] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [availableVariants, setAvailableVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loadingAttributes, setLoadingAttributes] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        setProduct(data);
        
        // Product data loaded successfully
        
        // Fetch product attributes for hierarchical variant system
        await fetchProductAttributes(data.product_id);
      } catch (err) {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  const fetchProductAttributes = async (productId) => {
    setLoadingAttributes(true);
    try {
      console.log('Fetching attributes for product:', productId);
      const res = await fetch(`/api/product-attributes/products/${productId}/attributes`);
      console.log('Attributes API response status:', res.status);
      
      if (!res.ok) {
        console.log('Attributes API failed, using simple variant system');
        setProductAttributes([]);
        return;
      }
      
      const attributes = await res.json();
      console.log('Received attributes:', attributes);
      setProductAttributes(attributes);
      
      // Set default selections for first attribute
      if (attributes.length > 0 && attributes[0].values.length > 0) {
        const firstAttr = attributes[0];
        setSelectedAttributes(prev => ({
          ...prev,
          [firstAttr.slug]: firstAttr.values[0].slug
        }));
        console.log('Set default selection for', firstAttr.slug, 'to', firstAttr.values[0].slug);
      }
    } catch (err) {
      console.error('Error fetching product attributes:', err);
      // On error, use simple variant system
      setProductAttributes([]);
    } finally {
      setLoadingAttributes(false);
    }
  };

  const fetchAvailableVariants = async (attributes) => {
    try {
      console.log('Fetching variants for attributes:', attributes);
      const res = await fetch(`/api/product-attributes/products/${id}/filter-variants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedAttributes: attributes })
      });
      console.log('Variants API response status:', res.status);
      
      const variants = await res.json();
      console.log('Received variants:', variants);
      setAvailableVariants(variants);
      
      // Auto-select first available variant
      if (variants.length > 0) {
        setSelectedVariant(variants[0]);
        console.log('Auto-selected variant:', variants[0]);
      } else {
        setSelectedVariant(null);
        console.log('No variants available for selection');
      }
    } catch (err) {
      console.error('Error fetching available variants:', err);
      setAvailableVariants([]);
      setSelectedVariant(null);
    }
  };

  // Handle attribute selection
  const handleAttributeSelect = (attributeSlug, valueSlug) => {
    const newSelectedAttributes = {
      ...selectedAttributes,
      [attributeSlug]: valueSlug
    };
    
    setSelectedAttributes(newSelectedAttributes);
    
    // Fetch available variants for the new selection
    fetchAvailableVariants(newSelectedAttributes);
  };

  // Check if all required attributes are selected
  const areAllAttributesSelected = () => {
    if (!productAttributes || !Array.isArray(productAttributes)) {
      return false;
    }
    return productAttributes.every(attr => 
      !attr.is_required || selectedAttributes[attr.slug]
    );
  };

  // Get current price (variant price overrides product price only if different)
  const getCurrentPrice = () => {
    if (selectedVariant && selectedVariant.variant_price && selectedVariant.variant_price !== product?.price) {
      return selectedVariant.variant_price;
    }
    return product?.price || 0;
  };

  // Get current stock status
  const getCurrentStockStatus = () => {
    if (selectedVariant && selectedVariant.available_stock !== undefined) {
      return selectedVariant.available_stock > 0 
        ? `In Stock (${selectedVariant.available_stock} available)`
        : 'Out of Stock';
    }
    // Use derived total stock from variants instead of product.stock
    const totalStock = parseInt(product.totalStock) || 0;
    return totalStock > 0 
      ? `In Stock (${totalStock} available)`
      : 'Out of Stock';
  };

  // Check if current selection is out of stock
  const isCurrentSelectionOutOfStock = () => {
    if (selectedVariant && selectedVariant.available_stock !== undefined) {
      return selectedVariant.available_stock <= 0;
    }
    // Use derived total stock from variants instead of product.stock
    const totalStock = parseInt(product.totalStock) || 0;
    return totalStock <= 0;
  };

  const handleAddToCart = () => {
    setCartMsg('');
    if (!user_id) {
      setCartMsg('Please log in to add items to your cart.');
      setTimeout(() => navigate('/login'), 1200);
      return;
    }
    
    // Check if we have a hierarchical variant system
    if (hasHierarchicalVariants && productAttributes && productAttributes.length > 0) {
      if (!areAllAttributesSelected()) {
        setCartMsg('Please select all required attributes before adding to cart.');
        return;
      }
      
      if (!selectedVariant) {
        setCartMsg('No variant available for the selected attributes.');
        return;
      }
      
      if (selectedVariant.available_stock <= 0) {
        setCartMsg('This variant is out of stock.');
        return;
      }
      
      // Add variant to cart
      const itemToAdd = {
        ...product,
        selectedVariant: selectedVariant,
        selectedAttributes: selectedAttributes,
        variantPrice: selectedVariant.variant_price,
        hasVariants: true
      };
      
      addToCart(itemToAdd, quantity);
      setCartMsg('Added to cart!');
    } else {
      // Fallback to old system for products without attributes
      if (product.hasVariants && !selectedVariant) {
        setCartMsg('Please select a variant before adding to cart.');
        return;
      }
      
      const itemToAdd = {
        ...product,
        selectedVariant: selectedVariant,
        variantPrice: selectedVariant ? selectedVariant.variant_price : product.price
      };
      
      addToCart(itemToAdd, quantity);
      setCartMsg('Added to cart!');
    }
  };

  if (loading) return <div className="loading-container">Loading...</div>;
  if (!product) return <div className="error-container">Product not found.</div>;

  // Enable hierarchical variant system
  const hasHierarchicalVariants = productAttributes && productAttributes.length > 0;
  
  const currentPrice = getCurrentPrice();
  const currentStockStatus = getCurrentStockStatus();
  const isOutOfStock = isCurrentSelectionOutOfStock();

  return (
    <div className="product-details-container">
      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          backgroundColor: '#f0f0f0',
          color: '#333',
          padding: '10px',
          marginBottom: '20px',
          borderRadius: '5px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <strong>Debug Info:</strong><br/>
          hasHierarchicalVariants: {hasHierarchicalVariants ? 'true' : 'false'}<br/>
          productAttributes.length: {productAttributes?.length || 0}<br/>
          selectedAttributes: {JSON.stringify(selectedAttributes)}<br/>
          availableVariants.length: {availableVariants?.length || 0}<br/>
          selectedVariant: {selectedVariant ? selectedVariant.variant_name : 'none'}
        </div>
      )}
      
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
                if (e && e.target && e.target.style) {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling && e.target.nextSibling.style) {
                    e.target.nextSibling.style.display = 'flex';
                  }
                }
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
          
          {/* Hierarchical Variant Selection */}
          {hasHierarchicalVariants && (
            <div className="hierarchical-variant-selection">
              <h3>Select Your Options:</h3>
              
              {productAttributes.map((attribute, index) => (
                <div key={attribute.attribute_id} className="attribute-selector">
                  <label className="attribute-label">
                    {attribute.name}:
                    {attribute.is_required && <span className="required"> *</span>}
                  </label>
                  
                  <div className="attribute-values">
                    {attribute.values.map((value) => (
                      <button
                        key={value.value_id}
                        className={`attribute-value-btn ${
                          selectedAttributes[attribute.slug] === value.slug ? 'selected' : ''
                        }`}
                        onClick={() => handleAttributeSelect(attribute.slug, value.slug)}
                        disabled={loadingAttributes}
                      >
                        {value.value}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Available Variants Display */}
              {areAllAttributesSelected() && availableVariants.length > 0 && (
                <div className="available-variants">
                  <h4>Available Options:</h4>
                  <div className="variants-list">
                    {availableVariants.map((variant) => (
                      <div
                        key={variant.variant_id}
                        className={`variant-option ${
                          selectedVariant?.variant_id === variant.variant_id ? 'selected' : ''
                        }`}
                        onClick={() => setSelectedVariant(variant)}
                      >
                        <div className="variant-name">{variant.variant_name}</div>
                        <div className="variant-price">{formatPrice(variant.variant_price, currency)}</div>
                        <div className="variant-stock">
                          {variant.available_stock > 0 
                            ? `${variant.available_stock} available` 
                            : 'Out of stock'
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {areAllAttributesSelected() && availableVariants.length === 0 && (
                <div className="no-variants-available">
                  <p>No variants available for the selected combination.</p>
                </div>
              )}
            </div>
          )}
          
          {/* Fallback to old variant system */}
          {!hasHierarchicalVariants && product.variants && product.variants.length > 0 && (
            <div className="variant-selection">
              <h3>Select Variant:</h3>
              <div className="variants-grid">
                {product.variants.map((variant) => (
                  <div
                    key={variant.variant_id}
                    className={`variant-option ${selectedVariant?.variant_id === variant.variant_id ? 'selected' : ''}`}
                    onClick={() => setSelectedVariant(variant)}
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
          
          {/* Price Display */}
          <div className="product-price">
            <span className="price-label">Price:</span>
            <span className="price-value">
              {formatPrice(currentPrice, currency)}
            </span>
            {selectedVariant && selectedVariant.variant_price && selectedVariant.variant_price !== product.price && (
              <span className="original-price">{formatPrice(product.price, currency)}</span>
            )}
          </div>
          
          {/* Stock Status */}
          <div className="stock-status" style={{ 
            color: isOutOfStock ? '#dc3545' : '#28a745' 
          }}>
            {currentStockStatus}
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
                  disabled={isOutOfStock}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={handleAddToCart}
                className="add-to-cart-button"
                disabled={isOutOfStock || (hasHierarchicalVariants && !areAllAttributesSelected())}
              >
                {isOutOfStock 
                  ? 'Out of Stock' 
                  : hasHierarchicalVariants && !areAllAttributesSelected()
                    ? 'Select Options'
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