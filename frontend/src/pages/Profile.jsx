import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import OrderHistory from './OrderHistory'; // Import OrderHistory component
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCamera, FaUserCircle } from 'react-icons/fa'; // Import icons
import axios from 'axios';
import PopupMessage from '../components/PopupMessage';

const Profile = () => {
  const { user_id, username, loadingSettings, updateUsername, refreshUserData } = useSettings();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    name: username || '',
    email: '', // Will fetch from backend
    phone: '', // Will fetch from backend
    streetAddress: '', // Will fetch from backend
    city: '', // Will fetch from backend
    zipCode: '', // Will fetch from backend
    profilePic: null // Changed to null for better default handling
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [popupMessage, setPopupMessage] = useState({ message: '', type: 'success', isVisible: false });

  // Default profile photo component
  const DefaultProfilePhoto = ({ size = 150, name = '' }) => (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor: '#C2883A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#111',
      fontSize: size * 0.4,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    }}>
      {name ? name.charAt(0) : 'U'}
    </div>
  );

  // Helper function to fetch profile data (extracted for reuse)
  const fetchProfileData = async () => {
    setLoadingProfile(true);
    setProfileError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/profile/${user_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
        throw new Error(errorData.message || 'Failed to fetch profile data.');
      }
      const data = await response.json();
      console.log('Fetched profile data:', data);
      setProfileData(prev => ({
        ...prev,
        name: data.name || prev.name,
        email: data.email || '',
        phone: data.phone || '',
        streetAddress: data.street_address || '',
        city: data.city || '',
        zipCode: data.zip_code || '',
        profilePic: data.profile_image || null
      }));
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setProfileError(`Failed to load profile: ${err.message}`);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (loadingSettings) {
      return; // Wait for settings to load
    }
    if (!user_id) {
      navigate('/login');
      return;
    }

    console.log('Profile component mounted, current username:', username);
    fetchProfileData();
    // Refresh user data to ensure header shows correct username
    refreshUserData();
    
    // Force refresh user data after a short delay to ensure it loads
    const timer = setTimeout(() => {
      console.log('Forcing refresh of user data...');
      refreshUserData();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [user_id, loadingSettings, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview('');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      let profile_image = profileData.profilePic;
      if (imageFile) {
        const data = new FormData();
        data.append('image', imageFile);
        const token = localStorage.getItem('token');
        const uploadRes = await axios.post('/api/auth/upload-image', data, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
        });
        profile_image = uploadRes.data.imageUrl;
        setProfileData(prev => ({ ...prev, profilePic: profile_image }));
        setImageFile(null);
        setImagePreview('');
      }
      
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/profile/${user_id}`, {
        name: profileData.name,
        phone: profileData.phone,
        city: profileData.address,
        profile_image
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Update the local state with the response data
      if (response.data.user) {
        setProfileData(prev => ({
          ...prev,
          name: response.data.user.name,
          phone: response.data.user.phone || '',
          address: response.data.user.city || '',
          profilePic: response.data.user.profile_image || null
        }));
        
        // Update the username in the header immediately
        updateUsername(response.data.user.name);
        
        // Regenerate JWT token with new username
        try {
          const tokenResponse = await axios.post('/api/auth/refresh-token', {
            user_id: user_id,
            new_username: response.data.user.name
          }, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (tokenResponse.data.token) {
            localStorage.setItem('token', tokenResponse.data.token);
            console.log('JWT token regenerated with new username');
          }
        } catch (tokenError) {
          console.log('Could not regenerate token, but profile updated successfully');
        }
      }
      
      showPopupMessage('Profile updated successfully!', 'success');
      
      // Refresh profile data from backend to ensure consistency
      fetchProfileData();
      
      // Refresh user data in context to update header
      refreshUserData();
      
    } catch (error) {
      console.error('Error updating profile:', error);
      showPopupMessage(`Error updating profile: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  // Helper function to show popup messages
  const showPopupMessage = (message, type = 'success') => {
    setPopupMessage({ message, type, isVisible: true });
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setPopupMessage(prev => ({ ...prev, isVisible: false }));
    }, 5000);
  };

  // Helper to get the correct profile image URL
  const getProfilePicUrl = (pic) => {
    if (!pic) return null; // Return null to show default photo
    if (pic && pic.startsWith('/uploads')) return `http://localhost:3001${pic}`;
    return pic;
  };

  if (loadingProfile || loadingSettings) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '50px', 
        color: '#fff',
        backgroundColor: '#111',
        minHeight: '100vh'
      }}>
        <div style={{ fontSize: '1.2em', color: '#C2883A' }}>Loading profile...</div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '50px', 
        color: '#ff6b6b',
        backgroundColor: '#111',
        minHeight: '100vh'
      }}>
        {profileError}
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1100px', 
      margin: '32px auto 0 auto', 
      padding: '8px 0', 
      backgroundColor: '#111', 
      borderRadius: '8px', 
      boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
      minHeight: 'calc(100vh - 100px)'
    }}>
      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        borderBottom: '2px solid #333', 
        marginBottom: '16px',
        backgroundColor: '#111'
      }}>
        <div style={{ 
          display: 'flex', 
          gap: '0', 
          background: '#222', 
          borderRadius: '8px 8px 0 0', 
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)', 
          maxWidth: '900px', 
          margin: '0 auto' 
        }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '16px 36px',
              background: activeTab === 'profile' ? '#C2883A' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'profile' ? '3px solid #C2883A' : '3px solid transparent',
              color: activeTab === 'profile' ? '#111' : '#fff',
              fontWeight: 'bold',
              fontSize: '1.1em',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s',
              borderRadius: '8px 8px 0 0',
              marginRight: '2px',
              minWidth: '120px',
            }}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '16px 36px',
              background: activeTab === 'orders' ? '#C2883A' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'orders' ? '3px solid #C2883A' : '3px solid transparent',
              color: activeTab === 'orders' ? '#111' : '#fff',
              fontWeight: 'bold',
              fontSize: '1.1em',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s',
              borderRadius: '8px 8px 0 0',
              minWidth: '120px',
            }}
          >
            Order History
          </button>
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div style={{ 
          display: 'flex', 
          gap: '20px', 
          flexWrap: 'wrap', 
          minWidth: 0, 
          justifyContent: 'center', 
          maxWidth: '900px', 
          width: '100%', 
          margin: '0 auto' 
        }}>
          {/* Profile Picture Section */}
          <div style={{ 
            flex: '1 1 380px', 
            maxWidth: '420px', 
            backgroundColor: '#222', 
            padding: '24px', 
            borderRadius: '12px', 
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)', 
            textAlign: 'center', 
            margin: '0 4px', 
            boxSizing: 'border-box', 
            minWidth: '200px',
            border: '1px solid #333'
          }}>
            <h2 style={{ 
              fontSize: '1.5em', 
              marginBottom: '24px', 
              color: '#C2883A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}>
              <FaCamera /> Profile Picture
            </h2>
            
            <div style={{ 
              width: '150px', 
              height: '150px', 
              borderRadius: '50%', 
              overflow: 'hidden', 
              margin: '0 auto 24px auto', 
              border: '4px solid #C2883A', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(194, 136, 58, 0.3)'
            }}>
              {getProfilePicUrl(imagePreview || profileData.profilePic) ? (
                <img 
                  src={getProfilePicUrl(imagePreview || profileData.profilePic)} 
                  alt="Profile" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <DefaultProfilePhoto size={150} name={profileData.name} />
              )}
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageFileChange} 
              style={{ 
                margin: '16px 0',
                color: '#fff',
                backgroundColor: '#333',
                border: '1px solid #555',
                borderRadius: '6px',
                padding: '8px',
                width: '100%',
                maxWidth: '280px'
              }} 
            />
            
            <h3 style={{ 
              margin: '16px 0 8px 0', 
              fontSize: '1.3em', 
              color: '#fff' 
            }}>
              {profileData.name || 'User'}
            </h3>
            <p style={{ 
              margin: '0', 
              color: '#C2883A', 
              fontSize: '0.95em',
              fontWeight: '500'
            }}>
              {profileData.email || 'No email provided'}
            </p>
          </div>
          
          {/* Personal Information Section */}
          <div style={{
            flex: '1 1 380px',
            maxWidth: '420px',
            minWidth: '200px',
            width: '100%',
            backgroundColor: '#222',
            padding: '28px',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            margin: '0 4px 16px 4px',
            border: '1px solid #333',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            boxSizing: 'border-box',
            minWidth: 0,
            overflow: 'hidden',
          }}>
                         <h2 style={{ 
               fontSize: '1.5em', 
               marginBottom: '16px', 
               color: '#C2883A',
               display: 'flex',
               alignItems: 'center',
               gap: '10px'
             }}>
               <FaUser /> Personal Information
             </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '24px',
            }}>
              <div style={{ position: 'relative' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#C2883A', 
                  fontWeight: 'bold', 
                  fontSize: '1.05em' 
                }}>
                  Full Name
                </label>
                <FaUser style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '48px', 
                  color: '#C2883A' 
                }} />
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleChange}
                  style={{ 
                    width: '100%', 
                    maxWidth: '100%', 
                    padding: '16px 12px 16px 42px', 
                    border: '1px solid #555', 
                    borderRadius: '8px', 
                    fontSize: '1.08em', 
                    marginBottom: '0', 
                    boxSizing: 'border-box',
                    backgroundColor: '#333',
                    color: '#fff',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#C2883A';
                    e.target.style.boxShadow = '0 0 0 2px rgba(194, 136, 58, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#555';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              
              <div style={{ position: 'relative' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#C2883A', 
                  fontWeight: 'bold', 
                  fontSize: '1.05em' 
                }}>
                  Email Address
                </label>
                <FaEnvelope style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '48px', 
                  color: '#C2883A' 
                }} />
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleChange}
                  style={{ 
                    width: '100%', 
                    maxWidth: '100%', 
                    padding: '16px 12px 16px 42px', 
                    border: '1px solid #555', 
                    borderRadius: '8px', 
                    fontSize: '1.08em', 
                    marginBottom: '0', 
                    boxSizing: 'border-box',
                    backgroundColor: '#444',
                    color: '#999',
                    cursor: 'not-allowed'
                  }}
                  readOnly // Email usually not editable
                />
              </div>
              
              <div style={{ position: 'relative' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#C2883A', 
                  fontWeight: 'bold', 
                  fontSize: '1.05em' 
                }}>
                  Phone Number
                </label>
                <FaPhone style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '48px', 
                  color: '#C2883A' 
                }} />
                <input
                  type="text"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleChange}
                  style={{ 
                    width: '100%', 
                    maxWidth: '100%', 
                    padding: '16px 12px 16px 42px', 
                    border: '1px solid #555', 
                    borderRadius: '8px', 
                    fontSize: '1.08em', 
                    marginBottom: '0', 
                    boxSizing: 'border-box',
                    backgroundColor: '#333',
                    color: '#fff',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#C2883A';
                    e.target.style.boxShadow = '0 0 0 2px rgba(194, 136, 58, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#555';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              
              <div style={{ position: 'relative' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#C2883A', 
                  fontWeight: 'bold', 
                  fontSize: '1.05em' 
                }}>
                  Street Address
                </label>
                <FaMapMarkerAlt style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '48px', 
                  color: '#C2883A' 
                }} />
                <input
                  type="text"
                  name="streetAddress"
                  value={profileData.streetAddress}
                  onChange={handleChange}
                  style={{ 
                    width: '100%', 
                    maxWidth: '100%', 
                    padding: '16px 12px 16px 42px', 
                    border: '1px solid #555', 
                    borderRadius: '8px', 
                    fontSize: '1.08em', 
                    marginBottom: '0', 
                    boxSizing: 'border-box',
                    backgroundColor: '#333',
                    color: '#fff',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#C2883A';
                    e.target.style.boxShadow = '0 0 0 2px rgba(194, 136, 58, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#555';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              
              <div style={{ position: 'relative' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#C2883A', 
                  fontWeight: 'bold', 
                  fontSize: '1.05em' 
                }}>
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={profileData.city}
                  onChange={handleChange}
                  style={{ 
                    width: '100%', 
                    maxWidth: '100%', 
                    padding: '16px 12px 16px 42px', 
                    border: '1px solid #555', 
                    borderRadius: '8px', 
                    fontSize: '1.08em', 
                    marginBottom: '0', 
                    boxSizing: 'border-box',
                    backgroundColor: '#333',
                    color: '#fff',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#C2883A';
                    e.target.style.boxShadow = '0 0 0 2px rgba(194, 136, 58, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#555';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              
              <div style={{ position: 'relative' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#C2883A', 
                  fontWeight: 'bold', 
                  fontSize: '1.05em' 
                }}>
                  Zip Code
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={profileData.zipCode}
                  onChange={handleChange}
                  style={{ 
                    width: '100%', 
                    maxWidth: '100%', 
                    padding: '16px 12px 16px 42px', 
                    border: '1px solid #555', 
                    borderRadius: '8px', 
                    fontSize: '1.08em', 
                    marginBottom: '0', 
                    boxSizing: 'border-box',
                    backgroundColor: '#333',
                    color: '#fff',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#C2883A';
                    e.target.style.boxShadow = '0 0 0 2px rgba(194, 136, 58, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#555';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>
            
            <button
              onClick={handleUpdateProfile}
              style={{
                padding: '16px 0',
                backgroundColor: '#C2883A',
                color: '#111',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1.13em',
                marginTop: '16px',
                fontWeight: 'bold',
                letterSpacing: '0.5px',
                boxShadow: '0 4px 15px rgba(194, 136, 58, 0.3)',
                transition: 'all 0.2s',
                textTransform: 'uppercase'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#d4a04a';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(194, 136, 58, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#C2883A';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(194, 136, 58, 0.3)';
              }}
            >
              Update Profile
            </button>
          </div>
        </div>
      )}
      
      {activeTab === 'orders' && (
        <div style={{ 
          background: '#222', 
          borderRadius: '12px', 
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)', 
          padding: '32px', 
          margin: '0 auto', 
          maxWidth: '900px',
          border: '1px solid #333'
        }}>
          <h2 style={{ 
            fontSize: '1.5em', 
            marginBottom: '24px', 
            textAlign: 'center', 
            color: '#C2883A' 
          }}>
            Your Order History
          </h2>
          {user_id && <OrderHistory userId={user_id} />}
        </div>
      )}
      
      {/* Popup Message */}
      <PopupMessage
        message={popupMessage.message}
        type={popupMessage.type}
        isVisible={popupMessage.isVisible}
        onClose={() => setPopupMessage(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
};

export default Profile; 