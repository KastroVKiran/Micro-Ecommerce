import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await addToCart(product.id);
  };

  return (
    <Link to={`/products/${product.id}`} className="card" style={{
      display: 'flex',
      flexDirection: 'column',
      cursor: 'pointer',
    }}>
      {/* Image Container */}
      <div style={{
        position: 'relative',
        aspectRatio: '1',
        overflow: 'hidden',
        background: 'var(--bg-secondary)',
      }}>
        <img
          src={product.image_url || 'https://via.placeholder.com/400'}
          alt={product.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease',
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        />
        
        {/* Discount Badge */}
        {product.discount_percent > 0 && (
          <span className="discount-badge" style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
          }}>
            {product.discount_percent}% OFF
          </span>
        )}

        {/* Quick Actions */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <button
            className="btn btn-icon"
            onClick={handleAddToCart}
            style={{
              width: '40px',
              height: '40px',
              background: 'var(--accent-primary)',
              border: 'none',
            }}
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        {/* Brand */}
        <p style={{
          fontSize: '12px',
          color: 'var(--accent-secondary)',
          fontWeight: '600',
          textTransform: 'uppercase',
          marginBottom: '4px',
        }}>
          {product.brand}
        </p>

        {/* Name */}
        <h3 style={{
          fontSize: '15px',
          fontWeight: '500',
          marginBottom: '8px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          lineHeight: '1.4',
        }}>
          {product.name}
        </h3>

        {/* Rating */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '12px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'var(--accent-success)',
            padding: '2px 8px',
            borderRadius: '4px',
          }}>
            <Star size={12} fill="white" />
            <span style={{ fontSize: '12px', fontWeight: '600' }}>{product.rating}</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            ({product.reviews_count?.toLocaleString()} reviews)
          </span>
        </div>

        {/* Price */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span className="price" style={{ fontSize: '18px' }}>
            {formatPrice(product.price)}
          </span>
          {product.original_price > product.price && (
            <span className="price-original">
              {formatPrice(product.original_price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
