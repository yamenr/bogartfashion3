import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSettings } from '../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import './AdminTheme.css';

const Suppliers = () => {
  const { isUserAdmin, loadingSettings } = useSettings();
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [error, setError] = useState(null);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierContact, setNewSupplierContact] = useState('');
  const [editingSupplier, setEditingSupplier] = useState(null); // supplier object being edited
  const [editedSupplierName, setEditedSupplierName] = useState('');
  const [editedSupplierContact, setEditedSupplierContact] = useState('');

  useEffect(() => {
    if (loadingSettings) {
      return; // Wait for settings to load
    }
    if (!isUserAdmin) {
      navigate('/'); // Redirect if not admin
      return;
    }

    fetchSuppliers();
  }, [isUserAdmin, loadingSettings, navigate]);

  const fetchSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/suppliers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuppliers(response.data);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError('Failed to fetch suppliers.');
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    if (!newSupplierName.trim() || !newSupplierContact.trim()) {
      setError('Supplier name and contact cannot be empty.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/suppliers', { name: newSupplierName, contact: newSupplierContact }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewSupplierName('');
      setNewSupplierContact('');
      fetchSuppliers();
    } catch (err) {
      console.error('Error adding supplier:', err);
      setError(err.response?.data?.message || 'Failed to add supplier.');
    }
  };

  const handleEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setEditedSupplierName(supplier.name);
    setEditedSupplierContact(supplier.contact);
  };

  const handleUpdateSupplier = async (e) => {
    e.preventDefault();
    if (!editedSupplierName.trim() || !editedSupplierContact.trim()) {
      setError('Supplier name and contact cannot be empty.');
      return;
    }
    if (!editingSupplier) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/suppliers/${editingSupplier.supplier_id}`, { name: editedSupplierName, contact: editedSupplierContact }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingSupplier(null);
      setEditedSupplierName('');
      setEditedSupplierContact('');
      fetchSuppliers();
    } catch (err) {
      console.error('Error updating supplier:', err);
      setError(err.response?.data?.message || 'Failed to update supplier.');
    }
  };

  const handleDeleteSupplier = async (supplierId) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        console.log('Attempting to delete supplier with ID:', supplierId);
        const token = localStorage.getItem('token');
        await axios.delete(`/api/suppliers/${supplierId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchSuppliers();
      } catch (err) {
        console.error('Error deleting supplier:', err);
        setError(err.response?.data?.message || 'Failed to delete supplier.');
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

  if (loadingSuppliers) {
    return (
      <div className="admin-page">
        <div className="admin-loading">Loading Suppliers...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Suppliers Management</h1>
        <p>Add, edit, and manage product suppliers</p>
      </div>

      {error && (
        <div className="message error">{error}</div>
      )}

      <div className="admin-form">
        <form onSubmit={handleAddSupplier}>
          <div className="form-group">
            <label htmlFor="newSupplierName">Supplier Name:</label>
            <input
              type="text"
              id="newSupplierName"
              value={newSupplierName}
              onChange={(e) => setNewSupplierName(e.target.value)}
              placeholder="Enter supplier name"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="newSupplierContact">Contact Information:</label>
            <input
              type="text"
              id="newSupplierContact"
              value={newSupplierContact}
              onChange={(e) => setNewSupplierContact(e.target.value)}
              placeholder="Enter contact information"
              required
            />
          </div>
          <button type="submit" className="admin-btn">Add Supplier</button>
        </form>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Supplier ID</th>
              <th>Name</th>
              <th>Contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.supplier_id}>
                <td>{supplier.supplier_id}</td>
                <td>
                  {editingSupplier?.supplier_id === supplier.supplier_id ? (
                    <input
                      type="text"
                      value={editedSupplierName}
                      onChange={(e) => setEditedSupplierName(e.target.value)}
                      style={{ 
                        width: '100%',
                        padding: '8px 12px',
                        border: '2px solid #555',
                        borderRadius: '8px',
                        backgroundColor: '#333',
                        color: '#fff'
                      }}
                      required
                    />
                  ) : (
                    supplier.name
                  )}
                </td>
                <td>
                  {editingSupplier?.supplier_id === supplier.supplier_id ? (
                    <input
                      type="text"
                      value={editedSupplierContact}
                      onChange={(e) => setEditedSupplierContact(e.target.value)}
                      style={{ 
                        width: '100%',
                        padding: '8px 12px',
                        border: '2px solid #555',
                        borderRadius: '8px',
                        backgroundColor: '#333',
                        color: '#fff'
                      }}
                      required
                    />
                  ) : (
                    supplier.contact
                  )}
                </td>
                <td>
                  <div className="action-buttons">
                    {editingSupplier?.supplier_id === supplier.supplier_id ? (
                      <>
                        <button
                          onClick={handleUpdateSupplier}
                          className="action-btn edit"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingSupplier(null)}
                          className="action-btn secondary"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditSupplier(supplier)}
                          className="action-btn edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSupplier(supplier.supplier_id)}
                          className="action-btn delete"
                        >
                          Delete
                        </button>
                      </>
                    )}
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

export default Suppliers; 