
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Calendar, DollarSign, Activity, Settings, Database, AlertTriangle, TrendingUp, Building, Bot, Plus, Edit, Trash2, MapPin, Download, FileText, RefreshCw } from 'lucide-react';
import { request } from '../lib/api';
import { useAuth } from '../lib/authContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import AIChatModal from '../components/AIChatModal';
import { logout } from '../lib/api';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
 const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>({});
  const [activities, setActivities] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'doctor', contact: '', specialty: '', department: '' });
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState('');
  const [addUserSuccess, setAddUserSuccess] = useState('');
  const [activeSection, setActiveSection] = useState('user-management');
  const [showEditUser, setShowEditUser] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [editUserLoading, setEditUserLoading] = useState(false);
  const [editUserError, setEditUserError] = useState('');
  const [editUserSuccess, setEditUserSuccess] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [showDeleteUser, setShowDeleteUser] = useState(false);
  const [deleteUser, setDeleteUser] = useState<any>(null);
  const [deleteUserLoading, setDeleteUserLoading] = useState(false);
  const [deleteUserError, setDeleteUserError] = useState('');
  const [deleteUserSuccess, setDeleteUserSuccess] = useState('');
  
  // Department management state
  const [showAddDepartment, setShowAddDepartment] = useState(false);
  const [showEditDepartment, setShowEditDepartment] = useState(false);
  const [showDeleteDepartment, setShowDeleteDepartment] = useState(false);
  const [departmentForm, setDepartmentForm] = useState({ name: '', description: '', location: '', head: '' });
  const [editingDepartment, setEditingDepartment] = useState<any>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<any>(null);
  const [departmentLoading, setDepartmentLoading] = useState(false);
  const [departmentError, setDepartmentError] = useState('');
  const [departmentSuccess, setDepartmentSuccess] = useState('');

  const navigate = useNavigate();

  // Fetch users separately for easier refresh
  const fetchUsers = async () => {
    try {
      const staffRes = await request('/users');
      const hospitalId = user?.hospitalId;
      setUsers((staffRes.users || []).filter((u: any) => u.hospitalId === hospitalId));
    } catch (err) {
      setUsers([]);
    }
  };

  // Main dashboard data fetcher
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch stats
      const patientsRes = await request('/patients');
      const doctorsRes = await request('/doctors');
      const staffRes = await request('/users'); // You may need a /users endpoint for all staff
      const appointmentsRes = await request('/appointments');
      const approvalsRes = await request('/approvals');
      const departmentsRes = await request('/departments');
      const activitiesRes = await request('/activities');
      // Filter everything by hospitalId
      const hospitalId = user?.hospitalId;
      const filteredPatients = patientsRes.patients.filter((p: any) => p.user?.hospitalId === hospitalId);
      const filteredDoctors = doctorsRes.doctors.filter((d: any) => d.user?.hospitalId === hospitalId);
      const filteredStaff = staffRes?.users?.filter((u: any) => u.hospitalId === hospitalId) || [];
      const filteredAppointments = appointmentsRes.appointments.filter((a: any) => a.hospitalId === hospitalId);
      const filteredApprovals = approvalsRes.approvals.filter((a: any) => a.hospitalId === hospitalId);
      const filteredDepartments = departmentsRes.departments.filter((d: any) => d.hospitalId === hospitalId);
      const filteredActivities = activitiesRes.activities.filter((a: any) => a.hospitalId === hospitalId);
      setStats({
        totalPatients: filteredPatients.length,
        totalDoctors: filteredDoctors.length,
        totalStaff: filteredStaff.length,
        monthlyRevenue: 0, // Placeholder, implement if you have revenue data
        todayAppointments: filteredAppointments.filter((a: any) => a.date === new Date().toISOString().slice(0, 10)).length,
        systemUptime: '99.9%', // Placeholder
        activeUsers: filteredStaff.length, // Placeholder
        pendingApprovals: filteredApprovals.length
      });
      setActivities(filteredActivities);
      setApprovals(filteredApprovals);
      setDepartments(filteredDepartments);
      setUsers(filteredStaff);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') fetchData();
  }, [user]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserLoading(true);
    setAddUserError('');
    setAddUserSuccess('');
    try {
      await request('/users', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setAddUserSuccess('User added successfully!');
      setForm({ name: '', email: '', password: '', role: 'doctor', contact: '', specialty: '', department: '' });
      setShowAddUser(false); // Close modal
      fetchData(); // Refresh everything
    } catch (err: any) {
      setAddUserError(err.message);
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleEditUser = (user: any) => {
    setEditUser(user);
    setShowEditUser(true);
    setEditUserError('');
    setEditUserSuccess('');
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditUserLoading(true);
    setEditUserError('');
    setEditUserSuccess('');
    try {
      await request(`/users/${editUser._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editUser.name,
          email: editUser.email,
          role: editUser.role,
          contact: editUser.contact,
        }),
      });
      setEditUserSuccess('User updated successfully!');
      setShowEditUser(false);
      fetchData(); // Refresh everything
    } catch (err: any) {
      setEditUserError(err.message);
    } finally {
      setEditUserLoading(false);
    }
  };

  const handleDeleteUser = (user: any) => {
    setDeleteUser(user);
    setShowDeleteUser(true);
    setDeleteUserError('');
    setDeleteUserSuccess('');
  };

  const handleDeleteUserConfirm = async () => {
    setDeleteUserLoading(true);
    setDeleteUserError('');
    setDeleteUserSuccess('');
    try {
      await request(`/users/${deleteUser._id}`, { method: 'DELETE' });
      setDeleteUserSuccess('User deleted successfully!');
      setShowDeleteUser(false);
      fetchData(); // Refresh everything
    } catch (err: any) {
      setDeleteUserError(err.message);
    } finally {
      setDeleteUserLoading(false);
    }
  };

  const handleToggleActive = async (user: any) => {
    try {
      await request(`/users/${user._id}/toggle-active`, { method: 'PATCH' });
      fetchData();
    } catch (err) {
      // Optionally show error
    }
  };

  // Department Management Functions
  const handleAddDepartment = async () => {
    setDepartmentLoading(true);
    setDepartmentError('');
    setDepartmentSuccess('');
    try {
      await request('/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(departmentForm)
      });
      setDepartmentSuccess('Department added successfully!');
      setShowAddDepartment(false);
      setDepartmentForm({ name: '', description: '', location: '', head: '' });
      fetchData(); // Refresh data
    } catch (err: any) {
      setDepartmentError(err.message);
    } finally {
      setDepartmentLoading(false);
    }
  };

  const handleEditDepartment = (department: any) => {
    setEditingDepartment(department);
    setDepartmentForm({
      name: department.name,
      description: department.description || '',
      location: department.location || '',
      head: department.head || ''
    });
    setShowEditDepartment(true);
    setDepartmentError('');
    setDepartmentSuccess('');
  };

  const handleUpdateDepartment = async () => {
    setDepartmentLoading(true);
    setDepartmentError('');
    setDepartmentSuccess('');
    try {
      await request(`/departments/${editingDepartment._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(departmentForm)
      });
      setDepartmentSuccess('Department updated successfully!');
      setShowEditDepartment(false);
      setDepartmentForm({ name: '', description: '', location: '', head: '' });
      setEditingDepartment(null);
      fetchData(); // Refresh data
    } catch (err: any) {
      setDepartmentError(err.message);
    } finally {
      setDepartmentLoading(false);
    }
  };

  const handleDeleteDepartment = async (department: any) => {
    if (window.confirm(`Are you sure you want to delete the ${department.name} department?`)) {
      try {
        await request(`/departments/${department._id}`, { method: 'DELETE' });
        fetchData(); // Refresh data
      } catch (err: any) {
        setDepartmentError(err.message);
      }
    }
  };

  // Reports Functions
  const handleExportData = () => {
    // Basic CSV export functionality
    const csvData = [
      ['Type', 'Count', 'Status'],
      ['Patients', stats.totalPatients, 'Active'],
      ['Doctors', stats.totalDoctors, 'Active'],
      ['Staff', stats.totalStaff, 'Active'],
      ['Today Appointments', stats.todayAppointments, 'Scheduled'],
      ['Active Users', stats.activeUsers, 'Online'],
      ['Pending Approvals', stats.pendingApprovals, 'Pending']
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medsync_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleGenerateReport = () => {
    // Generate comprehensive report
    const reportWindow = window.open('', '_blank');
    if (reportWindow) {
      reportWindow.document.write(`
        <html>
          <head>
            <title>MedSync System Report - ${new Date().toLocaleDateString()}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; border-bottom: 2px solid #1795d4; padding-bottom: 10px; }
              .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
              .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
              .stat-title { font-weight: bold; color: #1795d4; }
              .stat-value { font-size: 24px; font-weight: bold; margin: 5px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>MedSync Hospital Management System</h1>
              <h2>System Report - ${new Date().toLocaleDateString()}</h2>
            </div>
            <div class="stats">
              <div class="stat-card">
                <div class="stat-title">Total Patients</div>
                <div class="stat-value">${stats.totalPatients}</div>
              </div>
              <div class="stat-card">
                <div class="stat-title">Total Doctors</div>
                <div class="stat-value">${stats.totalDoctors}</div>
              </div>
              <div class="stat-card">
                <div class="stat-title">Total Staff</div>
                <div class="stat-value">${stats.totalStaff}</div>
              </div>
              <div class="stat-card">
                <div class="stat-title">Today's Appointments</div>
                <div class="stat-value">${stats.todayAppointments}</div>
              </div>
              <div class="stat-card">
                <div class="stat-title">System Uptime</div>
                <div class="stat-value">${stats.systemUptime}</div>
              </div>
              <div class="stat-card">
                <div class="stat-title">Active Users</div>
                <div class="stat-value">${stats.activeUsers}</div>
              </div>
            </div>
            <div style="margin-top: 30px; text-align: center; color: #666;">
              <p>Generated on ${new Date().toLocaleString()}</p>
            </div>
          </body>
        </html>
      `);
      reportWindow.document.close();
    }
  };

  const handleRefreshMonitoring = () => {
    fetchData(); // Refresh all data
  };

  // Quick Report Functions
  const handleQuickReport = (reportType: string) => {
    // Simple implementation for quick reports
    alert(`Generating ${reportType}... This feature will be available in the next update.`);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  // Mock data - replace with API calls
  // const systemStats = {
  //   totalPatients: 1247,
  //   totalDoctors: 12,
  //   totalStaff: 35,
  //   monthlyRevenue: 125000,
  //   todayAppointments: 89,
  //   systemUptime: '99.9%',
  //   activeUsers: 156,
  //   pendingApprovals: 7
  // };

  // const recentActivities = [
  //   { id: 1, type: 'user_registration', message: 'New doctor registered: Dr. John Smith', time: '2 hours ago', priority: 'normal' },
  //   { id: 2, type: 'system_alert', message: 'Database backup completed successfully', time: '4 hours ago', priority: 'low' },
  //   { id: 3, type: 'security', message: 'Failed login attempts detected', time: '6 hours ago', priority: 'high' },
  //   { id: 4, type: 'maintenance', message: 'System maintenance scheduled for tonight', time: '8 hours ago', priority: 'medium' }
  // ];

  // const pendingApprovals = [
  //   { id: 1, type: 'Doctor Registration', name: 'Dr. Sarah Wilson', department: 'Cardiology', date: '2024-01-15' },
  //   { id: 2, type: 'Staff Leave Request', name: 'Nurse Johnson', department: 'Emergency', date: '2024-01-14' },
  //   { id: 3, type: 'Equipment Purchase', name: 'MRI Machine Upgrade', department: 'Radiology', date: '2024-01-13' }
  // ];

  // const departmentStats = [
  //   { name: 'Emergency', patients: 45, staff: 8, utilization: '85%', status: 'high' },
  //   { name: 'Cardiology', patients: 32, staff: 5, utilization: '70%', status: 'normal' },
  //   { name: 'Pediatrics', patients: 28, staff: 6, utilization: '60%', status: 'normal' },
  //   { name: 'Orthopedics', patients: 22, staff: 4, utilization: '55%', status: 'low' }
  // ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Hospital Management & Administration</p>
            </div>
            <div className="flex items-center space-x-4">
              <AIChatModal title="AI Administrative Assistant - Hospital Management">
                <Button variant="outline" className="flex items-center space-x-2 hover:bg-purple-50 border-purple-200 hover:border-purple-300">
                  <Bot className="h-4 w-4 text-purple-600" />
                  <span>AI Assistant</span>
                </Button>
              </AIChatModal>
              <Button
                variant="outline"
                size="sm"
                className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
                onClick={() => {
                  logout();
                  setTimeout(() => navigate('/'), 100);
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Patients</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalPatients?.toLocaleString?.() ?? 0}</p>
                  <p className="text-xs text-green-600">+12% from last month</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-green-600">${stats.monthlyRevenue?.toLocaleString?.() ?? 0}</p>
                  <p className="text-xs text-green-600">+8% from last month</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.todayAppointments ?? 0}</p>
                  <p className="text-xs text-purple-600">Peak at 2-4 PM</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Uptime</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.systemUptime ?? '99.9%'}</p>
                  <p className="text-xs text-green-600">Excellent performance</p>
                </div>
                <Activity className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-lg font-bold">{stats.activeUsers ?? 0}</p>
                </div>
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Doctors</p>
                  <p className="text-lg font-bold">{stats.totalDoctors ?? 0}</p>
                </div>
                <Shield className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Staff</p>
                  <p className="text-lg font-bold">{stats.totalStaff ?? 0}</p>
                </div>
                <Building className="h-6 w-6 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Approvals</p>
                  <p className="text-lg font-bold">{stats.pendingApprovals ?? 0}</p>
                </div>
                <AlertTriangle className="h-6 w-6 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions as Section Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Button 
            className={`h-16 flex flex-col items-center justify-center space-y-1 transition-all ${
              activeSection === 'user-management' 
                ? 'medical-gradient text-white shadow-lg' 
                : 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 hover:border-blue-300'
            }`} 
            onClick={() => setActiveSection('user-management')}
          >
            <Users className="h-5 w-5" />
            <span className="text-xs font-medium">User Management</span>
          </Button>
          <Button 
            className={`h-16 flex flex-col items-center justify-center space-y-1 transition-all ${
              activeSection === 'departments' 
                ? 'medical-gradient text-white shadow-lg' 
                : 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 hover:border-blue-300'
            }`} 
            onClick={() => setActiveSection('departments')}
          >
            <Building className="h-5 w-5" />
            <span className="text-xs font-medium">Departments</span>
          </Button>
          <Button 
            className={`h-16 flex flex-col items-center justify-center space-y-1 transition-all ${
              activeSection === 'reports' 
                ? 'medical-gradient text-white shadow-lg' 
                : 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 hover:border-blue-300'
            }`} 
            onClick={() => setActiveSection('reports')}
          >
            <TrendingUp className="h-5 w-5" />
            <span className="text-xs font-medium">Reports</span>
          </Button>
          <Button 
            className={`h-16 flex flex-col items-center justify-center space-y-1 transition-all ${
              activeSection === 'monitoring' 
                ? 'medical-gradient text-white shadow-lg' 
                : 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 hover:border-blue-300'
            }`} 
            onClick={() => setActiveSection('monitoring')}
          >
            <Activity className="h-5 w-5" />
            <span className="text-xs font-medium">System Monitor</span>
          </Button>
        </div>

        {/* Section Content Below Cards */}
        {activeSection === 'user-management' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Users</h2>
              <Button className="medical-gradient text-white" onClick={() => setShowAddUser(true)}>
                Add User
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: any) => (
                    <TableRow key={user._id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</TableCell>
                      <TableCell>{user.contact || '-'}</TableCell>
                      <TableCell>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${user.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>{user.active ? 'Active' : 'Inactive'}</span>
                        <Switch checked={user.active} onCheckedChange={() => handleToggleActive(user)} className="ml-2 align-middle" />
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="mr-2 text-blue-600 border border-gray-300 hover:bg-blue-100 hover:text-blue-800 transition-colors" onClick={() => handleEditUser(user)}>Edit</Button>
                        <Button size="sm" variant="ghost" className="mr-2 text-red-600 border border-gray-300 hover:bg-red-100 hover:text-red-800 transition-colors" onClick={() => handleDeleteUser(user)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Add User Dialog (reuse your existing code, but remove floating button) */}
            <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
              <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto mx-4">
                <DialogHeader><DialogTitle>Add User</DialogTitle></DialogHeader>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <Input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  <Input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                  <Input placeholder="Contact" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
                  <Select value={form.role} onValueChange={role => setForm({ ...form, role })}>
                    <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                      <SelectItem value="pharmacist">Pharmacist</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.role === 'doctor' && (
                    <>
                      <Input placeholder="Specialty" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} />
                      <Input placeholder="Department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
                    </>
                  )}
                  <div className="text-sm text-gray-600">A password will be auto-generated and sent to the user's email. They must change it before first use.</div>
                  {addUserError && <div className="text-red-500 text-sm">{addUserError}</div>}
                  {addUserSuccess && <div className="text-green-600 text-sm">{addUserSuccess}</div>}
                  <Button type="submit" className="w-full medical-gradient text-white" disabled={addUserLoading}>
                    {addUserLoading ? 'Adding...' : 'Add User'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            {/* Edit User Dialog */}
            <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
              <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto mx-4">
                <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
                {editUser && (
                  <form onSubmit={handleEditUserSubmit} className="space-y-4">
                    <Input placeholder="Name" value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })} required />
                    <Input placeholder="Email" type="email" value={editUser.email} onChange={e => setEditUser({ ...editUser, email: e.target.value })} required />
                    <Input placeholder="Contact" value={editUser.contact} onChange={e => setEditUser({ ...editUser, contact: e.target.value })} />
                    <Select value={editUser.role} onValueChange={role => setEditUser({ ...editUser, role })}>
                      <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="receptionist">Receptionist</SelectItem>
                        <SelectItem value="pharmacist">Pharmacist</SelectItem>
                      </SelectContent>
                    </Select>
                    {editUserError && <div className="text-red-500 text-sm">{editUserError}</div>}
                    {editUserSuccess && <div className="text-green-600 text-sm">{editUserSuccess}</div>}
                    <Button type="submit" className="w-full medical-gradient text-white" disabled={editUserLoading}>
                      {editUserLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </form>
                )}
              </DialogContent>
            </Dialog>
            {/* Delete User Dialog */}
            <Dialog open={showDeleteUser} onOpenChange={setShowDeleteUser}>
              <DialogContent className="max-w-lg w-[95vw] sm:w-full mx-4">
                <DialogHeader><DialogTitle>Delete User</DialogTitle></DialogHeader>
                {deleteUser && (
                  <div className="space-y-4">
                    <div>Are you sure you want to delete <span className="font-semibold">{deleteUser.name}</span> ({deleteUser.email})?</div>
                    {deleteUserError && <div className="text-red-500 text-sm">{deleteUserError}</div>}
                    {deleteUserSuccess && <div className="text-green-600 text-sm">{deleteUserSuccess}</div>}
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setShowDeleteUser(false)} disabled={deleteUserLoading}>Cancel</Button>
                      <Button variant="destructive" onClick={handleDeleteUserConfirm} disabled={deleteUserLoading}>
                        {deleteUserLoading ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Add Department Modal */}
        <Dialog open={showAddDepartment} onOpenChange={setShowAddDepartment}>
          <DialogContent className="max-w-lg w-[95vw] sm:w-full mx-4">
            <DialogHeader>
              <DialogTitle>Add New Department</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddDepartment();
            }} className="space-y-4">
              <div>
                <label htmlFor="dept-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name *
                </label>
                <Input
                  id="dept-name"
                  type="text"
                  value={departmentForm.name}
                  onChange={(e) => setDepartmentForm({...departmentForm, name: e.target.value})}
                  placeholder="Enter department name"
                  required
                />
              </div>
              <div>
                <label htmlFor="dept-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="dept-description"
                  value={departmentForm.description}
                  onChange={(e) => setDepartmentForm({...departmentForm, description: e.target.value})}
                  placeholder="Enter department description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div>
                <label htmlFor="dept-location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <Input
                  id="dept-location"
                  type="text"
                  value={departmentForm.location}
                  onChange={(e) => setDepartmentForm({...departmentForm, location: e.target.value})}
                  placeholder="Enter department location"
                />
              </div>
              <div>
                <label htmlFor="dept-head" className="block text-sm font-medium text-gray-700 mb-1">
                  Department Head
                </label>
                <Input
                  id="dept-head"
                  type="text"
                  value={departmentForm.head}
                  onChange={(e) => setDepartmentForm({...departmentForm, head: e.target.value})}
                  placeholder="Enter department head name"
                />
              </div>
              {departmentError && <div className="text-red-500 text-sm">{departmentError}</div>}
              {departmentSuccess && <div className="text-green-600 text-sm">{departmentSuccess}</div>}
              <div className="flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddDepartment(false)}
                  disabled={departmentLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="medical-gradient text-white"
                  disabled={departmentLoading}
                >
                  {departmentLoading ? 'Adding...' : 'Add Department'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Department Modal */}
        <Dialog open={showEditDepartment} onOpenChange={setShowEditDepartment}>
          <DialogContent className="max-w-lg w-[95vw] sm:w-full mx-4">
            <DialogHeader>
              <DialogTitle>Edit Department</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateDepartment();
            }} className="space-y-4">
              <div>
                <label htmlFor="edit-dept-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name *
                </label>
                <Input
                  id="edit-dept-name"
                  type="text"
                  value={departmentForm.name}
                  onChange={(e) => setDepartmentForm({...departmentForm, name: e.target.value})}
                  placeholder="Enter department name"
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-dept-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="edit-dept-description"
                  value={departmentForm.description}
                  onChange={(e) => setDepartmentForm({...departmentForm, description: e.target.value})}
                  placeholder="Enter department description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div>
                <label htmlFor="edit-dept-location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <Input
                  id="edit-dept-location"
                  type="text"
                  value={departmentForm.location}
                  onChange={(e) => setDepartmentForm({...departmentForm, location: e.target.value})}
                  placeholder="Enter department location"
                />
              </div>
              <div>
                <label htmlFor="edit-dept-head" className="block text-sm font-medium text-gray-700 mb-1">
                  Department Head
                </label>
                <Input
                  id="edit-dept-head"
                  type="text"
                  value={departmentForm.head}
                  onChange={(e) => setDepartmentForm({...departmentForm, head: e.target.value})}
                  placeholder="Enter department head name"
                />
              </div>
              {departmentError && <div className="text-red-500 text-sm">{departmentError}</div>}
              {departmentSuccess && <div className="text-green-600 text-sm">{departmentSuccess}</div>}
              <div className="flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditDepartment(false)}
                  disabled={departmentLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="medical-gradient text-white"
                  disabled={departmentLoading}
                >
                  {departmentLoading ? 'Updating...' : 'Update Department'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Departments Section */}
        {activeSection === 'departments' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Hospital Departments</h2>
              <Button 
                className="medical-gradient text-white"
                onClick={() => setShowAddDepartment(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Department
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((dept: any) => (
                <Card key={dept._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{dept.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{dept.description}</p>
                        <div className="flex items-center mt-3 space-x-4">
                          <div className="flex items-center text-sm text-gray-500">
                            <Users className="h-4 w-4 mr-1" />
                            {dept.staffCount || 0} Staff
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="h-4 w-4 mr-1" />
                            {dept.location || 'Not set'}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditDepartment(dept)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteDepartment(dept)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {departments.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <Building className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No departments found. Add your first department to get started.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reports Section */}
        {activeSection === 'reports' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Reports & Analytics</h2>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleExportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button className="medical-gradient text-white" onClick={handleGenerateReport}>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </div>
            
            {/* Report Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Patient Analytics</h3>
                      <p className="text-sm text-gray-600 mt-1">Registration trends, demographics</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold text-blue-600">{stats.totalPatients}</p>
                    <p className="text-xs text-green-600">+12% this month</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Appointment Trends</h3>
                      <p className="text-sm text-gray-600 mt-1">Booking patterns, no-shows</p>
                    </div>
                    <Calendar className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold text-green-600">{stats.todayAppointments}</p>
                    <p className="text-xs text-green-600">Today's appointments</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Staff Performance</h3>
                      <p className="text-sm text-gray-600 mt-1">Productivity, attendance</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold text-purple-600">{stats.totalStaff}</p>
                    <p className="text-xs text-green-600">Active staff members</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Report Actions */}
            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-4">Quick Reports</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button variant="outline" className="justify-start" onClick={() => handleQuickReport('Daily Summary')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Daily Summary
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => handleQuickReport('Weekly Report')}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Weekly Report
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => handleQuickReport('Monthly Analytics')}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Monthly Analytics
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => handleQuickReport('Staff Report')}>
                  <Users className="h-4 w-4 mr-2" />
                  Staff Report
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* System Monitoring Section */}
        {activeSection === 'monitoring' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">System Monitoring</h2>
              <div className="flex items-center space-x-2">
                <div className="flex items-center text-sm text-green-600">
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                  System Online
                </div>
                <Button variant="outline" size="sm" onClick={handleRefreshMonitoring}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* System Health Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">System Uptime</p>
                      <p className="text-lg font-bold text-green-600">{stats.systemUptime}</p>
                    </div>
                    <Activity className="h-6 w-6 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Sessions</p>
                      <p className="text-lg font-bold text-blue-600">{stats.activeUsers}</p>
                    </div>
                    <Users className="h-6 w-6 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pending Tasks</p>
                      <p className="text-lg font-bold text-orange-600">{stats.pendingApprovals}</p>
                    </div>
                    <AlertTriangle className="h-6 w-6 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Data Sync</p>
                      <p className="text-lg font-bold text-green-600">OK</p>
                    </div>
                    <Database className="h-6 w-6 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activities */}
            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-4">Recent System Activities</h3>
              <div className="space-y-3">
                {activities.slice(0, 5).map((activity: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{activity.description || activity.action}</p>
                        <p className="text-xs text-gray-500">{activity.user?.name || 'System'}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(activity.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
                {activities.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <Activity className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No recent activities to display</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
