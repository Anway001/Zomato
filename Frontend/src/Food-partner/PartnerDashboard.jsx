import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BottomNav from '../General/BottomNav';
import './PartnerDashboard.css';

function PartnerDashboard() {
    const navigate = useNavigate();
    const [partner, setPartner] = useState(null);
    const [foodItems, setFoodItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [restockModal, setRestockModal] = useState(null);
    const [restockQuantity, setRestockQuantity] = useState('');
    const [isRestocking, setIsRestocking] = useState(false);
    const [stats, setStats] = useState({
        totalItems: 0,
        totalLikes: 0,
        totalSaves: 0,
        totalOrders: 0,
        totalEarnings: 0
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const partnerResponse = await axios.get('http://localhost:8080/api/foodpartner/profile', {
                withCredentials: true
            });

            if (!partnerResponse.data?.partner) {
                navigate('/foodpartner/login');
                return;
            }

            setPartner(partnerResponse.data.partner);
            setFoodItems(partnerResponse.data.partner.foodItems || []);

            const items = partnerResponse.data.partner.foodItems || [];
            const totalLikes = items.reduce((sum, item) => sum + (item.likeCount || 0), 0);
            const totalSaves = items.reduce((sum, item) => sum + (item.saveCount || 0), 0);

            let totalOrders = 0;
            let totalEarnings = 0;
            try {
                const ordersResponse = await axios.get('http://localhost:8080/api/orders/partner/orders', {
                    withCredentials: true
                });
                const orders = ordersResponse.data?.orders || [];
                totalOrders = orders.length;
                totalEarnings = orders.reduce((sum, order) => sum + order.totalAmount, 0);
            } catch (orderError) {
                console.log('Could not fetch orders:', orderError.message);
            }

            setStats({
                totalItems: items.length,
                totalLikes,
                totalSaves,
                totalOrders,
                totalEarnings
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            if (error.response?.status === 401 || error.response?.status === 404) {
                navigate('/foodpartner/login');
            } else {
                setError('Failed to load dashboard data');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (!window.confirm('Are you sure you want to delete this item?')) {
            return;
        }

        try {
            await axios.delete(`http://localhost:8080/api/food/${itemId}`, {
                withCredentials: true
            });

            setFoodItems(prev => prev.filter(item => item._id !== itemId));
            setStats(prev => ({
                ...prev,
                totalItems: prev.totalItems - 1
            }));

        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Failed to delete item');
        }
    };

    const handleRestockClick = (item) => {
        setRestockModal(item);
        setRestockQuantity(item.availableQuantity || 0);
    };

    const handleRestockSubmit = async () => {
        if (!restockModal || !restockQuantity) {
            alert('Please enter a quantity');
            return;
        }

        setIsRestocking(true);
        try {
            await axios.put(
                `http://localhost:8080/api/food/${restockModal._id}`,
                {
                    availableQuantity: parseInt(restockQuantity),
                    name: restockModal.name,
                    discription: restockModal.discription,
                    category: restockModal.category,
                    tags: restockModal.tags.join(', '),
                    price: restockModal.price
                },
                { withCredentials: true }
            );

            setFoodItems(prev => prev.map(item =>
                item._id === restockModal._id
                    ? { ...item, availableQuantity: parseInt(restockQuantity) }
                    : item
            ));

            alert('Stock updated successfully!');
            setRestockModal(null);
            setRestockQuantity('');
        } catch (error) {
            console.error('Error updating stock:', error);
            alert('Failed to update stock');
        } finally {
            setIsRestocking(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading">Loading dashboard...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-container">
                <div className="error">{error}</div>
                <button onClick={fetchDashboardData}>Retry</button>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Partner Dashboard</h1>
                <div className="partner-info">
                    <h2>Welcome, {partner?.name || 'Partner'}</h2>
                    <p>{partner?.email}</p>
                </div>
            </header>

            <div className="dashboard-stats">
                <div className="stat-card">
                    <h3>{stats.totalItems}</h3>
                    <p>Total Items</p>
                </div>
                <div className="stat-card">
                    <h3>{stats.totalLikes}</h3>
                    <p>Total Likes</p>
                </div>
                <div className="stat-card">
                    <h3>{stats.totalSaves}</h3>
                    <p>Total Saves</p>
                </div>
                <div className="stat-card">
                    <h3>{stats.totalOrders}</h3>
                    <p>Total Orders</p>
                </div>
                <div className="stat-card earnings">
                    <h3>₹{stats.totalEarnings.toFixed(2)}</h3>
                    <p>Total Earnings</p>
                </div>
            </div>

            <div className="dashboard-actions">
                <Link to="/createFood" className="action-btn primary">
                    <span>+</span> Add New Food/Reel
                </Link>
                <Link to="/partner/orders" className="action-btn secondary">
                    View Orders
                </Link>
                <Link to={`/partner/${partner?._id}`} className="action-btn secondary">
                    View Public Profile
                </Link>
            </div>

            {foodItems.filter(item => item.availableQuantity <= 0).length > 0 && (
                <section className="dashboard-content out-of-stock-section">
                    <h2>⚠️ Out of Stock Items ({foodItems.filter(item => item.availableQuantity <= 0).length})</h2>
                    <div className="items-grid">
                        {foodItems.filter(item => item.availableQuantity <= 0).map(item => (
                            <div key={item._id} className="item-card out-of-stock">
                                <div className="out-of-stock-badge">OUT OF STOCK</div>
                                <div className="item-media">
                                    <video src={item.video} muted />
                                </div>
                                <div className="item-info">
                                    <h4>{item.name}</h4>
                                    <p className="item-description">{item.discription}</p>
                                    <div className="item-stats">
                                        <span>❤️ {item.likeCount || 0}</span>
                                        <span>🔖 {item.saveCount || 0}</span>
                                        <span>₹{item.price || 'N/A'}</span>
                                    </div>
                                    <button
                                        className="restock-btn"
                                        onClick={() => handleRestockClick(item)}
                                    >
                                        📦 Restock Now
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section className="dashboard-content">
                <h2>Your Food Items & Reels</h2>

                {foodItems.length === 0 ? (
                    <div className="empty-state">
                        <h3>No items yet</h3>
                        <p>Start by adding your first food item or reel!</p>
                        <Link to="/createFood" className="action-btn primary">
                            Add Your First Item
                        </Link>
                    </div>
                ) : (
                    <div className="items-grid">
                        {foodItems.map(item => (
                            <div key={item._id} className="item-card">
                                {item.availableQuantity <= 0 && <div className="out-of-stock-badge">OUT OF STOCK</div>}
                                <div className="item-media">
                                    <video
                                        src={item.video}
                                        muted
                                        onMouseEnter={(e) => e.target.play()}
                                        onMouseLeave={(e) => e.target.pause()}
                                    />
                                </div>
                                <div className="item-info">
                                    <h4>{item.name}</h4>
                                    <p className="item-description">{item.discription}</p>
                                    <div className="item-stats">
                                        <span>❤️ {item.likeCount || 0}</span>
                                        <span>🔖 {item.saveCount || 0}</span>
                                        <span>₹{item.price || 'N/A'}</span>
                                        <span className={item.availableQuantity <= 0 ? 'stock-low' : 'stock-ok'}>
                                            📦 {item.availableQuantity}
                                        </span>
                                    </div>
                                    <div className="item-actions">
                                        <button
                                            className="edit-btn"
                                            onClick={() => navigate(`/edit-food/${item._id}`)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDeleteItem(item._id)}
                                        >
                                            Delete
                                        </button>
                                        <button
                                            className="restock-btn"
                                            onClick={() => handleRestockClick(item)}
                                        >
                                            📦 Restock
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {restockModal && (
                <div className="modal-overlay" onClick={() => setRestockModal(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Restock Item: {restockModal.name}</h3>
                        <div className="modal-body">
                            <p><strong>Current Stock:</strong> {restockModal.availableQuantity}</p>
                            <label>
                                <strong>New Quantity:</strong>
                                <input
                                    type="number"
                                    min="0"
                                    value={restockQuantity}
                                    onChange={(e) => setRestockQuantity(e.target.value)}
                                    placeholder="Enter quantity"
                                />
                            </label>
                        </div>
                        <div className="modal-actions">
                            <button
                                className="btn-cancel"
                                onClick={() => setRestockModal(null)}
                                disabled={isRestocking}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-confirm"
                                onClick={handleRestockSubmit}
                                disabled={isRestocking}
                            >
                                {isRestocking ? 'Updating...' : 'Update Stock'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}

export default PartnerDashboard;