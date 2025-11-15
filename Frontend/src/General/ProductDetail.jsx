import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../CartContext';
import BottomNav from './BottomNav';
import './ProductDetail.css';

function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, cart } = useCart();
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [partner, setPartner] = useState(null);

    useEffect(() => {
        fetchProductDetails();
    }, [id]);

    const fetchProductDetails = async () => {
        try {
            setLoading(true);
            // Fetch product details
            const productResponse = await axios.get(`http://localhost:8080/api/food/${id}`, {
                withCredentials: true
            });
            setProduct(productResponse.data);

            // Fetch related products
            const relatedResponse = await axios.get(`http://localhost:8080/api/food/${id}/related`, {
                withCredentials: true
            });
            setRelatedProducts(relatedResponse.data.relatedFoods || []);

            // Fetch partner details
            if (productResponse.data.foodpartner) {
                const partnerResponse = await axios.get(`http://localhost:8080/api/foodpartner/${productResponse.data.foodpartner}`, {
                    withCredentials: true
                });
                setPartner(partnerResponse.data.partner);
            }

        } catch (error) {
            console.error('Error fetching product details:', error);
            setError('Failed to load product details');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = () => {
        if (product && quantity > 0) {
            for (let i = 0; i < quantity; i++) {
                addToCart(product);
            }
            // Could add a toast notification here
        }
    };

    const handleBuyNow = () => {
        if (product && quantity > 0) {
            for (let i = 0; i < quantity; i++) {
                addToCart(product);
            }
            navigate('/cart');
        }
    };

    const updateQuantity = (newQuantity) => {
        if (newQuantity >= 1 && newQuantity <= (product?.availableQuantity || 1)) {
            setQuantity(newQuantity);
        }
    };

    if (loading) {
        return (
            <div className="product-detail-container">
                <div className="loading">Loading product details...</div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="product-detail-container">
                <div className="error">{error || 'Product not found'}</div>
                <button onClick={() => navigate('/explore')}>Back to Explore</button>
            </div>
        );
    }

    const isInCart = cart.some(item => item._id === product._id);
    const cartItem = cart.find(item => item._id === product._id);
    const currentQuantityInCart = cartItem ? cartItem.quantity : 0;

    return (
        <div className="product-detail-container">
            <div className="product-detail-content">
                <div className="product-main">
                    <div className="product-media">
                        <video
                            src={product.video}
                            controls
                            className="product-video"
                            poster={product.thumbnail || product.image}
                        />
                    </div>

                    <div className="product-info">
                        <h1 className="product-title">{product.name}</h1>

                        <div className="product-meta">
                            <span className="product-category">{product.category}</span>
                            {product.tags && product.tags.length > 0 && (
                                <div className="product-tags">
                                    {product.tags.map((tag, index) => (
                                        <span key={index} className="tag">#{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="product-price-section">
                            <span className="product-price">₹{product.price ? product.price.toFixed(2) : 'N/A'}</span>
                            <span className="availability">
                                {product.availableQuantity > 0
                                    ? `${product.availableQuantity} available`
                                    : 'Out of stock'
                                }
                            </span>
                        </div>

                        <div className="product-description">
                            <h3>Description</h3>
                            <p>{product.discription}</p>
                        </div>

                        {partner && (
                            <div className="partner-info">
                                <h3>Sold by</h3>
                                <Link to={`/partner/${partner._id}`} className="partner-link">
                                    <div className="partner-details">
                                        <div className="partner-avatar">
                                            {partner.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <span className="partner-name">{partner.name}</span>
                                            <span className="partner-location">{partner.address}</span>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        )}

                        <div className="product-actions">
                            <div className="quantity-selector">
                                <label>Quantity:</label>
                                <div className="quantity-controls">
                                    <button
                                        onClick={() => updateQuantity(quantity - 1)}
                                        disabled={quantity <= 1}
                                    >
                                        -
                                    </button>
                                    <span>{quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(quantity + 1)}
                                        disabled={quantity >= (product.availableQuantity || 1)}
                                    >
                                        +
                                    </button>
                                </div>
                                {currentQuantityInCart > 0 && (
                                    <span className="cart-quantity-note">
                                        {currentQuantityInCart} already in cart
                                    </span>
                                )}
                            </div>

                            <div className="action-buttons">
                                <button
                                    className="add-to-cart-btn"
                                    onClick={handleAddToCart}
                                    disabled={!product.availableQuantity || product.availableQuantity <= 0}
                                >
                                    {isInCart ? 'Add More to Cart' : 'Add to Cart'}
                                </button>
                                <button
                                    className="buy-now-btn"
                                    onClick={handleBuyNow}
                                    disabled={!product.availableQuantity || product.availableQuantity <= 0}
                                >
                                    Buy Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {relatedProducts.length > 0 && (
                    <div className="related-products">
                        <h2>You might also like</h2>
                        <div className="related-grid">
                            {relatedProducts.slice(0, 6).map(relatedProduct => (
                                <Link
                                    key={relatedProduct._id}
                                    to={`/product/${relatedProduct._id}`}
                                    className="related-card"
                                >
                                    <video
                                        src={relatedProduct.video}
                                        muted
                                        className="related-video"
                                        onMouseEnter={(e) => e.target.play()}
                                        onMouseLeave={(e) => e.target.pause()}
                                    />
                                    <div className="related-info">
                                        <h4>{relatedProduct.name}</h4>
                                        <p>₹{relatedProduct.price ? relatedProduct.price.toFixed(2) : 'N/A'}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <BottomNav />
        </div>
    );
}

export default ProductDetail;