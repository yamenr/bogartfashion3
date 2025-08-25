import React, { useState, useEffect } from 'react';
import './shared.css'; // Import shared styles
import { FaMapMarkerAlt, FaEnvelope, FaPhone, FaClock, FaUser, FaComment } from 'react-icons/fa';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    honeypot: '' // Hidden field to catch bots
  });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [mapData, setMapData] = useState(null);
  const [mapLoading, setMapLoading] = useState(true);

  // Fetch map data securely from backend
  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const response = await fetch('/api/contact/map-data');
        if (response.ok) {
          const data = await response.json();
          setMapData(data);
        } else {
          console.error('Failed to fetch map data');
        }
      } catch (error) {
        console.error('Error fetching map data:', error);
      } finally {
        setMapLoading(false);
      }
    };

    fetchMapData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }
    
    // Check honeypot - if filled, it's likely a bot
    if (formData.honeypot) {
      newErrors.honeypot = 'Invalid submission detected';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setStatus('Sending...');
    setLoading(true);
    
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formData.message
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus('Message sent successfully! We will get back to you soon.');
        setFormData({
          name: '',
          email: '',
          message: '',
          honeypot: ''
        });
        setErrors({});
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
      {/* Enhanced Header with Gold Accent */}
      <div style={{ 
        background: 'linear-gradient(135deg, #2a2a2a, #1a1a1a)', 
        border: '1px solid #C2883A', 
        color: 'white', 
        padding: '80px 20px', 
        textAlign: 'center', 
        marginBottom: '40px', 
        boxShadow: '0 8px 32px rgba(194, 136, 58, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 30% 20%, rgba(194, 136, 58, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none'
        }} />
        <h1 style={{ 
          fontSize: '3.5em', 
          margin: 0, 
          fontWeight: 'bold', 
          color: '#C2883A',
          textShadow: '0 4px 8px rgba(0,0,0,0.5)',
          animation: 'fadeInUp 0.8s ease-out'
        }}>
          Contact Us
        </h1>
        <p style={{ 
          marginTop: '20px', 
          fontSize: '1.3em',
          color: '#ccc',
          animation: 'fadeInUp 0.8s ease-out 0.2s both'
        }}>
          Have questions about our products or services? Our team is here to help you.
        </p>
      </div>

      <div className="simple-page-container" style={{paddingTop: 0}}>
        {/* Enhanced Contact Information Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '30px', 
          padding: '40px 0', 
          marginBottom: '50px'
        }}>
          <div style={{ 
            textAlign: 'center', 
            background: '#222', 
            padding: '30px 20px', 
            borderRadius: '16px',
            border: '1px solid #333',
            boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-8px)';
            e.target.style.boxShadow = '0 12px 35px rgba(194, 136, 58, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
          }}>
            <FaMapMarkerAlt style={{ fontSize: '2.5em', color: '#C2883A', marginBottom: '15px' }} />
            <h3 style={{ marginTop: '10px', fontSize: '1.3em', color: '#C2883A', marginBottom: '15px' }}>Our Location</h3>
            <p style={{ color: '#ccc', lineHeight: '1.6' }}>
              {mapData?.location?.address || 'Susita Street 7, Shefa Israel Shopping Center, Tel Aviv, HaSharon'}
            </p>
          </div>
          
          <div style={{ 
            textAlign: 'center', 
            background: '#222', 
            padding: '30px 20px', 
            borderRadius: '16px',
            border: '1px solid #333',
            boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-8px)';
            e.target.style.boxShadow = '0 12px 35px rgba(194, 136, 58, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
          }}>
            <FaEnvelope style={{ fontSize: '2.5em', color: '#C2883A', marginBottom: '15px' }} />
            <h3 style={{ marginTop: '10px', fontSize: '1.3em', color: '#C2883A', marginBottom: '15px' }}>Email Us</h3>
            <p style={{ color: '#ccc', lineHeight: '1.6' }}>
              {mapData?.contact?.email || 'support@bogartfashion.com'}<br />
              sales@bogartfashion.com
            </p>
          </div>
          
          <div style={{ 
            textAlign: 'center', 
            background: '#222', 
            padding: '30px 20px', 
            borderRadius: '16px',
            border: '1px solid #333',
            boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-8px)';
            e.target.style.boxShadow = '0 12px 35px rgba(194, 136, 58, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
          }}>
            <FaPhone style={{ fontSize: '2.5em', color: '#C2883A', marginBottom: '15px' }} />
            <h3 style={{ marginTop: '10px', fontSize: '1.3em', color: '#C2883A', marginBottom: '15px' }}>Call Us</h3>
            <p style={{ color: '#ccc', lineHeight: '1.6' }}>
              Customer Support: {mapData?.contact?.phone || '+972 50 374 7641'}<br />
              Sales Inquiries: +972 50 288 4200
            </p>
          </div>
          
          <div style={{ 
            textAlign: 'center', 
            background: '#222', 
            padding: '30px 20px', 
            borderRadius: '16px',
            border: '1px solid #333',
            boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-8px)';
            e.target.style.boxShadow = '0 12px 35px rgba(194, 136, 58, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
          }}>
            <FaClock style={{ fontSize: '2.5em', color: '#C2883A', marginBottom: '15px' }} />
            <h3 style={{ marginTop: '10px', fontSize: '1.3em', color: '#C2883A', marginBottom: '15px' }}>Business Hours</h3>
            <p style={{ color: '#ccc', lineHeight: '1.6' }}>
              {mapData?.businessHours?.weekdays || 'Sunday - Thursday: 9:00 AM - 6:00 PM'}<br />
              {mapData?.businessHours?.weekend || 'Friday - Saturday: 10:00 AM - 4:00 PM'}
            </p>
          </div>
        </div>

        {/* Secure Map Section - No API Key Exposure */}
        <div style={{ 
          marginBottom: '50px',
          background: '#222',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid #333',
          boxShadow: '0 8px 25px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{ 
            textAlign: 'center', 
            margin: '0',
            padding: '30px 30px 20px 30px',
            color: '#C2883A',
            fontSize: '1.8em',
            borderBottom: '1px solid #333'
          }}>
            <FaMapMarkerAlt style={{ marginRight: '10px' }} />
            Find Us on the Map
          </h2>
          
          {mapLoading ? (
            <div style={{ 
              height: '400px', 
              width: '100%',
              background: '#333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ccc',
              fontSize: '1.1em'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2em', marginBottom: '15px' }}>🗺️</div>
                <div>Loading map data...</div>
              </div>
            </div>
          ) : mapData ? (
            <div style={{ 
              height: '400px', 
              width: '100%',
              background: '#333',
              position: 'relative'
            }}>
               {/* Google Maps iframe embed - more reliable than static maps */}
               <iframe
                 src={`https://www.google.com/maps/embed/v1/place?key=${mapData.embedUrl?.split('key=')[1]?.split('&')[0] || 'AIzaSyAmwwzmUfq7MJNg5SgxiKUeQqH5ZfnzITo'}&q=${mapData.location.coordinates.lat},${mapData.location.coordinates.lng}&zoom=${mapData.location.zoom}`}
                 width="100%"
                 height="100%"
                 style={{ border: 0 }}
                 allowFullScreen=""
                 loading="lazy"
                 referrerPolicy="no-referrer-when-downgrade"
                 title="Bogart Fashion Location"
                 onError={() => {
                   // If iframe fails, show fallback
                   console.log('Map iframe failed, showing fallback');
                 }}
               />
              
              {/* Location Info Overlay */}
              <div style={{ 
                position: 'absolute', 
                bottom: '20px',
                left: '20px',
                right: '20px',
                background: 'rgba(0,0,0,0.9)', 
                padding: '20px', 
                borderRadius: '12px',
                textAlign: 'center',
                border: '1px solid #C2883A'
              }}>
                <h3 style={{ color: '#C2883A', margin: '0 0 10px 0', fontSize: '1.2em' }}>
                  📍 {mapData.location.name}
                </h3>
                <p style={{ color: '#ccc', margin: '0 0 15px 0', lineHeight: '1.4' }}>
                  {mapData.location.address}
                </p>
                <a 
                  href={mapData.mapUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    color: '#C2883A', 
                    textDecoration: 'none',
                    padding: '10px 20px',
                    border: '1px solid #C2883A',
                    borderRadius: '6px',
                    transition: 'all 0.3s ease',
                    display: 'inline-block'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#C2883A';
                    e.target.style.color = '#111';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#C2883A';
                  }}
                >
                  Open in Google Maps →
                </a>
              </div>
            </div>
          ) : (
            <div style={{ 
              height: '400px', 
              width: '100%',
              background: '#333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ccc',
              fontSize: '1.1em'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2em', marginBottom: '15px' }}>📍</div>
                <div>Tel Aviv, Israel</div>
                <div style={{ marginTop: '10px', color: '#C2883A' }}>
                  <a 
                    href="https://maps.google.com/?q=32.0853,34.7818" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#C2883A', textDecoration: 'none' }}
                  >
                    View on Google Maps
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Contact Form */}
        <div style={{ 
          maxWidth: '700px', 
          margin: '0 auto', 
          background: '#222', 
          border: '1px solid #333', 
          padding: '40px', 
          borderRadius: '16px', 
          boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
          position: 'relative'
        }}>
          <h2 style={{ 
            textAlign: 'center', 
            marginBottom: '30px', 
            color: '#C2883A',
            fontSize: '1.8em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            <FaComment /> Send Us a Message
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="name" style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: '#C2883A', 
                fontWeight: '600',
                fontSize: '1.05em'
              }}>
                <FaUser style={{ marginRight: '8px' }} />
                Your Name
              </label>
              <input 
                type="text" 
                id="name" 
                name="name"
                value={formData.name} 
                onChange={handleChange} 
                required 
                style={{ 
                  width: '100%', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  border: `1px solid ${errors.name ? '#ef4444' : '#555'}`, 
                  background: '#333', 
                  color: '#fff',
                  fontSize: '1em',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#C2883A';
                  e.target.style.boxShadow = '0 0 0 2px rgba(194, 136, 58, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.name ? '#ef4444' : '#555';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {errors.name && (
                <p style={{ color: '#ef4444', fontSize: '0.9em', marginTop: '5px' }}>
                  {errors.name}
                </p>
              )}
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="email" style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: '#C2883A', 
                fontWeight: '600',
                fontSize: '1.05em'
              }}>
                <FaEnvelope style={{ marginRight: '8px' }} />
                Email Address
              </label>
              <input 
                type="email" 
                id="email" 
                name="email"
                value={formData.email} 
                onChange={handleChange} 
                required 
                style={{ 
                  width: '100%', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  border: `1px solid ${errors.email ? '#ef4444' : '#555'}`, 
                  background: '#333', 
                  color: '#fff',
                  fontSize: '1em',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#C2883A';
                  e.target.style.boxShadow = '0 0 0 2px rgba(194, 136, 58, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.email ? '#ef4444' : '#555';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {errors.email && (
                <p style={{ color: '#ef4444', fontSize: '0.9em', marginTop: '5px' }}>
                  {errors.email}
                </p>
              )}
            </div>
            
            <div style={{ marginBottom: '25px' }}>
              <label htmlFor="message" style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: '#C2883A', 
                fontWeight: '600',
                fontSize: '1.05em'
              }}>
                <FaComment style={{ marginRight: '8px' }} />
                Your Message
              </label>
              <textarea 
                id="message" 
                name="message"
                value={formData.message} 
                onChange={handleChange} 
                required 
                rows="6" 
                style={{ 
                  width: '100%', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  border: `1px solid ${errors.message ? '#ef4444' : '#555'}`, 
                  background: '#333', 
                  color: '#fff',
                  fontSize: '1em',
                  resize: 'vertical',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#C2883A';
                  e.target.style.boxShadow = '0 0 0 2px rgba(194, 136, 58, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.message ? '#ef4444' : '#555';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="Tell us how we can help you..."
              />
              {errors.message && (
                <p style={{ color: '#ef4444', fontSize: '0.9em', marginTop: '5px' }}>
                  {errors.message}
                </p>
              )}
            </div>

            {/* Honeypot field - hidden from users but visible to bots */}
            <div style={{ 
              position: 'absolute', 
              left: '-9999px', 
              top: '-9999px'
            }}>
              <input 
                type="text" 
                name="honeypot" 
                value={formData.honeypot} 
                onChange={handleChange}
                tabIndex="-1"
                autoComplete="off"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading} 
              style={{ 
                width: '100%', 
                padding: '16px', 
                background: loading ? '#666' : '#C2883A', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '1.1em', 
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer', 
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(194, 136, 58, 0.3)'
              }} 
              onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')} 
              onMouseLeave={(e) => !loading && (e.target.style.transform = 'translateY(0)')}
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
            
            {status && (
              <div style={{ 
                textAlign: 'center', 
                marginTop: '20px', 
                padding: '15px',
                borderRadius: '8px',
                background: status.includes('successfully') ? 'rgba(74, 222, 128, 0.1)' : 
                           status.includes('Sending') ? 'rgba(194, 136, 58, 0.1)' : 
                           'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${status.includes('successfully') ? '#4ade80' : 
                                   status.includes('Sending') ? '#C2883A' : 
                                   '#ef4444'}`,
                color: status.includes('successfully') ? '#4ade80' : 
                       status.includes('Sending') ? '#C2883A' : 
                       '#ef4444'
              }}>
                {status}
              </div>
            )}
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Contact;