import React from 'react';

const Footer = () => {
  return (
    <footer style={{
      backgroundColor: '#111',
      color: '#fff',
      padding: '40px 20px',
      marginTop: 'auto', // Pushes footer to the bottom
      borderTop: '1px solid #333',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: '30px',
      }}>
        {/* BogartFashion Info */}
        <div style={{ flex: '1 1 300px' }}>
          <h3 style={{ color: '#C2883A', marginBottom: '15px' }}>BogartFashion</h3>
          <p>Your one-stop shop for premium fashion products and cutting-edge style. Quality guaranteed.</p>
        </div>

        {/* Contact Us */}
        <div style={{ flex: '1 1 250px' }}>
          <h3 style={{ color: '#C2883A', marginBottom: '15px' }}>Contact Us</h3>
          <p>Email: support@bogartfashion.com</p>
          <p>Phone: (555) 123-4567</p>
          <p>Address: 123 Fashion Street</p>
          <p>Hours: (555) 456-7891</p>
        </div>

        {/* Follow Us */}
        <div style={{ flex: '1 1 150px' }}>
          <h3 style={{ color: '#C2883A', marginBottom: '15px' }}>Follow Us</h3>
          <div style={{ display: 'flex', gap: '15px' }}>
            <a href="#" style={{ color: '#fff', textDecoration: 'none', fontSize: '1.5em' }}>f</a> {/* Placeholder for Facebook icon */}
            <a href="#" style={{ color: '#fff', textDecoration: 'none', fontSize: '1.5em' }}>𝕏</a> {/* Placeholder for Twitter icon */}
            <a href="#" style={{ color: '#fff', textDecoration: 'none', fontSize: '1.5em' }}>📷</a> {/* Placeholder for Instagram icon */}
          </div>
        </div>
      </div>

      <div style={{
        borderTop: '1px solid #333',
        marginTop: '30px',
        paddingTop: '20px',
        textAlign: 'center',
        fontSize: '0.9em',
        color: '#C2883A',
      }}>
        © 2024 BogartFashion. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer; 