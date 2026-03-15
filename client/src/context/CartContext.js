import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [cartLoading, setCartLoading] = useState(false);
  const { isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart(null);
    }
  }, [isAuthenticated]);

  const fetchCart = async () => {
    try {
      setCartLoading(true);
      const res = await axios.get('/api/cart');
      setCart(res.data.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setCartLoading(false);
    }
  };

  const addToCart = async (productId, quantity, tenureMonths, rentalStartDate) => {
    try {
      setCartLoading(true);
      const res = await axios.post('/api/cart/add', {
        productId,
        quantity,
        tenureMonths,
        rentalStartDate
      });
      setCart(res.data.data);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error adding to cart' };
    } finally {
      setCartLoading(false);
    }
  };

  const updateCartItem = async (itemId, data) => {
    try {
      setCartLoading(true);
      const res = await axios.put(`/api/cart/update/${itemId}`, data);
      setCart(res.data.data);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error updating cart' };
    } finally {
      setCartLoading(false);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      setCartLoading(true);
      const res = await axios.delete(`/api/cart/remove/${itemId}`);
      setCart(res.data.data);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error removing from cart' };
    } finally {
      setCartLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setCartLoading(true);
      await axios.delete('/api/cart/clear');
      setCart(null);
    } catch (error) {
      console.error('Error clearing cart:', error);
    } finally {
      setCartLoading(false);
    }
  };

  const cartItemsCount = cart?.items?.length || 0;
  const cartTotal = cart?.total || 0;

  return (
    <CartContext.Provider value={{
      cart,
      cartLoading,
      fetchCart,
      addToCart,
      updateCartItem,
      removeFromCart,
      clearCart,
      cartItemsCount,
      cartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
};
