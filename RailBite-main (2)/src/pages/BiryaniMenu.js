import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import BackButton from '../components/BackButton';
import Toast from '../components/Toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const BiryaniMenu = () => {
  const [toast, setToast] = useState(null);
  const { addToCart } = useCart();

  const [backendItems, setBackendItems] = useState(null);
  const [loading, setLoading] = useState(false);

  const staticItems = [
    {
      name: 'Kacchi Biryani',
      price: 350,
      image: '/images/biryani.jpg',
      description: 'Authentic mutton biryani',
    },
    {
      name: 'Chicken Biryani',
      price: 180,
      image: '/images/chicken-biryani.jpg',
      description: 'Tender chicken with aromatic rice',
    },
    {
      name: 'Beef Tehari',
      price: 200,
      image: '/images/beef-tehari.jpg',
      description: 'Spiced beef with yellow rice',
    },
    {
      name: 'Morog Polao',
      price: 220,
      image: '/images/morog-polao.jpg',
      description: 'Chicken pulao with ghee',
    },
  ];

  useEffect(() => {
    const fetchBiryani = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/menu`, {
          params: { category: 'biryani' },
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
        console.error('Failed to load biryani menu:', err);
        setBackendItems(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBiryani();
  }, []);

  const biryaniItems = backendItems || staticItems;

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
            marginBottom: '3rem',
            textAlign: 'center',
          }}
        >
          Biryani & Rice Selection
        </h1>

        {loading && <p>Loading biryani items...</p>}

        <div className="menu-grid-bordered">
          {biryaniItems.map((item) => (
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
                <p
                  style={{
                    color: 'var(--text-gray)',
                    fontSize: '0.9rem',
                    marginBottom: '1rem',
                  }}
                >
                  {item.description}
                </p>
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

export default BiryaniMenu;
