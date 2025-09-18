const User = require('../models/User');
const Doctor = require('../models/Doctor');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

function generatePassword(length = 12) {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

exports.createUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    const { name, email, role, contact, specialty, department } = req.body;
    let hospitalId = req.user.hospitalId;
    if (!name || !email || !role) return res.status(400).json({ message: 'Missing required fields' });
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });
    const password = generatePassword();
    user = new User({ name, email, password, role, contact, hospitalId, mustChangePassword: true });
    await user.save();
    let extra = {};
    if (role === 'doctor') {
      const doctor = new Doctor({ user: user._id, specialty, department });
      await doctor.save();
      extra.doctor = doctor;
    }
    
    // Send email with credentials for non-patient roles (excluding super-admin)
    let emailSent = false;
    if (role !== 'patient' && role !== 'super-admin') {
      // Only attempt to send email if SMTP credentials are configured
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
            timeout: 10000, // 10 second timeout
          });
          
          await transporter.sendMail({
            from: process.env.SMTP_USER || 'no-reply@medsync.com',
            to: email,
            subject: 'Your MedSync Account - Login Credentials',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
                  <h1 style="color: white; margin: 0;">MedSync</h1>
                  <p style="color: white; margin: 5px 0;">Healthcare Management System</p>
                </div>
                <div style="padding: 30px; background: #f9f9f9;">
                  <h2 style="color: #333;">Welcome to MedSync!</h2>
                  <p style="color: #666; line-height: 1.6;">
                    Hello ${name},<br><br>
                    Your ${role} account has been successfully created. Here are your login credentials:
                  </p>
                  <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
                    <p style="margin: 10px 0;"><strong>Password:</strong> ${password}</p>
                    <p style="margin: 10px 0;"><strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
                  </div>
                  <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="color: #856404; margin: 0;">
                      <strong>Important:</strong> Please log in and change your password immediately for security purposes.
                    </p>
                  </div>
                  <p style="color: #666; line-height: 1.6;">
                    You can access your dashboard at: <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="color: #667eea;">MedSync Login</a>
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
          emailSent = true;
          console.log(`Credentials email sent to ${email}`);
        } catch (emailError) {
          console.error('Failed to send credentials email:', emailError.message);
          // Continue without failing the user creation
          emailSent = false;
        }
      } else {
        console.log('SMTP not configured. Account created:', email, password);
      }
    } else {
      console.log('Account created:', email, password);
    }

    res.status(201).json({ 
      user, 
      ...extra,
      message: 'User created successfully',
      emailSent: emailSent || false
    });
  } catch (err) {
    console.error('Error creating user:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.password = password;
    user.mustChangePassword = false;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    const { userId } = req.params;
    const { name, email, role, contact } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (contact) user.contact = contact;
    await user.save();
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    const users = await User.find({
      hospitalId: req.user.hospitalId,
      role: { $nin: ['super-admin', 'admin'] }
    }, '-password'); // Exclude password field
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    const { userId } = req.params;
    const user = await User.findOne({ _id: userId, hospitalId: req.user.hospitalId, role: { $nin: ['super-admin', 'admin'] } });
    if (!user) return res.status(404).json({ message: 'User not found or cannot be deleted' });
    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.toggleUserActive = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    const { userId } = req.params;
    const user = await User.findOne({ _id: userId, hospitalId: req.user.hospitalId, role: { $nin: ['super-admin', 'admin'] } });
    if (!user) return res.status(404).json({ message: 'User not found or cannot be updated' });
    user.active = !user.active;
    await user.save();
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
