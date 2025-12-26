import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], total: 0, item_count: 0 });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart({ items: [], total: 0, item_count: 0 });
    }
  }, [isAuthenticated]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCart = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const response = await api.get('/api/cart/cart');
      setCart(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      showToast('Please login to add items to cart', 'error');
      return false;
    }
    try {
      await api.post('/api/cart/cart', { product_id: productId, quantity });
      await fetchCart();
      showToast('Added to cart!', 'success');
      return true;
    } catch (error) {
      showToast('Failed to add to cart', 'error');
      return false;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      await api.put(`/api/cart/cart/${itemId}`, { quantity });
      await fetchCart();
    } catch (error) {
      showToast('Failed to update quantity', 'error');
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      await api.delete(`/api/cart/cart/${itemId}`);
      await fetchCart();
      showToast('Removed from cart', 'success');
    } catch (error) {
      showToast('Failed to remove item', 'error');
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/api/cart/cart');
      setCart({ items: [], total: 0, item_count: 0 });
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      toast,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      fetchCart,
      showToast
    }}>
      {children}
    </CartContext.Provider>
  );
};
