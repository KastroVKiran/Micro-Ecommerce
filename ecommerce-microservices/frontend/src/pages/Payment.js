import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, Building, Lock, ChevronLeft } from 'lucide-react';
import api from '../utils/api';
import { useCart } from '../context/CartContext';

const Payment = () => {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [cardData, setCardData] = useState({
    card_number: '',
    card_holder_name: '',
    expiry_date: '',
    cvv: '',
  });
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    const savedOrder = localStorage.getItem('currentOrder');
    if (!savedOrder) {
      navigate('/cart');
      return;
    }
    setOrder(JSON.parse(savedOrder));
  }, [navigate]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleCardChange = (e) => {
    let { name, value } = e.target;
    if (name === 'card_number') {
      value = formatCardNumber(value);
    }
    if (name === 'expiry_date') {
      value = formatExpiry(value);
    }
    if (name === 'cvv') {
      value = value.replace(/[^0-9]/g, '').substring(0, 3);
    }
    setCardData({ ...cardData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const paymentData = {
        order_id: order.order_id,
        amount: order.total,
        payment_method: paymentMethod,
      };

      if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
        paymentData.card_number = cardData.card_number.replace(/\s/g, '');
        paymentData.card_holder_name = cardData.card_holder_name;
        paymentData.expiry_date = cardData.expiry_date;
        paymentData.cvv = cardData.cvv;
      } else if (paymentMethod === 'upi') {
        paymentData.upi_id = upiId;
      }

      const response = await api.post('/api/payments/payments/process', paymentData);
      
      if (response.data.success) {
        localStorage.removeItem('currentOrder');
        await clearCart();
        navigate(`/order-confirmation/${order.order_id}`);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert(error.response?.data?.detail || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!order) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  const paymentMethods = [
    { id: 'credit_card', name: 'Credit Card', icon: CreditCard },
    { id: 'debit_card', name: 'Debit Card', icon: CreditCard },
    { id: 'upi', name: 'UPI', icon: Smartphone },
    { id: 'net_banking', name: 'Net Banking', icon: Building },
  ];

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container">
        {/* Back Button */}
        <button
          onClick={() => navigate('/checkout')}
          className="btn btn-secondary"
          style={{ marginBottom: '32px' }}
        >
          <ChevronLeft size={18} />
          Back to Shipping
        </button>

        <h1 style={{ fontSize: '36px', marginBottom: '40px' }}>Payment</h1>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          gap: '40px',
        }}>
          {/* Payment Form */}
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
                  <CreditCard size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: '20px' }}>Payment Method</h2>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    Select your preferred payment method
                  </p>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                marginBottom: '32px',
              }}>
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '16px',
                      background: paymentMethod === method.id ? 'rgba(233, 69, 96, 0.1)' : 'var(--bg-card)',
                      border: `2px solid ${paymentMethod === method.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <method.icon size={20} color={paymentMethod === method.id ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                    <span style={{ fontWeight: '500' }}>{method.name}</span>
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit}>
                {/* Card Payment Form */}
                {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginBottom: '8px',
                      }}>
                        Card Number
                      </label>
                      <input
                        type="text"
                        name="card_number"
                        value={cardData.card_number}
                        onChange={handleCardChange}
                        className="input"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
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
                        Card Holder Name
                      </label>
                      <input
                        type="text"
                        name="card_holder_name"
                        value={cardData.card_holder_name}
                        onChange={handleCardChange}
                        className="input"
                        placeholder="Name on card"
                        required
                      />
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '20px',
                    }}>
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '500',
                          marginBottom: '8px',
                        }}>
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          name="expiry_date"
                          value={cardData.expiry_date}
                          onChange={handleCardChange}
                          className="input"
                          placeholder="MM/YY"
                          maxLength={5}
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
                          CVV
                        </label>
                        <input
                          type="password"
                          name="cvv"
                          value={cardData.cvv}
                          onChange={handleCardChange}
                          className="input"
                          placeholder="***"
                          maxLength={3}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* UPI Form */}
                {paymentMethod === 'upi' && (
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '8px',
                    }}>
                      UPI ID
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="input"
                      placeholder="username@upi"
                      required
                    />
                  </div>
                )}

                {/* Net Banking */}
                {paymentMethod === 'net_banking' && (
                  <div style={{
                    padding: '24px',
                    background: 'var(--bg-card)',
                    borderRadius: '12px',
                    textAlign: 'center',
                  }}>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      You will be redirected to your bank's website to complete the payment.
                    </p>
                  </div>
                )}

                {/* Security Note */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '24px',
                  padding: '12px 16px',
                  background: 'rgba(0, 217, 165, 0.1)',
                  borderRadius: '10px',
                }}>
                  <Lock size={16} color="var(--accent-success)" />
                  <p style={{ fontSize: '13px', color: 'var(--accent-success)' }}>
                    Your payment is secured with 256-bit SSL encryption
                  </p>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '18px',
                    fontSize: '16px',
                    marginTop: '24px',
                  }}
                >
                  {loading ? 'Processing Payment...' : `Pay ${formatPrice(order.total)}`}
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

            <div style={{
              padding: '16px',
              background: 'var(--bg-card)',
              borderRadius: '12px',
              marginBottom: '24px',
            }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Order ID
              </p>
              <p style={{ fontWeight: '600', fontFamily: 'monospace' }}>
                {order.order_id}
              </p>
            </div>

            {/* Items */}
            <div style={{ marginBottom: '24px' }}>
              {order.items?.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: '1px solid var(--border-color)',
                }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {item.product?.name?.substring(0, 30)}... x{item.quantity}
                  </span>
                  <span style={{ fontSize: '14px' }}>
                    {formatPrice(item.item_total)}
                  </span>
                </div>
              ))}
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Shipping</span>
                <span style={{ color: order.shipping_cost === 0 ? 'var(--accent-success)' : 'inherit' }}>
                  {order.shipping_cost === 0 ? 'FREE' : formatPrice(order.shipping_cost)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Tax</span>
                <span>{formatPrice(order.tax)}</span>
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
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>

            {/* Shipping Address */}
            <div style={{
              marginTop: '24px',
              padding: '16px',
              background: 'var(--bg-card)',
              borderRadius: '12px',
            }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Delivering to
              </p>
              <p style={{ fontWeight: '500' }}>{order.shipping_address?.full_name}</p>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {order.shipping_address?.address}<br />
                {order.shipping_address?.city}, {order.shipping_address?.state}<br />
                {order.shipping_address?.pincode}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
