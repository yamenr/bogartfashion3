import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProductModal from './ProductModal';
import { useSettings } from '../context/SettingsContext';
import '../pages/manager/AdminTheme.css';

function ProductManager() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', price: '', image: '', supplier_id: '', category_id: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [message, setMessage] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [settings, setSettings] = useState({ currency: 'ILS' });
  const [currencies, setCurrencies] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  
  const { isUserAdmin, loadingSettings } = useSettings();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const fetchProductData = useCallback(async () => {
    if (loadingSettings || !isUserAdmin) {
      if (!loadingSettings && !isUserAdmin) navigate('/');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [productsRes, suppliersRes, categoriesRes] = await Promise.all([
        fetch('/api/products/admin/all', { headers }), // Get all products including inactive
        fetch('/api/suppliers', { headers }), // Assuming this exists and requires auth
        fetch('/api/categories', { headers })
      ]);

      if (!productsRes.ok || !suppliersRes.ok || !categoriesRes.ok) {
        throw new Error('Failed to fetch initial product data.');
      }

      const productsData = await productsRes.json();
      const suppliersData = await suppliersRes.json();
      const categoriesData = await categoriesRes.json();

      setProducts(productsData);
      setSuppliers(suppliersData);
      setCategories(categoriesData);

    } catch (err) {
      console.error('Error fetching initial product data:', err);
      setError('Failed to load necessary data. Please try again.');
    }
  }, [isUserAdmin, loadingSettings, navigate]);

  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

  const handleChange = e => {
    const { name, value } = e.target;
    
    // Validation for price and stock
    if (name === 'price') {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        setMessage('Price must be a non-negative number');
        return;
      }
    }
    

    
    setForm({ ...form, [name]: value });
    setMessage(''); // Clear any previous error messages
  };

  const handleImageFileChange = e => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      setForm({ ...form, image: '' }); // Clear image URL if file is selected
    } else {
      setImagePreview('');
    }
  };

  const handleImageUrlChange = e => {
    setForm({ ...form, image: e.target.value });
    setImageFile(null);
    setImagePreview('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    if (!form.name || !form.description || !form.price) {
      setMessage('Please fill in all required fields');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('price', form.price);
      formData.append('supplier_id', form.supplier_id);
      formData.append('category_id', form.category_id);
      
      if (imageFile) {
        formData.append('image', imageFile);
      } else if (form.image) {
        formData.append('image', form.image);
      }

      const response = await axios.post('/api/products', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status === 201) {
        setMessage('Product added successfully!');
        setForm({ name: '', description: '', price: '', image: '', supplier_id: '', category_id: '' });
        setImageFile(null);
        setImagePreview('');
        setShowAddForm(false);
        fetchProductData();
      }
    } catch (error) {
      console.error('Error adding product:', error);
      setMessage(error.response?.data?.message || 'Error adding product');
    }
  };

  const handleEdit = async e => {
    e.preventDefault();
    
    if (!form.name || !form.description || !form.price) {
      setMessage('Please fill in all required fields');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('price', form.price);
      formData.append('supplier_id', form.supplier_id);
      formData.append('category_id', form.category_id);
      
      if (imageFile) {
        formData.append('image', imageFile);
      } else if (form.image) {
        formData.append('image', form.image);
      }

      const response = await axios.put(`/api/products/${editingProduct.product_id}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status === 200) {
        setMessage('Product updated successfully!');
        setForm({ name: '', description: '', price: '', image: '', supplier_id: '', category_id: '' });
        setImageFile(null);
        setImagePreview('');
        setEditingProduct(null);
        setShowAddForm(false);
        fetchProductData();
      }
    } catch (error) {
      console.error('Error updating product:', error);
      setMessage(error.response?.data?.message || 'Error updating product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to deactivate this product?')) {
      try {
        const response = await axios.delete(`/api/products/${productId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 200) {
          setMessage('Product deactivated successfully!');
          fetchProductData();
        }
      } catch (error) {
        console.error('Error deactivating product:', error);
        setMessage(error.response?.data?.message || 'Error deactivating product');
      }
    }
  };

  const handleRestoreProduct = async (productId) => {
    if (window.confirm('Are you sure you want to restore this product?')) {
      try {
        const response = await axios.put(`/api/products/${productId}/restore`, {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 200) {
          setMessage('Product restored successfully!');
          fetchProductData();
        }
      } catch (error) {
        console.error('Error restoring product:', error);
        setMessage(error.response?.data?.message || 'Error restoring product');
      }
    }
  };



  const handleOpenModalForAdd = () => {
    setEditingProduct(null);
    setForm({ name: '', description: '', price: '', image: '', supplier_id: '', category_id: '' });
    setImageFile(null);
    setImagePreview('');
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      image: product.image || '',
      supplier_id: product.supplier_id || '',
      category_id: product.category_id || ''
    });
    setImageFile(null);
    setImagePreview(product.image || '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setForm({ name: '', description: '', price: '', image: '', supplier_id: '', category_id: '' });
    setImageFile(null);
    setImagePreview('');
  };

  const handleSuccess = () => {
    fetchProductData();
    handleCloseModal();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: settings.currency || 'ILS'
    }).format(price);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (categories.find(c => c.category_id === product.category_id)?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loadingSettings || !isUserAdmin) {
    return null;
  }

  return (
    <div>


      <div className="admin-form">
        <div className="form-group">
          <label htmlFor="search">Search Products:</label>
          <input
            type="text"
            id="search"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div style={{ textAlign: 'right', marginBottom: '20px' }}>
        <button
          className="admin-btn"
          onClick={handleOpenModalForAdd}
        >
          Add New Product
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Size</th>
              <th>Color</th>
              <th>Brand</th>
              <th>Gender</th>
              <th>Price</th>
              <th>Inventory</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => (
              <tr key={p.product_id}>
                <td>
                  {p.image ? (
                    <img 
                      src={p.image && p.image.startsWith('/uploads') ? `http://localhost:3001${p.image}` : p.image || 'https://via.placeholder.com/50'} 
                      alt={p.name} 
                      style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '5px' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <div 
                    style={{ 
                      width: '50px', 
                      height: '50px', 
                      backgroundColor: '#333', 
                      borderRadius: '5px', 
                      display: p.image ? 'none' : 'flex',
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '12px',
                      color: '#C2883A',
                      textAlign: 'center',
                      padding: '2px'
                    }}
                    className="image-placeholder"
                  >
                    {p.name ? p.name.substring(0, 8) : 'No Image'}
                  </div>
                </td>
                <td>
                  {p.name}
                  {p.featured && <span style={{ marginLeft: '5px', color: '#C2883A' }}>★ Featured</span>}
                </td>
                <td>{categories.find(c => c.category_id === p.category_id)?.name || 'N/A'}</td>
                <td>{p.size || 'N/A'}</td>
                <td>{p.color || 'N/A'}</td>
                <td>{p.brand || 'N/A'}</td>
                <td>{p.gender || 'N/A'}</td>
                <td>{formatPrice(p.price)}</td>
                <td>
                  {p.totalStock !== undefined ? (
                    <span style={{ 
                      color: p.totalStock > 0 ? '#28a745' : '#dc3545',
                      fontWeight: 'normal'
                    }}>
                      {p.totalStock > 0 ? `${p.totalStock} (Variants)` : 'No Variants'}
                    </span>
                  ) : (
                    <span style={{ color: '#888' }}>No Variants</span>
                  )}
                </td>
                <td>
                  <span className={`status-badge ${p.totalStock > 0 ? 'active' : 'expired'}`}>
                    {p.totalStock > 0 ? 'Active' : 'No Variants'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      onClick={() => handleOpenModalForEdit(p)} 
                      className="action-btn edit" 
                      title="Edit"
                    >
                      Edit
                    </button>

                    {p.totalStock > 0 ? (
                      <button 
                        onClick={() => handleDeleteProduct(p.product_id)} 
                        className="action-btn delete" 
                        title="Deactivate"
                      >
                        Delete
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleRestoreProduct(p.product_id)} 
                        className="action-btn edit" 
                        title="Restore"
                      >
                        Restore
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', color: '#888' }}>No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        product={editingProduct}
        suppliers={suppliers}
        categories={categories}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

export default ProductManager;
