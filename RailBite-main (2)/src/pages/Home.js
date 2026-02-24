import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reviewAPI } from '../services/api';
import ScrollReveal3D from '../components/ScrollReveal3D';
import Tilt3D from '../components/Tilt3D';
import FoodCarousel from '../components/FoodCarousel';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const heroRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setHeroLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  /* Fetch real reviews from backend */
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        /* Try public endpoint first, fall back to authenticated getAll */
        let reviews = [];
        try {
          const res = await reviewAPI.getPublic();
          if (res.data.success) reviews = res.data.data || [];
        } catch {
          const token = localStorage.getItem('railbiteToken') || localStorage.getItem('railbite_token');
          if (token) {
            const res = await reviewAPI.getAll(token);
            if (res.data.success) reviews = res.data.data || [];
          }
        }
        /* Show approved reviews, prefer ones with a comment; limit to 6 */
        const filtered = reviews
          .filter(r => r.comment && r.comment.trim().length > 0)
          .sort((a, b) => (b.ratings?.overall || 0) - (a.ratings?.overall || 0))
          .slice(0, 6)
          .map(r => ({
            name: r.userName || r.user?.name || 'Anonymous',
            text: r.comment,
            rating: r.ratings?.overall || 5,
          }));
        setTestimonials(filtered);
      } catch {
        setTestimonials([]);
      } finally {
        setTestimonialsLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated()) {
      navigate('/order-selection');
    } else {
      localStorage.setItem('railbiteIntendedUrl', '/order-selection');
      navigate('/login');
    }
  };

  const popularDishes = [
    { name: 'Bhuna Khichuri', price: 350, image: '/images/bhuna-khichuri.png', category: 'Lunch' },
    { name: 'Beef Shwarma', price: 120, image: '/images/beef-shwarma.png', category: 'Breakfast' },
    { name: 'Barbecue Beef Blast', price: 350, image: '/images/bbq-beef-blast.png', category: 'Snacks' },
    { name: 'Peri Peri Pizza', price: 999, image: '/images/peri-peri-pizza.png', category: 'Lunch' },
    { name: 'Morog Polao', price: 220, image: '/images/morog-polao.png', category: 'Dinner' },
    { name: 'Mango Smoothie', price: 199, image: '/images/mango-smoothie.jpg', category: 'Snacks' },
    { name: 'Beef Tehari', price: 200, image: '/images/beef-tehari.jpg', category: 'Dinner' },
    { name: 'Dim Paratha', price: 120, image: '/images/paratha-dim.png', category: 'Breakfast' }
  ];

  return (
    <div className="landing-page">

      {/* ═══════════ HERO ═══════════ */}
      <section className="lp-hero" ref={heroRef}>
        {/* Animated background layers */}
        <div className="lp-hero__bg">
          <div className="lp-hero__bg-img" style={{ backgroundImage: `url('/images/bengali-biryani.jpg')` }} />
          <div className="lp-hero__bg-overlay" />
          <div className="lp-hero__grain" />
        </div>

        {/* Floating decorative orbs */}
        <div className="lp-hero__orb lp-hero__orb--1" />
        <div className="lp-hero__orb lp-hero__orb--2" />
        <div className="lp-hero__orb lp-hero__orb--3" />

        <div className={`lp-hero__content container ${heroLoaded ? 'lp-hero__content--visible' : ''}`}>
          <span className="lp-hero__tag">
            <span className="lp-hero__tag-dot" />
            Bangladesh Railway Food Service
          </span>

          <h1 className="lp-hero__title">
            Fresh Meals,<br />
            <span className="lp-hero__title--accent">Delivered to Your Seat</span>
          </h1>

          <p className="lp-hero__subtitle">
            Order authentic Bangladeshi cuisine while traveling —
            piping hot food brought right to your coach, from kitchen to seat in minutes.
          </p>

          <div className="lp-hero__ctas">
            <button className="lp-btn lp-btn--primary" onClick={handleGetStarted}>
              <span>Start Ordering</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10h12m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button className="lp-btn lp-btn--ghost" onClick={() => navigate('/about')}>
              Learn More
            </button>
          </div>

          {/* Quick trust badges */}
          <div className="lp-hero__trust">
            <div className="lp-hero__trust-item">
              <strong>30 min</strong><span>Avg. Delivery</span>
            </div>
            <div className="lp-hero__trust-divider" />
            <div className="lp-hero__trust-item">
              <strong>500+</strong><span>Daily Orders</span>
            </div>
            <div className="lp-hero__trust-divider" />
            <div className="lp-hero__trust-item">
              <strong>4.8 ★</strong><span>User Rating</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="lp-hero__scroll">
          <div className="lp-hero__scroll-line" />
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="lp-steps">
        <div className="container">
          <ScrollReveal3D animation="unfold">
            <span className="lp-section-tag">Simple Process</span>
            <h2 className="lp-section-title">How It Works</h2>
            <p className="lp-section-subtitle">Three easy steps to a delicious journey</p>
          </ScrollReveal3D>

          <div className="lp-steps__grid">
            {[
              { num: '01', icon: '🎫', title: 'Enter Train Details', desc: 'Provide your train number, coach and seat so we can locate you on the route.' },
              { num: '02', icon: '🍱', title: 'Pick Your Meal', desc: 'Browse our curated menu of authentic Bangladeshi and international favourites.' },
              { num: '03', icon: '🚀', title: 'Sit Back & Enjoy', desc: 'A fresh, hot meal is delivered right to your seat within 30 – 45 minutes.' }
            ].map((step, i) => (
              <ScrollReveal3D key={i} animation={i === 1 ? 'pop' : i === 0 ? 'flipLeft' : 'flipRight'} delay={i * 0.12}>
                <Tilt3D className="lp-step-card" intensity={10}>
                  <span className="lp-step-card__num">{step.num}</span>
                  <div className="lp-step-card__icon">{step.icon}</div>
                  <h3 className="lp-step-card__title">{step.title}</h3>
                  <p className="lp-step-card__desc">{step.desc}</p>
                  {i < 2 && <div className="lp-step-card__connector" />}
                </Tilt3D>
              </ScrollReveal3D>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ POPULAR DISHES ═══════════ */}
      <section className="lp-dishes">
        <div className="container">
          <ScrollReveal3D animation="unfold">
            <span className="lp-section-tag">Our Menu</span>
            <h2 className="lp-section-title">Popular Dishes</h2>
            <p className="lp-section-subtitle">Favourites loved by thousands of travellers</p>
          </ScrollReveal3D>

          <ScrollReveal3D animation="zoomRotate" delay={0.1}>
            <div className="lp-dishes__badges">
              {['🍛 Biryani', '🌯 Shwarma', '🍕 Pizza', '🍔 Burgers', '🥤 Beverages'].map((b, i) => (
                <span key={i} className="lp-dishes__badge">{b}</span>
              ))}
            </div>
          </ScrollReveal3D>

          <FoodCarousel
            items={popularDishes.map((d, i) => ({ ...d, _id: i, available: true }))}
            onOrderNow={handleGetStarted}
          />

          <ScrollReveal3D animation="pop" delay={0.2}>
            <div className="lp-dishes__cta">
              <button className="lp-btn lp-btn--primary" onClick={handleGetStarted}>
                View Full Menu
              </button>
            </div>
          </ScrollReveal3D>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section className="lp-testimonials">
        <div className="container">
          <ScrollReveal3D animation="unfold">
            <span className="lp-section-tag">Testimonials</span>
            <h2 className="lp-section-title">What Travellers Say</h2>
          </ScrollReveal3D>

          {testimonialsLoading ? (
            /* skeleton loader */
            <div className="lp-testimonials__grid">
              {[0, 1, 2].map(i => (
                <div key={i} className="lp-testimonial-card lp-testimonial-card--skeleton">
                  <div className="lp-skel lp-skel--stars" />
                  <div className="lp-skel lp-skel--line" />
                  <div className="lp-skel lp-skel--line lp-skel--short" />
                  <div className="lp-skel lp-skel--footer" />
                </div>
              ))}
            </div>
          ) : testimonials.length > 0 ? (
            <div className="lp-testimonials__grid">
              {testimonials.map((t, i) => (
                <ScrollReveal3D key={i} animation={i % 3 === 1 ? 'pop' : i % 3 === 0 ? 'flipLeft' : 'flipRight'} delay={i * 0.1}>
                  <Tilt3D className="lp-testimonial-card" intensity={8}>
                    <div className="lp-testimonial-card__stars">{'★'.repeat(Math.round(t.rating))}{'☆'.repeat(5 - Math.round(t.rating))}</div>
                    <p className="lp-testimonial-card__text">"{t.text}"</p>
                    <div className="lp-testimonial-card__footer">
                      <div className="lp-testimonial-card__avatar">{t.name.charAt(0)}</div>
                      <div>
                        <strong className="lp-testimonial-card__name">{t.name}</strong>
                      </div>
                    </div>
                  </Tilt3D>
                </ScrollReveal3D>
              ))}
            </div>
          ) : (
            <div className="lp-testimonials__empty">
              <p>No reviews yet — be the first to share your experience!</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="lp-cta">
        <div className="lp-cta__glow" />
        <div className="container lp-cta__inner">
          <ScrollReveal3D animation="pop">
            <h2 className="lp-cta__title">Ready for a Delicious Journey?</h2>
            <p className="lp-cta__text">
              Join thousands of satisfied travellers already enjoying fresh meals on the go.
            </p>
            <button className="lp-btn lp-btn--white" onClick={handleGetStarted}>
              Start Ordering Now
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10h12m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </ScrollReveal3D>
        </div>
      </section>
    </div>
  );
};

export default Home;