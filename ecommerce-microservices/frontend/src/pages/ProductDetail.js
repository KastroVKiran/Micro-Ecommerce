import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Star, Truck, Shield, RefreshCw, Minus, Plus, ChevronLeft } from 'lucide-react';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/api/products/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
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

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    setAddingToCart(true);
    await addToCart(product.id, quantity);
    setAddingToCart(false);
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    await addToCart(product.id, quantity);
    navigate('/cart');
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

  if (!product) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <h2>Product not found</h2>
        <button onClick={() => navigate('/products')} className="btn btn-primary" style={{ marginTop: '20px' }}>
          Back to Products
        </button>
      </div>
    );
  }

  const features = [
    { icon: Truck, text: 'Free Delivery on orders over ₹500' },
    { icon: Shield, text: '1 Year Warranty' },
    { icon: RefreshCw, text: '30 Days Easy Returns' },
  ];

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary"
          style={{ marginBottom: '32px' }}
        >
          <ChevronLeft size={18} />
          Back
        </button>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '60px',
        }}>
          {/* Product Image */}
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '24px',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            position: 'relative',
          }}>
            {product.discount_percent > 0 && (
              <span className="discount-badge" style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                padding: '8px 16px',
                fontSize: '14px',
              }}>
                {product.discount_percent}% OFF
              </span>
            )}
            <img
              src={product.image_url || 'https://via.placeholder.com/600'}
              alt={product.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                aspectRatio: '1',
              }}
            />
          </div>

          {/* Product Info */}
          <div>
            <p style={{
              fontSize: '14px',
              color: 'var(--accent-secondary)',
              fontWeight: '600',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              {product.brand}
            </p>

            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              marginBottom: '16px',
              lineHeight: '1.3',
            }}>
              {product.name}
            </h1>

            {/* Rating */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--accent-success)',
                padding: '6px 12px',
                borderRadius: '6px',
              }}>
                <Star size={16} fill="white" />
                <span style={{ fontWeight: '600' }}>{product.rating}</span>
              </div>
              <span style={{ color: 'var(--text-muted)' }}>
                {product.reviews_count?.toLocaleString()} reviews
              </span>
            </div>

            {/* Price */}
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '16px',
              marginBottom: '32px',
            }}>
              <span className="price" style={{ fontSize: '36px' }}>
                {formatPrice(product.price)}
              </span>
              {product.original_price > product.price && (
                <>
                  <span className="price-original" style={{ fontSize: '20px' }}>
                    {formatPrice(product.original_price)}
                  </span>
                  <span style={{
                    color: 'var(--accent-success)',
                    fontWeight: '600',
                  }}>
                    Save {formatPrice(product.original_price - product.price)}
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <p style={{
              color: 'var(--text-secondary)',
              lineHeight: '1.8',
              marginBottom: '32px',
            }}>
              {product.description}
            </p>

            {/* Quantity Selector */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '12px',
              }}>
                Quantity
              </label>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
              }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="btn btn-icon"
                  style={{ border: 'none', background: 'transparent' }}
                >
                  <Minus size={18} />
                </button>
                <span style={{
                  padding: '0 24px',
                  fontWeight: '600',
                  fontSize: '18px',
                }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="btn btn-icon"
                  style={{ border: 'none', background: 'transparent' }}
                >
                  <Plus size={18} />
                </button>
              </div>
              <span style={{
                marginLeft: '16px',
                color: product.stock < 10 ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontSize: '14px',
              }}>
                {product.stock < 10 ? `Only ${product.stock} left!` : `${product.stock} in stock`}
              </span>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '16px',
              marginBottom: '40px',
            }}>
              <button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="btn btn-secondary"
                style={{
                  flex: 1,
                  padding: '18px',
                  fontSize: '16px',
                }}
              >
                <ShoppingCart size={20} />
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
              <button
                onClick={handleBuyNow}
                className="btn btn-primary"
                style={{
                  flex: 1,
                  padding: '18px',
                  fontSize: '16px',
                }}
              >
                Buy Now
              </button>
            </div>

            {/* Features */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '24px',
              background: 'var(--bg-secondary)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
            }}>
              {features.map((feature, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <feature.icon size={20} color="var(--accent-primary)" />
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
