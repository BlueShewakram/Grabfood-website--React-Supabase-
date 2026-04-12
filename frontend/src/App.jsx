import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Moon, Sun, Leaf } from 'lucide-react';
import Home from './pages/Home';
import RestaurantDetails from './pages/RestaurantDetails';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';
import grabLogo from './assets/grab-logo.svg';

const THEMES = [
  { id: 'dark', icon: Moon, label: 'Dark' },
  { id: 'light', icon: Sun, label: 'Light' },
  { id: 'nature', icon: Leaf, label: 'Nature' },
];

function App() {
  const [cart, setCart] = useState([]);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('grabfood_theme') || 'dark';
  });
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('grabfood_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('grabfood_theme', theme);
  }, [theme]);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('grabfood_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setCart([]);
    localStorage.removeItem('grabfood_user');
  };

  const addToCart = (item, restaurantID, restaurantName) => {
    setCart(prev => {
      if (prev.length > 0 && prev[0].restaurantID !== restaurantID) {
        return [{ ...item, quantity: 1, restaurantID, restaurantName }];
      }
      const existing = prev.find(i => i.itemID === item.itemID);
      if (existing) {
        return prev.map(i => i.itemID === item.itemID ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, restaurantID, restaurantName }];
    });
  };

  const updateQuantity = (itemID, delta) => {
    setCart(prev => prev.map(i => {
      if (i.itemID === itemID) {
        const newQty = i.quantity + delta;
        return newQty > 0 ? { ...i, quantity: newQty } : i;
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const removeFromCart = (itemID) => {
    setCart(prev => prev.filter(i => i.itemID !== itemID));
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((a, c) => a + c.quantity, 0);

  return (
    <Router>
      <nav className="navbar">
        <div className="app-container navbar-content">
          <Link to="/" className="brand">
            <img src={grabLogo} alt="GrabFood" className="brand-logo" />
          </Link>
          <div className="nav-actions">
            {/* Theme Switcher */}
            <div className="theme-switcher">
              {THEMES.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    className={`theme-btn ${theme === t.id ? 'active' : ''}`}
                    onClick={() => setTheme(t.id)}
                    title={t.label}
                  >
                    <Icon size={15} />
                  </button>
                );
              })}
            </div>

            {user ? (
              <>
                <div className="nav-user">
                  <User size={16} />
                  <span>{user.firstName}</span>
                </div>
                <button className="btn-icon" onClick={logout} title="Logout">
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-outline btn-sm">Sign In</Link>
            )}
            <Link to="/checkout" className="btn-icon" title="Cart">
              <ShoppingBag size={18} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
          </div>
        </div>
      </nav>

      <main className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/restaurant/:id" element={
            <RestaurantDetails cart={cart} addToCart={addToCart} updateQuantity={updateQuantity} />
          } />
          <Route path="/checkout" element={
            user
              ? <Checkout cart={cart} clearCart={clearCart} removeFromCart={removeFromCart} updateQuantity={updateQuantity} user={user} />
              : <Navigate to="/login" replace />
          } />
          <Route path="/login" element={
            user ? <Navigate to="/" replace /> : <Login onLogin={login} />
          } />
          <Route path="/register" element={
            user ? <Navigate to="/" replace /> : <Register onLogin={login} />
          } />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
