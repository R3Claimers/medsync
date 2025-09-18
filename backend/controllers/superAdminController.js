const Hospital = require('../models/Hospital');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

function generatePassword(length = 12) {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

// Create transporter function
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

exports.createHospitalAndAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') return res.status(403).json({ message: 'Access denied' });
    const { hospitalName, hospitalAddress, hospitalContact, adminName, adminEmail, adminContact } = req.body;
    if (!hospitalName || !adminName || !adminEmail) return res.status(400).json({ message: 'Missing required fields' });
    
    // Create hospital
    const hospital = new Hospital({ name: hospitalName, address: hospitalAddress, contact: hospitalContact });
    await hospital.save();
    
    // Check if admin user already exists
    let user = await User.findOne({ email: adminEmail });
    if (user) return res.status(400).json({ message: 'Admin user already exists' });
    
    // Generate random password
    const adminPassword = generatePassword();
    
    // Create admin user
    user = new User({ 
      name: adminName, 
      email: adminEmail, 
      password: adminPassword, 
      role: 'admin', 
      contact: adminContact, 
      hospitalId: hospital._id, 
      mustChangePassword: true 
    });
    await user.save();
    
    // Add admin to hospital's admins array
    hospital.admins.push(user._id);
    await hospital.save();
    
    // Send email with credentials
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = createTransporter();
        
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: adminEmail,
          subject: 'Your MedSync Admin Account - Password Change Required',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Welcome to MedSync!</h2>
              <p>Hello <strong>${adminName}</strong>,</p>
              <p>Your admin account has been created for <strong>${hospitalName}</strong>.</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #374151;">Login Credentials:</h3>
                <p><strong>Email:</strong> ${adminEmail}</p>
                <p><strong>Temporary Password:</strong> <code style="background-color: #e5e7eb; padding: 2px 4px; border-radius: 4px;">${adminPassword}</code></p>
              </div>
              
              <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0;"><strong>⚠️ Important:</strong> You must change your password on first login for security purposes.</p>
              </div>
              
              <p>Please log in at: <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="color: #2563eb;">MedSync Login</a></p>
              
              <p>Best regards,<br>The MedSync Team</p>
            </div>
          `
        });
        console.log(`✅ Admin credentials sent to ${adminEmail}`);
      } catch (emailError) {
        console.error('❌ Failed to send email:', emailError.message);
        // Don't fail the whole operation if email fails
      }
    } else {
      console.log(`📧 Email not configured. Admin credentials: ${adminEmail} / ${adminPassword}`);
    }
    
    res.status(201).json({ hospital, admin: user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAllHospitals = async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') return res.status(403).json({ message: 'Access denied' });
    // Populate admins for each hospital using the new admins array
    const hospitals = await Hospital.find().populate('admins', 'name email contact role').lean();
    res.json({ hospitals });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateHospital = async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') return res.status(403).json({ message: 'Access denied' });
    const { id } = req.params;
    const { name, address, contact } = req.body;
    const hospital = await Hospital.findByIdAndUpdate(
      id,
      { name, address, contact },
      { new: true }
    );
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    res.json({ hospital });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteHospital = async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') return res.status(403).json({ message: 'Access denied' });
    const { id } = req.params;
    const hospital = await Hospital.findByIdAndDelete(id);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    // Delete all admins for this hospital
    await User.deleteMany({ hospitalId: id, role: 'admin' });
    res.json({ message: 'Hospital and its admins deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') return res.status(403).json({ message: 'Access denied' });
    const { name, email, hospitalId, contact } = req.body;

    if (!name || !email || !hospitalId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if hospital exists
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    // Check if admin already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Admin user already exists' });
    }

    // Auto-generate password
    const password = generatePassword();

    // Create new admin
    user = new User({
      name,
      email,
      password,
      role: 'admin',
      contact,
      hospitalId,
      mustChangePassword: true
    });
    await user.save();

    // Add admin to hospital's admins array
    hospital.admins.push(user._id);
    await hospital.save();

    // Send email with credentials
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = createTransporter();
        
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: email,
          subject: 'Your MedSync Admin Account - Password Change Required',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Welcome to MedSync!</h2>
              <p>Hello <strong>${name}</strong>,</p>
              <p>Your admin account has been created for <strong>${hospital.name}</strong>.</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #374151;">Login Credentials:</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Temporary Password:</strong> <code style="background-color: #e5e7eb; padding: 2px 4px; border-radius: 4px;">${password}</code></p>
              </div>
              
              <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0;"><strong>⚠️ Important:</strong> You must change your password on first login for security purposes.</p>
              </div>
              
              <p>Please log in at: <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="color: #2563eb;">MedSync Login</a></p>
              
              <p>Best regards,<br>The MedSync Team</p>
            </div>
          `
        });
        console.log(`✅ Admin credentials sent to ${email}`);
      } catch (emailError) {
        console.error('❌ Failed to send email:', emailError.message);
      }
    } else {
      console.log(`📧 Email not configured. Admin credentials: ${email} / ${password}`);
    }

    // Return admin without password
    const adminWithoutPassword = user.toObject();
    delete adminWithoutPassword.password;
    res.status(201).json({ admin: adminWithoutPassword });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') return res.status(403).json({ message: 'Access denied' });
    const { id } = req.params;
    const { name, email, contact } = req.body;

    const admin = await User.findOneAndUpdate(
      { _id: id, role: 'admin' },
      { name, email, contact },
      { new: true }
    ).select('-password');

    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    res.json({ admin });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') return res.status(403).json({ message: 'Access denied' });
    const { id } = req.params;

    const admin = await User.findOneAndDelete({ _id: id, role: 'admin' });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    // Remove admin from hospital's admins array
    await Hospital.updateOne(
      { _id: admin.hospitalId },
      { $pull: { admins: admin._id } }
    );

    res.json({ message: 'Admin deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAdminsByHospital = async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') return res.status(403).json({ message: 'Access denied' });
    const { hospitalId } = req.params;

    const admins = await User.find({ hospitalId, role: 'admin' })
      .select('-password')
      .lean();

    res.json({ admins });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
