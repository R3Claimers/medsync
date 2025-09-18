import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Calendar, Building, Bot, Plus, Edit, Trash2, RefreshCw, LogOut, Activity } from 'lucide-react';
import { request } from '../lib/api';
import { useAuth } from '../lib/authContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import AIChatModal from '../components/AIChatModal';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>({});
  const [activities, setActivities] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'doctor', contact: '', specialty: '' });
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
      const staffRes = await request('/users');
      const appointmentsRes = await request('/appointments');
      const approvalsRes = await request('/approvals');
      const activitiesRes = await request('/activities');
      
      // Filter everything by hospitalId
      const hospitalId = user?.hospitalId;
      const filteredPatients = patientsRes.patients.filter((p: any) => p.user?.hospitalId === hospitalId);
      const filteredDoctors = doctorsRes.doctors.filter((d: any) => d.user?.hospitalId === hospitalId);
      const filteredStaff = staffRes?.users?.filter((u: any) => u.hospitalId === hospitalId) || [];
      const filteredAppointments = appointmentsRes.appointments.filter((a: any) => a.hospitalId === hospitalId);
      const filteredApprovals = approvalsRes.approvals.filter((a: any) => a.hospitalId === hospitalId);
      const filteredActivities = activitiesRes.activities.filter((a: any) => a.hospitalId === hospitalId);
      
      setStats({
        totalPatients: filteredPatients.length,
        totalDoctors: filteredDoctors.length,
        totalStaff: filteredStaff.length,
        monthlyRevenue: 0,
        todayAppointments: filteredAppointments.filter((a: any) => 
          a.date === new Date().toISOString().slice(0, 10)
        ).length,
        systemUptime: '99.9%',
        activeUsers: filteredStaff.length,
        pendingApprovals: filteredApprovals.length
      });
      
      setUsers(filteredStaff);
      setActivities(filteredActivities.slice(0, 10));
      setApprovals(filteredApprovals.slice(0, 5));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') fetchData();
  }, [user]);

  // Add User Function
  const handleAddUser = async () => {
    setAddUserLoading(true);
    setAddUserError('');
    setAddUserSuccess('');
    try {
      const response = await request('/auth/create-doctor', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          contact: form.contact,
          specialty: form.specialty,
          department: form.specialty // Using specialty as department for now
        })
      });
      
      const emailMessage = response.emailSent 
        ? ' Login credentials have been sent to their email.' 
        : ' Please manually provide login credentials.';
      
      setAddUserSuccess(`Doctor created successfully!${emailMessage}`);
      setShowAddUser(false);
      setForm({ name: '', email: '', role: 'doctor', contact: '', specialty: '' });
      fetchUsers(); // Auto-refresh the users list
    } catch (err: any) {
      setAddUserError(err.message);
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleEditUserClick = (userToEdit: any) => {
    setEditUser(userToEdit);
    setForm({
      name: userToEdit.name,
      email: userToEdit.email,
      role: userToEdit.role,
      contact: userToEdit.contact || '',
      specialty: userToEdit.specialty || ''
    });
    setShowEditUser(true);
  };

  const handleUpdateUser = async () => {
    setEditUserLoading(true);
    setEditUserError('');
    setEditUserSuccess('');
    try {
      await request(`/users/${editUser._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          role: form.role,
          contact: form.contact,
          specialty: form.specialty
        })
      });
      setEditUserSuccess('User updated successfully!');
      setShowEditUser(false);
      setEditUser(null);
      setForm({ name: '', email: '', role: 'doctor', contact: '', specialty: '' });
      fetchUsers();
    } catch (err: any) {
      setEditUserError(err.message);
    } finally {
      setEditUserLoading(false);
    }
  };

  const handleDeleteUserClick = (userToDelete: any) => {
    setDeleteUser(userToDelete);
    setShowDeleteUser(true);
  };

  const handleConfirmDeleteUser = async () => {
    setDeleteUserLoading(true);
    setDeleteUserError('');
    setDeleteUserSuccess('');
    try {
      await request(`/users/${deleteUser._id}`, {
        method: 'DELETE'
      });
      setDeleteUserSuccess('User deleted successfully!');
      setShowDeleteUser(false);
      setDeleteUser(null);
      fetchUsers();
    } catch (err: any) {
      setDeleteUserError(err.message);
    } finally {
      setDeleteUserLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading admin dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">
                {user?.name ? `${user.name} - Hospital Administrator` : 'Hospital Administrator'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <AIChatModal title="AI Administrative Assistant">
                <Button
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Bot className="h-4 w-4" />
                  AI Assistant
                </Button>
              </AIChatModal>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPatients || 0}</div>
              <p className="text-xs text-gray-600">Registered patients</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
              <Shield className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDoctors || 0}</div>
              <p className="text-xs text-gray-600">Active doctors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayAppointments || 0}</div>
              <p className="text-xs text-gray-600">Scheduled for today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <Building className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStaff || 0}</div>
              <p className="text-xs text-gray-600">Hospital staff</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeSection} onValueChange={setActiveSection}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="user-management">User Management</TabsTrigger>
            <TabsTrigger value="approvals">Approvals</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="user-management" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Staff Management</CardTitle>
                    <CardDescription>Manage hospital staff members</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={fetchUsers} variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
                      <DialogTrigger asChild>
                        <Button className="medical-gradient text-white">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Staff
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Doctor</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="Full Name"
                            value={form.name}
                            onChange={(e) => setForm({...form, name: e.target.value})}
                          />
                          <Input
                            placeholder="Email"
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({...form, email: e.target.value})}
                          />
                          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                            <p className="text-sm text-blue-800">
                              <strong>Note:</strong> A temporary password will be auto-generated and sent to the doctor's email. 
                              They will be required to change it on first login.
                            </p>
                          </div>
                          <Select value={form.role} onValueChange={(value) => setForm({...form, role: value})} disabled>
                            <SelectTrigger>
                              <SelectValue placeholder="Role: Doctor" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="doctor">Doctor</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Contact Number"
                            value={form.contact}
                            onChange={(e) => setForm({...form, contact: e.target.value})}
                          />
                          <Input
                            placeholder="Specialty (e.g., Cardiology, Pediatrics)"
                            value={form.specialty}
                            onChange={(e) => setForm({...form, specialty: e.target.value})}
                          />
                          {addUserError && <p className="text-red-500 text-sm">{addUserError}</p>}
                          {addUserSuccess && <p className="text-green-500 text-sm">{addUserSuccess}</p>}
                          <div className="flex gap-2">
                            <Button 
                              onClick={handleAddUser} 
                              disabled={addUserLoading}
                              className="flex-1 medical-gradient text-white"
                            >
                              {addUserLoading ? 'Adding...' : 'Add Staff'}
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setShowAddUser(false)}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
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
                      {users.map((staff) => (
                        <TableRow key={staff._id}>
                          <TableCell className="font-medium">{staff.name}</TableCell>
                          <TableCell>{staff.email}</TableCell>
                          <TableCell>
                            <Badge variant={staff.role === 'doctor' ? 'default' : staff.role === 'admin' ? 'destructive' : 'secondary'}>
                              {staff.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{staff.contact || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-green-600 border-green-200">
                              Active
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditUserClick(staff)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteUserClick(staff)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {users.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No staff members found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approvals Tab */}
          <TabsContent value="approvals" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>Review and approve pending requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {approvals.length > 0 ? approvals.map((approval) => (
                    <div key={approval._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{approval.type}</p>
                        <p className="text-sm text-gray-600">{approval.description}</p>
                        <p className="text-xs text-gray-500">
                          Requested: {new Date(approval.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" className="medical-gradient text-white">
                          Approve
                        </Button>
                        <Button size="sm" variant="outline">
                          Reject
                        </Button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-gray-500">
                      No pending approvals
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest system activities and logs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.length > 0 ? activities.map((activity) => (
                    <div key={activity._id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <Activity className="h-5 w-5 text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-gray-500">
                      No recent activities
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit User Modal */}
      <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
            />
            <Input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({...form, email: e.target.value})}
            />
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Password changes are not supported through this form. 
                Users can reset their passwords using the "Forgot Password" feature.
              </p>
            </div>
            <Select value={form.role} onValueChange={(value) => setForm({...form, role: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="patient">Patient</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Contact Number"
              value={form.contact}
              onChange={(e) => setForm({...form, contact: e.target.value})}
            />
            {form.role === 'doctor' && (
              <Input
                placeholder="Specialty"
                value={form.specialty}
                onChange={(e) => setForm({...form, specialty: e.target.value})}
              />
            )}
            {editUserError && <p className="text-red-500 text-sm">{editUserError}</p>}
            {editUserSuccess && <p className="text-green-500 text-sm">{editUserSuccess}</p>}
            <div className="flex gap-2">
              <Button 
                onClick={handleUpdateUser} 
                disabled={editUserLoading}
                className="flex-1 medical-gradient text-white"
              >
                {editUserLoading ? 'Updating...' : 'Update Staff'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowEditUser(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete User Modal */}
      <Dialog open={showDeleteUser} onOpenChange={setShowDeleteUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to delete <strong>{deleteUser?.name}</strong>? This action cannot be undone.</p>
            {deleteUserError && <p className="text-red-500 text-sm">{deleteUserError}</p>}
            {deleteUserSuccess && <p className="text-green-500 text-sm">{deleteUserSuccess}</p>}
            <div className="flex gap-2">
              <Button 
                onClick={handleConfirmDeleteUser} 
                disabled={deleteUserLoading}
                variant="destructive"
                className="flex-1"
              >
                {deleteUserLoading ? 'Deleting...' : 'Delete'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteUser(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;