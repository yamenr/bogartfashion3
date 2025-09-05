import React, { useState, useRef, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { formatNumberWithCommas } from '../utils/currency';
import './PriceRangeSlider.css';

const PriceRangeSlider = ({ minPrice = 0, maxPrice = 1000, value = { min: 0, max: 1000 }, onChange }) => {
  const { currency } = useSettings();
  const [isDragging, setIsDragging] = useState(null); // 'min', 'max', or null
  const [localValue, setLocalValue] = useState(value);
  const sliderRef = useRef(null);
  const minHandleRef = useRef(null);
  const maxHandleRef = useRef(null);

  // Update local value when props change
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      if (document._mouseMoveHandler) {
        document.removeEventListener('mousemove', document._mouseMoveHandler);
      }
      if (document._mouseUpHandler) {
        document.removeEventListener('mouseup', document._mouseUpHandler);
      }
      if (document._touchMoveHandler) {
        document.removeEventListener('touchmove', document._touchMoveHandler);
      }
      if (document._touchEndHandler) {
        document.removeEventListener('touchend', document._touchEndHandler);
      }
    };
  }, []);

  const getCurrencySymbol = (currencyCode) => {
    const symbols = {
      'ILS': '₪',
      'USD': '$',
      'EUR': '€',
    };
    return symbols[currencyCode] || '$';
  };

  const getPositionFromValue = (val, min, max) => {
    return ((val - min) / (max - min)) * 100;
  };

  const getValueFromPosition = (position, min, max) => {
    return Math.round((position / 100) * (max - min) + min);
  };

  const handleMouseDown = (e, handleType) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(handleType);
    
    // Add dragging class for smooth transitions
    if (sliderRef.current) {
      sliderRef.current.classList.add('dragging');
    }
    
    const mouseMoveHandler = (e) => handleMouseMove(e, handleType);
    const mouseUpHandler = (e) => handleMouseUp(e, handleType);
    
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
    
    // Store handlers for cleanup
    document._mouseMoveHandler = mouseMoveHandler;
    document._mouseUpHandler = mouseUpHandler;
  };

  const handleTouchStart = (e, handleType) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(handleType);
    
    // Add dragging class for smooth transitions
    if (sliderRef.current) {
      sliderRef.current.classList.add('dragging');
    }
    
    const touchMoveHandler = (e) => handleTouchMove(e, handleType);
    const touchEndHandler = (e) => handleTouchEnd(e, handleType);
    
    document.addEventListener('touchmove', touchMoveHandler, { passive: false });
    document.addEventListener('touchend', touchEndHandler);
    
    // Store handlers for cleanup
    document._touchMoveHandler = touchMoveHandler;
    document._touchEndHandler = touchEndHandler;
  };

  const handleMouseMove = (e, handleType) => {
    if (!isDragging || !sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const position = ((e.clientX - rect.left) / rect.width) * 100;
    const clampedPosition = Math.max(0, Math.min(100, position));
    
    const newValue = getValueFromPosition(clampedPosition, minPrice, maxPrice);
    
    setLocalValue(prev => {
      let newMin = prev.min;
      let newMax = prev.max;
      
      if (handleType === 'min') {
        newMin = Math.min(newValue, prev.max - 1); // Ensure min is less than max
      } else if (handleType === 'max') {
        newMax = Math.max(newValue, prev.min + 1); // Ensure max is greater than min
      }
      
      return { min: newMin, max: newMax };
    });
  };

  const handleTouchMove = (e, handleType) => {
    if (!isDragging || !sliderRef.current) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = sliderRef.current.getBoundingClientRect();
    const position = ((touch.clientX - rect.left) / rect.width) * 100;
    const clampedPosition = Math.max(0, Math.min(100, position));
    
    const newValue = getValueFromPosition(clampedPosition, minPrice, maxPrice);
    
    setLocalValue(prev => {
      let newMin = prev.min;
      let newMax = prev.max;
      
      if (handleType === 'min') {
        newMin = Math.min(newValue, prev.max - 1);
      } else if (handleType === 'max') {
        newMax = Math.max(newValue, prev.min + 1);
      }
      
      return { min: newMin, max: newMax };
    });
  };

  const handleMouseUp = (e, handleType) => {
    setIsDragging(null);
    
    // Remove dragging class
    if (sliderRef.current) {
      sliderRef.current.classList.remove('dragging');
    }
    
    // Call onChange with final value when user releases mouse
    onChange(localValue);
    
    // Clean up event listeners
    if (document._mouseMoveHandler) {
      document.removeEventListener('mousemove', document._mouseMoveHandler);
      document._mouseMoveHandler = null;
    }
    if (document._mouseUpHandler) {
      document.removeEventListener('mouseup', document._mouseUpHandler);
      document._mouseUpHandler = null;
    }
  };

  const handleTouchEnd = (e, handleType) => {
    setIsDragging(null);
    
    // Remove dragging class
    if (sliderRef.current) {
      sliderRef.current.classList.remove('dragging');
    }
    
    // Call onChange with final value when user releases touch
    onChange(localValue);
    
    // Clean up event listeners
    if (document._touchMoveHandler) {
      document.removeEventListener('touchmove', document._touchMoveHandler);
      document._touchMoveHandler = null;
    }
    if (document._touchEndHandler) {
      document.removeEventListener('touchend', document._touchEndHandler);
      document._touchEndHandler = null;
    }
  };



  const minPosition = getPositionFromValue(localValue.min, minPrice, maxPrice);
  const maxPosition = getPositionFromValue(localValue.max, minPrice, maxPrice);

  return (
    <div className="price-range-slider">
      <div className="slider-container">
        <div 
          className="slider-track" 
          ref={sliderRef}
        >
          <div 
            className="slider-fill" 
            style={{ 
              left: `${minPosition}%`,
              width: `${maxPosition - minPosition}%` 
            }}
          />
          <div 
            className="slider-handle slider-handle-min"
            ref={minHandleRef}
            style={{ left: `${minPosition}%` }}
            onMouseDown={(e) => handleMouseDown(e, 'min')}
            onTouchStart={(e) => handleTouchStart(e, 'min')}
          />
          <div 
            className="slider-handle slider-handle-max"
            ref={maxHandleRef}
            style={{ left: `${maxPosition}%` }}
            onMouseDown={(e) => handleMouseDown(e, 'max')}
            onTouchStart={(e) => handleTouchStart(e, 'max')}
          />
        </div>
      </div>
      
      <div className="price-display">
        <span className="min-price">
          {getCurrencySymbol(currency)}{formatNumberWithCommas(minPrice)}
        </span>
        <span className="current-price-range">
          {getCurrencySymbol(currency)}{formatNumberWithCommas(localValue.min)} - {getCurrencySymbol(currency)}{formatNumberWithCommas(localValue.max)}
        </span>
        <span className="max-price">
          {getCurrencySymbol(currency)}{formatNumberWithCommas(maxPrice)}
        </span>
      </div>
    </div>
  );
};

export default PriceRangeSlider;