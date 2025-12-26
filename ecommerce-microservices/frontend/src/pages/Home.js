import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, RefreshCw, Star, ChevronRight } from 'lucide-react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get('/api/products/products/featured'),
        api.get('/api/products/products/categories')
      ]);
      setFeaturedProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Truck, title: 'Free Shipping', desc: 'On orders over ₹500' },
    { icon: Shield, title: 'Secure Payment', desc: '100% protected' },
    { icon: RefreshCw, title: 'Easy Returns', desc: '30-day returns' },
  ];

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Hero Section */}
      <section style={{
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        background: 'var(--gradient-dark)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(233, 69, 96, 0.1) 0%, transparent 50%),
                            radial-gradient(circle at 75% 75%, rgba(243, 156, 18, 0.1) 0%, transparent 50%)`,
        }} />
        
        <div className="container" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '60px',
          alignItems: 'center',
          position: 'relative',
        }}>
          <div style={{ animation: 'fadeIn 0.8s ease' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(233, 69, 96, 0.1)',
              padding: '8px 16px',
              borderRadius: '20px',
              marginBottom: '24px',
            }}>
              <Star size={16} color="var(--accent-secondary)" fill="var(--accent-secondary)" />
              <span style={{ fontSize: '13px', color: 'var(--accent-secondary)', fontWeight: '600' }}>
                RATED #1 SHOPPING PLATFORM
              </span>
            </div>
            
            <h1 style={{
              fontSize: 'clamp(40px, 5vw, 64px)',
              fontWeight: '700',
              lineHeight: '1.1',
              marginBottom: '24px',
            }}>
              Shop the Future
              <br />
              <span style={{
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Today
              </span>
            </h1>
            
            <p style={{
              fontSize: '18px',
              color: 'var(--text-secondary)',
              marginBottom: '40px',
              maxWidth: '480px',
              lineHeight: '1.7',
            }}>
              Discover premium products at unbeatable prices. Experience seamless shopping with fast delivery and secure payments.
            </p>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <Link to="/products" className="btn btn-primary" style={{
                padding: '16px 32px',
                fontSize: '16px',
              }}>
                Start Shopping
                <ArrowRight size={20} />
              </Link>
              <Link to="/products?featured=true" className="btn btn-secondary" style={{
                padding: '16px 32px',
                fontSize: '16px',
              }}>
                View Deals
              </Link>
            </div>
          </div>
          
          {/* Hero Image Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            animation: 'fadeIn 0.8s ease 0.2s both',
          }}>
            <div style={{
              gridRow: 'span 2',
              background: 'var(--bg-card)',
              borderRadius: '24px',
              overflow: 'hidden',
              border: '1px solid var(--border-color)',
            }}>
              <img
                src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"
                alt="Product"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '24px',
              overflow: 'hidden',
              border: '1px solid var(--border-color)',
            }}>
              <img
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500"
                alt="Product"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '24px',
              overflow: 'hidden',
              border: '1px solid var(--border-color)',
            }}>
              <img
                src="https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500"
                alt="Product"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{
        padding: '40px 0',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '32px',
          }}>
            {features.map((feature, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: 'var(--bg-card)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border-color)',
                }}>
                  <feature.icon size={24} color="var(--accent-primary)" />
                </div>
                <div>
                  <h4 style={{ fontWeight: '600', marginBottom: '4px' }}>{feature.title}</h4>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '40px',
          }}>
            <div>
              <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>Shop by Category</h2>
              <p style={{ color: 'var(--text-muted)' }}>Browse our popular categories</p>
            </div>
            <Link to="/products" className="btn btn-secondary">
              View All <ChevronRight size={18} />
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '24px',
          }}>
            {categories.map((cat, i) => (
              <Link
                key={cat.category}
                to={`/products?category=${encodeURIComponent(cat.category)}`}
                className="card"
                style={{
                  padding: '32px 24px',
                  textAlign: 'center',
                  animation: `fadeIn 0.5s ease ${i * 0.1}s both`,
                }}
              >
                <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>{cat.category}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                  {cat.count} products
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section style={{
        padding: '80px 0',
        background: 'var(--bg-secondary)',
      }}>
        <div className="container">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '40px',
          }}>
            <div>
              <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>Featured Products</h2>
              <p style={{ color: 'var(--text-muted)' }}>Handpicked deals just for you</p>
            </div>
            <Link to="/products?featured=true" className="btn btn-secondary">
              View All <ChevronRight size={18} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <div className="loading-spinner" />
            </div>
          ) : (
            <div className="grid grid-cols-4">
              {featuredProducts.map((product, i) => (
                <div key={product.id} style={{ animation: `fadeIn 0.5s ease ${i * 0.1}s both` }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '100px 0',
        background: 'var(--gradient-dark)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle at center, rgba(233, 69, 96, 0.15) 0%, transparent 70%)`,
        }} />
        <div className="container" style={{
          textAlign: 'center',
          position: 'relative',
        }}>
          <h2 style={{
            fontSize: '44px',
            marginBottom: '20px',
          }}>
            Ready to Start Shopping?
          </h2>
          <p style={{
            fontSize: '18px',
            color: 'var(--text-secondary)',
            marginBottom: '40px',
            maxWidth: '500px',
            margin: '0 auto 40px',
          }}>
            Join thousands of happy customers. Get exclusive deals and free shipping on your first order.
          </p>
          <Link to="/products" className="btn btn-primary" style={{
            padding: '18px 40px',
            fontSize: '16px',
          }}>
            Explore Products
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
