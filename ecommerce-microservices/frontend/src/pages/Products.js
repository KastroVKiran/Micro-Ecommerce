import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Grid, List, ChevronDown, X } from 'lucide-react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sort') || 'newest';
  const featured = searchParams.get('featured') === 'true';

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [category, search, sortBy, featured]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (search) params.append('search', search);
      if (sortBy) params.append('sort_by', sortBy);
      if (featured) params.append('featured', 'true');
      
      const response = await api.get(`/api/products/products?${params.toString()}`);
      setProducts(response.data.products);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/products/products/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
  ];

  const hasFilters = category || search || featured;

  return (
    <div style={{ padding: '40px 0 80px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', marginBottom: '12px' }}>
            {search ? `Search: "${search}"` : category || 'All Products'}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {total} products found
          </p>
        </div>

        {/* Filters Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '24px',
          marginBottom: '32px',
          padding: '20px 24px',
          background: 'var(--bg-secondary)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
        }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {/* Category Filter */}
            <div style={{ position: 'relative' }}>
              <select
                value={category}
                onChange={(e) => updateFilter('category', e.target.value)}
                style={{
                  padding: '10px 40px 10px 16px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  appearance: 'none',
                }}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category} ({cat.count})
                  </option>
                ))}
              </select>
              <ChevronDown style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }} size={18} />
            </div>

            {/* Featured Toggle */}
            <button
              onClick={() => updateFilter('featured', featured ? '' : 'true')}
              className={`btn ${featured ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '10px 20px' }}
            >
              Featured Only
            </button>

            {/* Clear Filters */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="btn btn-secondary"
                style={{
                  padding: '10px 20px',
                  color: 'var(--accent-primary)',
                }}
              >
                <X size={16} />
                Clear Filters
              </button>
            )}
          </div>

          {/* Sort */}
          <div style={{ position: 'relative' }}>
            <select
              value={sortBy}
              onChange={(e) => updateFilter('sort', e.target.value)}
              style={{
                padding: '10px 40px 10px 16px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                cursor: 'pointer',
                appearance: 'none',
                minWidth: '180px',
              }}
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }} size={18} />
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
          }}>
            <div className="loading-spinner" />
          </div>
        ) : products.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 0',
          }}>
            <h3 style={{ fontSize: '24px', marginBottom: '12px' }}>No products found</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              Try adjusting your filters or search term
            </p>
            <button onClick={clearFilters} className="btn btn-primary">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-4">
            {products.map((product, i) => (
              <div key={product.id} style={{
                animation: `fadeIn 0.4s ease ${i * 0.05}s both`,
              }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
