import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import PromotionsBanner from '../components/PromotionsBanner';
import './Home.css'; // Import the new CSS file

// Using online fashion stock images for better representation
const mensImage = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop';
const womensImage = 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=300&fit=crop';
const accessoriesImage = 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=300&fit=crop';
const shoesImage = 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop';
const bagsImage = 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop';
const jewelryImage = 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const productsRes = await axios.get('/api/products');
        setProducts(productsRes.data);
      } catch (err) {
        console.error('Error fetching data for home page:', err);
        setError('Failed to load content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading content...</div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>{error}</div>;
  }

  const displayCategories = [
    { name: 'Men\'s Fashion', description: 'Sophisticated men\'s clothing including suits, casual wear, and formal attire. Discover timeless style and modern elegance.', imageUrl: mensImage },
    { name: 'Women\'s Fashion', description: 'Elegant women\'s clothing featuring dresses, tops, skirts, and formal wear. Express your unique style with our curated collection.', imageUrl: womensImage },
    { name: 'Accessories', description: 'Complete your look with our premium accessories including belts, scarves, hats, and fashion jewelry to enhance your style.', imageUrl: accessoriesImage },
    { name: 'Shoes', description: 'Step into style with our collection of footwear including formal shoes, casual sneakers, and elegant heels for every occasion.', imageUrl: shoesImage },
    { name: 'Bags & Handbags', description: 'Carry your essentials in style with our collection of designer bags, handbags, and luggage for every need.', imageUrl: bagsImage },
    { name: 'Jewelry', description: 'Adorn yourself with our exquisite jewelry collection featuring rings, necklaces, earrings, and watches for that perfect finishing touch.', imageUrl: jewelryImage },
  ];

  return (
    <div className="home-container">
      {/* Promotions Banner */}
      <PromotionsBanner />
      
      {/* Hero Section */}
      <section className="hero-section">
        <h1>BogartFashion</h1>
        <p>Discover timeless elegance and contemporary style in our curated fashion collection</p>
        <Link to="/products" className="explore-button">
          Explore Collection
        </Link>
      </section>

      {/* Product Categories Section */}
      <div className="categories-container">
        {displayCategories.map((category) => (
          <div key={category.name} className="category-card">
            <div className="image-container">
              <img src={category.imageUrl} alt={category.name} />
            </div>
            <div className="text-container">
              <h2>{category.name}</h2>
              <p>{category.description}</p>
              <Link to={`/products?category=${category.name}`} className="explore-link">
                Explore {category.name.split('\'')[0]}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;