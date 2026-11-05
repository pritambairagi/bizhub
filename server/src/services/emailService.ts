import nodemailer from 'nodemailer';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'pritamperson@gmail.com',
    pass: process.env.EMAIL_PASS || 'vgkr chra eumu cuso',
  },
});

export const sendOtpEmail = async (email: string, otp: string): Promise<boolean> => {
  try {
    const mailOptions = {
      from: `"BizHub ERP Support" <${process.env.EMAIL_USER || 'pritamperson@gmail.com'}>`,
      to: email,
      subject: 'BizHub Password Reset Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #4f46e5; margin: 0;">BizHub ERP</h2>
            <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0;">Password Reset Verification</p>
          </div>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #f1f5f9;">
            <p style="color: #334155; font-size: 16px; margin-top: 0;">Hello,</p>
            <p style="color: #334155; font-size: 14px; line-height: 1.5;">You requested a password reset for your account on BizHub ERP. Please use the following One-Time Password (OTP) to complete the reset process:</p>
            <div style="text-align: center; margin: 25px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4f46e5; background-color: #e0e7ff; padding: 10px 24px; border-radius: 8px; border: 1px dashed #6366f1;">${otp}</span>
            </div>
            <p style="color: #ef4444; font-size: 13px; font-weight: 500; margin: 0;">⚠️ This verification code is extremely confidential and is valid for exactly 5 minutes.</p>
          </div>
          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 20px;">If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Verification OTP email sent successfully to ${email}. MessageID: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error('Failed to send OTP email:', error);
    return false;
  }
};
