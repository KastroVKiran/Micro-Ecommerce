import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X, Package, LogOut, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowUserMenu(false);
  };

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '80px',
      background: 'rgba(15, 15, 26, 0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-color)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
      }}>
        {/* Logo */}
        <Link to="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            background: 'var(--gradient-primary)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
          }}>
            S
          </div>
          <span style={{
            fontFamily: 'Space Grotesk',
            fontSize: '24px',
            fontWeight: '700',
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            ShopVerse
          </span>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{
          flex: 1,
          maxWidth: '500px',
          margin: '0 40px',
        }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}>
            <Search style={{
              position: 'absolute',
              left: '16px',
              color: 'var(--text-muted)',
              width: '20px',
              height: '20px',
            }} />
            <input
              type="text"
              placeholder="Search products, brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 20px 14px 48px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                transition: 'all 0.3s ease',
              }}
            />
          </div>
        </form>

        {/* Navigation Links */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <Link to="/products" className="btn btn-secondary" style={{ padding: '10px 20px' }}>
            Products
          </Link>

          {/* Cart */}
          <Link to="/cart" className="btn btn-icon" style={{ position: 'relative' }}>
            <ShoppingCart size={20} />
            {cart.item_count > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '20px',
                height: '20px',
                background: 'var(--accent-primary)',
                borderRadius: '50%',
                fontSize: '11px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {cart.item_count}
              </span>
            )}
          </Link>

          {/* User Menu */}
          {isAuthenticated ? (
            <div style={{ position: 'relative' }}>
              <button
                className="btn btn-icon"
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  background: showUserMenu ? 'var(--accent-primary)' : 'var(--bg-card)',
                }}
              >
                <User size={20} />
              </button>

              {showUserMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  width: '220px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-lg)',
                  animation: 'fadeIn 0.2s ease',
                }}>
                  <div style={{
                    padding: '16px',
                    borderBottom: '1px solid var(--border-color)',
                  }}>
                    <p style={{ fontWeight: '600', marginBottom: '4px' }}>
                      {user?.full_name || 'User'}
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {user?.email}
                    </p>
                  </div>
                  <div style={{ padding: '8px' }}>
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '8px',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      <User size={18} />
                      Profile
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setShowUserMenu(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '8px',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      <Package size={18} />
                      My Orders
                    </Link>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--accent-primary)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      <LogOut size={18} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth" className="btn btn-primary">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
