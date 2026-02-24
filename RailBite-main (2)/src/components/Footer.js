import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) { setSubscribed(true); setEmail(''); setTimeout(() => setSubscribed(false), 4000); }
  };

  return (
    <footer className="footer footer-3d footer--modern">
      {/* Wave SVG divider */}
      <div className="footer__wave">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none">
          <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,20 1440,30 L1440,60 L0,60Z" fill="var(--dark-bg)" />
        </svg>
      </div>

      <div className="container">
        <div className="footer-grid">
          {/* Brand column */}
          <div className="footer-col footer-col--brand">
            <div className="footer-logo">
              <span className="footer-logo__icon">🚂</span>
              <h3>RailBite<span className="footer-logo__bd">BD</span></h3>
            </div>
            <p className="footer-col__desc">Bangladesh Railway Food Service — delivering delicious meals to your train journey since 2024.</p>
            <div className="footer-socials">
              {[
                { label: 'Facebook', d: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z' },
                { label: 'Twitter', d: 'M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0012 7.5v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z' },
                { label: 'Instagram', d: 'M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm5 5a5 5 0 100 10 5 5 0 000-10zm6-1a1 1 0 100-2 1 1 0 000 2z' },
              ].map(({ label, d }) => (
                <a key={label} href="#" className="footer-social" aria-label={label}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/order-selection">Order Now</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="footer-col">
            <h4>Support</h4>
            <ul>
              <li><Link to="/faq">FAQ</Link></li>
              <li><Link to="/terms">Terms &amp; Conditions</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Newsletter + contact */}
          <div className="footer-col">
            <h4>Stay Updated</h4>
            <form className="footer-newsletter" onSubmit={handleSubscribe}>
              <input
                type="email"
                placeholder="Your email"
                className="footer-newsletter__input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="footer-newsletter__btn">
                {subscribed ? '✓' : '→'}
              </button>
            </form>
            {subscribed && <p className="footer-newsletter__thanks">Thank you for subscribing!</p>}
            <div className="footer-contact-row">📧 info@railbitebd.com</div>
            <div className="footer-contact-row">📞 +880 1XXX-XXXXXX</div>
            <div className="footer-contact-row">📍 Dhaka, Bangladesh</div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} RailBite BD. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;