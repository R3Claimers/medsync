import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, FileText, Pill, Activity, Stethoscope, LogOut, RotateCcw, Bot } from 'lucide-react';
import { request } from '../lib/api';
import { useAuth } from '../lib/authContext';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormItem, FormLabel, FormControl, FormField, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import NewConsultationModal from '../components/NewConsultationModal';
import AIChatModal from '../components/AIChatModal';
import { generatePrescriptionPDF } from '@/lib/prescriptionPdf';
import { formatDateDMY } from '@/lib/utils';

const DoctorDashboard = () => {
  // All hooks at the top
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [doctor, setDoctor] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});

  // Helper function to format health summary
  const formatHealthSummary = (healthSummary: any) => {
    if (!healthSummary) return 'No health summary available';
    if (typeof healthSummary === 'string') return healthSummary;
    if (typeof healthSummary === 'object') {
      const parts = [];
      if (healthSummary.bloodPressure) parts.push(`BP: ${healthSummary.bloodPressure}`);
      if (healthSummary.weight) parts.push(`Weight: ${healthSummary.weight}`);
      if (healthSummary.glucose) parts.push(`Glucose: ${healthSummary.glucose}`);
      if (healthSummary.heartRate) parts.push(`HR: ${healthSummary.heartRate}`);
      return parts.length > 0 ? parts.join(', ') : 'No health data';
    }
    return 'No health summary available';
  };

  const [showConsultModal, setShowConsultModal] = useState(false);
  const [showPrescriptionsModal, setShowPrescriptionsModal] = useState(false);
  const [consultForm, setConsultForm] = useState({
    patient: '',
    date: '',
    time: '',
    type: 'Consultation',
    notes: '',
  });
  const [consultStep, setConsultStep] = useState(1);
  const [selectedPendingAppointment, setSelectedPendingAppointment] = useState<any>(null);
  const [newPatientForm, setNewPatientForm] = useState({ name: '', contact: '', email: '' });
  const [consultPatientType, setConsultPatientType] = useState<'pending' | 'existing' | 'new'>('pending');
  const [consultDetails, setConsultDetails] = useState({ diagnosis: '', notes: '', medicines: [{ name: '', dosage: '', duration: '' }] });
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [prescriptionsError, setPrescriptionsError] = useState('');
  const [prescriptionSearch, setPrescriptionSearch] = useState('');
  const [showCreatePrescription, setShowCreatePrescription] = useState(false);
  const [createPrescriptionLoading, setCreatePrescriptionLoading] = useState(false);
  const [createPrescriptionError, setCreatePrescriptionError] = useState('');
  const [createPrescriptionSuccess, setCreatePrescriptionSuccess] = useState('');
  const [createPrescriptionForm, setCreatePrescriptionForm] = useState({
    patient: '',
    medication: '',
    quantity: '',
    date: '',
    status: 'pending',
  });
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentUpdateLoading, setAppointmentUpdateLoading] = useState(false);
  const [appointmentUpdateError, setAppointmentUpdateError] = useState('');
  const [appointmentUpdateSuccess, setAppointmentUpdateSuccess] = useState('');
  const [appointmentForm, setAppointmentForm] = useState({
    status: '',
    notes: '',
    diagnosis: '',
    treatmentProgress: {
      status: 'not-started',
      progressNotes: '',
      followUpDate: ''
    }
  });
  const [appointmentFilter, setAppointmentFilter] = useState('upcoming');
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showPatientDetailModal, setShowPatientDetailModal] = useState(false);
  const [showPatientHistoryModal, setShowPatientHistoryModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [patientHistory, setPatientHistory] = useState<any[]>([]);
  const [patientHistoryLoading, setPatientHistoryLoading] = useState(false);
  // Add state for Medical Records modal (move above all useEffect)
  const [showMedicalRecordsModal, setShowMedicalRecordsModal] = useState(false);
  const [selectedMedicalRecordsPatient, setSelectedMedicalRecordsPatient] = useState<any>(null);
  // Add state for Medical Records search
  const [medicalRecordsSearch, setMedicalRecordsSearch] = useState('');
  // Add state for loading/error in modal
  const [medicalRecordsLoading, setMedicalRecordsLoading] = useState(false);
  const [medicalRecordsError, setMedicalRecordsError] = useState('');

  // Add state for multi-step modal
  const [selectedExistingPatient, setSelectedExistingPatient] = useState<any>(null);

  // Add state for consultation details in Step 2
  const [consultLoading, setConsultLoading] = useState(false);
  const [consultError, setConsultError] = useState('');
  const [consultSuccess, setConsultSuccess] = useState('');

  // Add a function to refresh appointments and patients
  const refreshAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const doctorRes = await request(`/doctors/by-user/${user?.id}`);
      setDoctor(doctorRes.doctor);
      const apptRes = await request('/appointments/doctor');
      setAppointments(apptRes.appointments);
      const patientRes = await request('/patients');
      // Only show patients related to this doctor
      const doctorPatientIds = new Set(apptRes.appointments.map((a: any) => a.patient && (a.patient._id || a.patient.id)));
      const myPatients = patientRes.patients.filter((p: any) => doctorPatientIds.has(p._id || p.id));
      setPatients(myPatients);
      // Fetch prescriptions for this doctor
      const prescriptionsRes = await request('/prescriptions');
      const myPrescriptions = prescriptionsRes.prescriptions.filter((p: any) => {
        return p.doctor && (p.doctor._id === doctorRes.doctor._id || p.doctor.id === doctorRes.doctor._id);
      });
      setPrescriptions(myPrescriptions);
      const today = new Date().toISOString().slice(0, 10);
      const todayAppointments = apptRes.appointments.filter((a: any) => a.date === today);
      const upcomingAppointments = apptRes.appointments.filter((a: any) => {
        const appointmentDate = new Date(`${a.date}T${a.time}`);
        return appointmentDate >= new Date() && a.status !== 'completed' && a.status !== 'cancelled';
      });
      const completedAppointments = apptRes.appointments.filter((a: any) => a.status === 'completed');
      const cancelledAppointments = apptRes.appointments.filter((a: any) => a.status === 'cancelled');
      setStats({
        todayAppointments: todayAppointments.length,
        pendingReports: 0,
        totalPatients: myPatients.length,
        // Additional analytics
        upcomingAppointments: upcomingAppointments.length,
        completedAppointments: completedAppointments.length,
        cancelledAppointments: cancelledAppointments.length,
        appointmentCompletionRate: apptRes.appointments.length > 0 ? 
          Math.round((completedAppointments.length / apptRes.appointments.length) * 100) : 0,
        totalAppointments: apptRes.appointments.length
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // All useMemo, useCallback, useRef, useEffect hooks here
  // In the filteredPrescriptions useMemo, sort by date descending (most recent first)
  const filteredPrescriptions = useMemo(() => {
    let filtered = prescriptions;
    if (prescriptionSearch) {
      filtered = prescriptions.filter((p: any) => {
        const patientName = p.patient?.user?.name || p.patient?.name || '';
        return (
          patientName.toLowerCase().includes(prescriptionSearch.toLowerCase()) ||
          p.medication.toLowerCase().includes(prescriptionSearch.toLowerCase())
        );
      });
    }
    // Sort by date descending (most recent first)
    return filtered.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [prescriptions, prescriptionSearch]);

  const filteredAppointments = useMemo(() => {
    let filtered = appointments;
    if (appointmentFilter === 'upcoming') {
      filtered = filtered.filter(apt => {
        const appointmentDate = new Date(`${apt.date}T${apt.time}`);
        return appointmentDate >= new Date() && apt.status !== 'completed' && apt.status !== 'cancelled';
      });
    } else if (appointmentFilter === 'completed') {
      filtered = filtered.filter(apt => apt.status === 'completed');
    } else if (appointmentFilter === 'today') {
      const today = new Date().toISOString().slice(0, 10);
      filtered = filtered.filter(apt => apt.date === today);
    }
    if (appointmentSearch) {
      filtered = filtered.filter(apt => {
        const patientName = apt.patient?.user?.name || '';
        const appointmentType = apt.type || '';
        const searchTerm = appointmentSearch.toLowerCase();
        return (
          patientName.toLowerCase().includes(searchTerm) ||
          appointmentType.toLowerCase().includes(searchTerm)
        );
      });
    }
    return filtered.sort((a, b) => {
      const aDateTime = new Date(`${a.date}T${a.time}`);
      const bDateTime = new Date(`${b.date}T${b.time}`);
      return aDateTime.getTime() - bDateTime.getTime();
    });
  }, [appointments, appointmentFilter, appointmentSearch]);

  useEffect(() => {
    if (user?.role === 'doctor') refreshAppointments();
  }, [user]);

  // Refined: Reset selected patient when closing modal
  useEffect(() => {
    if (!showMedicalRecordsModal) {
      setSelectedMedicalRecordsPatient(null);
      setMedicalRecordsError('');
    }
  }, [showMedicalRecordsModal]);

  // Add state for search results
  const [medicalRecordsPatientResults, setMedicalRecordsPatientResults] = useState<any[]>([]);

  // Update patient search results when search or patients change
  useEffect(() => {
    if (!medicalRecordsSearch) {
      setMedicalRecordsPatientResults(patients);
    } else {
      setMedicalRecordsPatientResults(
        patients.filter((p: any) => {
          const name = p.name || p.user?.name || '';
          const email = p.user?.email || '';
          return (
            name.toLowerCase().includes(medicalRecordsSearch.toLowerCase()) ||
            email.toLowerCase().includes(medicalRecordsSearch.toLowerCase())
          );
        })
      );
    }
  }, [medicalRecordsSearch, patients]);

  // Place loading and error returns AFTER all hooks
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading doctor dashboard...</p>
      </div>
    </div>
  );
  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-500 text-lg mb-4">Error loading dashboard</div>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={refreshAppointments} variant="outline">
          Try Again
        </Button>
      </div>
    </div>
  );

  // Helper for patient options
  const patientOptions = patients.map((p: any) => ({
    value: p._id || p.id,
    label: p.name || (p.user && p.user.name) || 'Patient',
  }));

  // Handle form changes
  const handleConsultChange = (field: string, value: string) => {
    setConsultForm((prev) => ({ ...prev, [field]: value }));
  };

  // Handle form submit
  const handleConsultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConsultLoading(true);
    setConsultError('');
    setConsultSuccess('');
    try {
      if (!consultForm.patient || !consultForm.date || !consultForm.time) {
        setConsultError('Please fill all required fields.');
        setConsultLoading(false);
        return;
      }
      // Find patient object for hospitalId
      const patientObj = patients.find((p: any) => (p._id || p.id) === consultForm.patient);
      const hospitalId = doctor && doctor.user && doctor.user.hospitalId ? doctor.user.hospitalId : '';
      const payload = {
        patient: consultForm.patient,
        doctor: doctor._id || doctor.id,
        hospitalId,
        date: consultForm.date,
        time: consultForm.time,
        status: 'confirmed',
        type: consultForm.type,
        notes: consultForm.notes,
      };
      await request('/appointments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setConsultSuccess('Consultation created successfully!');
      setShowConsultModal(false);
      await refreshAppointments(); // Auto-refresh after booking
    } catch (err: any) {
      setConsultError(err.message || 'Failed to create consultation.');
    } finally {
      setConsultLoading(false);
    }
  };

  // Handle appointment update
  const handleAppointmentUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppointmentUpdateLoading(true);
    setAppointmentUpdateError('');
    setAppointmentUpdateSuccess('');
    
    try {
      const response = await request(`/appointments/doctor/${selectedAppointment._id}`, {
        method: 'PUT',
        body: JSON.stringify(appointmentForm)
      });
      
      setAppointmentUpdateSuccess('Appointment updated successfully!');
      setShowAppointmentModal(false);
      
      // Update the appointment in local state
      setAppointments(appointments.map(apt => 
        apt._id === selectedAppointment._id ? response.appointment : apt
      ));
      
      // Reset form
      setAppointmentForm({
        status: '',
        notes: '',
        diagnosis: '',
        treatmentProgress: {
          status: 'not-started',
          progressNotes: '',
          followUpDate: ''
        }
      });
      
    } catch (err: any) {
      setAppointmentUpdateError(err.message || 'Failed to update appointment');
    } finally {
      setAppointmentUpdateLoading(false);
    }
  };

  // Handle appointment selection
  const handleAppointmentSelect = (appointment: any) => {
    setSelectedAppointment(appointment);
    setAppointmentForm({
      status: appointment.status || '',
      notes: appointment.notes || '',
      diagnosis: appointment.diagnosis || '',
      treatmentProgress: {
        status: appointment.treatmentProgress?.status || 'not-started',
        progressNotes: appointment.treatmentProgress?.progressNotes || '',
        followUpDate: appointment.treatmentProgress?.followUpDate || ''
      }
    });
    setShowAppointmentModal(true);
  };

  // Handle patient history view
  const handlePatientHistoryView = async (patient: any) => {
    setSelectedPatient(patient);
    setShowPatientHistoryModal(true);
    setPatientHistoryLoading(true);
    
    try {
      const response = await request(`/appointments/patient/${patient._id}/history`);
      setPatientHistory(response.appointments);
    } catch (err: any) {
      console.error('Failed to fetch patient history:', err);
      setPatientHistory([]);
    } finally {
      setPatientHistoryLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCreatePrescriptionChange = (field: string, value: string) => {
    setCreatePrescriptionForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreatePrescriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatePrescriptionLoading(true);
    setCreatePrescriptionError('');
    setCreatePrescriptionSuccess('');
    try {
      if (!createPrescriptionForm.patient || !createPrescriptionForm.medication || !createPrescriptionForm.quantity || !createPrescriptionForm.date) {
        setCreatePrescriptionError('Please fill all required fields.');
        setCreatePrescriptionLoading(false);
        return;
      }
      const hospitalId = doctor && doctor.user && doctor.user.hospitalId ? doctor.user.hospitalId : '';
      const payload = {
        patient: createPrescriptionForm.patient,
        doctor: doctor._id || doctor.id,
        hospitalId,
        medication: createPrescriptionForm.medication,
        quantity: Number(createPrescriptionForm.quantity),
        date: createPrescriptionForm.date,
        status: createPrescriptionForm.status,
      };
      await request('/prescriptions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setCreatePrescriptionSuccess('Prescription created successfully!');
      setShowCreatePrescription(false);
      setCreatePrescriptionForm({ patient: '', medication: '', quantity: '', date: '', status: 'pending' });
      // Refresh prescriptions list
      const res = await request('/prescriptions');
      const myPrescriptions = res.prescriptions.filter((p: any) => {
        return p.doctor && (p.doctor._id === doctor._id || p.doctor.id === doctor._id);
      });
      setPrescriptions(myPrescriptions);
    } catch (err: any) {
      setCreatePrescriptionError(err.message || 'Failed to create prescription.');
    } finally {
      setCreatePrescriptionLoading(false);
    }
  };

  // Fetch patient history
  const fetchPatientHistory = async (patientId: string) => {
    setPatientHistoryLoading(true);
    setPatientHistory([]);
    try {
      const res = await request(`/patients/${patientId}/history`);
      setPatientHistory(res.history);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch patient history.');
    } finally {
      setPatientHistoryLoading(false);
    }
  };

  // Helper to update medicines array
  const handleMedicineChange = (idx: number, field: string, value: string) => {
    setConsultDetails(prev => {
      const meds = [...prev.medicines];
      meds[idx] = { ...meds[idx], [field]: value };
      return { ...prev, medicines: meds };
    });
  };
  const addMedicine = () => setConsultDetails(prev => ({ ...prev, medicines: [...prev.medicines, { name: '', dosage: '', duration: '' }] }));
  const removeMedicine = (idx: number) => setConsultDetails(prev => ({ ...prev, medicines: prev.medicines.filter((_, i) => i !== idx) }));

  // Enhanced prescription PDF generation using shared function
  const handleDownloadPrescriptionPDF = async (prescription) => {
    try {
      await generatePrescriptionPDF(prescription);
    } catch (error) {
      console.error('Error generating prescription PDF:', error);
      // You could add a toast notification here for better UX
    }
  };

  // In the recent patients section, sort patients descending by last appointment date
  const sortedPatients = [...patients].sort((a, b) => {
    // Find the most recent appointment for each patient
    const aLast = appointments.filter(ap => (ap.patient._id || ap.patient.id) === (a._id || a.id)).sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime())[0];
    const bLast = appointments.filter(ap => (ap.patient._id || ap.patient.id) === (b._id || b.id)).sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime())[0];
    const aDate = aLast ? new Date(aLast.date).getTime() : 0;
    const bDate = bLast ? new Date(bLast.date).getTime() : 0;
    return bDate - aDate;
  });
  // Use sortedPatients instead of patients in the recent patients list

  // The rest of the component logic and JSX
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
              <p className="text-gray-600">
                {doctor && doctor.user && doctor.user.name ? `Dr. ${doctor.user.name}${doctor.specialty ? ' - ' + doctor.specialty : ''}${doctor.department ? ' (' + doctor.department + ')' : ''}` : 'Doctor'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={refreshAppointments}>
                <RotateCcw className="h-4 w-4 mr-2 text-blue-600" />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.todayAppointments || 0}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.upcomingAppointments || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completedAppointments || 0}</p>
                </div>
                <Activity className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Patients</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.totalPatients || 0}</p>
                </div>
                <Users className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.appointmentCompletionRate || 0}%</p>
                </div>
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <Button 
            variant={appointmentFilter === 'today' ? 'default' : 'outline'}
            className={`h-16 flex flex-col items-center justify-center ${appointmentFilter === 'today' ? 'medical-gradient text-white' : ''}`}
            onClick={() => setAppointmentFilter('today')}
          >
            <Clock className="h-5 w-5 mb-1" />
            Schedule
          </Button>
          <Button
            variant={showConsultModal ? 'default' : 'outline'}
            className={`h-16 flex flex-col items-center justify-center ${showConsultModal ? 'ring-2 ring-blue-400' : ''}`}
            onClick={() => setShowConsultModal(true)}
          >
            <Stethoscope className="h-5 w-5 mb-1" />
            New Consultation
          </Button>
          <NewConsultationModal
            open={showConsultModal}
            onOpenChange={setShowConsultModal}
            patients={patients}
            appointments={appointments}
            doctor={doctor}
            refreshAppointments={refreshAppointments}
          />
          <Dialog open={showPrescriptionsModal} onOpenChange={setShowPrescriptionsModal}>
            <DialogTrigger asChild>
              <Button
                variant={showPrescriptionsModal ? 'default' : 'outline'}
                className={`h-16 flex flex-col items-center justify-center ${showPrescriptionsModal ? 'medical-gradient text-white' : ''}`}
                onClick={() => setShowPrescriptionsModal(true)}
              >
                <Pill className="h-5 w-5 mb-1" />
                Prescriptions
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto mx-4">
              <DialogHeader>
                <DialogTitle>Prescriptions</DialogTitle>
              </DialogHeader>
              <div className="mb-4 flex gap-2">
                <Input
                  placeholder="Search by patient or medication..."
                  value={prescriptionSearch}
                  onChange={e => setPrescriptionSearch(e.target.value)}
                  className="flex-1"
                />
              </div>
              {prescriptionsLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : prescriptionsError ? (
                <div className="text-red-500 text-center py-8">{prescriptionsError}</div>
              ) : filteredPrescriptions.length === 0 ? (
                <div className="text-gray-500 text-center py-8">No prescriptions found.</div>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-4">
                  {filteredPrescriptions.map((p: any) => (
                    <div key={p._id || p.id} className="border p-4 rounded-lg shadow-sm flex flex-col md:flex-row md:items-center justify-between mb-4 bg-white">
                      <div className="flex-1">
                        <div className="font-bold text-lg mb-1">{p.patient?.user?.name || p.patient?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500 mb-1">Date: {formatDateDMY(p.date)}</div>
                        <div className="text-xs text-gray-500 mb-1">Quantity: {Array.isArray(p.medications) ? p.medications.length : (p.medications ? 1 : 0)}</div>
                        {p.followUpDate && <div className="text-xs text-gray-500 mb-1">Follow-up: {formatDateDMY(p.followUpDate)}</div>}
                        <div className="text-xs text-gray-500 mb-1">Status: <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold text-xs">{p.status}</span></div>
                        <div className="mt-2">
                          <div className="font-semibold text-sm mb-1">Medicines:</div>
                          <ul className="list-disc ml-5 space-y-0.5">
                            {Array.isArray(p.medications)
                              ? p.medications.map((med: any, idx: number) => (
                                  <li key={idx} className="text-xs">{typeof med === 'string' ? med : med.name}</li>
                                ))
                              : <li className="text-xs">{p.medications || 'N/A'}</li>}
                          </ul>
                        </div>
                      </div>
                      <div className="flex flex-col items-end mt-4 md:mt-0 md:ml-4">
                        <Button size="sm" variant="outline" onClick={() => handleDownloadPrescriptionPDF(p)}>
                          Download as PDF
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            className="h-16 flex flex-col items-center justify-center"
            onClick={() => setShowMedicalRecordsModal(true)}
          >
            <FileText className="h-5 w-5 mb-1" />
            Medical Records
          </Button>
          <AIChatModal title="AI Medical Assistant - Doctor Support">
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center justify-center hover:bg-green-50 border-green-200 hover:border-green-300"
            >
              <Bot className="h-5 w-5 mb-1 text-green-600" />
              AI Assistant
            </Button>
          </AIChatModal>
          <Dialog open={showPatientHistoryModal} onOpenChange={setShowPatientHistoryModal}>
            <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto mx-4">
              <DialogHeader>
                <DialogTitle>Recent Patients</DialogTitle>
              </DialogHeader>
              <div className="mb-2">
                <Input
                  placeholder="Search by name or email..."
                  value={appointmentSearch}
                  onChange={e => setAppointmentSearch(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="max-h-96 overflow-y-auto space-y-2 mt-2">
                {filteredAppointments.length === 0 ? (
                  <div className="text-gray-500 text-center">No recent patients found.</div>
                ) : (
                  filteredAppointments.map((apt) => {
                    const p = apt.patient;
                    return (
                      <button
                        key={p._id || p.id}
                        className="border rounded p-3 flex flex-col text-left w-full hover:bg-gray-50 focus:outline-none"
                        onClick={() => {
                          setSelectedPatient(p);
                          setShowPatientDetailModal(true);
                        }}
                      >
                        <span className="font-medium">{p.name || p.user?.name}</span>
                        <span className="text-xs text-gray-500">{p.user?.email}</span>
                        {p.user?.contact && <span className="text-xs text-gray-500">{p.user?.contact}</span>}
                        <span className="text-xs text-gray-400 mt-1">Last Visit: {formatDateDMY(apt.date)} {apt.time}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </DialogContent>
          </Dialog>
          {/* Patient Detail Modal */}
          <Dialog open={showPatientDetailModal} onOpenChange={setShowPatientDetailModal}>
            <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto mx-4">
              <DialogHeader>
                <DialogTitle>Patient Details</DialogTitle>
              </DialogHeader>
              {selectedPatient ? (
                <div>
                  <div className="mb-2">
                    <span className="font-semibold">Name:</span> {selectedPatient.name || selectedPatient.user?.name}
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">Email:</span> {selectedPatient.user?.email}
                  </div>
                  {selectedPatient.user?.contact && (
                    <div className="mb-2">
                      <span className="font-semibold">Contact:</span> {selectedPatient.user?.contact}
                    </div>
                  )}
                  {selectedPatient.user?.age && (
                    <div className="mb-2">
                      <span className="font-semibold">Age:</span> {selectedPatient.user?.age}
                    </div>
                  )}
                  {selectedPatient.user?.gender && (
                    <div className="mb-2">
                      <span className="font-semibold">Gender:</span> {selectedPatient.user?.gender}
                    </div>
                  )}
                  <div className="mt-4 mb-2 font-semibold">Appointments:</div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {appointments.filter(a => (a.patient._id || a.patient.id) === (selectedPatient._id || selectedPatient.id)).length === 0 ? (
                      <div className="text-gray-500">No appointments found.</div>
                    ) : (
                      appointments.filter(a => (a.patient._id || a.patient.id) === (selectedPatient._id || selectedPatient.id)).map(a => (
                        <div key={a._id} className="border rounded p-2">
                          <div className="text-sm font-medium">{formatDateDMY(a.date)} {a.time} - {a.type}</div>
                          {a.diagnosis && <div className="text-xs text-gray-600">Diagnosis: {a.diagnosis}</div>}
                          {a.notes && <div className="text-xs text-gray-600">Notes: {a.notes}</div>}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-4 mb-2 font-semibold">Prescriptions:</div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {prescriptions.filter(pr => (pr.patient._id || pr.patient.id) === (selectedPatient._id || selectedPatient.id)).length === 0 ? (
                      <div className="text-gray-500">No prescriptions found.</div>
                    ) : (
                      prescriptions.filter(pr => (pr.patient._id || pr.patient.id) === (selectedPatient._id || selectedPatient.id)).map(pr => (
                        <div key={pr._id} className="border rounded p-2">
                          <div className="text-sm font-medium">{formatDateDMY(pr.date)} - {pr.medication}</div>
                          <div className="text-xs text-gray-600">Status: {pr.status}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">No patient selected.</div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Appointments Management
              </CardTitle>
              <CardDescription>Manage your appointments</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters and Search */}
              <div className="mb-4 space-y-3">
                <div className="flex gap-2">
                  <Select value={appointmentFilter} onValueChange={setAppointmentFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter appointments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="all">All</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Search by patient name or type..."
                    value={appointmentSearch}
                    onChange={(e) => setAppointmentSearch(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              
              {/* Appointments List */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredAppointments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No appointments found
                  </div>
                ) : (
                  filteredAppointments.map((appointment) => (
                    <div key={appointment._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {appointment.patient?.user?.name || 'Unknown Patient'}
                        </h4>
                        <p className="text-sm text-gray-600">{appointment.type}</p>
                        <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          {formatDateDMY(appointment.date)} at {appointment.time}
                        </div>
                        {appointment.notes && (
                          <p className="text-sm text-gray-600 mt-1">
                            Notes: {appointment.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            appointment.status === 'completed' ? 'default' :
                            appointment.status === 'in-progress' ? 'secondary' :
                            appointment.status === 'cancelled' ? 'destructive' : 
                            'outline'
                          }
                        >
                          {appointment.status}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAppointmentSelect(appointment)}
                          disabled={appointmentUpdateLoading}
                        >
                          View/Edit
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Patients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recent Patients
              </CardTitle>
              <CardDescription>Recently treated patients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {sortedPatients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No patients found
                  </div>
                ) : (
                  sortedPatients.map((patient) => (
                    <div key={patient._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <h4 className="font-medium">{patient.user?.name || patient.name || 'Unknown Patient'}</h4>
                        <p className="text-sm text-gray-600">{patient.user?.contact || 'No contact info'}</p>
                        <p className="text-sm text-gray-500">
                          Health Summary: {formatHealthSummary(patient.healthSummary)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handlePatientHistoryView(patient)}
                        >
                          View History
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Tasks - REMOVED */}
          {/* Weekly Overview - REMOVED */}
        </div>
      </div>
      
      {/* Appointment Management Modal */}
      <Dialog open={showAppointmentModal} onOpenChange={setShowAppointmentModal}>
        <DialogContent className="max-w-full md:max-w-2xl w-full p-4 md:p-8 overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Manage Appointment</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <form className="space-y-6" onSubmit={handleAppointmentUpdate}>
              {/* Patient Info */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="text-lg font-semibold mb-2 text-blue-700">Patient</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Name:</span> {selectedAppointment.patient?.user?.name || 'Unknown'}</div>
                  <div><span className="font-medium">Contact:</span> {selectedAppointment.patient?.user?.contact || 'N/A'}</div>
                  <div><span className="font-medium">Email:</span> {selectedAppointment.patient?.user?.email || 'N/A'}</div>
                  {selectedAppointment.patient?.user?.age && <div><span className="font-medium">Age:</span> {selectedAppointment.patient?.user?.age}</div>}
                  {selectedAppointment.patient?.user?.gender && <div><span className="font-medium">Gender:</span> {selectedAppointment.patient?.user?.gender}</div>}
                </div>
              </div>
              {/* Appointment Details */}
              <div className="bg-white p-4 rounded-lg border mb-4">
                <div className="text-lg font-semibold mb-2 text-blue-700">Appointment Details</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><span className="font-medium">Date:</span> {formatDateDMY(selectedAppointment.date)}</div>
                  <div><span className="font-medium">Time:</span> {selectedAppointment.time}</div>
                  <div><span className="font-medium">Type:</span> {selectedAppointment.type}</div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Status</label>
                    <select
                      className="w-full rounded border px-2 py-2"
                      value={appointmentForm.status}
                      onChange={e => setAppointmentForm(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="no-show">No Show</option>
                    </select>
                  </div>
                </div>
              </div>
              {/* Notes/Consultation */}
              <div className="bg-white p-4 rounded-lg border mb-4">
                <div className="text-lg font-semibold mb-2 text-blue-700">Notes & Consultation</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">Notes</label>
                    <textarea
                      className="w-full rounded border px-2 py-2"
                      value={appointmentForm.notes}
                      onChange={e => setAppointmentForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  <div className="flex flex-col justify-end items-end h-full mt-4 md:mt-0">
                    <button
                      type="button"
                      className="px-4 py-2 rounded bg-gradient-to-r from-[#1795d4] to-[#1ec98b] text-white font-semibold shadow-sm hover:from-[#1ec98b] hover:to-[#1795d4] focus:ring-2 focus:ring-blue-400 focus:outline-none transition-colors duration-200 mt-2 md:mt-0"
                      style={{ minWidth: '180px' }}
                      onClick={() => {
                        setShowAppointmentModal(false);
                        setShowConsultModal(true);
                        setConsultPatientType('pending');
                        setSelectedPendingAppointment(selectedAppointment);
                      }}
                    >
                      Start Consultation
                    </button>
                  </div>
                </div>
              </div>
              {/* Save/Cancel Buttons */}
              <div className="flex flex-col md:flex-row justify-end gap-2 mt-8">
                <button type="button" className="w-full md:w-auto px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300" onClick={() => setShowAppointmentModal(false)}>Cancel</button>
                <button type="submit" className="w-full md:w-auto px-4 py-2 rounded bg-gradient-to-r from-[#1795d4] to-[#1ec98b] text-white font-semibold shadow-sm hover:from-[#1ec98b] hover:to-[#1795d4] focus:ring-2 focus:ring-blue-400 focus:outline-none transition-colors duration-200" disabled={appointmentUpdateLoading}>
                  {appointmentUpdateLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Patient History Modal */}
      <Dialog open={showPatientHistoryModal} onOpenChange={setShowPatientHistoryModal}>
        <DialogContent className="max-w-6xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle>Patient History - {selectedPatient?.user?.name || 'Unknown Patient'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Patient Info */}
            {selectedPatient && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Patient Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name: </span>
                    {selectedPatient.user?.name || 'Unknown'}
                  </div>
                  <div>
                    <span className="font-medium">Contact: </span>
                    {selectedPatient.user?.contact || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Email: </span>
                    {selectedPatient.user?.email || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Health Summary: </span>
                    {formatHealthSummary(selectedPatient.healthSummary)}
                  </div>
                </div>
              </div>
            )}
            
            {/* Appointment History */}
            <div>
              <h3 className="font-medium mb-4">Appointment History</h3>
              {patientHistoryLoading ? (
                <div className="text-center py-8">Loading history...</div>
              ) : patientHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No appointment history found</div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {patientHistory.map((appointment) => (
                    <div key={appointment._id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={
                              appointment.status === 'completed' ? 'default' :
                              appointment.status === 'in-progress' ? 'secondary' :
                              appointment.status === 'cancelled' ? 'destructive' : 'outline'
                            }>
                              {appointment.status}
                            </Badge>
                            <span className="text-sm text-gray-600">{appointment.type}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDateDMY(appointment.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {appointment.time}
                            </span>
                          </div>
                          {appointment.diagnosis && (
                            <div className="mt-2">
                              <span className="font-medium text-sm">Diagnosis: </span>
                              <span className="text-sm">{appointment.diagnosis}</span>
                            </div>
                          )}
                          {appointment.notes && (
                            <div className="mt-2">
                              <span className="font-medium text-sm">Notes: </span>
                              <span className="text-sm">{appointment.notes}</span>
                            </div>
                          )}
                          {appointment.treatmentProgress?.progressNotes && (
                            <div className="mt-2">
                              <span className="font-medium text-sm">Treatment Progress: </span>
                              <span className="text-sm">{appointment.treatmentProgress.progressNotes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Medical Records Modal */}
      <Dialog open={showMedicalRecordsModal} onOpenChange={setShowMedicalRecordsModal}>
        <DialogContent
          className="w-[95vw] sm:w-full max-w-6xl p-2 sm:p-6 max-h-[90vh] overflow-y-auto flex flex-col mx-4"
        >
          <DialogHeader>
            <DialogTitle>Medical Records</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <Input
              placeholder="Search patient by name or email..."
              value={medicalRecordsSearch}
              onChange={e => setMedicalRecordsSearch(e.target.value)}
              className="mb-2"
            />
            <div className="max-h-40 overflow-y-auto border rounded bg-white">
              {medicalRecordsPatientResults.length === 0 ? (
                <div className="text-gray-500 p-2 text-center">No patients found.</div>
              ) : (
                medicalRecordsPatientResults.map((p: any) => (
                  <button
                    className={`w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-100 border-b last:border-b-0 ${selectedMedicalRecordsPatient && (p._id || p.id) === (selectedMedicalRecordsPatient._id || selectedMedicalRecordsPatient.id) ? 'bg-blue-100 font-semibold' : ''}`}
                    onClick={() => setSelectedMedicalRecordsPatient(p)}
                    key={p._id || p.id}
                  >
                    {p.name || p.user?.name || 'Patient'}
                    <span className="block text-xs text-gray-500">{p.user?.email}</span>
                  </button>
                ))
              )}
            </div>
          </div>
          {medicalRecordsLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-gray-600">Loading medical records...</span>
            </div>
          ) : medicalRecordsError ? (
            <div className="text-red-500 text-center py-8">{medicalRecordsError}</div>
          ) : selectedMedicalRecordsPatient ? (
            <div className="space-y-6">
              {/* Patient Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Patient Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Name: </span>{selectedMedicalRecordsPatient?.user?.name || selectedMedicalRecordsPatient?.name || 'Unknown'}</div>
                  <div><span className="font-medium">Contact: </span>{selectedMedicalRecordsPatient?.user?.contact || 'N/A'}</div>
                  <div><span className="font-medium">Email: </span>{selectedMedicalRecordsPatient?.user?.email || 'N/A'}</div>
                  <div><span className="font-medium">Age: </span>{selectedMedicalRecordsPatient?.user?.age || 'N/A'}</div>
                  <div><span className="font-medium">Gender: </span>{selectedMedicalRecordsPatient?.user?.gender || 'N/A'}</div>
                  <div><span className="font-medium">Health Summary: </span>{formatHealthSummary(selectedMedicalRecordsPatient?.healthSummary)}</div>
                </div>
              </div>
              {/* Appointments */}
              <h3 className="font-medium mb-2">Appointments</h3>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {appointments.filter(a => (a.patient?._id || a.patient?.id) === (selectedMedicalRecordsPatient?._id || selectedMedicalRecordsPatient?.id)).length === 0 ? (
                  <div className="text-gray-500">No appointments found.</div>
                ) : (
                  appointments.filter(a => (a.patient?._id || a.patient?.id) === (selectedMedicalRecordsPatient?._id || selectedMedicalRecordsPatient?.id)).map(a => (
                    <div key={a._id} className="border rounded p-2">
                      <div className="text-sm font-medium">{formatDateDMY(a.date)} {a.time} - {a.type}</div>
                      {a.diagnosis && <div className="text-xs text-gray-600">Diagnosis: {a.diagnosis}</div>}
                      {a.notes && <div className="text-xs text-gray-600">Notes: {a.notes}</div>}
                    </div>
                  ))
                )}
              </div>
              {/* Prescriptions */}
              <h3 className="font-medium mb-2">Prescriptions</h3>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {prescriptions.filter(pr => (pr.patient?._id || pr.patient?.id) === (selectedMedicalRecordsPatient?._id || selectedMedicalRecordsPatient?.id)).length === 0 ? (
                  <div className="text-gray-500">No prescriptions found.</div>
                ) : (
                  prescriptions.filter(pr => (pr.patient?._id || pr.patient?.id) === (selectedMedicalRecordsPatient?._id || selectedMedicalRecordsPatient?.id)).map(pr => (
                    <div key={pr._id} className="border rounded p-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-sm font-medium">{formatDateDMY(pr.date)}</div>
                          <div className="text-xs text-gray-600">Status: {pr.status}</div>
                          <div className="text-xs text-gray-600">Doctor: {pr.doctor?.user?.name || 'Unknown'}</div>
                        </div>
                        <Button size="sm" variant="outline" className="mt-2 sm:mt-0" onClick={() => handleDownloadPrescriptionPDF(pr)}>
                          Download as PDF
                        </Button>
                      </div>
                      <div className="mt-2">
                        <div className="font-semibold text-xs mb-1">Medicines:</div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs border rounded">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="px-2 py-1 border">Name</th>
                                <th className="px-2 py-1 border">Qty</th>
                                <th className="px-2 py-1 border">Dosage</th>
                                <th className="px-2 py-1 border">Frequency</th>
                                <th className="px-2 py-1 border">Timing</th>
                                <th className="px-2 py-1 border">Duration</th>
                                <th className="px-2 py-1 border">Food</th>
                                <th className="px-2 py-1 border">Instructions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.isArray(pr.medications) && pr.medications.length > 0 ? (
                                pr.medications.map((med: any, idx: number) => (
                                  <tr key={idx} className="border-t">
                                    <td className="px-2 py-1 border">{med.name || 'N/A'}</td>
                                    <td className="px-2 py-1 border">{med.quantity || 'N/A'}</td>
                                    <td className="px-2 py-1 border">{med.dosage || 'N/A'}</td>
                                    <td className="px-2 py-1 border">{med.frequency || 'N/A'}</td>
                                    <td className="px-2 py-1 border">{Array.isArray(med.timing) ? med.timing.join(', ') : med.timing || 'N/A'}</td>
                                    <td className="px-2 py-1 border">{med.duration || 'N/A'}</td>
                                    <td className="px-2 py-1 border">{med.food || 'N/A'}</td>
                                    <td className="px-2 py-1 border">{med.instructions || 'N/A'}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr><td colSpan={8} className="px-2 py-1 text-center">N/A</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        {pr.diagnosis && (
                          <div className="mt-2 text-xs"><span className="font-semibold">Diagnosis:</span> {pr.diagnosis}</div>
                        )}
                        {pr.notes && (
                          <div className="mt-1 text-xs"><span className="font-semibold">Notes:</span> {pr.notes}</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Select a patient to view medical records.</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Prescription Modal */}
      <Dialog open={selectedPrescription !== null} onOpenChange={() => setSelectedPrescription(null)}>
        <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedPrescription?.patient?.user?.name || selectedPrescription?.patient?.name || 'Patient'}
            </DialogTitle>
          </DialogHeader>
          {selectedPrescription && (
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <div><span className="font-semibold">Date:</span> {formatDateDMY(selectedPrescription.date)}</div>
                <div><span className="font-semibold">Medicine Count:</span> {Array.isArray(selectedPrescription.medications) ? selectedPrescription.medications.length : (selectedPrescription.medications ? 1 : 0)}</div>
                {selectedPrescription.followUpDate && (
                  <div><span className="font-semibold">Follow-up Date:</span> {formatDateDMY(selectedPrescription.followUpDate)}</div>
                )}
                <div><span className="font-semibold">Status:</span> {selectedPrescription.status}</div>
                <div><span className="font-semibold">Doctor:</span> {selectedPrescription.doctor?.user?.name || 'Unknown'}</div>
              </div>
              <div className="mt-4">
                <div className="font-semibold mb-2">Medicines</div>
                <ul className="list-disc ml-6 space-y-1">
                  {Array.isArray(selectedPrescription.medications)
                    ? selectedPrescription.medications.map((med: any, idx: number) => (
                        <li key={idx} className="text-sm">{typeof med === 'string' ? med : med.name}</li>
                      ))
                    : <li className="text-sm">{selectedPrescription.medications || 'N/A'}</li>}
                </ul>
              </div>
              <div className="mt-4">
                <div className="font-semibold mb-2">Notes</div>
                <div className="text-sm">{selectedPrescription.notes || 'N/A'}</div>
              </div>
              <div className="mt-4">
                <div className="font-semibold mb-2">Diagnosis</div>
                <div className="text-sm">{selectedPrescription.diagnosis || 'N/A'}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorDashboard;
