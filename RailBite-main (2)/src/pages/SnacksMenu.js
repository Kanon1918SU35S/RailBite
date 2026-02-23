import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import BackButton from '../components/BackButton';
import SearchFilter from '../components/SearchFilter';
import Toast from '../components/Toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

/*
 * Sub-category registry – each entry maps a backend category to a
 * dedicated submenu page. When the admin adds items under any of these
 * categories, the submenu card appears automatically in Snacks & Drinks.
 */
const SUB_CATEGORIES = {
  burger: { label: 'Burger', path: '/burger-menu', image: '/images/burger.jpg', desc: 'Explore different types' },
  pizza: { label: 'Pizza', path: '/pizza-menu', image: '/images/peri-peri-pizza.png', desc: 'Explore pizza varieties' },
  shwarma: { label: 'Shwarma', path: '/shwarma-menu', image: '/images/shwarma.png', desc: 'Explore shwarma wraps' },
  smoothie: { label: 'Smoothie', path: '/smoothie-menu', image: '/images/smoothie.jpg', desc: 'Explore different flavors' },
  beverage: { label: 'Beverage', path: '/beverage-menu', image: '/images/drinks.jpg', desc: 'Soft drinks & more' },
};

const SnacksMenu = () => {
  const [toast, setToast] = useState(null);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [priceRange, setPriceRange] = useState('all');
  const [dietaryType, setDietaryType] = useState('');
  const [allergenFree, setAllergenFree] = useState('');

  const [snackItems, setSnackItems] = useState([]);
  const [submenuCards, setSubmenuCards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fallback static snack items (shown when backend is empty)
  const fallbackSnacks = useMemo(
    () => [
      { name: 'Jhal Muri', price: 30, image: '/images/jhalmuri.png', description: 'Spicy puffed rice mix', hasSubmenu: false },
    ],
    []
  );

  /*
   * Fetch items for the snacksanddrinks section. Then:
   *  1. Build submenu cards for every sub-category that has >= 1 item.
   *  2. Collect all "general" category items as regular add-to-cart items.
   */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/menu`, {
          params: { section: 'snacksanddrinks', available: 'true' },
        });
        if (!res.data.success) return;

        const allItems = res.data.data || [];

        // group items by category
        const byCategory = {};
        allItems.forEach((item) => {
          const cat = (item.category || 'general').toLowerCase();
          if (!byCategory[cat]) byCategory[cat] = [];
          byCategory[cat].push(item);
        });

        // Build submenu cards for every registered sub-category that has items
        const dynamicSubmenus = [];
        Object.entries(SUB_CATEGORIES).forEach(([key, meta]) => {
          const items = byCategory[key];
          if (items && items.length > 0) {
            const thumb =
              meta.image ||
              (items[0].image?.startsWith('/uploads')
                ? API_URL.replace('/api', '') + items[0].image
                : items[0].image) ||
              '/images/placeholder.jpg';
            dynamicSubmenus.push({
              name: meta.label,
              price: Math.min(...items.map((i) => i.price)),
              image: thumb,
              description: `${items.length} item${items.length > 1 ? 's' : ''} \u2014 ${meta.desc}`,
              hasSubmenu: true,
              path: meta.path,
            });
          }
        });

        // Also include default sub-categories so the user can navigate
        const defaultSubmenus = ['burger', 'smoothie', 'beverage', 'pizza', 'shwarma'];
        defaultSubmenus.forEach((key) => {
          if (!dynamicSubmenus.find((s) => s.path === SUB_CATEGORIES[key].path)) {
            const meta = SUB_CATEGORIES[key];
            dynamicSubmenus.push({
              name: meta.label,
              price: 0,
              image: meta.image,
              description: meta.desc,
              hasSubmenu: true,
              path: meta.path,
            });
          }
        });

        setSubmenuCards(dynamicSubmenus);

        // Collect "general" category items
        const coreSnacks = (byCategory['general'] || []).map((item) => ({
          name: item.name,
          price: item.price,
          image: item.image?.startsWith('/uploads')
            ? API_URL.replace('/api', '') + item.image
            : item.image,
          description: item.description,
          hasSubmenu: false,
        }));

        setSnackItems(coreSnacks.length > 0 ? coreSnacks : fallbackSnacks);
      } catch (err) {
        console.error('Failed to load snacks:', err);
        setSubmenuCards(
          ['burger', 'pizza', 'smoothie', 'beverage'].map((key) => {
            const m = SUB_CATEGORIES[key];
            return { name: m.label, price: 0, image: m.image, description: m.desc, hasSubmenu: true, path: m.path };
          })
        );
        setSnackItems(fallbackSnacks);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [fallbackSnacks]);

  // Merge submenus + snack items for unified search / filter / sort
  const allDisplayItems = useMemo(
    () => [...submenuCards, ...snackItems],
    [submenuCards, snackItems]
  );

  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...allDisplayItems];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Price range filter (submenu items always visible)
    if (priceRange !== 'all') {
      if (priceRange === '0-100') {
        filtered = filtered.filter(
          (item) => item.hasSubmenu || item.price < 100
        );
      } else if (priceRange === '100-200') {
        filtered = filtered.filter(
          (item) =>
            item.hasSubmenu ||
            (item.price >= 100 && item.price < 200)
        );
      } else if (priceRange === '200-300') {
        filtered = filtered.filter(
          (item) =>
            item.hasSubmenu ||
            (item.price >= 200 && item.price < 300)
        );
      } else if (priceRange === '300+') {
        filtered = filtered.filter(
          (item) => item.hasSubmenu || item.price >= 300
        );
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
  }, [allDisplayItems, searchQuery, sortBy, priceRange]);

  const handleItemClick = (item) => {
    if (item.hasSubmenu && item.path) {
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
          <h1>🍟 Snacks & Drinks Menu</h1>
          <p className="ordering-from">
            Ordering from <span>Train</span>
          </p>
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

        {loading && <p>Loading snacks...</p>}

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
              No items found. Try a different search term.
            </p>
          )}
        </div>

        {/* Menu Grid */}
        <div className="menu-grid">
          {filteredAndSortedItems.map((item) => (
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
                    className={`btn ${item.hasSubmenu ? 'btn-explore' : 'btn-primary'
                      } btn-sm`}
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

export default SnacksMenu;
