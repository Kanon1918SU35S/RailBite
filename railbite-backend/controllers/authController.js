const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendWelcomeEmail
} = require('../utils/emailService');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check email verification for customers
    if (user.role === 'customer' && !user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in. Check your inbox for the verification link.',
        needsVerification: true,
        email: user.email
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create default admin user if missing
exports.seedAdmin = async (req, res) => {
  try {
    let admin = await User.findOne({ email: 'admin@railbite.com' });
    if (!admin) {
      admin = await User.create({
        name: 'RailBite Admin',
        email: 'admin@railbite.com',
        password: 'admin123',
        role: 'admin'
      });
    }
    res.json({ success: true, admin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required'
      });
    }

    // Only allow customer or delivery registration
    const allowedRoles = ['customer', 'delivery'];
    const userRole = allowedRoles.includes(role) ? role : 'customer';

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    // Create new user
    const user = await User.create({
      name,
      email,
      phone: phone || '',
      password,
      role: userRole,
      status: 'active',
      isEmailVerified: userRole !== 'customer', // Admin/delivery auto-verified
      emailVerificationToken: userRole === 'customer' ? hashedVerificationToken : null,
      emailVerificationExpire: userRole === 'customer' ? Date.now() + 24 * 60 * 60 * 1000 : null
    });

    // If delivery staff, also create DeliveryStaff profile
    if (userRole === 'delivery') {
      const DeliveryStaff = require('../models/DeliveryStaff');
      await DeliveryStaff.create({
        userId: user._id,
        name,
        phone: phone || '',
        status: 'available'
      });
    }

    // Send verification email for customers (non-blocking)
    if (userRole === 'customer') {
      // Fire-and-forget — don't block the HTTP response
      sendVerificationEmail(user, verificationToken).catch(err =>
        console.error('[Register] Failed to send verification email:', err.message)
      );
      return res.status(201).json({
        success: true,
        message: 'Registration successful! Please check your email to verify your account.',
        needsVerification: true,
        email: user.email
      });
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with that email address'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Save hashed token to DB, expire in 1 hour
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour

    await user.save();

    // Send reset email (non-blocking with timeout)
    sendPasswordResetEmail(user, resetToken)
      .then(result => {
        if (!result.success) {
          console.error('[ForgotPassword] Email send failed:', result.error);
        }
      })
      .catch(err => console.error('[ForgotPassword] Email error:', err.message));

    res.json({
      success: true,
      message: 'Password reset link sent to your email.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    // Hash the incoming token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token that hasn't expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;

    await user.save();

    // Send confirmation email (non-blocking)
    sendPasswordChangedEmail(user).catch(err =>
      console.error('[ResetPassword] Failed to send confirmation email:', err.message)
    );

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/verify-email/:token
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification link. Please request a new one.'
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpire = null;
    await user.save();

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user).catch(err =>
      console.error('[VerifyEmail] Failed to send welcome email:', err.message)
    );

    // Auto-login: generate token
    const authToken = generateToken(user._id);

    res.json({
      success: true,
      message: 'Email verified successfully! Your account is now active.',
      token: authToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: true
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/resend-verification
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with that email'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified. You can login.'
      });
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24h
    await user.save();

    // Send verification email (non-blocking)
    sendVerificationEmail(user, verificationToken).catch(err =>
      console.error('[ResendVerification] Email error:', err.message)
    );

    res.json({
      success: true,
      message: 'Verification email sent! Please check your inbox.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
