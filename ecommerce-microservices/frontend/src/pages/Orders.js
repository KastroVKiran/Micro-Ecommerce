import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Orders = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, navigate]);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/orders/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'var(--accent-success)';
      case 'processing': return 'var(--accent-secondary)';
      case 'shipped': return '#3b82f6';
      case 'delivered': return 'var(--accent-success)';
      case 'cancelled': return 'var(--accent-primary)';
      default: return 'var(--text-muted)';
    }
  };

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

  if (orders.length === 0) {
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
        <Package size={80} color="var(--text-muted)" style={{ marginBottom: '24px' }} />
        <h2 style={{ fontSize: '28px', marginBottom: '12px' }}>No orders yet</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
          You haven't placed any orders yet
        </p>
        <Link to="/products" className="btn btn-primary" style={{ padding: '16px 32px' }}>
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '40px' }}>My Orders</h1>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
          {orders.map((order, index) => (
            <Link
              key={order.order_id}
              to={`/order-confirmation/${order.order_id}`}
              className="card"
              style={{
                padding: '24px',
                animation: `fadeIn 0.4s ease ${index * 0.1}s both`,
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px',
              }}>
                <div>
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    marginBottom: '4px',
                  }}>
                    Order ID
                  </p>
                  <p style={{
                    fontWeight: '600',
                    fontFamily: 'monospace',
                    fontSize: '16px',
                  }}>
                    {order.order_id}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span
                    className="badge"
                    style={{
                      background: `${getStatusColor(order.order_status)}20`,
                      color: getStatusColor(order.order_status),
                      textTransform: 'capitalize',
                    }}
                  >
                    {order.order_status}
                  </span>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '16px',
                overflowX: 'auto',
                paddingBottom: '8px',
              }}>
                {order.items?.slice(0, 4).map((item, idx) => (
                  <img
                    key={idx}
                    src={item.product?.image_url}
                    alt={item.product?.name}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                ))}
                {order.items?.length > 4 && (
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    flexShrink: 0,
                  }}>
                    +{order.items.length - 4}
                  </div>
                )}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-color)',
              }}>
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Placed on {formatDate(order.created_at)}
                  </p>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <span className="price" style={{ fontSize: '18px' }}>
                    {formatPrice(order.total)}
                  </span>
                  <ChevronRight size={20} color="var(--text-muted)" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Orders;
