import React, { useState, useRef, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { formatNumberWithCommas } from '../utils/currency';
import './PriceRangeSlider.css';

const PriceRangeSlider = ({ minPrice = 0, maxPrice = 100000, value, onChange }) => {
  const { currency } = useSettings();
  const [isDragging, setIsDragging] = useState(false);
  const [localValue, setLocalValue] = useState(value || maxPrice);
  const sliderRef = useRef(null);
  const handleRef = useRef(null);

  // Update local value when props change
  useEffect(() => {
    setLocalValue(value || maxPrice);
  }, [value, maxPrice]);

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

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    
    // Add dragging class for smooth transitions
    if (sliderRef.current) {
      sliderRef.current.classList.add('dragging');
    }
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    
    // Add dragging class for smooth transitions
    if (sliderRef.current) {
      sliderRef.current.classList.add('dragging');
    }
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const position = ((e.clientX - rect.left) / rect.width) * 100;
    const clampedPosition = Math.max(0, Math.min(100, position));
    
    const newValue = getValueFromPosition(clampedPosition, minPrice, maxPrice);
    setLocalValue(newValue);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !sliderRef.current) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = sliderRef.current.getBoundingClientRect();
    const position = ((touch.clientX - rect.left) / rect.width) * 100;
    const clampedPosition = Math.max(0, Math.min(100, position));
    
    const newValue = getValueFromPosition(clampedPosition, minPrice, maxPrice);
    setLocalValue(newValue);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    // Remove dragging class
    if (sliderRef.current) {
      sliderRef.current.classList.remove('dragging');
    }
    
    // Call onChange with final value when user releases mouse
    onChange(localValue);
    
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // Remove dragging class
    if (sliderRef.current) {
      sliderRef.current.classList.remove('dragging');
    }
    
    // Call onChange with final value when user releases touch
    onChange(localValue);
    
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  };

  const handleTrackClick = (e) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const position = ((e.clientX - rect.left) / rect.width) * 100;
    const clampedPosition = Math.max(0, Math.min(100, position));
    
    const newValue = getValueFromPosition(clampedPosition, minPrice, maxPrice);
    setLocalValue(newValue);
    onChange(newValue);
  };

  const position = getPositionFromValue(localValue, minPrice, maxPrice);

  return (
    <div className="price-range-slider">
      <div className="slider-container">
        <div 
          className="slider-track" 
          ref={sliderRef}
          onClick={handleTrackClick}
        >
          <div 
            className="slider-fill" 
            style={{ 
              left: '0%',
              width: `${position}%` 
            }}
          />
          <div 
            className="slider-handle"
            ref={handleRef}
            style={{ left: `${position}%` }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          />
        </div>
      </div>
      
      <div className="price-display">
        <span className="min-price">
          {getCurrencySymbol(currency)}{formatNumberWithCommas(minPrice)}
        </span>
        <span className="current-price">
          {getCurrencySymbol(currency)}{formatNumberWithCommas(localValue)}
        </span>
        <span className="max-price">
          {getCurrencySymbol(currency)}{formatNumberWithCommas(maxPrice)}
        </span>
      </div>
      

    </div>
  );
};

export default PriceRangeSlider;
