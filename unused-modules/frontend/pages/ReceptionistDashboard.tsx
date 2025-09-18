
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, Users, Phone, UserPlus, Search, AlertTriangle, CheckCircle, Bot } from 'lucide-react';
import { request } from '../lib/api';
import { useAuth } from '../lib/authContext';
import AIChatModal from '../components/AIChatModal';

const ReceptionistDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch all appointments
        const apptRes = await request('/appointments');
        const today = new Date().toISOString().slice(0, 10);
        const todaysAppointments = apptRes.appointments.filter((a: any) => a.date === today);
        setAppointments(todaysAppointments);
        // Stats
        setStats({
          todayAppointments: todaysAppointments.length,
          walkIns: 0, // Simplified for now
          checkedIn: todaysAppointments.filter((a: any) => a.status === 'checked-in').length,
          completed: todaysAppointments.filter((a: any) => a.status === 'completed').length
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === 'receptionist') fetchData();
  }, [user]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  // Mock data - replace with API calls
  // const todayAppointments = [
  //   { id: 1, patient: 'John Doe', doctor: 'Dr. Smith', time: '9:00 AM', status: 'checked-in', type: 'Follow-up' },
  //   { id: 2, patient: 'Jane Smith', doctor: 'Dr. Johnson', time: '10:30 AM', status: 'waiting', type: 'Consultation' },
  //   { id: 3, patient: 'Mike Johnson', doctor: 'Dr. Chen', time: '11:00 AM', status: 'scheduled', type: 'Check-up' },
  //   { id: 4, patient: 'Emergency Patient', doctor: 'Dr. Wilson', time: '11:30 AM', status: 'urgent', type: 'Emergency' }
  // ];

  // const walkInQueue = [
  //   { id: 1, name: 'Sarah Wilson', arrivalTime: '10:45 AM', priority: 'high', reason: 'Chest pain' },
  //   { id: 2, name: 'Tom Brown', arrivalTime: '11:15 AM', priority: 'medium', reason: 'Fever' },
  //   { id: 3, name: 'Lisa Davis', arrivalTime: '11:20 AM', priority: 'low', reason: 'Routine check' }
  // ];

  // const stats = {
  //   todayAppointments: 24,
  //   walkIns: 8,
  //   checkedIn: 15,
  //   completed: 12
  // };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reception Dashboard</h1>
              <p className="text-gray-600">Front Desk Operations</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="destructive" size="sm">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Emergency Registration
              </Button>
              <Button className="medical-gradient text-white" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                New Patient
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.todayAppointments}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Checked In</p>
                  <p className="text-2xl font-bold text-green-600">{stats.checkedIn}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.completed}</p>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Button 
            className="h-16 medical-gradient text-white flex flex-col items-center justify-center"
            onClick={() => {/* Navigate to patient registration */}}
          >
            <UserPlus className="h-5 w-5 mb-1" />
            Register Patient
          </Button>
          <Button 
            variant="outline" 
            className="h-16 flex flex-col items-center justify-center hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
            onClick={() => {/* Open appointment booking modal */}}
          >
            <Calendar className="h-5 w-5 mb-1" />
            Book Appointment
          </Button>
          <Button 
            variant="outline" 
            className="h-16 flex flex-col items-center justify-center hover:bg-green-50 hover:text-green-600 hover:border-green-300"
            onClick={() => {/* Open check-in functionality */}}
          >
            <CheckCircle className="h-5 w-5 mb-1" />
            Check-in Patient
          </Button>
          <Button 
            variant="outline" 
            className="h-16 flex flex-col items-center justify-center hover:bg-red-50 hover:text-red-600 hover:border-red-300"
            onClick={() => {/* Handle emergency registration */}}
          >
            <AlertTriangle className="h-5 w-5 mb-1" />
            Emergency
          </Button>
          <Button 
            variant="outline" 
            className="h-16 flex flex-col items-center justify-center hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
            onClick={() => {/* Open patient calling functionality */}}
          >
            <Phone className="h-5 w-5 mb-1" />
            Call Patient
          </Button>
          <AIChatModal title="AI Reception Assistant - Patient Support">
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300">
              <Bot className="h-5 w-5 mb-1" />
              AI Assistant
            </Button>
          </AIChatModal>
        </div>

        {/* Search Bar */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search patients by name, phone, or ID..."
                  className="pl-10"
                />
              </div>
              <Button onClick={() => {/* Implement patient search functionality */}}>
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Appointments
              </CardTitle>
              <CardDescription>Scheduled appointments for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{appointment.patient}</h4>
                      <p className="text-sm text-gray-600">{appointment.doctor} - {appointment.type}</p>
                      <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        {appointment.time}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        appointment.status === 'urgent' ? 'destructive' :
                        appointment.status === 'checked-in' ? 'default' :
                        appointment.status === 'waiting' ? 'secondary' : 'outline'
                      }>
                        {appointment.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        {appointment.status === 'scheduled' ? 'Check In' : 'View'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Patient Registration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Quick Registration
              </CardTitle>
              <CardDescription>Emergency patient registration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="First Name" />
                  <Input placeholder="Last Name" />
                </div>
                <Input placeholder="Phone Number" />
                <Input placeholder="Date of Birth" type="date" />
                <Input placeholder="Emergency Contact" />
                <div className="flex gap-2">
                  <Button className="flex-1 medical-gradient text-white">
                    Register & Schedule
                  </Button>
                  <Button variant="destructive" className="flex-1">
                    Emergency Registration
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Daily Summary
              </CardTitle>
              <CardDescription>Today's activity overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-900">New Registrations</span>
                  <span className="font-medium text-blue-900">8</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-green-900">Appointments Completed</span>
                  <span className="font-medium text-green-900">12</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm text-green-900">Appointments Completed</span>
                  <span className="font-medium text-orange-900">5</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-sm text-red-900">Emergency Cases</span>
                  <span className="font-medium text-red-900">3</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
