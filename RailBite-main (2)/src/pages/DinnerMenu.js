import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import BackButton from '../components/BackButton';
import SearchFilter from '../components/SearchFilter';
import Toast from '../components/Toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const CATEGORY_META = {
  burger: { label: 'Burger', path: '/burger-menu', image: '/images/burger.jpg' },
  pizza: { label: 'Pizza', path: '/pizza-menu', image: '/images/peri-peri-pizza.png' },
  shwarma: { label: 'Shwarma', path: '/shwarma-menu', image: '/images/chicken-shwarma.png' },
  smoothie: { label: 'Smoothie', path: '/smoothie-menu', image: '/images/smoothie.jpg' },
  beverage: { label: 'Beverage', path: '/beverage-menu', image: '/images/drinks.jpg' },
};

const DinnerMenu = () => {
  const [toast, setToast] = useState(null);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [priceRange, setPriceRange] = useState('all');
  const [dietaryType, setDietaryType] = useState('');
  const [allergenFree, setAllergenFree] = useState('');
  const [backendItems, setBackendItems] = useState(null);
  const [loading, setLoading] = useState(false);

  const dinnerItems = useMemo(() => [
    {
      name: 'Chicken Rezala',
      price: 250,
      image: '/images/chicken-rezala.png',
      description: 'Creamy yogurt-based chicken curry',
      hasSubmenu: false
    },
    {
      name: 'Morog Polao',
      price: 220,
      image: '/images/morog-polao.png',
      description: 'Chicken pulao with ghee',
      hasSubmenu: false
    },
    {
      name: 'Beef Tehari',
      price: 200,
      image: '/images/beef-tehari.jpg',
      description: 'Spiced beef with yellow rice',
      hasSubmenu: false
    },
    {
      name: 'Fish Curry with Rice',
      price: 180,
      image: '/images/fishcurry.jpg',
      description: 'Traditional Bengali fish curry',
      hasSubmenu: false
    },
  ], []);

  useEffect(() => {
    const fetchDinner = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/menu`, {
          params: { section: 'dinner', available: 'true' },
        });
        if (res.data.success && res.data.data.length > 0) {
          const allItems = res.data.data;
          const general = [];
          const byCategory = {};
          allItems.forEach(item => {
            const cat = item.category || 'general';
            if (cat === 'general') {
              general.push({
                name: item.name,
                price: item.price,
                image: item.image?.startsWith('/uploads') ? API_URL.replace('/api', '') + item.image : item.image,
                description: item.description,
                hasSubmenu: false,
              });
            } else {
              if (!byCategory[cat]) byCategory[cat] = [];
              byCategory[cat].push(item);
            }
          });
          const submenuCards = Object.entries(byCategory).map(([cat, items]) => {
            const meta = CATEGORY_META[cat] || {};
            const thumb = meta.image || (items[0].image?.startsWith('/uploads') ? API_URL.replace('/api', '') + items[0].image : items[0].image) || '/images/placeholder.jpg';
            return {
              name: meta.label || cat.charAt(0).toUpperCase() + cat.slice(1),
              price: Math.min(...items.map(i => i.price)),
              image: thumb,
              description: `${items.length} item${items.length > 1 ? 's' : ''} — Explore`,
              hasSubmenu: true,
              path: meta.path || '#',
            };
          });
          setBackendItems([...general, ...submenuCards]);
        } else {
          setBackendItems(null);
        }
      } catch (err) {
        console.error('Failed to load dinner menu:', err);
        setBackendItems(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDinner();
  }, []);

  const items = backendItems || dinnerItems;

  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...items];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Price range filter (submenu items show in all ranges)
    if (priceRange !== 'all') {
      if (priceRange === '0-100') {
        filtered = filtered.filter(item => item.hasSubmenu || item.price < 100);
      } else if (priceRange === '100-200') {
        filtered = filtered.filter(item => item.hasSubmenu || (item.price >= 100 && item.price < 200));
      } else if (priceRange === '200-300') {
        filtered = filtered.filter(item => item.hasSubmenu || (item.price >= 200 && item.price < 300));
      } else if (priceRange === '300+') {
        filtered = filtered.filter(item => item.hasSubmenu || item.price >= 300);
      }
    }

    // Sort
    if (sortBy === 'name-asc') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc') {
      filtered.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    }

    return filtered;
  }, [items, searchQuery, sortBy, priceRange]);

  const handleItemClick = (item) => {
    if (item.hasSubmenu) {
      navigate(item.path);
    } else {
      addToCart(item.name, item.price, item.image);
      setToast({ message: `${item.name} added to cart!`, type: 'success' });
    }
  };

  return (
    <div className="menu-page">
      <BackButton />
      <div className="container">
        <div className="menu-header">
          <h1>🍲 Dinner Menu</h1>
          <p className="ordering-from">Ordering from <span>Train</span></p>
        </div>

        {/* Search and Filter */}
        <SearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          showDietaryFilters={true}
          dietaryType={dietaryType}
          onDietaryTypeChange={setDietaryType}
          allergenFree={allergenFree}
          onAllergenFreeChange={setAllergenFree}
        />

        {/* Results Info */}
        <div style={{
          marginBottom: '1.5rem',
          color: 'var(--text-gray)',
          fontSize: '0.95rem'
        }}>
          {searchQuery && (
            <p>
              Found <strong style={{ color: 'var(--primary-orange)' }}>
                {filteredAndSortedItems.length}
              </strong> result(s) for "{searchQuery}"
            </p>
          )}
          {filteredAndSortedItems.length === 0 && searchQuery && (
            <p style={{
              color: 'var(--text-white)',
              fontSize: '1.1rem',
              textAlign: 'center',
              padding: '2rem',
              background: 'var(--dark-card)',
              borderRadius: '10px'
            }}>
              No items found. Try a different search term.
            </p>
          )}
        </div>

        {/* Menu Grid */}
        <div className="menu-grid">
          {filteredAndSortedItems.map(item => (
            <div key={item.name} className="menu-item-card">
              <div className="menu-item-image">
                <img src={item.image} alt={item.name} />
              </div>
              <div className="menu-item-content">
                <h3 className="menu-item-title">{item.name}</h3>
                <p className="menu-item-description">{item.description}</p>
                <div className="menu-item-footer">
                  {!item.hasSubmenu && (
                    <span className="menu-item-price">৳{item.price}</span>
                  )}
                  <button
                    className={`btn ${item.hasSubmenu ? 'btn-explore' : 'btn-primary'} btn-sm`}
                    onClick={() => handleItemClick(item)}
                  >
                    {item.hasSubmenu ? 'Explore →' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default DinnerMenu;