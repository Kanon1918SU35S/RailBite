import React, { useState } from 'react';
import BackButton from '../components/BackButton';
import Toast from '../components/Toast';
import { contactAPI } from '../services/api';

const Contact = () => {
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await contactAPI.send(formData);
      if (res.data.success) {
        setToast({
          message: 'Thank you! We will contact you soon.',
          type: 'success'
        });
        setFormData({ name: '', email: '', message: '' });
      } else {
        setToast({
          message: res.data.message || 'Failed to send message',
          type: 'error'
        });
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || err.message || 'Failed to send message',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      <BackButton />

      <div className="contact-inner">
        {/* Header */}
        <section className="contact-header">
          <h1>Contact Us</h1>
          <p>
            Have questions or need assistance? Our customer support team is
            available 24/7. Reach out through any of the options below or send
            us a direct message.
          </p>
        </section>

        <section className="contact-layout">
          {/* Contact cards */}
          <div className="contact-info-panel">
            <div className="contact-grid">
              <div className="contact-card">
                <div className="contact-icon">📞</div>
                <h3>Phone Support</h3>
                <p>Call us anytime</p>
                <p className="contact-value">+880 1XXX-XXXXXX</p>
                <p className="contact-value">+880 2-XXXXXXX</p>
              </div>

              <div className="contact-card">
                <div className="contact-icon">📧</div>
                <h3>Email Support</h3>
                <p>Write to us</p>
                <p className="contact-value">support@railbitebd.com</p>
                <p className="contact-value">info@railbitebd.com</p>
              </div>

              <div className="contact-card">
                <div className="contact-icon">🏢</div>
                <h3>Head Office</h3>
                <p>Visit us at</p>
                <p className="contact-value">Kamalapur Railway Station</p>
                <p className="contact-value">Dhaka-1217, Bangladesh</p>
              </div>

              <div className="contact-card">
                <div className="contact-icon">⏰</div>
                <h3>Working Hours</h3>
                <p>We&apos;re available</p>
                <p className="contact-value">24/7 Customer Support</p>
                <p className="contact-value">Including holidays</p>
              </div>
            </div>
          </div>

          {/* Message form */}
          <aside className="contact-form-panel">
            <div className="contact-card contact-form-card">
              <h2>Send us a message</h2>
              <form onSubmit={handleSubmit}>
                <div className="contact-form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="contact-form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="contact-form-group">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />
                </div>
                <button
                  className="btn btn-primary contact-submit"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Submit'}
                </button>
              </form>
            </div>
          </aside>
        </section>

        {/* FAQ Section */}
        <section className="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-list">
            <div className="faq-item">
              <h3>How do I track my order?</h3>
              <p>
                You will receive a confirmation SMS and email with your order
                number that you can use to track your order status.
              </p>
            </div>
            <div className="faq-item">
              <h3>What if my train gets delayed?</h3>
              <p>
                Delivery timing automatically adjusts with live train schedules.
                You can also call our support team to update your delivery time.
              </p>
            </div>
            <div className="faq-item">
              <h3>Can I cancel my order?</h3>
              <p>
                Yes, you can cancel up to 30 minutes before the scheduled
                delivery time by contacting customer support.
              </p>
            </div>
            <div className="faq-item">
              <h3>What payment methods do you accept?</h3>
              <p>
                We accept cash on delivery, cards, and mobile banking (bKash,
                Nagad, Rocket).
              </p>
            </div>
          </div>
        </section>
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

export default Contact;
