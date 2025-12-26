import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, loading } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '40px',
      }}>
        <ShoppingBag size={80} color="var(--text-muted)" style={{ marginBottom: '24px' }} />
        <h2 style={{ fontSize: '28px', marginBottom: '12px' }}>Please login to view your cart</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
          Sign in to add items and checkout
        </p>
        <Link to="/auth" className="btn btn-primary" style={{ padding: '16px 32px' }}>
          Login / Register
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
      }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '40px',
      }}>
        <ShoppingBag size={80} color="var(--text-muted)" style={{ marginBottom: '24px' }} />
        <h2 style={{ fontSize: '28px', marginBottom: '12px' }}>Your cart is empty</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
          Looks like you haven't added anything yet
        </p>
        <Link to="/products" className="btn btn-primary" style={{ padding: '16px 32px' }}>
          Start Shopping
        </Link>
      </div>
    );
  }

  const shippingCost = cart.total >= 500 ? 0 : 40;
  const tax = Math.round(cart.total * 0.18);
  const grandTotal = cart.total + shippingCost + tax;

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container">
        <h1 style={{ fontSize: '36px', marginBottom: '40px' }}>Shopping Cart</h1>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          gap: '40px',
        }}>
          {/* Cart Items */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}>
            {cart.items.map((item, index) => (
              <div
                key={item.id}
                className="card"
                style={{
                  display: 'flex',
                  gap: '24px',
                  padding: '24px',
                  animation: `fadeIn 0.4s ease ${index * 0.1}s both`,
                }}
              >
                {/* Product Image */}
                <Link to={`/products/${item.product_id}`} style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}>
                  <img
                    src={item.product?.image_url || 'https://via.placeholder.com/140'}
                    alt={item.product?.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Link>

                {/* Product Info */}
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: '12px',
                    color: 'var(--accent-secondary)',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}>
                    {item.product?.brand}
                  </p>
                  <Link to={`/products/${item.product_id}`}>
                    <h3 style={{
                      fontSize: '18px',
                      marginBottom: '12px',
                      transition: 'color 0.2s',
                    }}>
                      {item.product?.name}
                    </h3>
                  </Link>

                  {/* Quantity Controls */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'var(--bg-secondary)',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                    }}>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="btn btn-icon"
                        style={{
                          width: '36px',
                          height: '36px',
                          border: 'none',
                          background: 'transparent',
                        }}
                      >
                        <Minus size={16} />
                      </button>
                      <span style={{
                        padding: '0 16px',
                        fontWeight: '600',
                      }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="btn btn-icon"
                        style={{
                          width: '36px',
                          height: '36px',
                          border: 'none',
                          background: 'transparent',
                        }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="btn btn-icon"
                      style={{
                        width: '36px',
                        height: '36px',
                        color: 'var(--accent-primary)',
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div style={{ textAlign: 'right' }}>
                  <p className="price" style={{ fontSize: '20px' }}>
                    {formatPrice(item.item_total)}
                  </p>
                  <p style={{
                    fontSize: '14px',
                    color: 'var(--text-muted)',
                    marginTop: '4px',
                  }}>
                    {formatPrice(item.product?.price)} each
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '20px',
            border: '1px solid var(--border-color)',
            padding: '32px',
            height: 'fit-content',
            position: 'sticky',
            top: '100px',
          }}>
            <h2 style={{ fontSize: '22px', marginBottom: '24px' }}>Order Summary</h2>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              marginBottom: '24px',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  Subtotal ({cart.item_count} items)
                </span>
                <span>{formatPrice(cart.total)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>Shipping</span>
                <span style={{ color: shippingCost === 0 ? 'var(--accent-success)' : 'inherit' }}>
                  {shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>Tax (18% GST)</span>
                <span>{formatPrice(tax)}</span>
              </div>
            </div>

            <div style={{
              borderTop: '1px solid var(--border-color)',
              paddingTop: '20px',
              marginBottom: '24px',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: '18px', fontWeight: '600' }}>Total</span>
                <span className="price" style={{ fontSize: '24px' }}>
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>

            {shippingCost > 0 && (
              <div style={{
                background: 'rgba(0, 217, 165, 0.1)',
                padding: '12px 16px',
                borderRadius: '10px',
                marginBottom: '24px',
              }}>
                <p style={{
                  fontSize: '13px',
                  color: 'var(--accent-success)',
                }}>
                  Add {formatPrice(500 - cart.total)} more for FREE shipping!
                </p>
              </div>
            )}

            <button
              onClick={() => navigate('/checkout')}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '18px',
                fontSize: '16px',
              }}
            >
              Proceed to Checkout
              <ArrowRight size={20} />
            </button>

            <Link
              to="/products"
              style={{
                display: 'block',
                textAlign: 'center',
                marginTop: '16px',
                color: 'var(--text-muted)',
                fontSize: '14px',
              }}
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
