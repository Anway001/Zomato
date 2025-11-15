import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../CartContext';
import axios from 'axios';
import './BottomNav.css';

function BottomNav({ theme = 'dark' }) {
    const { cart } = useCart();
    const [userType, setUserType] = useState(null); // 'user', 'foodpartner', or null
    const [activePath, setActivePath] = useState('/');

    useEffect(() => {
        checkUserType();
        setActivePath(window.location.pathname);
    }, []);

    const checkUserType = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/auth/me', {
                withCredentials: true
            });
            setUserType(response.data?.type || null);
        } catch {
            // User not authenticated
            setUserType(null);
        }
    };

    const isFoodPartner = userType === 'foodpartner';

    const isActive = (path) => {
        if (path === '/' && activePath === '/') return true;
        return activePath.startsWith(path) && path !== '/';
    };

    return (
        <div className="bottom-nav-wrapper">
            <div className="nav-handle"></div>
            <nav className={`bottom-nav ${theme}`}>
                <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={() => setActivePath('/')}>
                    Reels
                </Link>
                {!isFoodPartner && (
                    <Link to="/explore" className={`nav-link ${isActive('/explore') ? 'active' : ''}`} onClick={() => setActivePath('/explore')}>
                        Explore
                    </Link>
                )}
                {isFoodPartner ? (
                    <Link to="/partner/dashboard" className={`nav-link ${isActive('/partner') ? 'active' : ''}`} onClick={() => setActivePath('/partner/dashboard')}>
                        Dashboard
                    </Link>
                ) : (
                    <>
                        <Link to="/cart" className={`nav-link ${isActive('/cart') ? 'active' : ''}`} onClick={() => setActivePath('/cart')}>
                            Cart {cart.length > 0 && <span className="cart-count">({cart.length})</span>}
                        </Link>
                        <Link to="/orders" className={`nav-link ${isActive('/orders') ? 'active' : ''}`} onClick={() => setActivePath('/orders')}>
                            Orders
                        </Link>
                    </>
                )}
            </nav>
        </div>
    );
}

export default BottomNav;