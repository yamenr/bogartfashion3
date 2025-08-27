import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Modal.css';
import SimilarityWarningModal from './SimilarityWarningModal';

const ProductModal = ({ isOpen, onClose, product, suppliers, categories, onSuccess }) => {
  const [form, setForm] = useState({ 
    name: '', 
    description: '', 
    price: '', 
    image: '', 
    supplier_id: '', 
    category_id: '',
    size: '',
    color: '',
    material: '',
    brand: '',
    season: 'All Season',
    gender: 'Unisex'
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [message, setMessage] = useState('');
  const [showSimilarityWarning, setShowSimilarityWarning] = useState(false);
  const [similarityData, setSimilarityData] = useState(null);
  const [pendingProductData, setPendingProductData] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (product) {
      // Editing an existing product
      setForm({
        name: product.name || '',
        description: product.description || '',
        price: product.price ? parseFloat(product.price).toFixed(2) : '',
        image: product.image || '',
        supplier_id: product.supplier_id || '',
        category_id: product.category_id || '',
        size: product.size || '',
        color: product.color || '',
        material: product.material || '',
        brand: product.brand || '',
        season: product.season || 'All Season',
        gender: product.gender || 'Unisex'
      });
      setImagePreview(product.image ? (product.image && product.image.startsWith('/uploads') ? `http://localhost:3001${product.image}`: product.image) : '');
      setImageFile(null);
    } else {
      // Adding a new product
      setForm({ 
        name: '', 
        description: '', 
        price: '', 
        image: '', 
        supplier_id: '', 
        category_id: '',
        size: '',
        color: '',
        material: '',
        brand: '',
        season: 'All Season',
        gender: 'Unisex'
      });
      setImagePreview('');
      setImageFile(null);
    }
    setMessage('');
  }, [product, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleChange = e => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleImageFileChange = e => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setForm({ ...form, image: '' }); // Clear image URL if file is selected
    }
  };

  const handleImageUrlChange = e => {
    setForm({ ...form, image: e.target.value });
    setImageFile(null); // Clear file if URL is entered
    setImagePreview(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Submitting...');

    if (!form.name || !form.price) {
      setMessage('Name and price are required.');
      return;
    }

    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('description', form.description);
    formData.append('price', form.price);
    formData.append('supplier_id', form.supplier_id || '');
    formData.append('category_id', form.category_id || '');
    formData.append('size', form.size);
    formData.append('color', form.color);
    formData.append('material', form.material);
    formData.append('brand', form.brand);
    formData.append('season', form.season);
    formData.append('gender', form.gender);
    
    if (imageFile) {
      formData.append('image', imageFile);
    } else {
      formData.append('image', form.image);
    }
    
    try {
      let res;
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      };

      if (product) {
        // Update existing product
        res = await axios.put(`/api/products/${product.product_id}`, formData, config);
        setMessage(res.data.message || 'Success!');
        onSuccess(); // Trigger refresh on parent
        onClose(); // Close the modal
      } else {
        // Create new product
        try {
          res = await axios.post('/api/products', formData, config);
          setMessage(res.data.message || 'Success!');
          onSuccess(); // Trigger refresh on parent
          onClose(); // Close the modal
        } catch (err) {
          // Check if this is a similarity warning
          if (err.response?.status === 409 && err.response?.data?.type === 'similarity_warning') {
            setSimilarityData(err.response.data.analysis);
            setPendingProductData(formData);
            setShowSimilarityWarning(true);
            setMessage(''); // Clear any previous messages
          } else {
            setMessage(err.response?.data?.message || 'An error occurred.');
          }
        }
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'An error occurred.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>{product ? 'Edit Product' : 'Add New Product'}</h2>
        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-group">
            <label>Name</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} />
          </div>
                      <div className="form-group">
              <label>Price</label>
              <input type="number" name="price" value={form.price} onChange={handleChange} required step="0.01" />
            </div>
          
          {/* Fashion-specific fields */}
          <div className="form-row">
            <div className="form-group">
              <label>Size</label>
              <input type="text" name="size" value={form.size} onChange={handleChange} placeholder="S, M, L, XL, etc." />
            </div>
            <div className="form-group">
              <label>Color</label>
              <input type="text" name="color" value={form.color} onChange={handleChange} placeholder="Red, Blue, Black, etc." />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Material</label>
              <input type="text" name="material" value={form.material} onChange={handleChange} placeholder="Cotton, Silk, Polyester, etc." />
            </div>
            <div className="form-group">
              <label>Brand</label>
              <input type="text" name="brand" value={form.brand} onChange={handleChange} placeholder="Bogart, Nike, etc." />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Season</label>
              <select name="season" value={form.season} onChange={handleChange}>
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
                <option value="Fall">Fall</option>
                <option value="Winter">Winter</option>
                <option value="All Season">All Season</option>
              </select>
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange}>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Unisex">Unisex</option>
                <option value="Kids">Kids</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
              <label>Image URL</label>
              <input type="text" name="image" value={form.image} onChange={handleImageUrlChange} placeholder="Enter image URL or upload a file" />
          </div>
          <div className="form-group">
              <label>Or Upload Image File</label>
              <input type="file" onChange={handleImageFileChange} accept="image/*" />
          </div>
          {imagePreview && <img src={imagePreview} alt="Product Preview" className="image-preview" />}
          <div className="form-row">
            <div className="form-group">
              <label>Supplier</label>
              <select name="supplier_id" value={form.supplier_id} onChange={handleChange}>
                <option value="">None</option>
                {suppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Category</label>
              <select name="category_id" value={form.category_id} onChange={handleChange}>
                <option value="">None</option>
                {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          {message && <p className="form-message">{message}</p>}
          <div className="form-actions">
            <button type="submit" className="submit-btn">{product ? 'Update Product' : 'Add Product'}</button>
            <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>

      {/* Similarity Warning Modal */}
      <SimilarityWarningModal
        isOpen={showSimilarityWarning}
        onClose={() => {
          setShowSimilarityWarning(false);
          setSimilarityData(null);
          setPendingProductData(null);
        }}
        similarityData={similarityData}
        newProductData={pendingProductData}
        onSuccess={onSuccess}
        onAddInventory={onSuccess}
      />
    </div>
  );
};

export default ProductModal; 