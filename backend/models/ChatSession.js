const mongoose = require('mongoose');

const ChatSessionSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  sessionId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  messages: [{
    role: { 
      type: String, 
      enum: ['user', 'assistant'], 
      required: true 
    },
    content: { 
      type: String, 
      required: true 
    },
    timestamp: { 
      type: Date, 
      default: Date.now 
    },
    metadata: {
      messageId: String,
      model: String,
      tokensUsed: Number,
      responseTime: Number
    }
  }],
  context: {
    userRole: { 
      type: String, 
      enum: ['patient', 'doctor', 'admin', 'receptionist', 'pharmacist'] 
    },
    hospitalId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Hospital' 
    },
    patientId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Patient' 
    },
    doctorId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Doctor' 
    },
    sessionType: { 
      type: String, 
      enum: ['general', 'symptom_check', 'medication_info', 'appointment_help', 'emergency'], 
      default: 'general' 
    }
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastActivity: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true 
});

// Index for efficient queries
ChatSessionSchema.index({ user: 1, sessionId: 1 });
ChatSessionSchema.index({ user: 1, isActive: 1, lastActivity: -1 });

// Auto-expire inactive sessions after 24 hours
ChatSessionSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('ChatSession', ChatSessionSchema);
