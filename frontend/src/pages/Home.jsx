import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import PromotionsBanner from '../components/PromotionsBanner';
import './Home.css'; // Import the new CSS file

// Using online fashion stock images for better representation
// Additional fashion-specific images for men's categories
const casualWearImage = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop';
const businessSuitsImage = 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=300&fit=crop';
const denimImage = 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=300&fit=crop';
const outerwearImage = 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=300&fit=crop';
const activewearImage = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop';
const fashionAccessoriesImage = 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=300&fit=crop';

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
    { name: 'Casual Wear', description: 'Premium casual clothing including t-shirts, polo shirts, and comfortable everyday wear. Perfect for relaxed, stylish looks.', imageUrl: casualWearImage },
    { name: 'Business Suits', description: 'Sophisticated business suits and formal attire for the modern professional. Make a lasting impression with our premium collection.', imageUrl: businessSuitsImage },
    { name: 'Denim & Jeans', description: 'Classic denim jackets and jeans with modern styling. Timeless pieces that never go out of style.', imageUrl: denimImage },
    { name: 'Outerwear', description: 'Stylish jackets and coats for every season. From casual denim jackets to formal blazers.', imageUrl: outerwearImage },
    { name: 'Activewear', description: 'Performance-driven activewear for the active lifestyle. Comfort and style for your fitness routine.', imageUrl: activewearImage },
    { name: 'Accessories', description: 'Complete your look with premium men\'s accessories including belts, ties, watches, and footwear.', imageUrl: fashionAccessoriesImage },
  ];

  return (
    <div className="home-container">
      {/* Promotions Banner */}
      <PromotionsBanner />
      
      {/* Hero Section */}
      <section className="hero-section">
        <h1>BogartFashion - Men's Wear</h1>
        <p>Discover timeless elegance and contemporary style in our curated men's fashion collection</p>
        <Link to="/products" className="explore-button">
          Explore Men's Collection
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