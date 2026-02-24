import React from 'react';
import BackButton from '../components/BackButton';

const About = () => {
  return (
    <div className="about-page">
      <BackButton />

      <div className="about-inner">
        {/* Hero */}
        <section className="about-hero">
          <h1>About RailBite</h1>
          <p>
            Bangladesh Railway&apos;s premier food delivery service bringing authentic
            Bangladeshi cuisine directly to your train seat so your journey is
            more comfortable and enjoyable.
          </p>
        </section>

        {/* Intro + Features */}
        <section className="about-layout">
          <div className="about-card">
            <h2>Who We Are</h2>
            <p>
              Founded with a vision to revolutionize railway food service, we
              partner with trusted restaurants and onboard kitchens to deliver
              fresh, hygienic, and delicious meals to passengers across
              Bangladesh.
            </p>
            <p>
              From daily commuters to long-distance travelers, RailBite is
              designed to make ordering food on trains simple, reliable, and
              enjoyable.
            </p>
          </div>

          <aside className="about-meta">
            <div>
              <div className="about-meta-title">At a glance</div>
              <div className="about-meta-line" />
            </div>
            <div className="about-meta-list">
              <div className="about-meta-item">
                <span className="about-meta-item-label">Major routes</span>
                <span className="about-meta-item-value">
                  Dhaka–Chattogram, Dhaka–Sylhet, Dhaka–Rajshahi
                </span>
              </div>
              <div className="about-meta-item">
                <span className="about-meta-item-label">Partner restaurants</span>
                <span className="about-meta-item-value">Verified & rated</span>
              </div>
              <div className="about-meta-item">
                <span className="about-meta-item-label">Support</span>
                <span className="about-meta-item-value">24/7 assistance</span>
              </div>
            </div>
          </aside>
        </section>

        {/* Features grid */}
        <section className="about-features">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🌏</div>
              <h3>Nationwide Coverage</h3>
              <p>
                Serving passengers on major routes including Dhaka–Chattogram,
                Dhaka–Sylhet, and Dhaka–Rajshahi.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">✅</div>
              <h3>Quality Assured</h3>
              <p>
                All partner restaurants are verified and maintain high standards
                of food safety and hygiene.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⏱️</div>
              <h3>Timely Delivery</h3>
              <p>
                Orders are scheduled with your live train timing so food reaches
                you fresh and on time.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⭐</div>
              <h3>Customer First</h3>
              <p>
                A dedicated support team is available around the clock to assist
                with orders and queries.
              </p>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="mission-vision">
          <div className="mission-box">
            <h2>Our Mission</h2>
            <p>
              To transform the railway dining experience with convenient,
              affordable, and high-quality food delivery that celebrates
              Bangladesh&apos;s rich culinary heritage.
            </p>
          </div>

          <div className="vision-box">
            <h2>Our Vision</h2>
            <p>
              To become Bangladesh&apos;s most trusted railway food service,
              setting new standards in hygiene, taste, and customer satisfaction
              while supporting local businesses.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
