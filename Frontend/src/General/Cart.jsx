import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../CartContext';
import { useToast } from '../ToastContext';
import BottomNav from './BottomNav';
import './Cart.css';

function Cart() {
    const { cart, removeFromCart, updateQuantity, getTotalPrice } = useCart();
    const { showToast } = useToast();

    const handleRemoveFromCart = (item) => {
        removeFromCart(item._id);
        showToast(`${item.name} removed from cart`, 'info');
    };

    const handleUpdateQuantity = (item, newQuantity) => {
        if (newQuantity <= 0) {
            handleRemoveFromCart(item);
        } else {
            updateQuantity(item._id, newQuantity);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="cart-container">
                <div className="cart-header">
                    <h1 className="cart-title">Your Cart</h1>
                    <p className="cart-subtitle">Add some delicious food to get started</p>
                </div>
                <div className="cart-empty">
                    <div className="cart-empty-icon">🛒</div>
                    <h3>Your cart is empty</h3>
                    <p>Explore our menu and add some items to your cart</p>
                    <Link to="/explore" className="btn btn-primary">Start Shopping</Link>
                </div>
                <BottomNav />
            </div>
        );
    }

    return (
        <div className="cart-container">
            <div className="cart-header">
                <h1 className="cart-title">Your Cart</h1>
                <p className="cart-subtitle">{cart.length} item{cart.length !== 1 ? 's' : ''} in your cart</p>
            </div>
            <div className="cart-items">
                {cart.map(item => (
                    <div key={item._id} className="cart-item">
                        <div className="item-details">
                            <h3 className="item-name">{item.name}</h3>
                            <p className="item-description">{item.description || item.discription}</p>
                            <p className="item-price">₹{(item.price || 100).toFixed(2)}</p>
                        </div>
                        <div className="quantity-controls">
                            <button
                                className="quantity-btn"
                                onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                            >
                                −
                            </button>
                            <span className="quantity-display">{item.quantity}</span>
                            <button
                                className="quantity-btn"
                                onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                            >
                                +
                            </button>
                        </div>
                        <div className="item-total">₹{((item.price || 100) * item.quantity).toFixed(2)}</div>
                        <button className="remove-btn" onClick={() => handleRemoveFromCart(item)}>×</button>
                    </div>
                ))}
            </div>
            <div className="cart-summary">
                <div className="summary-row">
                    <span className="summary-label">Subtotal</span>
                    <span className="summary-value">₹{getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="summary-row">
                    <span className="summary-label">Delivery</span>
                    <span className="summary-value">₹40.00</span>
                </div>
                <div className="summary-row cart-total">
                    <span className="summary-label">Total</span>
                    <span className="summary-value">₹{(getTotalPrice() + 40).toFixed(2)}</span>
                </div>
            </div>
            <div className="cart-actions">
                <Link to="/explore" className="btn btn-outline">Continue Shopping</Link>
                <Link to="/checkout" className="btn btn-primary">Proceed to Checkout</Link>
            </div>
            <BottomNav />
        </div>
    );
}

export default Cart;