import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const MenuContext = createContext();

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
const BACKEND_BASE = API_URL.replace('/api', '');

const resolveImage = (img) =>
  img?.startsWith('/uploads') ? `${BACKEND_BASE}${img}` : img;

const resolveItemImages = (items) =>
  items.map((item) => ({ ...item, image: resolveImage(item.image) }));

export const MenuProvider = ({ children }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all menu items
  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/menu`);

      if (response.data.success) {
        setMenuItems(resolveItemImages(response.data.data));

        // Extract unique categories
        const uniqueCategories = [...new Set(response.data.data.map(item => item.category))];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
      setError(error.response?.data?.message || 'Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  // Fetch menu items by category
  const fetchMenuByCategory = async (category) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/menu/category/${category}`);

      if (response.data.success) {
        return resolveItemImages(response.data.data);
      }
      return [];
    } catch (error) {
      console.error(`Failed to fetch ${category} menu:`, error);
      setError(error.response?.data?.message || `Failed to load ${category} menu`);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch single menu item by ID
  const fetchMenuItem = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/menu/${id}`);

      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch menu item:', error);
      setError(error.response?.data?.message || 'Failed to load menu item');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get menu items by category from cached data
  const getItemsByCategory = (category) => {
    return menuItems.filter(item =>
      item.category.toLowerCase() === category.toLowerCase() && item.available
    );
  };

  // Fetch menu items on mount
  useEffect(() => {
    fetchMenuItems();
  }, []);

  const value = {
    menuItems,
    categories,
    loading,
    error,
    fetchMenuItems,
    fetchMenuByCategory,
    fetchMenuItem,
    getItemsByCategory
  };

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
};
