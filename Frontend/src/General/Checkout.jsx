import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../CartContext';
import BottomNav from './BottomNav';
import './Checkout.css';

function Checkout() {
    const { cart, clearCart, getTotalPrice } = useCart();
    const navigate = useNavigate();
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!deliveryAddress.trim()) {
            alert('Please enter delivery address');
            return;
        }

        setLoading(true);
        try {
            const items = cart.map(item => ({
                food: item._id,
                quantity: item.quantity,
                price: item.price || 100
            }));

            console.log('Placing order with items:', items);
            
            const response = await axios.post('http://localhost:8080/api/orders', {
                items,
                deliveryAddress
            }, { withCredentials: true });

            console.log('Order response:', response.data);
            alert('Order placed successfully!');
            clearCart();
            navigate('/orders');
        } catch (error) {
            console.error('Error placing order:', error.response?.data || error.message);
            alert(error.response?.data?.error || error.response?.data?.message || 'Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="checkout-container">
                <div className="checkout-header">
                    <h1 className="checkout-title">Checkout</h1>
                    <p className="checkout-subtitle">Complete your order</p>
                </div>
                <div className="checkout-content">
                    <div className="checkout-form-section">
                        <h3>No items in cart</h3>
                        <p>Please add some items to your cart before proceeding to checkout.</p>
                        <button onClick={() => navigate('/cart')} className="btn btn-primary">Back to Cart</button>
                    </div>
                </div>
                <BottomNav />
            </div>
        );
    }

    return (
        <div className="checkout-container">
            <div className="checkout-header">
                <h1 className="checkout-title">Checkout</h1>
                <p className="checkout-subtitle">Complete your delicious order</p>
            </div>
            <div className="checkout-content">
                <div className="checkout-form-section">
                    <div className="delivery-address">
                        <div className="address-form">
                            <div className="form-group">
                                <label className="form-label" htmlFor="address">Delivery Address</label>
                                <textarea
                                    id="address"
                                    className="form-input"
                                    value={deliveryAddress}
                                    onChange={(e) => setDeliveryAddress(e.target.value)}
                                    required
                                    placeholder="Enter your complete delivery address"
                                    rows="4"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="payment-method">
                        <div className="payment-options">
                            <div className="payment-option selected">
                                <input
                                    type="radio"
                                    id="cod"
                                    name="payment"
                                    value="cod"
                                    checked
                                    readOnly
                                    className="payment-radio"
                                />
                                <label htmlFor="cod" className="payment-label">
                                    💵 Cash on Delivery
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="checkout-summary">
                    <div className="summary-header">
                        <h3>Order Summary</h3>
                    </div>
                    <div className="order-items">
                        {cart.map(item => (
                            <div key={item._id} className="checkout-item">
                                <div className="item-info">
                                    <div className="item-details">
                                        <h4>{item.name}</h4>
                                        <span className="item-quantity">Qty: {item.quantity}</span>
                                    </div>
                                </div>
                                <span className="item-price">₹{((item.price || 100) * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="order-summary">
                        <div className="summary-row">
                            <span className="summary-label">Subtotal</span>
                            <span className="summary-value">₹{getTotalPrice().toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">Delivery</span>
                            <span className="summary-value">₹40.00</span>
                        </div>
                        <div className="summary-row checkout-total">
                            <span className="summary-label">Total</span>
                            <span className="summary-value">₹{(getTotalPrice() + 40).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="checkout-actions">
                <button onClick={() => navigate('/cart')} className="btn back-to-cart">Back to Cart</button>
                <button type="submit" onClick={handleSubmit} disabled={loading} className="btn place-order-btn">
                    {loading ? 'Placing Order...' : 'Place Order'}
                </button>
            </div>
            <BottomNav />
        </div>
    );
}

export default Checkout;