import React from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';

const OrderSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="order-selection-page">
      <BackButton />

      <div className="container">
        <div className="selection-container">
          <div className="selection-header-row">
            <div>
              <h1 className="selection-title">Choose Your Ordering Option</h1>
              <p className="selection-subtitle">
                Select how you&apos;d like to receive your food
              </p>
            </div>
          </div>

          <div className="selection-grid">
            {/* Order from Train Card */}
            <div
              className="selection-card"
              onClick={() => navigate('/order-train')}
            >
              <div className="selection-card-inner">
                <div className="selection-media">
                  <div className="selection-media-bg">
                    <img
                      src="/images/train.png"
                      alt="Order from train"
                      className="selection-image"
                    />
                  </div>
                </div>
                <div className="selection-content">
                  <h3>Order from Train</h3>
                  <p>
                    Get fresh meals prepared and served by onboard train
                    services, delivered directly to your seat during your
                    journey.
                  </p>
                  <button
                    className="btn btn-primary selection-btn"
                    type="button"
                  >
                    Select
                  </button>
                </div>
              </div>
            </div>

            {/* Order from Station Card */}
            <div
              className="selection-card"
              onClick={() => navigate('/order-station')}
            >
              <div className="selection-card-inner">
                <div className="selection-media">
                  <div className="selection-media-bg">
                    <img
                      src="/images/station.png"
                      alt="Order from station"
                      className="selection-image"
                    />
                  </div>
                </div>
                <div className="selection-content">
                  <h3>Order from Station</h3>
                  <p>
                    Choose from verified restaurants and food partners at
                    selected railway stations and pick up when your train
                    arrives.
                  </p>
                  <button
                    className="btn btn-primary selection-btn"
                    type="button"
                  >
                    Select
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSelection;
