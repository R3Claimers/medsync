
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, FileText, Pill, Activity, Bot, LogOut } from 'lucide-react';
import { request } from '../lib/api';
import { useAuth } from '../lib/authContext';
import { useNavigate } from 'react-router-dom';
import BookAppointmentForm from '../components/BookAppointmentForm';
import AIChatModal from '../components/AIChatModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatDateDMY } from '@/lib/utils';
import { generatePrescriptionPDF } from '@/lib/prescriptionPdf';

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  console.log('User in PatientDashboard:', user);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patient, setPatient] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showRecordsModal, setShowRecordsModal] = useState(false);
  const [showPrescriptionsModal, setShowPrescriptionsModal] = useState(false);

  // If user is not authenticated, show error and redirect option
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-red-500 text-lg mb-4">You are not logged in or your session has expired.</div>
        <Button onClick={() => navigate('/login')}>Go to Login</Button>
      </div>
    );
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch patient info by user ID
        const patientRes = await request(`/patients/by-user/${user?.id}`);
        setPatient(patientRes.patient);
        // Fetch appointments for this patient
        const apptRes = await request('/appointments');
        setAppointments(
          apptRes.appointments.filter((a: any) => {
            const patientUser = a?.patient?.user;
            if (!patientUser) return false;
            if (typeof patientUser === 'object') {
              return patientUser._id?.toString() === user?.id;
            }
            return patientUser?.toString() === user?.id;
          })
        );
        // Fetch prescriptions for this patient
        const presRes = await request('/prescriptions');
        setPrescriptions(
          presRes.prescriptions.filter((p: any) => {
            const patientUser = p?.patient?.user;
            if (!patientUser) return false;
            if (typeof patientUser === 'object') {
              return patientUser._id?.toString() === user?.id;
            }
            return patientUser?.toString() === user?.id;
          })
        );
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchData();
  }, [user]);

  // Add a function to refresh data
  const refreshData = () => {
    if (user?.id) {
      setLoading(true);
      setError('');
      request(`/patients/by-user/${user?.id}`).then(patientRes => setPatient(patientRes.patient));
      request('/appointments').then(apptRes => setAppointments(apptRes.appointments.filter((a: any) => {
        const patientUser = a?.patient?.user;
        if (!patientUser) return false;
        if (typeof patientUser === 'object') {
          return patientUser._id?.toString() === user?.id;
        }
        return patientUser?.toString() === user?.id;
      })));
      request('/prescriptions').then(presRes => setPrescriptions(presRes.prescriptions.filter((p: any) => {
        const patientUser = p?.patient?.user;
        if (!patientUser) return false;
        if (typeof patientUser === 'object') {
          return patientUser._id?.toString() === user?.id;
        }
        return patientUser?.toString() === user?.id;
      })));
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!patient) return <div className="p-8 text-center">No patient data found.</div>;

  // Sort prescriptions by date descending for recent display
  const sortedPrescriptions = prescriptions.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Patient Dashboard</h1>
              <p className="text-gray-600">
                {user?.name ? `${user.name} - Patient` : 'Welcome back, Patient'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
                onClick={() => { logout(); setTimeout(() => navigate('/'), 100); }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Dialog open={showBookModal} onOpenChange={setShowBookModal}>
            <DialogTrigger asChild>
              <Button className="h-20 medical-gradient text-white flex flex-col items-center justify-center" onClick={() => setShowBookModal(true)}>
                <Calendar className="h-6 w-6 mb-2" />
                Book Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto mx-4">
              <DialogHeader>
                <DialogTitle>Book Appointment</DialogTitle>
              </DialogHeader>
              <BookAppointmentForm onSuccess={() => { setShowBookModal(false); refreshData(); }} />
            </DialogContent>
          </Dialog>
          <Dialog open={showRecordsModal} onOpenChange={setShowRecordsModal}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center" onClick={() => setShowRecordsModal(true)}>
                <FileText className="h-6 w-6 mb-2" />
                View Records
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto mx-4">
              <DialogHeader>
                <DialogTitle>Medical Records</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {appointments.length === 0 ? (
                  <div className="text-gray-500 text-center">No records found.</div>
                ) : (
                  appointments.map((appointment) => (
                    <div key={appointment._id || appointment.id} className="border rounded p-3">
                      <div className="font-medium text-blue-700">{formatDateDMY(appointment.date)} {appointment.time} - {appointment.type}</div>
                      <div className="text-sm text-gray-600">Doctor: {appointment?.doctor?.user?.name || appointment?.doctor?.name || 'Doctor'}</div>
                      {appointment.diagnosis && <div className="text-xs text-gray-700 mt-1"><span className="font-semibold">Diagnosis:</span> {appointment.diagnosis}</div>}
                      {appointment.notes && <div className="text-xs text-gray-700 mt-1"><span className="font-semibold">Notes:</span> {appointment.notes}</div>}
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showPrescriptionsModal} onOpenChange={setShowPrescriptionsModal}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center" onClick={() => setShowPrescriptionsModal(true)}>
                <Pill className="h-6 w-6 mb-2" />
                Prescriptions
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto mx-4">
              <DialogHeader>
                <DialogTitle>Prescriptions</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {prescriptions.length === 0 ? (
                  <div className="text-gray-500 text-center">No prescriptions found.</div>
                ) : (
                  prescriptions.map((prescription) => (
                    <div key={prescription._id || prescription.id} className="border rounded p-3">
                      <div className="font-medium text-blue-700">{formatDateDMY(prescription.date)}</div>
                      <div className="text-sm text-gray-600">Doctor: {prescription?.doctor?.user?.name || prescription?.doctor?.name || 'Doctor'}</div>
                      <div className="text-sm text-gray-600">Status: {prescription.status}</div>
                      {Array.isArray(prescription.medications) && prescription.medications.length > 0 ? (
                        <div className="mt-2">
                          <div className="font-semibold text-xs mb-1">Medicines:</div>
                          <ul className="list-disc ml-5 space-y-0.5">
                            {prescription.medications.map((med: any, idx: number) => (
                              <li key={idx} className="text-xs">{med.name} - {med.dosage} {med.frequency} {med.duration}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="mt-2 text-xs">Medicine: {prescription.medication || 'N/A'} | Qty: {prescription.quantity || 'N/A'}</div>
                      )}
                      {prescription.diagnosis && <div className="mt-2 text-xs"><span className="font-semibold">Diagnosis:</span> {prescription.diagnosis}</div>}
                      {prescription.notes && <div className="mt-1 text-xs"><span className="font-semibold">Notes:</span> {prescription.notes}</div>}
                      <div className="mt-2 flex justify-end">
                        <Button size="sm" variant="outline" onClick={() => generatePrescriptionPDF(prescription)}>
                          Download as PDF
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
          <AIChatModal title="AI Health Assistant - Patient Support">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center hover:bg-blue-50 border-blue-200 hover:border-blue-300">
              <Bot className="h-6 w-6 mb-2 text-blue-600" />
              AI Health Assistant
            </Button>
          </AIChatModal>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Appointments
              </CardTitle>
              <CardDescription>Your scheduled medical appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[400px] md:max-h-[500px] lg:max-h-[600px] overflow-y-auto">
                {appointments.map((appointment) => (
                  <div key={appointment._id || appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{appointment?.doctor?.user?.name || appointment?.doctor?.name || 'Doctor'}</h4>
                      <p className="text-sm text-gray-600">{appointment?.type || ''}</p>
                      <p className="text-sm text-gray-600">Hospital: {appointment?.hospitalId?.name || appointment?.hospitalId || 'N/A'}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDateDMY(appointment?.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {appointment?.time || ''}
                        </span>
                      </div>
                    </div>
                    <Badge variant={appointment?.status === 'confirmed' ? 'default' : 'secondary'}>
                      {appointment?.status || 'unknown'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Prescriptions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Recent Prescriptions
              </CardTitle>
              <CardDescription>Your current and past medications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[400px] md:max-h-[500px] lg:max-h-[600px] overflow-y-auto">
                {sortedPrescriptions.length === 0 ? (
                  <div className="text-gray-500 text-center">No prescriptions found.</div>
                ) : (
                  sortedPrescriptions.map((prescription) => (
                    <div key={prescription._id || prescription.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">
                          {Array.isArray(prescription.medications) && prescription.medications.length > 0
                            ? prescription.medications.map((med: any, idx: number) => (
                                <span key={idx} className="block">
                                  {med.name} {med.dosage ? `- ${med.dosage}` : ''} {med.frequency ? `(${med.frequency})` : ''} {med.duration ? `for ${med.duration}` : ''}
                                </span>
                              ))
                            : (prescription.medication || 'Medication')}
                        </h4>
                        <p className="text-sm text-gray-600">Prescribed by {prescription?.doctor?.user?.name || prescription?.doctor?.name || 'Doctor'}</p>
                        <p className="text-sm text-gray-500">{formatDateDMY(prescription?.date)}</p>
                        {prescription.diagnosis && <div className="text-xs text-gray-700 mt-1"><span className="font-semibold">Diagnosis:</span> {prescription.diagnosis}</div>}
                        {prescription.notes && <div className="text-xs text-gray-700 mt-1"><span className="font-semibold">Notes:</span> {prescription.notes}</div>}
                        {!(Array.isArray(prescription.medications) && prescription.medications.length > 0) && (
                          <div className="text-xs text-gray-500 mt-1">Qty: {prescription.quantity || 'N/A'}</div>
                        )}
                      </div>
                      <Badge variant={prescription?.status === 'active' ? 'default' : 'secondary'}>
                        {prescription?.status || 'unknown'}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
