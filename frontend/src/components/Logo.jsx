import React from 'react';
import { Link } from 'react-router-dom';

const Logo = () => {
  return (
    <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        lineHeight: '1.1',
      }}>
        <span style={{
          color: '#C2883A',
          fontSize: '1.7rem',
          fontWeight: 'bold',
          letterSpacing: '1px',
        }}>
          BogartFashion
        </span>
        <span style={{
          color: '#f5f5f5',
          fontSize: '0.8rem',
          letterSpacing: '2px',
        }}>
          STYLE & QUALITY
        </span>
      </div>
    </Link>
  );
};

export default Logo; 