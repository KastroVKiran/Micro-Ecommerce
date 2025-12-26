import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, Truck, Home, ArrowRight } from 'lucide-react';
import api from '../utils/api';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/api/orders/orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
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
      month: 'long',
      day: 'numeric',
    });
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

  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <h2>Order not found</h2>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '20px' }}>
          Go to Home
        </Link>
      </div>
    );
  }

  const orderSteps = [
    { icon: CheckCircle, label: 'Order Confirmed', active: true },
    { icon: Package, label: 'Processing', active: order.order_status !== 'pending' },
    { icon: Truck, label: 'Shipped', active: ['shipped', 'delivered'].includes(order.order_status) },
    { icon: Home, label: 'Delivered', active: order.order_status === 'delivered' },
  ];

  return (
    <div style={{ padding: '60px 0 80px' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        {/* Success Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '48px',
          animation: 'fadeIn 0.5s ease',
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            background: 'rgba(0, 217, 165, 0.1)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <CheckCircle size={50} color="var(--accent-success)" />
          </div>
          <h1 style={{ fontSize: '32px', marginBottom: '12px', color: 'var(--accent-success)' }}>
            Order Confirmed!
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>
            Thank you for your purchase. Your order has been placed successfully.
          </p>
        </div>

        {/* Order Progress */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          padding: '32px',
          marginBottom: '24px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            position: 'relative',
          }}>
            {/* Progress Line */}
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '40px',
              right: '40px',
              height: '2px',
              background: 'var(--border-color)',
            }}>
              <div style={{
                height: '100%',
                background: 'var(--accent-success)',
                width: '25%',
                transition: 'width 0.5s ease',
              }} />
            </div>

            {orderSteps.map((step, index) => (
              <div key={index} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 1,
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: step.active ? 'var(--accent-success)' : 'var(--bg-card)',
                  border: `2px solid ${step.active ? 'var(--accent-success)' : 'var(--border-color)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '8px',
                }}>
                  <step.icon size={20} color={step.active ? 'white' : 'var(--text-muted)'} />
                </div>
                <span style={{
                  fontSize: '13px',
                  color: step.active ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: step.active ? '500' : '400',
                }}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Order Details */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          padding: '32px',
          marginBottom: '24px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            paddingBottom: '24px',
            borderBottom: '1px solid var(--border-color)',
          }}>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Order ID
              </p>
              <p style={{ fontWeight: '600', fontSize: '18px', fontFamily: 'monospace' }}>
                {order.order_id}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Order Date
              </p>
              <p style={{ fontWeight: '500' }}>
                {formatDate(order.created_at)}
              </p>
            </div>
          </div>

          {/* Items */}
          <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Order Items</h3>
          <div style={{ marginBottom: '24px' }}>
            {order.items?.map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                gap: '16px',
                padding: '16px',
                background: 'var(--bg-card)',
                borderRadius: '12px',
                marginBottom: '12px',
              }}>
                <img
                  src={item.product?.image_url}
                  alt={item.product?.name}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '500', marginBottom: '4px' }}>{item.product?.name}</p>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Qty: {item.quantity}</p>
                </div>
                <p style={{ fontWeight: '600' }}>{formatPrice(item.item_total)}</p>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)',
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
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-color)',
            }}>
              <span style={{ fontSize: '18px', fontWeight: '600' }}>Total Paid</span>
              <span className="price" style={{ fontSize: '22px' }}>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          padding: '32px',
          marginBottom: '32px',
        }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Shipping Address</h3>
          <div style={{
            padding: '16px',
            background: 'var(--bg-card)',
            borderRadius: '12px',
          }}>
            <p style={{ fontWeight: '500', marginBottom: '8px' }}>{order.shipping_address?.full_name}</p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {order.shipping_address?.address}<br />
              {order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.pincode}<br />
              Phone: {order.shipping_address?.phone}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
        }}>
          <Link to="/orders" className="btn btn-secondary" style={{ padding: '16px 32px' }}>
            View All Orders
          </Link>
          <Link to="/products" className="btn btn-primary" style={{ padding: '16px 32px' }}>
            Continue Shopping
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
