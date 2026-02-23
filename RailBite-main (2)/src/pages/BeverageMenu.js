import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import BackButton from '../components/BackButton';
import SearchFilter from '../components/SearchFilter';
import Toast from '../components/Toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const BeverageMenu = () => {
  const [toast, setToast] = useState(null);
  const { addToCart } = useCart();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [priceRange, setPriceRange] = useState('all');
  const [dietaryType, setDietaryType] = useState('');
  const [allergenFree, setAllergenFree] = useState('');

  const [backendItems, setBackendItems] = useState(null);
  const [loading, setLoading] = useState(false);

  const staticItems = useMemo(
    () => [
      {
        name: 'Sprite',
        price: 50,
        image: '/images/sprite.jpg',
        description: 'Lemon-lime flavored soda',
      },
      {
        name: '7Up',
        price: 50,
        image: '/images/7up.jpg',
        description: 'Crisp lemon-lime drink',
      },
      {
        name: 'Mirinda',
        price: 50,
        image: '/images/mirinda.jpg',
        description: 'Orange flavored soda',
      },
      {
        name: 'Coca Cola',
        price: 50,
        image: '/images/coca-cola.jpg',
        description: 'Classic cola drink',
      },
      {
        name: 'Fanta',
        price: 50,
        image: '/images/fanta.jpg',
        description: 'Orange flavored soda',
      },
      {
        name: 'Pepsi',
        price: 50,
        image: '/images/pepsi.jpg',
        description: 'Cola soft drink',
      },
    ],
    []
  );

  useEffect(() => {
    const fetchBeverages = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/menu`, {
          params: { category: 'beverage', available: 'true' },
        });
        if (res.data.success && res.data.data.length > 0) {
          const mapped = res.data.data.map((item) => ({
            name: item.name,
            price: item.price,
            image: item.image?.startsWith('/uploads') ? API_URL.replace('/api', '') + item.image : item.image,
            description: item.description,
          }));
          setBackendItems(mapped);
        } else {
          setBackendItems(null);
        }
      } catch (err) {
        console.error('Failed to load beverages:', err);
        setBackendItems(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBeverages();
  }, []);

  const beverageItems = backendItems || staticItems;

  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...beverageItems];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description &&
            item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Price range filter
    if (priceRange !== 'all') {
      if (priceRange === '0-100') {
        filtered = filtered.filter((item) => item.price < 100);
      } else if (priceRange === '100-200') {
        filtered = filtered.filter(
          (item) => item.price >= 100 && item.price < 200
        );
      } else if (priceRange === '200-300') {
        filtered = filtered.filter(
          (item) => item.price >= 200 && item.price < 300
        );
      } else if (priceRange === '300+') {
        filtered = filtered.filter((item) => item.price >= 300);
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
  }, [beverageItems, searchQuery, sortBy, priceRange]);

  const handleAddToCart = (name, price, image) => {
    addToCart(name, price, image);
    setToast({ message: `${name} added to cart!`, type: 'success' });
  };

  return (
    <div className="menu-page">
      <BackButton />
      <div className="container">
        <h1
          style={{
            fontSize: '2.5rem',
            marginBottom: '2rem',
            textAlign: 'center',
            color: '#fff',
          }}
        >
          🥤 Beverage Selection
        </h1>

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
        <div
          style={{
            marginBottom: '1.5rem',
            color: 'var(--text-gray)',
            fontSize: '0.95rem',
          }}
        >
          {searchQuery && (
            <p>
              Found{' '}
              <strong style={{ color: 'var(--primary-orange)' }}>
                {filteredAndSortedItems.length}
              </strong>{' '}
              result(s) for "{searchQuery}"
            </p>
          )}
          {filteredAndSortedItems.length === 0 && searchQuery && (
            <p
              style={{
                color: 'var(--text-white)',
                fontSize: '1.1rem',
                textAlign: 'center',
                padding: '2rem',
                background: 'var(--dark-card)',
                borderRadius: '10px',
              }}
            >
              No beverages found. Try a different search term.
            </p>
          )}
        </div>

        {/* Menu Grid */}
        <div className="menu-grid-bordered">
          {filteredAndSortedItems.map((item) => (
            <div key={item.name} className="menu-card-bordered">
              <div className="menu-card-image">
                <img
                  src={item.image}
                  alt={item.name}
                  style={{
                    width: '200px',
                    height: '200px',
                    objectFit: 'cover',
                    borderRadius: '15px',
                  }}
                />
              </div>
              <div className="menu-card-info">
                <h3>{item.name.toUpperCase()}</h3>
                {item.description && (
                  <p
                    style={{
                      color: 'var(--text-gray)',
                      fontSize: '0.9rem',
                      marginBottom: '1rem',
                    }}
                  >
                    {item.description}
                  </p>
                )}
                <p className="price">৳{item.price}</p>
                <button
                  className="btn btn-primary"
                  onClick={() => handleAddToCart(item.name, item.price, item.image)}
                >
                  Order Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default BeverageMenu;
