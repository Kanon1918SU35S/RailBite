const express = require('express');
const router = express.Router();
const {
    createReview,
    getReviewByOrder,
    getMyReviews,
    getAllReviews,
    getPublicReviews,
    approveReview,
    rejectReview,
    deleteReview,
    getReviewStats
} = require('../controllers/reviewController');
const { protect, admin } = require('../middleware/auth');

// Public route (no auth) — must be before /:id routes
router.get('/public', getPublicReviews);

// Customer routes
router.post('/', protect, createReview);
router.get('/my-reviews', protect, getMyReviews);
router.get('/order/:orderId', protect, getReviewByOrder);

// Admin routes
router.get('/', protect, admin, getAllReviews);
router.get('/stats', protect, admin, getReviewStats);
router.put('/:id/approve', protect, admin, approveReview);
router.put('/:id/reject', protect, admin, rejectReview);
router.delete('/:id', protect, admin, deleteReview);

module.exports = router;
