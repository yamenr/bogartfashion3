import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSettings } from '../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import './AdminTheme.css';

const Categories = () => {
  const { isUserAdmin, loadingSettings } = useSettings();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null); // category object being edited
  const [editedCategoryName, setEditedCategoryName] = useState('');

  useEffect(() => {
    if (loadingSettings) {
      return; // Wait for settings to load
    }
    if (!isUserAdmin) {
      navigate('/'); // Redirect if not admin
      return;
    }

    fetchCategories();
  }, [isUserAdmin, loadingSettings, navigate]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to fetch categories.');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setError('Category name cannot be empty.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/categories', { name: newCategoryName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewCategoryName('');
      fetchCategories();
    } catch (err) {
      console.error('Error adding category:', err);
      setError(err.response?.data?.message || 'Failed to add category.');
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setEditedCategoryName(category.name);
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editedCategoryName.trim()) {
      setError('Category name cannot be empty.');
      return;
    }
    if (!editingCategory) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/categories/${editingCategory.category_id}`, { name: editedCategoryName }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingCategory(null);
      setEditedCategoryName('');
      fetchCategories();
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err.response?.data?.message || 'Failed to update category.');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/categories/${categoryId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchCategories();
      } catch (err) {
        console.error('Error deleting category:', err);
        setError(err.response?.data?.message || 'Failed to delete category.');
      }
    }
  };

  if (loadingSettings) {
    return (
      <div className="admin-page">
        <div className="admin-loading">Loading Admin Panel...</div>
      </div>
    );
  }

  if (!isUserAdmin) {
    return null;
  }

  if (loadingCategories) {
    return (
      <div className="admin-page">
        <div className="admin-loading">Loading Categories...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Categories Management</h1>
        <p>Add, edit, and manage product categories</p>
      </div>

      {error && (
        <div className="message error">{error}</div>
      )}

      <div className="admin-form">
        <form onSubmit={handleAddCategory}>
          <div className="form-group">
            <label htmlFor="newCategory">New Category Name:</label>
            <input
              type="text"
              id="newCategory"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Enter category name"
              required
            />
          </div>
          <button type="submit" className="admin-btn">Add Category</button>
        </form>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Category ID</th>
              <th>Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.category_id}>
                <td>{category.category_id}</td>
                <td>
                  {editingCategory?.category_id === category.category_id ? (
                    <form onSubmit={handleUpdateCategory} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={editedCategoryName}
                        onChange={(e) => setEditedCategoryName(e.target.value)}
                        style={{ 
                          flex: 1,
                          padding: '8px 12px',
                          border: '2px solid #555',
                          borderRadius: '8px',
                          backgroundColor: '#333',
                          color: '#fff'
                        }}
                        required
                      />
                      <button type="submit" className="action-btn edit">Save</button>
                      <button 
                        type="button" 
                        className="action-btn secondary"
                        onClick={() => setEditingCategory(null)}
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    category.name
                  )}
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="action-btn edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.category_id)}
                      className="action-btn delete"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Categories; 