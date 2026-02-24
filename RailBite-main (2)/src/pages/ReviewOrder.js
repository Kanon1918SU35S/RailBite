import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderAPI, reviewAPI } from '../services/api';
import BackButton from '../components/BackButton';
import Toast from '../components/Toast';

const StarRating = ({ value, onChange, label }) => {
    const [hover, setHover] = useState(0);

    return (
        <div className="star-rating-group">
            <label className="star-rating-label">{label}</label>
            <div className="star-rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className={`star-btn ${star <= (hover || value) ? 'star-filled' : 'star-empty'}`}
                        onClick={() => onChange(star)}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                    >
                        {star <= (hover || value) ? '★' : '☆'}
                    </button>
                ))}
                <span className="star-rating-text">
                    {value > 0 ? `${value}/5` : 'Select'}
                </span>
            </div>
        </div>
    );
};

const ReviewOrder = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [alreadyReviewed, setAlreadyReviewed] = useState(false);
    const [existingReview, setExistingReview] = useState(null);
    const [toast, setToast] = useState(null);

    const [foodRating, setFoodRating] = useState(0);
    const [deliveryRating, setDeliveryRating] = useState(0);
    const [overallRating, setOverallRating] = useState(0);
    const [comment, setComment] = useState('');

    useEffect(() => {
        fetchOrderAndReview();
    }, [orderId]);

    const fetchOrderAndReview = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('railbiteToken');
            if (!token) {
                navigate('/login');
                return;
            }

            // Fetch order details
            const orderRes = await orderAPI.getById(orderId, token);
            if (orderRes.data.success) {
                const o = orderRes.data.data;
                setOrder(o);

                if (o.status !== 'delivered') {
                    setToast({ message: 'You can only rate delivered orders', type: 'error' });
                    setTimeout(() => navigate('/order-history'), 2000);
                    return;
                }

                // Check if already reviewed
                try {
                    const reviewRes = await reviewAPI.getByOrder(o._id, token);
                    if (reviewRes.data.success && reviewRes.data.data) {
                        setAlreadyReviewed(true);
                        setExistingReview(reviewRes.data.data);
                        setFoodRating(reviewRes.data.data.ratings.food);
                        setDeliveryRating(reviewRes.data.data.ratings.delivery);
                        setOverallRating(reviewRes.data.data.ratings.overall);
                        setComment(reviewRes.data.data.comment || '');
                    }
                } catch (err) {
                    // No review yet — that's fine
                }
            } else {
                setToast({ message: 'Order not found', type: 'error' });
                setTimeout(() => navigate('/order-history'), 2000);
            }
        } catch (err) {
            setToast({ message: err.response?.data?.message || 'Error loading order', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (foodRating === 0 || deliveryRating === 0 || overallRating === 0) {
            setToast({ message: 'Please provide all three ratings', type: 'error' });
            return;
        }

        try {
            setSubmitting(true);
            const token = localStorage.getItem('railbiteToken');

            const res = await reviewAPI.create({
                orderId: order._id,
                ratings: {
                    food: foodRating,
                    delivery: deliveryRating,
                    overall: overallRating
                },
                comment
            }, token);

            if (res.data.success) {
                setToast({ message: 'Thank you for your review!', type: 'success' });
                setAlreadyReviewed(true);
                setExistingReview(res.data.data);
                setTimeout(() => navigate('/order-history'), 2000);
            }
        } catch (err) {
            setToast({ message: err.response?.data?.message || 'Failed to submit review', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const getStarsDisplay = (rating) => {
        return '★'.repeat(rating) + '☆'.repeat(5 - rating);
    };

    if (loading) {
        return (
            <div className="review-order-page">
                <BackButton />
                <div className="container">
                    <div className="page-header-section">
                        <h1>⭐ Rate Your Order</h1>
                        <p>Loading order details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="review-order-page">
            <BackButton />
            <div className="container">
                <div className="page-header-section">
                    <h1>⭐ Rate Your Order</h1>
                    <p>Order #{order.orderNumber}</p>
                </div>

                {/* Order Summary */}
                <div className="review-order-summary">
                    <h3>Order Summary</h3>
                    <div className="review-items-list">
                        {order.items?.map((item, idx) => (
                            <div key={idx} className="review-item-row">
                                <span>{item.name} x {item.quantity}</span>
                                <span>৳{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="review-order-total">
                        <strong>Total: ৳{order.totalAmount?.toFixed(2)}</strong>
                    </div>
                </div>

                {alreadyReviewed ? (
                    /* Show existing review */
                    <div className="review-existing">
                        <h3>Your Review</h3>
                        <div className="review-existing-ratings">
                            <div className="review-existing-row">
                                <span className="review-existing-label">Food Quality</span>
                                <span className="review-stars-display">{getStarsDisplay(existingReview?.ratings?.food || 0)}</span>
                            </div>
                            <div className="review-existing-row">
                                <span className="review-existing-label">Delivery Service</span>
                                <span className="review-stars-display">{getStarsDisplay(existingReview?.ratings?.delivery || 0)}</span>
                            </div>
                            <div className="review-existing-row">
                                <span className="review-existing-label">Overall Experience</span>
                                <span className="review-stars-display">{getStarsDisplay(existingReview?.ratings?.overall || 0)}</span>
                            </div>
                        </div>
                        {existingReview?.comment && (
                            <div className="review-existing-comment">
                                <strong>Your Comment:</strong>
                                <p>"{existingReview.comment}"</p>
                            </div>
                        )}
                        <button
                            className="btn btn-secondary btn-block"
                            onClick={() => navigate('/order-history')}
                            style={{ marginTop: '1.5rem' }}
                        >
                            Back to Order History
                        </button>
                    </div>
                ) : (
                    /* Review Form */
                    <form onSubmit={handleSubmit} className="review-form">
                        <h3>Rate Your Experience</h3>

                        <StarRating
                            label="🍽️ Food Quality"
                            value={foodRating}
                            onChange={setFoodRating}
                        />

                        <StarRating
                            label="🚚 Delivery Service"
                            value={deliveryRating}
                            onChange={setDeliveryRating}
                        />

                        <StarRating
                            label="⭐ Overall Experience"
                            value={overallRating}
                            onChange={setOverallRating}
                        />

                        <div className="review-comment-group">
                            <label>💬 Comments (Optional)</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Tell us about your experience..."
                                rows={4}
                                maxLength={500}
                            />
                            <small>{comment.length}/500 characters</small>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-block"
                            disabled={submitting || foodRating === 0 || deliveryRating === 0 || overallRating === 0}
                        >
                            {submitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </form>
                )}
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default ReviewOrder;
