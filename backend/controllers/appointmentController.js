const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const mongoose = require('mongoose');

// Create appointment (admin, receptionist)
exports.createAppointment = async (req, res) => {
  try {
    let { patient, doctor, hospitalId, date, time, status, type } = req.body;
    // If patient is booking, use their Patient document id
    if (req.user.role === 'patient') {
      const patientDoc = await Patient.findOne({ user: req.user.id });
      if (!patientDoc) return res.status(404).json({ message: 'Patient record not found' });
      patient = patientDoc._id;
    }
    // Validate doctor belongs to hospital
    const doctorDoc = await Doctor.findById(doctor).populate('user');
    if (!doctorDoc) return res.status(404).json({ message: 'Doctor not found' });
    if (!doctorDoc.user.hospitalId || doctorDoc.user.hospitalId.toString() !== hospitalId) {
      return res.status(400).json({ message: 'Doctor does not belong to selected hospital' });
    }
    const appointment = new Appointment({ patient, doctor, hospitalId, date, time, status, type });
    await appointment.save();
    res.status(201).json({ appointment });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all appointments (admin, receptionist, doctor)
exports.getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('patient')
      .populate({ path: 'doctor', populate: { path: 'user' } })
      .populate('hospitalId');
    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get single appointment (self, admin, receptionist, doctor)
exports.getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate('patient').populate('doctor');
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    // If patient or doctor, only allow self
    if (req.user.role === 'patient' && appointment.patient.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.user.role === 'doctor' && appointment.doctor.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json({ appointment });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update appointment (admin, receptionist)
exports.updateAppointment = async (req, res) => {
  try {
    const { date, time, status, type } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (date) appointment.date = date;
    if (time) appointment.time = time;
    if (status) appointment.status = status;
    if (type) appointment.type = type;
    await appointment.save();
    res.json({ appointment });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete appointment (admin, receptionist)
exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    await appointment.deleteOne();
    res.json({ message: 'Appointment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get appointments for the currently authenticated doctor
exports.getDoctorAppointments = async (req, res) => {
  try {
    console.log('getDoctorAppointments called with user:', req.user);
    
    // Find the doctor document for the current user
    const doctorDoc = await Doctor.findOne({ user: req.user.id });
    console.log('Doctor document found:', doctorDoc);
    
    if (!doctorDoc) return res.status(404).json({ message: 'Doctor not found' });
    
    const appointments = await Appointment.find({ doctor: doctorDoc._id })
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'name email contact'
        }
      })
      .populate({ path: 'doctor', populate: { path: 'user' } })
      .populate('hospitalId')
      .sort({ date: 1, time: 1 });
    
    console.log('Appointments found:', appointments.length);
    res.json({ appointments });
  } catch (err) {
    console.error('Error in getDoctorAppointments:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update appointment by doctor (doctor can update status and notes)
exports.updateAppointmentByDoctor = async (req, res) => {
  try {
    const { status, notes, diagnosis, treatmentProgress } = req.body;
    const appointment = await Appointment.findById(req.params.id).populate('doctor');
    
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    
    // Check if the doctor owns this appointment
    if (appointment.doctor.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update allowed fields
    if (status) appointment.status = status;
    if (notes) appointment.notes = notes;
    if (diagnosis) appointment.diagnosis = diagnosis;
    if (treatmentProgress) appointment.treatmentProgress = treatmentProgress;
    
    await appointment.save();
    
    // Return populated appointment
    const updatedAppointment = await Appointment.findById(appointment._id)
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'name email contact'
        }
      })
      .populate({ path: 'doctor', populate: { path: 'user' } })
      .populate('hospitalId');
    
    res.json({ appointment: updatedAppointment });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get patient appointment history
exports.getPatientHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const appointments = await Appointment.find({ patient: patientId })
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'name email contact'
        }
      })
      .populate({ path: 'doctor', populate: { path: 'user' } })
      .populate('hospitalId')
      .sort({ createdAt: -1 });
    
    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get appointment statistics for doctor
exports.getDoctorStats = async (req, res) => {
  try {
    const doctorDoc = await Doctor.findOne({ user: req.user.id });
    if (!doctorDoc) return res.status(404).json({ message: 'Doctor not found' });
    
    const appointments = await Appointment.find({ doctor: doctorDoc._id });
    const today = new Date().toISOString().slice(0, 10);
    
    const stats = {
      totalAppointments: appointments.length,
      todayAppointments: appointments.filter(a => a.date === today).length,
      upcomingAppointments: appointments.filter(a => {
        const appointmentDate = new Date(`${a.date}T${a.time}`);
        return appointmentDate >= new Date() && !['completed', 'cancelled'].includes(a.status);
      }).length,
      completedAppointments: appointments.filter(a => a.status === 'completed').length,
      cancelledAppointments: appointments.filter(a => a.status === 'cancelled').length,
      pendingAppointments: appointments.filter(a => a.status === 'pending').length,
      appointmentCompletionRate: appointments.length > 0 ? 
        Math.round((appointments.filter(a => a.status === 'completed').length / appointments.length) * 100) : 0
    };
    
    res.json({ stats });
  } catch (err) {
    console.error('Error in getDoctorStats:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Send appointment reminder notification
exports.sendAppointmentReminder = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await Appointment.findById(appointmentId)
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'name email contact'
        }
      })
      .populate({ path: 'doctor', populate: { path: 'user' } });
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Here you would integrate with your notification service
    // For now, we'll just return a success message
    const reminderData = {
      patientName: appointment.patient.user.name,
      patientContact: appointment.patient.user.contact,
      doctorName: appointment.doctor.user.name,
      date: appointment.date,
      time: appointment.time,
      type: appointment.type
    };
    
    // In a real implementation, you would send SMS/Email here
    console.log('Reminder sent:', reminderData);
    
    res.json({ 
      message: 'Reminder sent successfully',
      reminder: reminderData
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};