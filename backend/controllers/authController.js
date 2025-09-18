const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Generate random password
function generatePassword(length = 12) {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, contact } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });
    user = new User({ name, email, password, role, contact });
    await user.save();
    // If registering a doctor, also create a Doctor document
    if (role === 'doctor') {
      const Doctor = require('../models/Doctor');
      const specialty = req.body.specialty || '';
      const department = req.body.department || '';
      await new Doctor({ user: user._id, specialty, department }).save();
    }
    // If registering a patient, also create a Patient document
    if (role === 'patient') {
      const Patient = require('../models/Patient');
      await new Patient({ user: user._id, healthSummary: {} }).save();
    }
    // Add hospitalId to token if present
    const tokenPayload = { id: user._id, role: user.role, name: user.name, email: user.email, mustChangePassword: user.mustChangePassword };
    if (user.hospitalId) tokenPayload.hospitalId = user.hospitalId;
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        hospitalId: user.hospitalId,
        mustChangePassword: user.mustChangePassword
      } 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    // Add hospitalId to token if present
    const tokenPayload = { id: user._id, role: user.role, name: user.name, email: user.email, mustChangePassword: user.mustChangePassword };
    if (user.hospitalId) tokenPayload.hospitalId = user.hospitalId;
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        hospitalId: user.hospitalId,
        mustChangePassword: user.mustChangePassword 
      } 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 

// Create doctor with auto-generated password and email notification
exports.createDoctorWithEmail = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { name, email, contact, specialty, department } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Check if user already exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Generate random password
    const generatedPassword = generatePassword();

    // Create user with generated password and mustChangePassword flag
    const user = new User({
      name,
      email,
      password: generatedPassword,
      role: 'doctor',
      contact: contact || '',
      hospitalId: req.user.hospitalId,
      mustChangePassword: true
    });

    await user.save();

    // Create Doctor document
    const Doctor = require('../models/Doctor');
    await new Doctor({
      user: user._id,
      specialty: specialty || '',
      department: department || ''
    }).save();

    // Get hospital information for email
    const Hospital = require('../models/Hospital');
    const hospital = await Hospital.findById(req.user.hospitalId);

    // Send email with credentials if SMTP is configured
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = createTransporter();

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #2563eb; margin: 0;">Welcome to MedSync!</h2>
              <p style="color: #666; margin-top: 5px;">Your Doctor Account</p>
            </div>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h3 style="color: #1e40af; margin-top: 0;">Hello Dr. ${name},</h3>
              <p style="color: #374151; line-height: 1.6;">
                Your doctor account has been created for <strong>${hospital?.name || 'the hospital'}</strong>. 
                You can now access the MedSync system using the credentials below.
              </p>
            </div>

            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 25px;">
              <h4 style="color: #92400e; margin-top: 0;">⚠️ Important Security Notice</h4>
              <p style="color: #78350f; margin-bottom: 0;">
                You must change your password on first login for security purposes.
              </p>
            </div>

            <div style="background-color: #ffffff; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h4 style="color: #374151; margin-top: 0;">Your Login Credentials:</h4>
              <p style="margin: 10px 0;"><strong>Email:</strong> <code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${email}</code></p>
              <p style="margin: 10px 0;"><strong>Temporary Password:</strong> <code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${generatedPassword}</code></p>
              <p style="margin: 10px 0;"><strong>Role:</strong> Doctor</p>
              ${specialty ? `<p style="margin: 10px 0;"><strong>Specialty:</strong> ${specialty}</p>` : ''}
            </div>

            <div style="text-align: center; margin-bottom: 25px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" 
                 style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Login to MedSync
              </a>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                This is an automated message from MedSync Hospital Management System.<br>
                Please do not reply to this email.
              </p>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: email,
          subject: `Welcome to MedSync - Your Doctor Account at ${hospital?.name || 'Hospital'}`,
          html: emailHtml
        });

        console.log(`Welcome email sent successfully to ${email}`);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(201).json({
      message: 'Doctor created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        contact: user.contact,
        hospitalId: user.hospitalId,
        mustChangePassword: user.mustChangePassword
      },
      emailSent: !!(process.env.SMTP_USER && process.env.SMTP_PASS)
    });

  } catch (err) {
    console.error('Error creating doctor:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create nodemailer transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email address' });
    }

    // Check if user is super-admin (not allowed)
    if (user.role === 'super-admin') {
      return res.status(403).json({ message: 'Password reset not available for super admin' });
    }

    // Generate OTP and set expiration (10 minutes)
    const otp = generateOTP();
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Send OTP via email
    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: process.env.SMTP_USER || 'no-reply@medsync.com',
        to: email,
        subject: 'MedSync - Password Reset OTP',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">MedSync</h1>
              <p style="color: white; margin: 5px 0;">Healthcare Management System</p>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #333;">Password Reset Request</h2>
              <p style="color: #666; line-height: 1.6;">
                Hello ${user.name},<br><br>
                You requested a password reset for your MedSync account. Use the following OTP to reset your password:
              </p>
              <div style="background: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h1 style="color: #667eea; font-size: 36px; margin: 0; letter-spacing: 4px;">${otp}</h1>
                <p style="color: #999; margin: 10px 0 0 0;">This OTP will expire in 10 minutes</p>
              </div>
              <p style="color: #666; line-height: 1.6;">
                If you didn't request this password reset, please ignore this email or contact support if you have concerns.
              </p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="color: #999; font-size: 12px;">
                  This is an automated message from MedSync. Please do not reply to this email.
                </p>
              </div>
            </div>
          </div>
        `,
      });

      res.json({ 
        message: 'Password reset OTP sent to your email address',
        email: email 
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Reset OTP fields if email fails
      user.resetPasswordOTP = undefined;
      user.resetPasswordOTPExpires = undefined;
      await user.save();
      
      res.status(500).json({ 
        message: 'Failed to send reset email. Please try again later.',
        error: 'Email service unavailable'
      });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const user = await User.findOne({ 
      email,
      resetPasswordOTP: otp,
      resetPasswordOTPExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Update password and clear OTP fields
    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    user.mustChangePassword = false;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ 
      email,
      resetPasswordOTP: otp,
      resetPasswordOTPExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    res.json({ message: 'OTP verified successfully', valid: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password and clear mustChangePassword flag
    user.password = newPassword; // Will be hashed by pre-save hook
    user.mustChangePassword = false;
    await user.save();

    // Generate new token with updated mustChangePassword status
    const tokenPayload = { id: user._id, role: user.role, name: user.name, email: user.email, mustChangePassword: false };
    if (user.hospitalId) tokenPayload.hospitalId = user.hospitalId;
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      message: 'Password changed successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hospitalId: user.hospitalId,
        mustChangePassword: false
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};