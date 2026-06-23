const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

// Store OTPs temporarily (in production, use Redis)
const otpStore = {};

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP Email
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    // Check if user exists
    const connection = await pool.getConnection();
    const [users] = await connection.query('SELECT * FROM admin_users WHERE email = ?', [email]);
    connection.release();

    if (users.length === 0) {
      return res.status(404).json({ success: false, error: 'Email not found' });
    }

    const otp = generateOTP();
    otpStore[email] = {
      otp: otp,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes expiry
    };

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: '🔐 PDSCT Library - Login OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #007AFF 0%, #00D4FF 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
            <h1>📚 PDSCT Library</h1>
            <p>Login Verification</p>
          </div>
          <div style="padding: 30px; background: #f5f5f5;">
            <h2>Your OTP Code:</h2>
            <div style="background: white; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
              <h1 style="color: #007AFF; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p style="color: #666;">This OTP is valid for <strong>5 minutes</strong></p>
            <p style="color: #666;">If you didn't request this, please ignore this email.</p>
          </div>
          <div style="background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p>&copy; 2026 Pandit Dev Prabhakar Shashtri College of Technology</p>
          </div>
        </div>
      `
    });

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify OTP and Login
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP are required' });
    }

    // Check OTP
    if (!otpStore[email] || otpStore[email].otp !== otp) {
      return res.status(401).json({ success: false, error: 'Invalid OTP' });
    }

    if (otpStore[email].expiresAt < Date.now()) {
      delete otpStore[email];
      return res.status(401).json({ success: false, error: 'OTP expired' });
    }

    // Get user
    const connection = await pool.getConnection();
    const [users] = await connection.query('SELECT * FROM admin_users WHERE email = ?', [email]);
    connection.release();

    if (users.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: users[0].id, email: users[0].email, role: users[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    delete otpStore[email];

    res.json({
      success: true,
      token: token,
      user: {
        id: users[0].id,
        email: users[0].email,
        username: users[0].username,
        role: users[0].role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
