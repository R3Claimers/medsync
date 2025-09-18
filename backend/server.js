require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import models to register schemas
require('./models/User');
require('./models/Patient');
require('./models/Doctor');
require('./models/Appointment');
require('./models/Prescription');
require('./models/Hospital');
require('./models/ChatSession');
require('./models/Approval');
require('./models/Activity');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!', 
    timestamp: new Date(),
    endpoints: [
      '/api/auth/login',
      '/api/auth/register', 
      '/api/users',
      '/api/approvals',
      '/api/activities',
      '/api/patients',
      '/api/doctors',
      '/api/appointments',
      '/api/prescriptions',
      '/api/hospitals'
    ]
  });
});

// Auth routes
app.use('/api/auth', require('./routes/auth'));

// Patient routes
app.use('/api/patients', require('./routes/patient'));

// Doctor routes
app.use('/api/doctors', require('./routes/doctor'));

// Appointment routes
app.use('/api/appointments', require('./routes/appointment'));

// Prescription routes
app.use('/api/prescriptions', require('./routes/prescription'));

// Hospital routes
app.use('/api/hospitals', require('./routes/hospital'));

// Super-admin routes
app.use('/api/superadmin', require('./routes/superAdmin'));

// User routes
app.use('/api/users', require('./routes/user'));

// AI Chat routes
app.use('/api/ai-chat', require('./routes/aiChat'));

// Approval routes
app.use('/api/approvals', require('./routes/approval'));

// Activity routes
app.use('/api/activities', require('./routes/activity'));

// MongoDB connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/medsync';

console.log('🚀 Starting MedSync Backend Server...');
console.log(`📡 Server will run on port ${PORT}`);
console.log(`📊 MongoDB URI: ${MONGO_URI}`);

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`🎉 Server running on port ${PORT}`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});
