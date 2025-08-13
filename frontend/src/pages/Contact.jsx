import React, { useState } from 'react';
import './shared.css'; // Import shared styles

const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Sending...');
    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('Message sent successfully!');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        setStatus(data.message || 'Failed to send message.');
      }
    } catch (err) {
      setStatus('Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Dark Header with Gold Accent */}
      <div style={{ background: 'linear-gradient(135deg, #2a2a2a, #1a1a1a)', border: '1px solid #C2883A', color: 'white', padding: '60px 20px', textAlign: 'center', marginBottom: '40px', boxShadow: '0 4px 20px rgba(194, 136, 58, 0.2)' }}>
        <h1 style={{ fontSize: '3em', margin: 0, fontWeight: 'bold', color: '#C2883A' }}>Contact Us</h1>
        <p style={{ marginTop: '15px', fontSize: '1.2em' }}>
          Have questions about our products or services? Our team is here to help you.
        </p>
      </div>

      <div className="simple-page-container" style={{paddingTop: 0}}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', padding: '40px 0', flexWrap: 'wrap' }}>
          {/* Contact Information */}
          <div style={{ textAlign: 'center', minWidth: '250px' }}>
            <span style={{ fontSize: '2.5em' }}>📍</span>
            <h3 style={{ marginTop: '10px', fontSize: '1.2em' }}>Our Location</h3>
            <p style={{ color: '#666' }}>123 Tech Avenue<br />Silicon Valley, CA 94043<br />United States</p>
          </div>
          <div style={{ textAlign: 'center', minWidth: '250px' }}>
            <span style={{ fontSize: '2.5em' }}>📧</span>
            <h3 style={{ marginTop: '10px', fontSize: '1.2em' }}>Email Us</h3>
            <p style={{ color: '#666' }}>support@bogartfashion.com<br />sales@bogartfashion.com</p>
          </div>
          <div style={{ textAlign: 'center', minWidth: '250px' }}>
            <span style={{ fontSize: '2.5em' }}>📞</span>
            <h3 style={{ marginTop: '10px', fontSize: '1.2em' }}>Call Us</h3>
            <p style={{ color: '#666' }}>Customer Support: (220) 456-7890<br />Sales Inquiries: (712) 654-7891</p>
          </div>
        </div>

        {/* Contact Form */}
        <div style={{ maxWidth: '600px', margin: '0 auto', background: '#222', border: '1px solid #333', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#C2883A' }}>Send Us a Message</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="name" style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Your Name</label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: '#fff' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="email" style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Email</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: '#fff' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="message" style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Message</label>
              <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} required rows="5" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #555', background: '#333', color: '#fff' }}></textarea>
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: loading ? '#666' : '#C2883A', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1.1em', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background-color 0.3s' }} onMouseEnter={(e) => !loading && (e.target.style.background = '#a6762e')} onMouseLeave={(e) => !loading && (e.target.style.background = '#C2883A')}>Send Message</button>
            {status && <p style={{ textAlign: 'center', marginTop: '15px', color: status.includes('successfully') ? '#4ade80' : status.includes('Sending') ? '#C2883A' : '#ef4444' }}>{status}</p>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;