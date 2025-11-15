import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../CartContext';
import { useToast } from '../ToastContext';
import LazyVideo from '../components/LazyVideo';
import BottomNav from './BottomNav';
import './Explore.css';

function Explore() {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { showToast } = useToast();
    const [foods, setFoods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredFoods = foods.filter(food =>
        food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (food.tags && food.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
    );

    useEffect(() => {
        fetchFoods();
    }, []);

    const fetchFoods = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/food', { withCredentials: true });
            if (!response.data?.isAuthenticated) {
                navigate('/user/login', { replace: true });
                return;
            }
            if (response.data?.foodItems) {
                // Sort by createdAt descending for latest first
                const sortedFoods = response.data.foodItems.sort((a, b) =>
                    new Date(b.createdAt) - new Date(a.createdAt)
                );
                setFoods(sortedFoods);
            }
        } catch (error) {
            if (error.response?.status === 401) {
                navigate('/user/login', { replace: true });
                return;
            }
            console.error('Error fetching foods:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="explore-container">
                <div className="explore-header">
                    <h1 className="explore-title">Explore Foods</h1>
                    <p className="explore-subtitle">Loading delicious food options...</p>
                </div>
                <BottomNav />
            </div>
        );
    }

    return (
        <div className="explore-container">
            <div className="explore-header">
                <h1 className="explore-title">Explore Foods</h1>
                <p className="explore-subtitle">Discover amazing food from local partners</p>
            </div>
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search foods or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
            </div>
            {filteredFoods.length === 0 && foods.length > 0 ? (
                <div className="no-results-state">
                    <div className="no-results-icon">🔍</div>
                    <h3>No foods found</h3>
                    <p>Try searching with different keywords</p>
                </div>
            ) : filteredFoods.length === 0 ? (
                <div className="no-results-state">
                    <div className="no-results-icon">🍽️</div>
                    <h3>No foods available</h3>
                    <p>Check back soon for delicious food options!</p>
                </div>
            ) : (
                <div className="foods-grid">
                    {filteredFoods.map(food => (
                        <div key={food._id} className="food-card">
                            <LazyVideo
                                src={food.video}
                                className="food-video"
                                muted
                                loop
                                onMouseEnter={(e) => e.target.play?.()}
                                onMouseLeave={(e) => e.target.pause?.()}
                            />
                            <div className="food-info">
                                <h3>{food.name}</h3>
                                <p className="food-description">{food.discription}</p>
                                <p className="food-category">{food.category}</p>
                                <p className="food-price">₹{food.price ? food.price.toFixed(2) : 'N/A'}</p>
                                <div className="food-actions">
                                    <Link to={`/product/${food._id}`} className="view-details-btn">
                                        View Details
                                    </Link>
                                    <button
                                        className="add-to-cart-btn"
                                        onClick={() => {
                                            addToCart(food);
                                            showToast(`${food.name} added to cart!`, 'success');
                                        }}
                                        disabled={!food.availableQuantity || food.availableQuantity <= 0}
                                    >
                                        {food.availableQuantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                                    </button>
                                    <Link to={`/partner/${food.foodpartner}`} className="visit-store-btn">
                                        Visit Store
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <BottomNav />
        </div>
    );
}

export default Explore;