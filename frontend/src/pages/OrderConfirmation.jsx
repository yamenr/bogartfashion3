import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const OrderConfirmation = () => {
    const { orderId } = useParams();
    const [orderDetails, setOrderDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`/api/orders/${orderId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setOrderDetails(response.data);
            } catch (err) {
                setError('Failed to fetch order details');
                console.error('Error fetching order details:', err);
            } finally {
                setLoading(false);
            }
        };

        if (orderId) {
            fetchOrderDetails();
        }
    }, [orderId]);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <h2>Loading order details...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <h2>Error: {error}</h2>
                <p>Please check your <Link to="/order-history">Order History</Link> for details.</p>
            </div>
        );
    }

    return (
        <div style={{ 
            maxWidth: '800px', 
            margin: '0 auto', 
            padding: '40px 20px',
            background: '#222',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            border: '1px solid #333'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 style={{ color: '#C2883A', marginBottom: '20px' }}>✅ Order Placed Successfully!</h1>
                <p style={{ fontSize: '1.2em', color: '#ccc' }}>Your Order ID is: <strong style={{ color: '#C2883A' }}>#{orderId}</strong></p>
            </div>

            {orderDetails && (
                <div style={{ 
                    background: '#333', 
                    padding: '30px', 
                    borderRadius: '8px', 
                    marginBottom: '30px',
                    border: '1px solid #444'
                }}>
                    <h2 style={{ color: '#C2883A', marginBottom: '20px', textAlign: 'center' }}>Order Details</h2>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                            <h3 style={{ color: '#C2883A', marginBottom: '10px' }}>Shipping Address</h3>
                            <div style={{ color: '#ccc', lineHeight: '1.6' }}>
                                <p><strong>Street:</strong> {orderDetails.street_address || 'N/A'}</p>
                                <p><strong>City:</strong> {orderDetails.city || 'N/A'}</p>
                                <p><strong>Zip Code:</strong> {orderDetails.zip_code || 'N/A'}</p>
                                <p><strong>Phone:</strong> {orderDetails.phone || 'N/A'}</p>
                            </div>
                        </div>
                        
                        <div>
                            <h3 style={{ color: '#C2883A', marginBottom: '10px' }}>Order Information</h3>
                            <div style={{ color: '#ccc', lineHeight: '1.6' }}>
                                <p><strong>Total Amount:</strong> ${orderDetails.total_amount}</p>
                                <p><strong>Payment Method:</strong> {orderDetails.payment_method}</p>
                                <p><strong>Status:</strong> <span style={{ 
                                    color: orderDetails.status === 'pending' ? '#ffc107' : '#28a745',
                                    fontWeight: 'bold'
                                }}>{orderDetails.status}</span></p>
                                <p><strong>Order Date:</strong> {new Date(orderDetails.order_date).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.1em', color: '#ccc', marginBottom: '20px' }}>
                    Thank you for your purchase! You will receive a confirmation email shortly.
                </p>
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/order-history" style={{
                        padding: '12px 24px',
                        backgroundColor: '#C2883A',
                        color: '#111',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        transition: 'background-color 0.2s'
                    }} onMouseEnter={(e) => e.target.style.backgroundColor = '#d4a04a'} onMouseLeave={(e) => e.target.style.backgroundColor = '#C2883A'}>
                        View Order History
                    </Link>
                    <Link to="/products" style={{
                        padding: '12px 24px',
                        backgroundColor: 'transparent',
                        color: '#C2883A',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        border: '2px solid #C2883A',
                        transition: 'all 0.2s'
                    }} onMouseEnter={(e) => { e.target.style.backgroundColor = '#C2883A'; e.target.style.color = '#111'; }} onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#C2883A'; }}>
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmation; 