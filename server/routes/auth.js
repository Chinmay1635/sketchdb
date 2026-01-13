const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { sendOTPEmail, sendPasswordResetEmail } = require('../utils/email');
const { protect } = require('../middleware/auth');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Verify Turnstile token
const verifyTurnstileToken = async (token) => {
  if (!token) return false;
  
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  
  // If no secret key is configured, skip verification in development
  if (!secretKey) {
    console.warn('TURNSTILE_SECRET_KEY not configured, skipping verification');
    return true;
  }
  
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });
    
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return false;
  }
};

// Validation rules
const signupValidation = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .matches(/@walchandsangli\.ac\.in$/)
    .withMessage('Email must be from @walchandsangli.ac.in domain'),
  body('prn')
    .trim()
    .notEmpty()
    .withMessage('PRN is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', signupValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { username, email, prn, password, turnstileToken } = req.body;

    // Verify Turnstile token
    const isTurnstileValid = await verifyTurnstileToken(turnstileToken);
    if (!isTurnstileValid) {
      return res.status(400).json({
        success: false,
        message: 'CAPTCHA verification failed. Please try again.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }, { prn }]
    });

    if (existingUser) {
      let field = 'User';
      if (existingUser.email === email.toLowerCase()) field = 'Email';
      else if (existingUser.username === username) field = 'Username';
      else if (existingUser.prn === prn) field = 'PRN';

      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      prn,
      password
    });

    // Generate and send OTP
    const otp = user.generateOTP();
    await user.save();

    try {
      await sendOTPEmail(email, otp, username);
    } catch (emailError) {
      // If email fails, still create user but inform them
      console.error('Failed to send OTP email:', emailError);
      return res.status(201).json({
        success: true,
        message: 'Account created but failed to send OTP. Please request a new OTP.',
        userId: user._id
      });
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email for OTP verification.',
      userId: user._id
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during signup'
    });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify email with OTP
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    if (!user.verifyOTP(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Email verified successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        prn: user.prn
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP verification'
    });
  }
});

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP to email
// @access  Public
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    // Generate new OTP
    const otp = user.generateOTP();
    await user.save();

    await sendOTPEmail(email, otp, user.username);

    res.json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { email, password, turnstileToken } = req.body;

    // Verify Turnstile token
    const isTurnstileValid = await verifyTurnstileToken(turnstileToken);
    if (!isTurnstileValid) {
      return res.status(400).json({
        success: false,
        message: 'CAPTCHA verification failed. Please try again.'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if verified
    if (!user.isVerified) {
      // Generate new OTP and send
      const otp = user.generateOTP();
      await user.save();

      try {
        await sendOTPEmail(email, otp, user.username);
      } catch (emailError) {
        console.error('Failed to send OTP:', emailError);
      }

      return res.status(403).json({
        success: false,
        message: 'Email not verified. A new OTP has been sent to your email.',
        requiresVerification: true
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        prn: user.prn
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists
      return res.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset code.'
      });
    }

    const otp = user.generateOTP();
    await user.save();

    await sendPasswordResetEmail(email, otp, user.username);

    res.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset code.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with OTP
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request'
      });
    }

    if (!user.verifyOTP(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    user.password = newPassword;
    user.otp = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      prn: req.user.prn,
      createdAt: req.user.createdAt
    }
  });
});

module.exports = router;
