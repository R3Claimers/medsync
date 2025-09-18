import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { request } from '../lib/api';
import { formatDateDMY } from '@/lib/utils';

interface Patient {
  _id?: string;
  id?: string;
  name?: string;
  user?: { name?: string; email?: string };
}

interface Appointment {
  _id?: string;
  id?: string;
  date?: string;
  time?: string;
  status?: string;
  patient?: Patient;
}

interface Doctor {
  _id?: string;
  id?: string;
  user?: { hospitalId?: string };
}

interface NewConsultationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patients: Patient[];
  appointments: Appointment[];
  doctor: Doctor;
  refreshAppointments: () => Promise<void>;
}

const defaultNewPatient = { name: '', contact: '', email: '' };
// Update defaultConsultDetails and medicine structure
const defaultConsultDetails = { diagnosis: '', notes: '', medicines: [{ name: '', timing: [], duration: '', food: '', customFood: '', instructions: '' }] };

export const NewConsultationModal: React.FC<NewConsultationModalProps> = ({
  open,
  onOpenChange,
  patients,
  appointments,
  doctor,
  refreshAppointments,
}) => {
  const [consultStep, setConsultStep] = useState(1);
  const [consultPatientType, setConsultPatientType] = useState<'pending' | 'existing' | 'new'>('pending');
  const [selectedPendingAppointment, setSelectedPendingAppointment] = useState<Appointment | null>(null);
  const [selectedExistingPatient, setSelectedExistingPatient] = useState<Patient | null>(null);
  const [newPatientForm, setNewPatientForm] = useState(defaultNewPatient);
  const [consultDetails, setConsultDetails] = useState(defaultConsultDetails);
  const [consultLoading, setConsultLoading] = useState(false);
  const [consultError, setConsultError] = useState('');
  const [consultSuccess, setConsultSuccess] = useState('');

  // Medicine handlers
  const handleMedicineChange = (idx: number, field: string, value: any) => {
    setConsultDetails(prev => ({
      ...prev,
      medicines: prev.medicines.map((m, i) => i === idx ? { ...m, [field]: value } : m)
    }));
  };
  const handleMedicineTimingToggle = (idx: number, timing: string) => {
    setConsultDetails(prev => ({
      ...prev,
      medicines: prev.medicines.map((m, i) => {
        if (i !== idx) return m;
        const exists = m.timing.includes(timing);
        return { ...m, timing: exists ? m.timing.filter(t => t !== timing) : [...m.timing, timing] };
      })
    }));
  };
  const addMedicine = () => setConsultDetails(prev => ({ ...prev, medicines: [...prev.medicines, { name: '', timing: [], duration: '', food: '', customFood: '', instructions: '' }] }));
  const removeMedicine = (idx: number) => setConsultDetails(prev => ({ ...prev, medicines: prev.medicines.filter((_, i) => i !== idx) }));

  // New patient search state
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showQuickAddPatient, setShowQuickAddPatient] = useState(false);

  // Filter patients based on search term
  const filteredPatients = patients.filter(p =>
    (p.name || p.user?.name || '').toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
    (p.user?.email || '').toLowerCase().includes(patientSearchTerm.toLowerCase())
  );

  // Main submit handler
  const handleConsultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConsultLoading(true);
    setConsultError('');
    setConsultSuccess('');
    try {
      let patientId = '';
      // Create new patient if needed
      if (consultPatientType === 'new') {
        const res = await request('/patients', {
          method: 'POST',
          body: JSON.stringify(newPatientForm)
        });
        patientId = res.patient._id || res.patient.id;
      } else if (consultPatientType === 'pending') {
        patientId = selectedPendingAppointment?.patient?._id || selectedPendingAppointment?.patient?.id || '';
      } else if (consultPatientType === 'existing') {
        patientId = selectedExistingPatient?._id || selectedExistingPatient?.id || '';
      }
      // Defensive: check patientId
      if (!patientId) {
        setConsultError('Patient ID is missing.');
        setConsultLoading(false);
        return;
      }
      // Defensive: check doctor and hospitalId
      const doctorId = doctor?._id || doctor?.id;
      const hospitalId = doctor?.user?.hospitalId;
      if (!doctorId) {
        setConsultError('Doctor ID is missing.');
        setConsultLoading(false);
        return;
      }
      if (!hospitalId) {
        setConsultError('Hospital ID is missing.');
        setConsultLoading(false);
        return;
      }
      // Create appointment
      let appointmentId = '';
      let appointmentDate = '';
      let appointmentTime = '';
      if (consultPatientType === 'pending') {
        appointmentId = selectedPendingAppointment?._id || '';
        appointmentDate = selectedPendingAppointment?.date || '';
        appointmentTime = selectedPendingAppointment?.time || '';
      } else {
        const apptRes = await request('/appointments', {
          method: 'POST',
          body: JSON.stringify({
            patient: patientId,
            doctor: doctorId,
            hospitalId: hospitalId,
            date: new Date().toISOString().slice(0, 10),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'confirmed',
            type: 'Consultation',
            notes: consultDetails.notes
          })
        });
        appointmentId = apptRes.appointment._id || apptRes.appointment.id;
        appointmentDate = apptRes.appointment.date;
        appointmentTime = apptRes.appointment.time;
      }
      // Defensive: check appointmentDate
      if (!appointmentDate) {
        setConsultError('Appointment date is missing.');
        setConsultLoading(false);
        return;
      }
      // Create prescription
      await request('/prescriptions', {
        method: 'POST',
        body: JSON.stringify({
          patient: patientId,
          doctor: doctorId,
          hospitalId: hospitalId,
          medications: consultDetails.medicines,
          date: appointmentDate,
          status: 'active'
        })
      });
      // After creating the prescription, if consultPatientType === 'pending' and selectedPendingAppointment exists, update appointment status to 'completed'
      if (consultPatientType === 'pending' && selectedPendingAppointment?._id) {
        await request(`/appointments/doctor/${selectedPendingAppointment._id}`, {
          method: 'PUT',
          body: JSON.stringify({ status: 'completed' })
        });
      }
      setConsultSuccess('Consultation and prescription created successfully!');
      onOpenChange(false);
      setConsultStep(1);
      setConsultDetails(defaultConsultDetails);
      setNewPatientForm(defaultNewPatient);
      setSelectedPendingAppointment(null);
      setSelectedExistingPatient(null);
      await refreshAppointments();
    } catch (err: any) {
      setConsultError(err.message || 'Failed to create consultation.');
    } finally {
      setConsultLoading(false);
    }
  };

  // Reset state when modal closes
  React.useEffect(() => {
    if (!open) {
      setConsultStep(1);
      setConsultPatientType('pending');
      setSelectedPendingAppointment(null);
      setSelectedExistingPatient(null);
      setNewPatientForm(defaultNewPatient);
      setConsultDetails(defaultConsultDetails);
      setConsultError('');
      setConsultSuccess('');
      setPatientSearchTerm('');
      setShowPatientDropdown(false);
      setShowQuickAddPatient(false);
    }
  }, [open]);

  // Add a gradient utility for buttons
  const gradientBtn = 'bg-gradient-to-r from-[#1795d4] to-[#1ec98b] text-white font-semibold shadow-sm rounded-lg hover:from-[#1ec98b] hover:to-[#1795d4] focus:ring-2 focus:ring-blue-400 focus:outline-none transition-colors duration-200';
  const grayBtn = 'bg-gray-200 text-gray-800 hover:bg-gray-300';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full md:max-w-2xl w-full p-4 md:p-8 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>New Consultation</DialogTitle>
        </DialogHeader>
        {/* Step Progress Indicator */}
        <div className="mb-6 flex items-center gap-2">
          <div className={`w-8 h-8 flex items-center justify-center rounded-full ${consultStep === 1 ? gradientBtn : 'bg-gray-200 text-gray-600'}`}>1</div>
          <span className={consultStep === 1 ? 'text-blue-600 font-semibold' : 'text-gray-600'}>Patient</span>
          <div className="w-8 h-0.5 bg-gray-300 mx-2" />
          <div className={`w-8 h-8 flex items-center justify-center rounded-full ${consultStep === 2 ? gradientBtn : 'bg-gray-200 text-gray-600'}`}>2</div>
          <span className={consultStep === 2 ? 'text-blue-600 font-semibold' : 'text-gray-600'}>Consultation</span>
        </div>
        {consultStep === 1 && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <button className={`flex-1 px-4 py-2 rounded ${consultPatientType === 'pending' ? gradientBtn : grayBtn}`} onClick={() => setConsultPatientType('pending')}>Select Pending Appointment</button>
              <button className={`flex-1 px-4 py-2 rounded ${consultPatientType === 'existing' ? gradientBtn : grayBtn}`} onClick={() => setConsultPatientType('existing')}>Select Existing Patient</button>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border">
              {consultPatientType === 'pending' && (
                <div>
                  <div className="text-lg font-semibold mb-4 text-blue-700">Pending Appointments</div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {appointments.filter(a => a.status === 'pending').length === 0 && <div className="text-gray-500">No pending appointments.</div>}
                    {appointments.filter(a => a.status === 'pending').map(a => (
                      <div key={a._id} className={`p-3 rounded border flex flex-col md:flex-row items-start md:items-center justify-between ${selectedPendingAppointment?._id === a._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}> 
                        <div>
                          <div className="font-medium">{a.patient?.user?.name || a.patient?.name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{formatDateDMY(a.date)} {a.time}</div>
                        </div>
                        <button className={`mt-2 md:mt-0 px-3 py-1 rounded ${gradientBtn} text-xs`} onClick={() => setSelectedPendingAppointment(a)}>Select</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {consultPatientType === 'existing' && (
                <div>
                  <div className="text-lg font-semibold mb-4 text-blue-700">Search Patient</div>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full rounded border px-3 py-2 mb-2"
                      placeholder="Search by name or email..."
                      value={patientSearchTerm || ''}
                      onChange={e => {
                        setPatientSearchTerm(e.target.value);
                        setShowPatientDropdown(true);
                      }}
                      onFocus={() => setShowPatientDropdown(true)}
                      autoComplete="off"
                    />
                    {showPatientDropdown && patientSearchTerm && (
                      <div className="absolute z-10 bg-white border rounded w-full max-h-48 overflow-y-auto shadow-lg">
                        {filteredPatients.length === 0 ? (
                          <div className="p-2 text-gray-500 flex items-center justify-between">
                            <span>No patient found.</span>
                            <button
                              className="ml-2 px-2 py-1 rounded bg-blue-500 text-white text-xs"
                              onClick={e => {
                                e.preventDefault();
                                setShowPatientDropdown(false);
                                setShowQuickAddPatient(true);
                              }}
                            >
                              + New Patient
                            </button>
                          </div>
                        ) : (
                          filteredPatients.map(p => (
                            <div
                              key={p._id || p.id}
                              className={`p-2 cursor-pointer hover:bg-blue-50 ${selectedExistingPatient && (selectedExistingPatient._id || selectedExistingPatient.id) === (p._id || p.id) ? 'bg-blue-100' : ''}`}
                              onClick={() => {
                                setSelectedExistingPatient(p);
                                setShowPatientDropdown(false);
                                setShowQuickAddPatient(false);
                              }}
                            >
                              <div className="font-medium">{p.name || p.user?.name}</div>
                              <div className="text-xs text-gray-500">{p.user?.email}</div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  {showQuickAddPatient && (
                    <div className="mt-3 p-3 border rounded bg-gray-50">
                      <div className="font-semibold mb-2">Add New Patient</div>
                      <div className="mb-2">
                        <input
                          className="w-full rounded border px-3 py-2 mb-2"
                          placeholder="Name"
                          value={newPatientForm.name}
                          onChange={e => setNewPatientForm(f => ({ ...f, name: e.target.value }))}
                        />
                        <input
                          className="w-full rounded border px-3 py-2 mb-2"
                          placeholder="Contact"
                          value={newPatientForm.contact}
                          onChange={e => setNewPatientForm(f => ({ ...f, contact: e.target.value }))}
                        />
                        <input
                          className="w-full rounded border px-3 py-2 mb-2"
                          placeholder="Email"
                          value={newPatientForm.email}
                          onChange={e => setNewPatientForm(f => ({ ...f, email: e.target.value }))}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="px-4 py-2 rounded bg-blue-600 text-white"
                          onClick={async e => {
                            e.preventDefault();
                            setConsultLoading(true);
                            try {
                              const res = await request('/patients', {
                                method: 'POST',
                                body: JSON.stringify(newPatientForm)
                              });
                              setSelectedExistingPatient(res.patient);
                              setShowQuickAddPatient(false);
                              setPatientSearchTerm('');
                              setConsultError('');
                              setConsultStep(2);
                            } catch (err: any) {
                              setConsultError(err.message || 'Failed to add patient.');
                            } finally {
                              setConsultLoading(false);
                            }
                          }}
                          disabled={!newPatientForm.name || !newPatientForm.email}
                        >
                          Add Patient
                        </button>
                        <button
                          className="px-4 py-2 rounded bg-gray-200"
                          onClick={e => {
                            e.preventDefault();
                            setShowQuickAddPatient(false);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  {selectedExistingPatient && !showQuickAddPatient && (selectedExistingPatient.name || selectedExistingPatient.user?.name || selectedExistingPatient.user?.email) && (
                    <div className="p-3 rounded border border-blue-500 bg-blue-50 mt-2">
                      <div className="font-medium">{selectedExistingPatient.name || selectedExistingPatient.user?.name}</div>
                      <div className="text-sm text-gray-500">{selectedExistingPatient.user?.email}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col md:flex-row justify-end gap-2 mt-8">
              <button className={`w-full md:w-auto px-4 py-2 rounded ${grayBtn}`} onClick={() => onOpenChange(false)}>Cancel</button>
              <button className={`w-full md:w-auto px-4 py-2 rounded ${gradientBtn}`} onClick={() => setConsultStep(2)} disabled={
                (consultPatientType === 'pending' && !selectedPendingAppointment) ||
                (consultPatientType === 'existing' && !selectedExistingPatient)
              }>Next</button>
            </div>
          </div>
        )}
        {consultStep === 2 && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border">
              <div className="text-lg font-semibold mb-4 text-blue-700">Consultation Details</div>
              <form className="space-y-6" onSubmit={handleConsultSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Diagnosis</label>
                    <textarea
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                      value={consultDetails.diagnosis}
                      onChange={e => setConsultDetails(prev => ({ ...prev, diagnosis: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                    <textarea
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                      value={consultDetails.notes}
                      onChange={e => setConsultDetails(prev => ({ ...prev, notes: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-lg font-semibold mb-4 text-blue-700">Medicines</div>
                  <div className="space-y-4">
                    {consultDetails.medicines.map((med, idx) => (
                      <div key={idx} className="border rounded-lg p-4 bg-gray-50 relative mb-4">
                        {/* Medicine Name (full width) */}
                        <div className="mb-2">
                          <label className="block text-xs font-medium mb-1">Name</label>
                          <input
                            className="w-full rounded border px-2 py-2 text-base"
                            value={med.name}
                            onChange={e => handleMedicineChange(idx, 'name', e.target.value)}
                            placeholder="Medicine name"
                            required
                          />
                        </div>
                        {/* Timing (full width, below name) */}
                        <div className="mb-4">
                          <label className="block text-xs font-medium mb-1">Timing</label>
                          <div className="flex gap-3 flex-wrap">
                            {['Morning', 'Afternoon', 'Evening', 'Night'].map(t => (
                              <label key={t} className={`flex items-center gap-1 px-3 py-1 rounded border cursor-pointer text-xs select-none ${med.timing?.includes(t) ? 'bg-gradient-to-r from-[#1795d4] to-[#1ec98b] text-white border-blue-400' : 'bg-white border-gray-300'}`}
                                style={{ minWidth: 0 }}
                                onClick={e => { e.preventDefault(); handleMedicineTimingToggle(idx, t); }}
                              >
                                <input
                                  type="checkbox"
                                  checked={med.timing?.includes(t) || false}
                                  readOnly
                                  className="accent-[#1795d4]"
                                  style={{ margin: 0 }}
                                />
                                {t}
                              </label>
                            ))}
                          </div>
                        </div>
                        {/* Duration, Food, Other (side by side) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                          {/* Duration */}
                          <div>
                            <label className="block text-xs font-medium mb-1">Duration</label>
                            <input
                              className="w-full rounded border px-2 py-2"
                              value={med.duration}
                              onChange={e => handleMedicineChange(idx, 'duration', e.target.value)}
                              placeholder="e.g. 5 days"
                              required
                            />
                          </div>
                          {/* Food Instructions */}
                          <div>
                            <label className="block text-xs font-medium mb-1">Food</label>
                            <select
                              className="w-full rounded border px-2 py-2"
                              value={med.food}
                              onChange={e => handleMedicineChange(idx, 'food', e.target.value)}
                            >
                              <option value="">Select</option>
                              <option value="Before Food">Before Food</option>
                              <option value="After Food">After Food</option>
                              <option value="With Food">With Food</option>
                              <option value="Custom">Custom</option>
                            </select>
                            {med.food === 'Custom' && (
                              <input
                                className="w-full rounded border px-2 py-2 mt-1"
                                value={med.customFood}
                                onChange={e => handleMedicineChange(idx, 'customFood', e.target.value)}
                                placeholder="Custom food instructions"
                              />
                            )}
                          </div>
                          {/* Other Instructions */}
                          <div>
                            <label className="block text-xs font-medium mb-1">Other</label>
                            <input
                              className="w-full rounded border px-2 py-2"
                              value={med.instructions}
                              onChange={e => handleMedicineChange(idx, 'instructions', e.target.value)}
                              placeholder="Other instructions"
                            />
                          </div>
                        </div>
                        {/* Remove button */}
                        <div className="absolute top-2 right-2 flex items-center">
                          {consultDetails.medicines.length > 1 && (
                            <button
                              type="button"
                              className="text-xs text-red-500 hover:underline"
                              onClick={() => removeMedicine(idx)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className={`mt-2 px-3 py-1 rounded ${gradientBtn} text-xs w-full md:w-auto`}
                    onClick={addMedicine}
                  >
                    + Add Medicine
                  </button>
                </div>
                <div className="flex flex-col md:flex-row justify-end gap-2 mt-8">
                  <button type="button" className={`w-full md:w-auto px-4 py-2 rounded ${grayBtn}`} onClick={() => setConsultStep(1)}>Back</button>
                  <button type="submit" className={`w-full md:w-auto px-4 py-2 rounded ${gradientBtn}`}>{consultLoading ? 'Saving...' : 'Submit Consultation'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewConsultationModal; 