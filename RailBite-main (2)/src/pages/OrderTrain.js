import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrder } from '../context/OrderContext';
import BackButton from '../components/BackButton';
import Toast from '../components/Toast';

const OrderTrain = () => {
  const [formData, setFormData] = useState({
    passengerName: '',
    phone: '',
    trainNumber: '',
    coachNumber: '',
    seatNumber: ''
  });

  const [toast, setToast] = useState(null);
  const { saveOrderType, saveBookingDetails } = useOrder();
  const navigate = useNavigate();

  const coachOptions = ['KA', 'KHA', 'GA', 'GHA', 'UMO', 'CHA', 'SHA', 'JA', 'JHA'];
  const seatOptions = Array.from({ length: 50 }, (_, i) => i + 1);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.passengerName ||
      !formData.phone ||
      !formData.trainNumber ||
      !formData.coachNumber ||
      !formData.seatNumber
    ) {
      setToast({ message: 'Please fill in all fields', type: 'error' });
      return;
    }

    // Store lowercase orderType used by backend
    saveOrderType('train');
    saveBookingDetails({ ...formData, orderType: 'train' });

    setToast({ message: 'Details saved! Redirecting to menu...', type: 'success' });

    setTimeout(() => {
      navigate('/menu-categories', { state: { orderType: 'train' } });
    }, 1000);
  };

  return (
    <div className="booking-page">
      <BackButton />
      <div className="container">
        <div className="booking-container">
          <div className="booking-header">
            <div className="booking-header-icon">
              <img src="/images/train.png" alt="train" />
            </div>
            <div className="booking-header-text">
              <h2>Order from Train</h2>
              <p>Enter your journey details</p>
            </div>
          </div>

          <form className="booking-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Passenger Name</label>
              <input
                type="text"
                name="passengerName"
                value={formData.passengerName}
                onChange={handleChange}
                placeholder="Enter passenger name"
                required
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="880 1XXX-XXXXXX"
                required
              />
            </div>

            <div className="form-group">
              <label>Train Number</label>
              <input
                type="text"
                name="trainNumber"
                value={formData.trainNumber}
                onChange={handleChange}
                placeholder="e.g., 701 Suborna Express"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Coach Number</label>
                <select
                  name="coachNumber"
                  value={formData.coachNumber}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Coach</option>
                  {coachOptions.map((coach) => (
                    <option key={coach} value={coach}>
                      {coach}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Seat Number</label>
                <select
                  name="seatNumber"
                  value={formData.seatNumber}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Seat</option>
                  {seatOptions.map((seat) => (
                    <option key={seat} value={seat}>
                      {seat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              Continue to Menu
            </button>
          </form>
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

export default OrderTrain;
