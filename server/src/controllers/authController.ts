import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import * as authService from '../services/authService.js';
import { syncDefaults } from '../services/businessService.js';
import type { AuthRequest } from '../types/index.js';
import { Otp } from '../models/Otp.js';
import { sendOtpEmail } from '../services/emailService.js';
import { generateOtp, hashOtp, verifyOtp } from '../utils/helpers.js';
import { User } from '../models/User.js';
import bcrypt from 'bcryptjs';

export const register = [
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('phone').optional().isString().withMessage('Invalid phone number'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').optional().isString(),
  body('lastName').optional().isString(),

  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const { email, phone, password, firstName, lastName } = req.body;

      const result = await authService.registerUser({
        email,
        phone,
        password,
        firstName,
        lastName,
      });

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: result,
      });
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message?: string };
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Registration failed',
      });
    }
  },
];

export const employeeRegister = [
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('phone').optional().isString().withMessage('Invalid phone number'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const { email, phone, password } = req.body;

      const result = await authService.employeeRegister({
        email,
        phone,
        password,
      });

      res.status(201).json({
        success: true,
        message: 'Employee registration successful',
        data: result,
      });
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message?: string };
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Registration failed',
      });
    }
  },
];

export const login = [
  body('email').optional().isEmail(),
  body('phone').optional().isString(),
  body('password').notEmpty(),

  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
      }

      const { email, phone, password } = req.body;
      const device = req.headers['user-agent'] || 'unknown';
      const ip = req.ip || '0.0.0.0';

      const result = await authService.loginUser({
        email,
        phone,
        password,
        device,
        ip,
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message?: string };
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Login failed',
      });
    }
  },
];

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ success: false, message: 'Refresh token required' });
      return;
    }

    const result = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      message: 'Token refreshed',
      data: result,
    });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Token refresh failed',
    });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    await authService.logoutUser(req.user._id.toString());

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Logout failed',
    });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    if (req.user.businessId) {
      await syncDefaults(req.user.businessId.toString());
    }

    const user = await authService.getUserProfile(req.user._id.toString());

    res.json({
      success: true,
      data: user,
    });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to get profile',
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { firstName, lastName, avatar, address } = req.body;

    const user = await authService.updateUserProfile(req.user._id.toString(), {
      firstName,
      lastName,
      avatar,
      address,
    });

    res.json({
      success: true,
      message: 'Profile updated',
      data: user,
    });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to update profile',
    });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { oldPassword, newPassword } = req.body;

    const result = await authService.changePassword(
      req.user._id.toString(),
      oldPassword,
      newPassword
    );

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to change password',
    });
  }
};

export const unlockAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const allowedRoles = ['super_admin', 'owner', 'manager'];
    if (!allowedRoles.includes(req.user.role as string)) {
      res.status(403).json({ success: false, message: 'Not authorized to unlock accounts' });
      return;
    }

    const { userId, email, phone } = req.body;
    const result = await authService.unlockAccount({ userId, email, phone });

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Failed to unlock account',
    });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404).json({ success: false, message: 'No account found with this email' });
      return;
    }

    // Generate 6-digit OTP
    const rawOtp = generateOtp(6);
    const hashed = hashOtp(rawOtp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete existing OTPs for this email first
    await Otp.deleteMany({ email: email.toLowerCase() });

    // Save to database
    await Otp.create({
      email: email.toLowerCase(),
      otp: hashed,
      expiresAt,
    });

    // Send the email
    const sent = await sendOtpEmail(email.toLowerCase(), rawOtp);
    if (!sent) {
      res.status(500).json({ success: false, message: 'Failed to send OTP email' });
      return;
    }

    res.json({ success: true, message: 'Verification OTP sent to your email. Valid for 5 minutes.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to process forgot password request' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      res.status(400).json({ success: false, message: 'Email, OTP and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      return;
    }

    const otpDoc = await Otp.findOne({ email: email.toLowerCase() });
    if (!otpDoc) {
      res.status(400).json({ success: false, message: 'OTP expired or not found. Please request a new one.' });
      return;
    }

    // Check expiry
    if (new Date() > otpDoc.expiresAt) {
      await Otp.deleteOne({ _id: otpDoc._id });
      res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
      return;
    }

    // Verify OTP
    const isCorrect = verifyOtp(otp, otpDoc.otp);
    if (!isCorrect) {
      res.status(400).json({ success: false, message: 'Invalid verification OTP' });
      return;
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Update password
    user.password = newPassword; // the pre('save') hook will hash it automatically
    await user.save();

    // Clean up OTP
    await Otp.deleteOne({ _id: otpDoc._id });

    res.json({ success: true, message: 'Password reset successful! You can now log in.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};