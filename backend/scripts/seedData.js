const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models  
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');

async function seedRealIndianData() {
  try {
    console.log('🇮🇳 Seeding Realistic Indian Healthcare Data\n');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medsync');
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data (except super admin)
    await User.deleteMany({ role: { $ne: 'super-admin' } });
    await Doctor.deleteMany({});
    await Patient.deleteMany({});
    await Appointment.deleteMany({});
    await Prescription.deleteMany({});
    console.log('✅ Cleared existing data');

    // Get existing hospitals (already created)
    const hospitals = await Hospital.find();
    console.log(`✅ Found ${hospitals.length} hospitals`);

    // Create doctors (10 per hospital)
    console.log('👨‍⚕️ Creating doctors...');
    const doctors = [];
    const specialties = ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Oncology', 'Gastroenterology'];
    
    const doctorNames = [
      'Dr. Rajesh Kumar', 'Dr. Priya Sharma', 'Dr. Arun Patel', 'Dr. Sunita Singh', 'Dr. Vikram Gupta',
      'Dr. Kavita Reddy', 'Dr. Suresh Nair', 'Dr. Meera Joshi', 'Dr. Ravi Chandra', 'Dr. Anjali Verma'
    ];

    for (let hospitalIndex = 0; hospitalIndex < hospitals.length; hospitalIndex++) {
      const hospital = hospitals[hospitalIndex];
      
      for (let i = 0; i < 10; i++) {
        const name = doctorNames[i];
        const email = `${name.toLowerCase().replace('dr. ', '').replace(' ', '')}${hospitalIndex + 1}@medsync.in`;
        
        // Create user
        const doctorUser = new User({
          name: name,
          email: email,
          password: await bcrypt.hash('doctor123', 10),
          role: 'doctor',
          contact: `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`,
          hospitalId: hospital._id,
          isVerified: true
        });
        await doctorUser.save();

        // Create doctor profile
        const doctor = new Doctor({
          user: doctorUser._id,
          specialty: specialties[i % specialties.length],
          department: specialties[i % specialties.length] // Use specialty as department
        });
        await doctor.save();
        doctors.push(doctor);
      }
    }
    console.log(`✅ Created ${doctors.length} doctors`);

    // Create patients
    console.log('👥 Creating patients...');
    const patients = [];
    const patientNames = [
      { name: 'Ramesh Kumar', age: 45, gender: 'male' },
      { name: 'Sunita Devi', age: 38, gender: 'female' },
      { name: 'Amit Sharma', age: 32, gender: 'male' },
      { name: 'Priya Singh', age: 29, gender: 'female' },
      { name: 'Vijay Patel', age: 52, gender: 'male' },
      { name: 'Rekha Gupta', age: 41, gender: 'female' },
      { name: 'Suresh Reddy', age: 48, gender: 'male' },
      { name: 'Kavita Joshi', age: 35, gender: 'female' },
      { name: 'Ravi Nair', age: 39, gender: 'male' },
      { name: 'Meera Verma', age: 33, gender: 'female' },
      { name: 'Ajay Agarwal', age: 44, gender: 'male' },
      { name: 'Pooja Malhotra', age: 31, gender: 'female' },
      { name: 'Deepak Yadav', age: 50, gender: 'male' },
      { name: 'Sushma Tiwari', age: 42, gender: 'female' },
      { name: 'Manoj Chopra', age: 36, gender: 'male' }
    ];

    for (let i = 0; i < 50; i++) { 
      const nameTemplate = patientNames[i % patientNames.length];
      const email = `${nameTemplate.name.toLowerCase().replace(' ', '')}${i + 1}@gmail.com`;
      
      // Create user
      const patientUser = new User({
        name: nameTemplate.name,
        email: email,
        password: await bcrypt.hash('patient123', 10),
        role: 'patient',
        contact: `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        age: nameTemplate.age + Math.floor(Math.random() * 10) - 5, // Vary age by ±5 years
        gender: nameTemplate.gender,
        isVerified: true
      });
      await patientUser.save();

      // Create patient profile
      const patient = new Patient({
        user: patientUser._id,
        healthSummary: {
          bloodPressure: `${Math.floor(Math.random() * 40) + 110}/${Math.floor(Math.random() * 20) + 70}`,
          weight: `${Math.floor(Math.random() * 30) + 50}kg`,
          glucose: `${Math.floor(Math.random() * 50) + 80}mg/dL`,
          heartRate: `${Math.floor(Math.random() * 20) + 70}bpm`
        }
      });
      await patient.save();
      patients.push(patient);
    }
    console.log(`✅ Created ${patients.length} patients`);

    // Create appointments
    console.log('📅 Creating appointments...');
    const appointments = [];
    const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    const types = ['Consultation', 'Follow-up', 'Check-up', 'Emergency'];
    
    for (let i = 0; i < 100; i++) {
      const patient = patients[Math.floor(Math.random() * patients.length)];
      const doctor = doctors[Math.floor(Math.random() * doctors.length)];
      const hospital = hospitals[Math.floor(Math.random() * hospitals.length)];
      
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + Math.floor(Math.random() * 30) - 10);
      
      const appointment = new Appointment({
        patient: patient._id,
        doctor: doctor._id,
        hospitalId: hospital._id,
        date: appointmentDate.toISOString().split('T')[0],
        time: ['09:00', '10:00', '11:00', '14:00', '15:00'][Math.floor(Math.random() * 5)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        type: types[Math.floor(Math.random() * types.length)],
        patientNotes: 'Regular checkup and consultation',
        notes: 'Appointment scheduled'
      });
      await appointment.save();
      appointments.push(appointment);
    }
    console.log(`✅ Created ${appointments.length} appointments`);

    // Create prescriptions
    console.log('💊 Creating prescriptions...');
    const medicines = [
      { name: 'Paracetamol', dosage: '650mg' },
      { name: 'Amoxicillin', dosage: '500mg' },
      { name: 'Metformin', dosage: '500mg' },
      { name: 'Amlodipine', dosage: '5mg' },
      { name: 'Omeprazole', dosage: '20mg' }
    ];

    const completedAppointments = appointments.filter(apt => apt.status === 'completed');
    
    for (let i = 0; i < Math.min(completedAppointments.length, 50); i++) {
      const appointment = completedAppointments[i];
      
      const medications = [];
      const numMeds = Math.floor(Math.random() * 3) + 2; // 2-4 medicines
      
      for (let j = 0; j < numMeds; j++) {
        const medicine = medicines[Math.floor(Math.random() * medicines.length)];
        medications.push({
          name: medicine.name,
          quantity: Math.floor(Math.random() * 20) + 10,
          dosage: medicine.dosage,
          frequency: 'Twice daily',
          timing: ['Morning', 'Evening'],
          duration: '7 days',
          food: 'After meals',
          instructions: 'Complete the course as prescribed'
        });
      }

      const prescription = new Prescription({
        patient: appointment.patient,
        doctor: appointment.doctor,
        hospitalId: appointment.hospitalId,
        date: appointment.date,
        medications: medications,
        status: 'active'
      });
      await prescription.save();
    }
    console.log(`✅ Created prescriptions`);

    // Final count
    const finalCounts = {
      hospitals: await Hospital.countDocuments(),
      doctors: await Doctor.countDocuments(),
      patients: await Patient.countDocuments(),
      appointments: await Appointment.countDocuments(),
      prescriptions: await Prescription.countDocuments(),
      users: await User.countDocuments()
    };

    console.log('\n🎉 Indian Healthcare Data Seeded Successfully!');
    console.log('================================================');
    console.log(`🏥 Hospitals: ${finalCounts.hospitals}`);
    console.log(`👨‍⚕️ Doctors: ${finalCounts.doctors}`);
    console.log(`👥 Patients: ${finalCounts.patients}`);
    console.log(`📅 Appointments: ${finalCounts.appointments}`);
    console.log(`💊 Prescriptions: ${finalCounts.prescriptions}`);
    console.log(`👤 Total Users: ${finalCounts.users}`);
    
    console.log('\n🔑 Login Credentials:');
    console.log('========================');
    console.log('🚀 Super Admin: superadmin@test.com / password123');
    console.log('👨‍⚕️ Sample Doctor: rajeshkumar1@medsync.in / doctor123');
    console.log('👥 Sample Patient: rameshkumar1@gmail.com / patient123');
    console.log('\n✨ Your system is ready for screenshots!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

seedRealIndianData();
