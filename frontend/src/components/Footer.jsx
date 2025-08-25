import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
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
          <p>Sales: sales@bogartfashion.com</p>
          <p>Customer Support: +972 50 374 7641</p>
          <p>Sales Inquiries: +972 50 288 4200</p>
          <p>Address: Susita Street 7, Shefa Israel Shopping Center, Tel Aviv, HaSharon</p>
          <p>Hours: Sunday - Thursday: 9:00 AM - 6:00 PM</p>
          <p>Friday - Saturday: 10:00 AM - 4:00 PM</p>
        </div>

        {/* Follow Us */}
        <div style={{ flex: '1 1 150px' }}>
          <h3 style={{ color: '#C2883A', marginBottom: '15px' }}>Follow Us</h3>
          <div style={{ display: 'flex', gap: '15px' }}>
            <a 
              href="https://facebook.com/BogartManSA" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: '#fff', 
                textDecoration: 'none', 
                fontSize: '1.5em',
                transition: 'color 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.color = '#C2883A'}
              onMouseLeave={(e) => e.target.style.color = '#fff'}
              aria-label="Follow Bogart Fashion on Facebook"
            >
              f
            </a>
            <a 
              href="https://x.com/BogartManSA" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: '#fff', 
                textDecoration: 'none', 
                fontSize: '1.5em',
                transition: 'color 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.color = '#C2883A'}
              onMouseLeave={(e) => e.target.style.color = '#fff'}
              aria-label="Follow Bogart Fashion on Twitter/X"
            >
              𝕏
            </a>
            <a 
              href="https://instagram.com/bogartman" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: '#999', 
                textDecoration: 'none', 
                fontSize: '1.5em',
                transition: 'color 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.color = '#C2883A'}
              onMouseLeave={(e) => e.target.style.color = '#999'}
              aria-label="Follow Bogart Fashion on Instagram"
            >
              📷
            </a>
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
        © {currentYear} BogartFashion. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer; 