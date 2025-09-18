import React, { useEffect, useState } from 'react';
import { request } from '../lib/api';
import { useAuth } from '../lib/authContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogContent } from '@/components/ui/dialog';

interface BookAppointmentFormProps {
  onSuccess?: () => void;
}

const WORKING_HOURS_START = 9; // 9:00
const WORKING_HOURS_END = 17; // 17:00
const SLOT_INTERVAL = 30; // minutes

function generateSlots(date: string) {
  const slots = [];
  const now = new Date();
  const selectedDate = new Date(date);
  for (let hour = WORKING_HOURS_START; hour < WORKING_HOURS_END; hour++) {
    for (let min = 0; min < 60; min += SLOT_INTERVAL) {
      const slotTime = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      // Don't allow past slots for today
      if (
        selectedDate.toDateString() === now.toDateString() &&
        (hour < now.getHours() || (hour === now.getHours() && min <= now.getMinutes()))
      ) continue;
      slots.push(slotTime);
    }
  }
  return slots;
}

const BookAppointmentForm: React.FC<BookAppointmentFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  console.log('User in BookAppointmentForm:', user);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [hospitalId, setHospitalId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState('Consultation');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const res = await request('/hospitals');
        setHospitals(res.hospitals);
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchHospitals();
  }, []);

  useEffect(() => {
    if (!hospitalId) return setDoctors([]);
    const fetchDoctors = async () => {
      try {
        const res = await request(`/doctors/by-hospital?hospitalId=${hospitalId}`);
        setDoctors(res.doctors);
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchDoctors();
  }, [hospitalId]);

  // Fetch booked slots when doctor or date changes
  useEffect(() => {
    if (!doctorId || !date) return setBookedSlots([]);
    const fetchBooked = async () => {
      try {
        const res = await request('/appointments');
        const doctorAppointments = res.appointments.filter((a: any) => a.doctor && (a.doctor._id === doctorId || a.doctor.id === doctorId) && a.date === date);
        setBookedSlots(doctorAppointments.map((a: any) => a.time));
      } catch {}
    };
    fetchBooked();
  }, [doctorId, date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Add this line
    setLoading(true);
    setError('');
    setSuccess('');
    // Prevent booking for past dates
    const today = new Date();
    const selectedDate = new Date(date);
    if (selectedDate < new Date(today.toDateString())) {
      setError('Cannot book appointments for past dates.');
      setLoading(false);
      return;
    }
    try {
      await request('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          doctor: doctorId,
          hospitalId,
          date,
          time,
          type,
        }),
      });
      setSuccess('Appointment booked successfully!');
      setDoctorId('');
      setHospitalId('');
      setDate('');
      setTime('');
      setType('Consultation');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-1 font-medium">Select Hospital</label>
        <Select value={hospitalId} onValueChange={setHospitalId} required>
          <SelectTrigger>
            <SelectValue placeholder="Choose a hospital" />
          </SelectTrigger>
          <SelectContent>
            {hospitals.map((h) => (
              <SelectItem key={h._id} value={h._id}>{h.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block mb-1 font-medium">Select Doctor</label>
        <Select value={doctorId} onValueChange={setDoctorId} disabled={!hospitalId} required>
          <SelectTrigger>
            <SelectValue placeholder="Choose a doctor" />
          </SelectTrigger>
          <SelectContent>
            {doctors.map((d) => (
              <SelectItem key={d._id} value={d._id}>{d.user?.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block mb-1 font-medium">Date</label>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} required min={new Date().toISOString().split('T')[0]} />
      </div>
      {/* Only show slots after date is selected */}
      {date && (
        <div>
          <label className="block mb-1 font-medium">Time</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
            {generateSlots(date).map(slot => {
              const isBooked = bookedSlots.includes(slot);
              const isDisabled = !date || isBooked;
              return (
                <Button
                  key={slot}
                  type="button"
                  variant={time === slot ? 'default' : 'outline'}
                  className={`w-full text-xs sm:text-sm ${isBooked ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : ''}`}
                  disabled={isDisabled}
                  onClick={() => !isDisabled && setTime(slot)}
                >
                  {slot}
                </Button>
              );
            })}
          </div>
        </div>
      )}
      <div>
        <label className="block mb-1 font-medium">Appointment Type</label>
        <Select value={type} onValueChange={setType} required>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Consultation">Consultation</SelectItem>
            <SelectItem value="Follow-up">Follow-up</SelectItem>
            <SelectItem value="Emergency">Emergency</SelectItem>
            <SelectItem value="Routine Checkup">Routine Checkup</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm">{success}</div>}
      <Button type="submit" className="w-full medical-gradient text-white" disabled={loading}>
        {loading ? 'Booking...' : 'Book Appointment'}
      </Button>
    </form>
  );
};

export default BookAppointmentForm; 