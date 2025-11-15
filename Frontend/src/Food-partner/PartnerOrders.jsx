import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PartnerOrders.css';

function PartnerOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/orders/partner/orders', { withCredentials: true });
            setOrders(response.data.orders);
        } catch (error) {
            console.error('Error fetching orders:', error);
            if (error.response?.status === 401) {
                navigate('/foodpartner/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await axios.patch(`http://localhost:8080/api/orders/${orderId}/status`, { status: newStatus }, { withCredentials: true });
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order._id === orderId ? { ...order, status: newStatus } : order
                )
            );
        } catch (error) {
            console.error('Error updating order status:', error);
            alert('Failed to update order status');
        }
    };

    const getStatusIndex = (status) => {
        const stages = ['pending', 'preparing', 'on_the_way', 'delivered'];
        return stages.indexOf(status);
    };

    const getStatusIcon = (status) => {
        const iconMap = {
            pending: '📦',
            preparing: '👨‍🍳',
            on_the_way: '🚴',
            delivered: '✅'
        };
        return iconMap[status] || '❓';
    };

    if (loading) {
        return (
            <div className="partner-orders-container">
                <div className="loading-state">
                    <p>Loading orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="partner-orders-container">
            <h2>My Orders</h2>
            {orders.length === 0 ? (
                <div className="orders-empty-state">
                    <div className="empty-icon">📦</div>
                    <h3>No orders yet</h3>
                    <p>Your orders will appear here once customers place them</p>
                    <p className="empty-hint">Make sure your restaurant is active and your menu items are available</p>
                </div>
            ) : (
                <div className="orders-list">
                    {orders.map(order => (
                        <div key={order._id} className="order-card">
                            <div className="order-header">
                                <h3>Order #{order._id.slice(-8)}</h3>
                                <span className={`status ${order.status}`}>{getStatusIcon(order.status)} {order.status}</span>
                            </div>
                            <div className="order-progress">
                                <div className="progress-indicator">
                                    {['pending', 'preparing', 'on_the_way', 'delivered'].map((stage, index) => (
                                        <div 
                                            key={stage} 
                                            className={`progress-dot ${index <= getStatusIndex(order.status) ? 'completed' : ''} ${index === getStatusIndex(order.status) ? 'active' : ''}`}
                                            title={stage}
                                        ></div>
                                    ))}
                                </div>
                            </div>
                            <div className="order-details">
                                <p><strong>Customer:</strong> {order.user.fullname} ({order.user.email})</p>
                                <p><strong>Delivery Address:</strong> {order.deliveryAddress}</p>
                                <p><strong>Total:</strong> ₹{order.totalAmount.toFixed(2)}</p>
                                <p><strong>Ordered on:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="order-items">
                                <h4>Items:</h4>
                                {order.items.map((item, index) => (
                                    <div key={index} className="order-item">
                                        <span>{item.food.name} x {item.quantity}</span>
                                        <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="order-actions">
                                {order.status === 'pending' && (
                                    <button onClick={() => updateOrderStatus(order._id, 'preparing')} className="btn-prepare">
                                        👨‍🍳 Mark as Preparing
                                    </button>
                                )}
                                {order.status === 'preparing' && (
                                    <button onClick={() => updateOrderStatus(order._id, 'on_the_way')} className="btn-onway">
                                        🚴 Mark as On the Way
                                    </button>
                                )}
                                {order.status === 'on_the_way' && (
                                    <button onClick={() => updateOrderStatus(order._id, 'delivered')} className="btn-delivered">
                                        ✅ Mark as Delivered
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <button onClick={() => navigate('/createFood')} className="back-btn">Back to Dashboard</button>
        </div>
    );
}

export default PartnerOrders;