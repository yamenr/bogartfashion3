import React from 'react';
import './shared.css'; // Import shared styles
import aboutImage from '../assets/images/rasta7.jpg'; // Fashion-related image
import { FaShieldAlt, FaDollarSign } from 'react-icons/fa'; // Assuming you have react-icons installed

const About = () => {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px', background: '#111', minHeight: '100vh' }}>
      <h1 style={{ color: '#C2883A', textAlign: 'center', fontSize: '3em', marginBottom: '40px' }}>About BogartFashion</h1>
      
      <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', marginTop: '30px' }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ color: '#C2883A', fontSize: '2.2em', marginBottom: '20px' }}>Our Story</h2>
          <p style={{ lineHeight: '1.8', color: '#ccc', fontSize: '1.1em' }}>
            Founded in 2018, BogartFashion began with a simple mission: to provide fashion enthusiasts with high-quality
            clothing and accessories that combine style, comfort, and affordability. What started as a small boutique
            has grown into a trusted destination for fashion lovers worldwide.
          </p>
          
          <p style={{ lineHeight: '1.8', color: '#ccc', fontSize: '1.1em' }}>
            We believe that fashion is more than just clothing – it's a form of self-expression, confidence, and
            creativity. Our carefully curated collection reflects the latest trends while maintaining timeless elegance
            that transcends seasons.
          </p>
          
          <p style={{ lineHeight: '1.8', color: '#ccc', fontSize: '1.1em' }}>
            Every piece in our collection is selected with attention to quality, design, and the diverse needs of our
            customers. From casual everyday wear to sophisticated formal attire, we offer something for every occasion
            and personal style.
          </p>
        </div>
        
        <div style={{ flex: 1 }}>
          <img src={aboutImage} alt="About BogartFashion" style={{ width: '100%', borderRadius: '8px' }} />
        </div>
      </div>

      {/* Our Values Section */}
      <section style={{ backgroundColor: '#1a1a1a', border: '1px solid #C2883A', borderRadius: '10px', padding: '60px 20px', textAlign: 'center', marginTop: '60px', boxShadow: '0 4px 20px rgba(194, 136, 58, 0.2)' }}>
        <h2 style={{ fontSize: '2em', marginBottom: '40px', color: '#C2883A' }}>Our Values</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap' }}>
          {/* Quality Card */}
          <div style={{
            backgroundColor: '#222',
            border: '1px solid #333',
            padding: '30px',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            flexBasis: '300px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <FaShieldAlt size={40} color="#C2883A" style={{ marginBottom: '20px' }} />
            <h3 style={{ fontSize: '1.5em', marginBottom: '10px', color: '#C2883A' }}>Quality</h3>
            <p style={{ lineHeight: '1.6', color: '#ccc' }}>
              We partner with trusted brands and rigorously test
              all products to ensure they meet our high
              standards for performance and reliability.
            </p>
          </div>
          {/* Value Card */}
          <div style={{
            backgroundColor: '#222',
            border: '1px solid #333',
            padding: '30px',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            flexBasis: '300px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <FaDollarSign size={40} color="#C2883A" style={{ marginBottom: '20px' }} />
            <h3 style={{ fontSize: '1.5em', marginBottom: '10px', color: '#C2883A' }}>Value</h3>
            <p style={{ lineHeight: '1.6', color: '#ccc' }}>
              We believe in fair pricing and transparency. Our
              customers deserve the best technology without
              overpaying.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;