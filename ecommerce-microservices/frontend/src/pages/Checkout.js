import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../utils/api';

const Checkout = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateShippingAddress } = useAuth();
  const { cart } = useCart();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    if (cart.items.length === 0) {
      navigate('/cart');
      return;
    }
    // Pre-fill with user data
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || '',
      });
    }
  }, [isAuthenticated, user, cart, navigate]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    const required = ['full_name', 'phone', 'address', 'city', 'state', 'pincode'];
    for (const field of required) {
      if (!formData[field].trim()) {
        alert(`Please fill in ${field.replace('_', ' ')}`);
        return;
      }
    }

    setLoading(true);
    try {
      // Create order
      const response = await api.post('/api/orders/orders', {
        shipping_address: formData
      });
      
      // Save order data and navigate to payment
      localStorage.setItem('currentOrder', JSON.stringify(response.data));
      navigate('/payment');
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const shippingCost = cart.total >= 500 ? 0 : 40;
  const tax = Math.round(cart.total * 0.18);
  const grandTotal = cart.total + shippingCost + tax;

  const states = [
    'Andhra Pradesh', 'Bihar', 'Delhi', 'Gujarat', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Punjab', 'Rajasthan',
    'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal'
  ];

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container">
        {/* Back Button */}
        <button
          onClick={() => navigate('/cart')}
          className="btn btn-secondary"
          style={{ marginBottom: '32px' }}
        >
          <ChevronLeft size={18} />
          Back to Cart
        </button>

        <h1 style={{ fontSize: '36px', marginBottom: '40px' }}>Checkout</h1>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          gap: '40px',
        }}>
          {/* Shipping Form */}
          <div>
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              padding: '32px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '32px',
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'var(--gradient-primary)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <MapPin size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: '20px' }}>Shipping Address</h2>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    Where should we deliver your order?
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px',
                }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '8px',
                    }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      className="input"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '8px',
                    }}>
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="input"
                      placeholder="Enter 10-digit mobile number"
                      required
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '8px',
                    }}>
                      Address *
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="input"
                      placeholder="House/Flat No., Building, Street, Area"
                      rows={3}
                      style={{ resize: 'none' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '8px',
                    }}>
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="input"
                      placeholder="Enter city"
                      required
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '8px',
                    }}>
                      State *
                    </label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="input"
                      required
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="">Select state</option>
                      {states.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '8px',
                    }}>
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      className="input"
                      placeholder="6-digit PIN code"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '18px',
                    fontSize: '16px',
                    marginTop: '32px',
                  }}
                >
                  {loading ? 'Processing...' : 'Continue to Payment'}
                  <ArrowRight size={20} />
                </button>
              </form>
            </div>
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

            {/* Items Preview */}
            <div style={{
              maxHeight: '200px',
              overflowY: 'auto',
              marginBottom: '24px',
            }}>
              {cart.items.map((item) => (
                <div key={item.id} style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: '1px solid var(--border-color)',
                }}>
                  <img
                    src={item.product?.image_url}
                    alt={item.product?.name}
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: '13px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {item.product?.name}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: '600' }}>
                    {formatPrice(item.item_total)}
                  </p>
                </div>
              ))}
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-color)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span>{formatPrice(cart.total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Shipping</span>
                <span style={{ color: shippingCost === 0 ? 'var(--accent-success)' : 'inherit' }}>
                  {shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Tax (18% GST)</span>
                <span>{formatPrice(tax)}</span>
              </div>
            </div>

            <div style={{
              borderTop: '1px solid var(--border-color)',
              paddingTop: '16px',
              marginTop: '16px',
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
