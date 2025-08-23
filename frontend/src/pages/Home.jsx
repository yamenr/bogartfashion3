import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import PromotionsBanner from '../components/PromotionsBanner';
import './Home.css'; // Import the new CSS file

// Using local fashion images from uploads folders
// Images from the men's fashion store uploads
const casualWearImage = 'http://localhost:3001/uploads/mens-clothing/white-tshirt.jpg';
const businessSuitsImage = 'http://localhost:3001/uploads/formal-wear/black-suit.jpg';
const denimImage = 'http://localhost:3001/uploads/mens-clothing/denim-jacket.jpg';
const outerwearImage = 'http://localhost:3001/uploads/formal-wear/navy-blazer.jpg';
const activewearImage = 'http://localhost:3001/uploads/sportswear/athletic-shorts.jpg';
const fashionAccessoriesImage = 'http://localhost:3001/uploads/accessories/leather-belt.jpg';
const footwearImage = 'http://localhost:3001/uploads/footwear/oxford-shoes.jpg';
const watchesImage = 'http://localhost:3001/uploads/watches/analog-watch.jpg';

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
    { name: 'Men Clothing', description: 'Premium casual clothing including t-shirts, polo shirts, and denim jackets. Perfect for relaxed, stylish looks.', imageUrl: casualWearImage },
    { name: 'Formal Wear', description: 'Sophisticated business suits and formal attire for the modern professional. Make a lasting impression with our premium collection.', imageUrl: businessSuitsImage },
    { name: 'Denim Collection', description: 'Classic denim jackets and jeans with modern styling. Timeless pieces that never go out of style.', imageUrl: denimImage },
    { name: 'Business Attire', description: 'Stylish blazers and formal jackets for every business occasion. From casual blazers to formal suits.', imageUrl: outerwearImage },
    { name: 'Sportswear', description: 'Performance-driven activewear for the active lifestyle. Comfort and style for your fitness routine.', imageUrl: activewearImage },
    { name: 'Accessories', description: 'Complete your look with premium men\'s accessories including belts, ties, watches, and footwear.', imageUrl: fashionAccessoriesImage },
    { name: 'Footwear', description: 'Premium men\'s footwear from classic Oxford shoes to casual sneakers. Quality and comfort for every occasion.', imageUrl: footwearImage },
    { name: 'Watches', description: 'Elegant timepieces that complement your style. From classic analog to modern digital watches.', imageUrl: watchesImage },
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