import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/api';

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  // Only the most recent request may update state. Filters fire a request per change,
  // and a slow older response used to overwrite the newer results.
  const latestRequest = useRef(0);

  // Fetch products (used by the Products page; Home loads its own featured list)
  const fetchProducts = useCallback(async (params = {}) => {
    const requestId = ++latestRequest.current;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/products`, { params });
      if (requestId !== latestRequest.current) return;
      setProducts(response.data.products);
      setPagination(response.data.pagination);
    } catch (err) {
      if (requestId !== latestRequest.current) return;
      setError(err.response?.data?.message || 'Failed to fetch products');
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <ProductContext.Provider
      value={{
        products,
        categories,
        loading,
        error,
        pagination,
        fetchProducts,
        fetchCategories
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
