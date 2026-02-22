import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BackButton from '../components/BackButton';

// Time ranges for each meal period
const MEAL_PERIODS = {
  breakfast: { start: 6, end: 11, label: 'Breakfast' },   // 6:00 AM - 10:59 AM
  lunch: { start: 11, end: 16, label: 'Lunch' },       // 11:00 AM - 3:59 PM
  dinner: { start: 16, end: 23, label: 'Dinner' },      // 4:00 PM - 10:59 PM
};

const ALL_CATEGORIES = [
  {
    id: 'breakfast',
    name: 'Breakfast',
    description: 'Start your journey with a fresh morning meal',
    path: '/breakfast-menu',
    image: 'images/paratha-dim.png',
    timeLabel: '6:00 AM - 11:00 AM',
    alwaysAvailable: false,
  },
  {
    id: 'lunch',
    name: 'Lunch',
    description: 'Hearty midday meals to fuel your travels',
    path: '/lunch-menu',
    image: 'images/bhuna-khichuri.png',
    timeLabel: '11:00 AM - 4:00 PM',
    alwaysAvailable: false,
  },
  {
    id: 'dinner',
    name: 'Dinner',
    description: 'Delicious evening delights for your journey',
    path: '/dinner-menu',
    image: 'images/beef-tehari.jpg',
    timeLabel: '4:00 PM - 11:00 PM',
    alwaysAvailable: false,
  },
  {
    id: 'snacks',
    name: 'Snacks & Drinks',
    description: 'Quick bites & refreshments available anytime',
    path: '/snacks-menu',
    image: 'images/burger.jpg',
    timeLabel: 'Available 24/7',
    alwaysAvailable: true,
  },
];

const getCurrentMealPeriod = (hour) => {
  for (const [key, period] of Object.entries(MEAL_PERIODS)) {
    if (hour >= period.start && hour < period.end) {
      return key;
    }
  }
  // 11 PM - 6 AM: no meal period active (only snacks available)
  return null;
};

const formatTime = (date) => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

const MenuCategories = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderType, setOrderType] = useState('Train');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [clickedCard, setClickedCard] = useState(null);
  const [ripplePos, setRipplePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const savedOrderType = localStorage.getItem('railbiteOrderType');
    const locationState = location.state?.orderType;
    if (locationState) {
      setOrderType(locationState);
      localStorage.setItem('railbiteOrderType', locationState);
    } else if (savedOrderType) {
      setOrderType(savedOrderType);
    }
  }, [location]);

  // Live clock update every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 3D tilt effect tracking
  const handleMouseMove = useCallback((e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const currentHour = currentTime.getHours();
  const activeMealPeriod = getCurrentMealPeriod(currentHour);
  const activeMealLabel = activeMealPeriod
    ? MEAL_PERIODS[activeMealPeriod].label
    : 'Late Night';

  // Filter categories: always show snacks + currently active meal
  const availableCategories = ALL_CATEGORIES.filter(
    (cat) => cat.alwaysAvailable || cat.id === activeMealPeriod
  );

  const unavailableCategories = ALL_CATEGORIES.filter(
    (cat) => !cat.alwaysAvailable && cat.id !== activeMealPeriod
  );

  // Handle card click with transition
  const handleCardClick = (e, category) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    // Ripple position relative to card
    setRipplePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setClickedCard(category.id);
    // Navigate after the animation plays
    setTimeout(() => {
      navigate(category.path);
    }, 600);
  };

  return (
    <div className="mc-page" onMouseMove={handleMouseMove}>
      <BackButton />

      {/* Animated background orbs */}
      <div className="mc-bg-orb mc-bg-orb--1" />
      <div className="mc-bg-orb mc-bg-orb--2" />
      <div className="mc-bg-orb mc-bg-orb--3" />

      <div className="container" style={{ paddingTop: '90px', paddingBottom: '80px', position: 'relative', zIndex: 1 }}>
        {/* Header with live clock */}
        <div className="mc-header">
          <h1 className="mc-title">Select Menu Category</h1>
          <p className="mc-subtitle">
            Ordering from{' '}
            <span className="mc-highlight">{orderType}</span>
          </p>

          <div className="mc-clock-badge">
            <div className="mc-clock-dot" />
            <span className="mc-clock-time">{formatTime(currentTime)}</span>
            <span className="mc-clock-separator">•</span>
            <span className="mc-clock-period">{activeMealLabel} Menu Active</span>
          </div>
        </div>

        {/* Available categories */}
        <div className="mc-grid">
          {availableCategories.map((category, index) => (
            <div
              key={category.id}
              className={`mc-card mc-card--available${clickedCard === category.id ? ' mc-card--clicked' : ''}`}
              onClick={(e) => handleCardClick(e, category)}
              onMouseMove={(e) => {
                if (clickedCard) return;
                const card = e.currentTarget;
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                const rotateX = (y / rect.height) * -10;
                const rotateY = (x / rect.width) * 10;
                card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px) scale(1.02)`;
              }}
              onMouseLeave={(e) => {
                if (clickedCard) return;
                e.currentTarget.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateZ(0) scale(1)';
              }}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Background image layer */}
              <div
                className="mc-card__bg"
                style={{ backgroundImage: `url('${category.image}')` }}
              />

              {/* Glass overlay */}
              <div className="mc-card__glass">
                {/* Availability badge */}
                <div className="mc-card__badge mc-card__badge--available">
                  <span className="mc-card__badge-dot" />
                  {category.alwaysAvailable ? '24/7' : 'Available Now'}
                </div>

                <h3 className="mc-card__name">{category.name}</h3>
                <p className="mc-card__desc">{category.description}</p>
                <span className="mc-card__time">{category.timeLabel}</span>

                <div className="mc-card__arrow">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>

              {/* Glow border effect */}
              <div className="mc-card__glow" />

              {/* Click ripple effect */}
              {clickedCard === category.id && (
                <div
                  className="mc-card__ripple"
                  style={{ left: ripplePos.x, top: ripplePos.y }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Unavailable categories */}
        {unavailableCategories.length > 0 && (
          <>
            <div className="mc-unavailable-header">
              <div className="mc-unavailable-line" />
              <span className="mc-unavailable-label">Currently Unavailable</span>
              <div className="mc-unavailable-line" />
            </div>

            <div className="mc-grid mc-grid--unavailable">
              {unavailableCategories.map((category, index) => (
                <div
                  key={category.id}
                  className="mc-card mc-card--locked"
                  style={{ animationDelay: `${(availableCategories.length + index) * 0.15}s` }}
                >
                  <div
                    className="mc-card__bg mc-card__bg--locked"
                    style={{ backgroundImage: `url('${category.image}')` }}
                  />

                  <div className="mc-card__glass mc-card__glass--locked">
                    <div className="mc-card__badge mc-card__badge--locked">
                      <span>🔒</span> {category.timeLabel}
                    </div>

                    <h3 className="mc-card__name" style={{ opacity: 0.5 }}>{category.name}</h3>
                    <p className="mc-card__desc" style={{ opacity: 0.4 }}>{category.description}</p>
                    <span className="mc-card__time" style={{ opacity: 0.4 }}>{category.timeLabel}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MenuCategories;