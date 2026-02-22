const Coupon = require('../models/Coupon');
const Order = require('../models/Order');

// ─────────────────────────────────────────────
// POST /api/coupons/validate – Validate & calculate discount for a coupon code
// ─────────────────────────────────────────────
exports.validateCoupon = async (req, res) => {
    try {
        const { code, subtotal, orderType } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, message: 'Coupon code is required' });
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Invalid coupon code' });
        }

        // Check if active
        if (!coupon.isActive) {
            return res.status(400).json({ success: false, message: 'This coupon is no longer active' });
        }

        // Check date validity
        const now = new Date();
        if (now < coupon.validFrom) {
            return res.status(400).json({ success: false, message: 'This coupon is not yet valid' });
        }
        if (now > coupon.validUntil) {
            return res.status(400).json({ success: false, message: 'This coupon has expired' });
        }

        // Check global usage limit
        if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ success: false, message: 'This coupon has reached its usage limit' });
        }

        // Check per-user limit
        const userUsageCount = coupon.usedBy.filter(
            (u) => u.user.toString() === req.user._id.toString()
        ).length;

        if (userUsageCount >= coupon.perUserLimit) {
            return res.status(400).json({ success: false, message: 'You have already used this coupon' });
        }

        // Check minimum order amount
        if (subtotal && subtotal < coupon.minOrderAmount) {
            return res.status(400).json({
                success: false,
                message: `Minimum order amount of ৳${coupon.minOrderAmount} required for this coupon`
            });
        }

        // Check applicable order type
        if (coupon.applicableTo !== 'all' && orderType && coupon.applicableTo !== orderType) {
            return res.status(400).json({
                success: false,
                message: `This coupon is only valid for ${coupon.applicableTo} orders`
            });
        }

        // Calculate discount
        let discount = 0;
        if (coupon.discountType === 'percentage') {
            discount = Math.round((subtotal || 0) * (coupon.discountValue / 100));
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                discount = coupon.maxDiscount;
            }
        } else {
            // flat discount
            discount = coupon.discountValue;
        }

        // Ensure discount doesn't exceed subtotal
        if (subtotal && discount > subtotal) {
            discount = subtotal;
        }

        res.json({
            success: true,
            data: {
                code: coupon.code,
                description: coupon.description,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                maxDiscount: coupon.maxDiscount,
                calculatedDiscount: discount,
                minOrderAmount: coupon.minOrderAmount
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// POST /api/coupons/apply – Apply coupon to an order (mark as used)
// Called internally or after order placement
// ─────────────────────────────────────────────
exports.applyCoupon = async (req, res) => {
    try {
        const { code, orderId } = req.body;

        if (!code || !orderId) {
            return res.status(400).json({ success: false, message: 'code and orderId are required' });
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        // Record usage
        coupon.usedCount += 1;
        coupon.usedBy.push({
            user: req.user._id,
            order: orderId,
            usedAt: new Date()
        });
        await coupon.save();

        res.json({ success: true, message: 'Coupon applied successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────

// GET /api/coupons – Get all coupons (admin)
exports.getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find()
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        // Add computed status
        const now = new Date();
        const data = coupons.map((c) => {
            const couponObj = c.toObject();
            if (!c.isActive) couponObj.computedStatus = 'inactive';
            else if (now < c.validFrom) couponObj.computedStatus = 'scheduled';
            else if (now > c.validUntil) couponObj.computedStatus = 'expired';
            else if (c.usageLimit !== null && c.usedCount >= c.usageLimit) couponObj.computedStatus = 'depleted';
            else couponObj.computedStatus = 'active';
            return couponObj;
        });

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/coupons – Create a new coupon (admin)
exports.createCoupon = async (req, res) => {
    try {
        const {
            code,
            description,
            discountType,
            discountValue,
            minOrderAmount,
            maxDiscount,
            validFrom,
            validUntil,
            usageLimit,
            perUserLimit,
            applicableTo,
            isActive
        } = req.body;

        if (!code || !discountType || discountValue === undefined || !validFrom || !validUntil) {
            return res.status(400).json({
                success: false,
                message: 'code, discountType, discountValue, validFrom, and validUntil are required'
            });
        }

        // Check for duplicate code
        const existing = await Coupon.findOne({ code: code.toUpperCase().trim() });
        if (existing) {
            return res.status(400).json({ success: false, message: 'A coupon with this code already exists' });
        }

        // Validate discount
        if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
            return res.status(400).json({ success: false, message: 'Percentage must be between 0 and 100' });
        }

        const coupon = await Coupon.create({
            code: code.toUpperCase().trim(),
            description,
            discountType,
            discountValue,
            minOrderAmount: minOrderAmount || 0,
            maxDiscount: maxDiscount || null,
            validFrom: new Date(validFrom),
            validUntil: new Date(validUntil),
            usageLimit: usageLimit || null,
            perUserLimit: perUserLimit || 1,
            applicableTo: applicableTo || 'all',
            isActive: isActive !== false,
            createdBy: req.user._id
        });

        res.status(201).json({ success: true, data: coupon });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/coupons/:id – Update a coupon (admin)
exports.updateCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        const allowedFields = [
            'description', 'discountType', 'discountValue', 'minOrderAmount',
            'maxDiscount', 'validFrom', 'validUntil', 'usageLimit',
            'perUserLimit', 'applicableTo', 'isActive'
        ];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                coupon[field] = req.body[field];
            }
        });

        await coupon.save();
        res.json({ success: true, data: coupon });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/coupons/:id – Delete a coupon (admin)
exports.deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }
        res.json({ success: true, message: 'Coupon deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/coupons/stats – Coupon statistics (admin)
exports.getCouponStats = async (req, res) => {
    try {
        const now = new Date();
        const [total, active, expired, totalUsages] = await Promise.all([
            Coupon.countDocuments(),
            Coupon.countDocuments({ isActive: true, validFrom: { $lte: now }, validUntil: { $gte: now } }),
            Coupon.countDocuments({ validUntil: { $lt: now } }),
            Coupon.aggregate([{ $group: { _id: null, total: { $sum: '$usedCount' } } }])
        ]);

        res.json({
            success: true,
            data: {
                totalCoupons: total,
                activeCoupons: active,
                expiredCoupons: expired,
                totalUsages: totalUsages[0]?.total || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
