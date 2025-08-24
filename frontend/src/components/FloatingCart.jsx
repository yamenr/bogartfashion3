import React from 'react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { FaShoppingCart } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

const FloatingCart = () => {
  const { cartItems } = useCart();
  const { user_id, isUserAdmin } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show floating cart on cart page, if user is not logged in, or if user is admin
  if (!user_id || location.pathname === '/cart' || isUserAdmin) {
    return null;
  }

  const itemCount = cartItems?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

  return (
    <div
      onClick={() => navigate('/cart')}
      style={{
        position: 'fixed',
        bottom: '32px',
        right: '32px',
        zIndex: 1000,
        background: '#222',
        borderRadius: '50%',
        boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
        width: '64px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
        overflow: 'visible',
      }}
      title="View Cart"
    >
      <FaShoppingCart size={32} color="#C2883A" />
      {itemCount > 0 && (
        <span style={{
          position: 'absolute',
          top: '-6px',
          right: '-6px',
          background: '#C2883A',
          color: '#fff',
          borderRadius: '50%',
          padding: '2px 8px',
          fontSize: '0.95em',
          fontWeight: 'bold',
          minWidth: '24px',
          textAlign: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.12)'
        }}>{itemCount}</span>
      )}
    </div>
  );
};

export default FloatingCart; 