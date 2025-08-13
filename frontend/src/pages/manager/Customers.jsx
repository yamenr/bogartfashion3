import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { formatPrice } from '../../utils/currency';
import './AdminTheme.css';

const Customers = () => {
    const { isUserAdmin, loadingSettings, currency } = useSettings();
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerOrders, setCustomerOrders] = useState([]);
    const [showOrdersModal, setShowOrdersModal] = useState(false);

    useEffect(() => {
        if (loadingSettings) {
            return; // Wait for settings to load
        }
        if (!isUserAdmin) {
            navigate('/'); // Redirect if not admin
            return;
        }

        const fetchCustomers = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No token found');
                }
                const response = await fetch('/api/admin/customers', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setCustomers(data);
            } catch (error) {
                console.error('Error fetching customers:', error);
            }
        };

        fetchCustomers();
    }, [isUserAdmin, loadingSettings, navigate]);

    const fetchCustomerOrders = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/orders?userId=${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setCustomerOrders(data);
        } catch (error) {
            console.error('Error fetching customer orders:', error);
        }
    };

    const handleViewOrders = async (customer) => {
        setSelectedCustomer(customer);
        await fetchCustomerOrders(customer.user_id);
        setShowOrdersModal(true);
    };

    const handleDeleteCustomer = async (customer) => {
        if (!window.confirm(`Are you sure you want to delete customer "${customer.username}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/customers/${customer.user_id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete customer');
            }

            // Remove the customer from the local state
            setCustomers(prevCustomers => 
                prevCustomers.filter(c => c.user_id !== customer.user_id)
            );

            alert('Customer deleted successfully');
        } catch (error) {
            console.error('Error deleting customer:', error);
            alert(`Error deleting customer: ${error.message}`);
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

    const filteredCustomers = customers.filter(customer =>
        customer.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h1>Customers Management</h1>
                <p>View and manage customer accounts and orders</p>
            </div>

            <div className="admin-form">
                <div className="form-group">
                    <label htmlFor="search">Search Customers:</label>
                    <input
                        type="text"
                        id="search"
                        placeholder="Search by username or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.map((customer) => (
                            <tr key={customer.user_id}>
                                <td>{customer.user_id}</td>
                                <td>{customer.username}</td>
                                <td>{customer.email}</td>
                                <td>
                                    <span className={`status-badge ${customer.role === 'admin' ? 'active' : 'inactive'}`}>
                                        {customer.role}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            onClick={() => handleViewOrders(customer)}
                                            className="action-btn edit"
                                        >
                                            View Orders
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCustomer(customer)}
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

            {/* Orders Modal */}
            {showOrdersModal && (
                <div className="admin-modal-overlay" onClick={() => setShowOrdersModal(false)}>
                    <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="admin-modal-close"
                            onClick={() => setShowOrdersModal(false)}
                        >
                            ×
                        </button>
                        <h2>Orders for {selectedCustomer?.username}</h2>
                        {customerOrders.length === 0 ? (
                            <p>No orders found for this customer.</p>
                        ) : (
                            <div className="admin-table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Date</th>
                                            <th>Total</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customerOrders.map((order) => (
                                            <tr key={order.order_id}>
                                                <td>{order.order_id}</td>
                                                <td>{new Date(order.order_date).toLocaleDateString()}</td>
                                                <td>{formatPrice(order.total_amount, currency)}</td>
                                                <td>
                                                    <span className={`status-badge ${order.status === 'pending' ? 'pending' : 'active'}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;