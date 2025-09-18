import React, { useEffect, useState } from 'react';
import { request } from '../lib/api';
import { useAuth } from '../lib/authContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showHospitalForm, setShowHospitalForm] = useState(false);
  const [editingHospital, setEditingHospital] = useState<any>(null);
  const [hospitalForm, setHospitalForm] = useState({ name: '', address: '', contact: '', adminName: '', adminEmail: '', adminPassword: '', adminContact: '' });
  const [adminForms, setAdminForms] = useState<{ [hospitalId: string]: boolean }>({});
  const [adminInputs, setAdminInputs] = useState<{ [hospitalId: string]: { name: string; email: string; password: string; contact: string } }>({});
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user?.role !== 'super-admin') return;
    fetchHospitals();
  }, [user]);

  const fetchHospitals = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await request('/superadmin/hospitals');
      setHospitals(res.hospitals);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShowHospitalForm = (hospital: any = null) => {
    setShowHospitalForm(true);
    setEditingHospital(hospital);
    setHospitalForm(hospital ? {
      name: hospital.name || '',
      address: hospital.address || '',
      contact: hospital.contact || '',
      adminName: hospital.admins && hospital.admins.length > 0 ? hospital.admins[0].name || '' : '',
      adminEmail: hospital.admins && hospital.admins.length > 0 ? hospital.admins[0].email || '' : '',
      adminPassword: '', // Password is not stored in the hospital object, so it's empty
      adminContact: hospital.admins && hospital.admins.length > 0 ? hospital.admins[0].contact || '' : '',
    } : { name: '', address: '', contact: '', adminName: '', adminEmail: '', adminPassword: '', adminContact: '' });
  };

  const handleHospitalFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHospitalForm({ ...hospitalForm, [e.target.name]: e.target.value });
  };

  const handleCreateOrUpdateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingHospital) {
        await request(`/superadmin/hospitals/${editingHospital._id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: hospitalForm.name, address: hospitalForm.address, contact: hospitalForm.contact }),
        });
        toast({
          title: "Success",
          description: "Hospital updated successfully",
        });
      } else {
        await request('/superadmin/hospitals', {
          method: 'POST',
          body: JSON.stringify({
            hospitalName: hospitalForm.name,
            hospitalAddress: hospitalForm.address,
            hospitalContact: hospitalForm.contact,
            adminName: hospitalForm.adminName,
            adminEmail: hospitalForm.adminEmail,
            adminContact: hospitalForm.adminContact,
          }),
        });
        toast({
          title: "Success",
          description: "Hospital and admin created successfully",
        });
      }
      setShowHospitalForm(false);
      setEditingHospital(null);
      setHospitalForm({ name: '', address: '', contact: '', adminName: '', adminEmail: '', adminPassword: '', adminContact: '' });
      await fetchHospitals();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteHospital = async (hospitalId: string) => {
    if (!window.confirm('Are you sure you want to delete this hospital?')) return;
    setActionLoading(true);
    try {
      await request(`/superadmin/hospitals/${hospitalId}`, { method: 'DELETE' });
      toast({
        title: "Success",
        description: "Hospital deleted successfully",
      });
      await fetchHospitals();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleShowAdminForm = (hospitalId: string, admin: any = null) => {
    setAdminForms((prev) => ({ ...prev, [hospitalId]: true }));
    setEditingAdmin(admin);
    setAdminInputs((prev) => ({
      ...prev,
      [hospitalId]: admin ? {
        name: admin.name || '',
        email: admin.email || '',
        password: '', // Don't show password
        contact: admin.contact || '',
      } : {
        name: '',
        email: '',
        password: '',
        contact: '',
      },
    }));
  };

  const handleAdminInputChange = (hospitalId: string, field: string, value: string) => {
    setAdminInputs((prev) => ({
      ...prev,
      [hospitalId]: { ...prev[hospitalId], [field]: value },
    }));
  };

  const handleCreateOrUpdateAdmin = async (e: React.FormEvent, hospitalId: string) => {
    e.preventDefault();
    setActionLoading(true);
    const adminData = adminInputs[hospitalId];
    try {
      if (editingAdmin) {
        await request(`/superadmin/admins/${editingAdmin._id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: adminData.name,
            email: adminData.email,
            contact: adminData.contact,
          }),
        });
        toast({
          title: "Success",
          description: "Admin updated successfully",
        });
      } else {
        await request('/superadmin/admins', {
          method: 'POST',
          body: JSON.stringify({
            name: adminData.name,
            email: adminData.email,
            contact: adminData.contact,
            hospitalId,
          }),
        });
        toast({
          title: "Success",
          description: "Admin created successfully",
        });
      }
      setAdminForms((prev) => ({ ...prev, [hospitalId]: false }));
      setEditingAdmin(null);
      setAdminInputs((prev) => ({
        ...prev,
        [hospitalId]: { name: '', email: '', password: '', contact: '' },
      }));
      await fetchHospitals();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    setActionLoading(true);
    try {
      await request(`/superadmin/admins/${adminId}`, { method: 'DELETE' });
      toast({
        title: "Success",
        description: "Admin deleted successfully",
      });
      await fetchHospitals();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (!user || user.role !== 'super-admin') {
    return <div className="p-8 text-center text-red-500">Access denied. Super-admins only.</div>;
  }

  if (loading) return <div className="p-8 text-center flex justify-center items-center"><Loader2 className="animate-spin mr-2" />Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
              <p className="text-gray-600">
                {user?.name ? `${user.name} - System Administrator` : 'System & Hospital Management'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
                onClick={() => {
                  logout();
                  setTimeout(() => navigate('/'), 100);
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Super Admin Dashboard</h1>
        <div className="mb-6">
          <Button 
            onClick={() => handleShowHospitalForm()} 
            disabled={actionLoading}
            className="medical-gradient text-white hover:opacity-90 transition-opacity"
          >
            {showHospitalForm ? 'Cancel' : 'Add New Hospital'}
          </Button>
          {showHospitalForm && (
            <form onSubmit={handleCreateOrUpdateHospital} className="mt-4 flex flex-col gap-2 bg-gray-50 p-4 rounded shadow">
              <input
                type="text"
                name="name"
                placeholder="Hospital Name"
                value={hospitalForm.name}
                onChange={handleHospitalFormChange}
                className="border rounded px-2 py-1"
                required
                disabled={actionLoading}
              />
              <input
                type="text"
                name="address"
                placeholder="Hospital Address"
                value={hospitalForm.address}
                onChange={handleHospitalFormChange}
                className="border rounded px-2 py-1"
                disabled={actionLoading}
              />
              <input
                type="text"
                name="contact"
                placeholder="Hospital Contact"
                value={hospitalForm.contact}
                onChange={handleHospitalFormChange}
                className="border rounded px-2 py-1"
                disabled={actionLoading}
              />
              {!editingHospital && (
                <>
                  <div className="font-semibold mt-2 mb-1">First Admin Details</div>
                  <input
                    type="text"
                    name="adminName"
                    placeholder="Admin Name"
                    value={hospitalForm.adminName}
                    onChange={handleHospitalFormChange}
                    className="border rounded px-2 py-1"
                    required
                    disabled={actionLoading}
                  />
                  <input
                    type="email"
                    name="adminEmail"
                    placeholder="Admin Email"
                    value={hospitalForm.adminEmail}
                    onChange={handleHospitalFormChange}
                    className="border rounded px-2 py-1"
                    required
                    disabled={actionLoading}
                  />
                  <input
                    type="text"
                    name="adminContact"
                    placeholder="Admin Contact"
                    value={hospitalForm.adminContact}
                    onChange={handleHospitalFormChange}
                    className="border rounded px-2 py-1"
                    disabled={actionLoading}
                  />
                </>
              )}
              <Button 
                type="submit" 
                disabled={actionLoading}
                className="medical-gradient text-white hover:opacity-90 transition-opacity"
              >
                {actionLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                {editingHospital ? 'Update Hospital' : 'Create Hospital & Admin'}
              </Button>
            </form>
          )}
        </div>
        <div className="space-y-4">
          {hospitals.map((hospital) => (
            <Card key={hospital._id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{hospital.name}</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleShowHospitalForm(hospital)} 
                    disabled={actionLoading}
                    className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                  >
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDeleteHospital(hospital._id)} 
                    disabled={actionLoading}
                    className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
                  >
                    Delete
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-2 text-sm text-gray-600">Address: {hospital.address || <span className="italic text-gray-400">N/A</span>}</div>
                <div className="mb-2 text-sm text-gray-600">Contact: {hospital.contact || <span className="italic text-gray-400">N/A</span>}</div>
                <div className="mb-2">
                  <div className="text-sm font-semibold text-gray-600 mb-2">Admins:</div>
                  <div className="space-y-2">
                    {hospital.admins && hospital.admins.length > 0 ? (
                      hospital.admins.map((admin: any) => (
                        <div key={admin._id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div>
                            <div className="font-medium">{admin.name}</div>
                            <div className="text-sm text-gray-600">{admin.email}</div>
                            {admin.contact && <div className="text-sm text-gray-500">{admin.contact}</div>}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleShowAdminForm(hospital._id, admin)} 
                              disabled={actionLoading}
                              className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                            >
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleDeleteAdmin(admin._id)} 
                              disabled={actionLoading}
                              className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 italic">No admins yet</div>
                    )}
                  </div>
                  {adminForms[hospital._id] ? (
                    <form onSubmit={(e) => handleCreateOrUpdateAdmin(e, hospital._id)} className="mt-4 flex flex-col gap-2 bg-gray-50 p-4 rounded">
                      <input
                        type="text"
                        placeholder="Admin Name"
                        value={adminInputs[hospital._id]?.name || ''}
                        onChange={(e) => handleAdminInputChange(hospital._id, 'name', e.target.value)}
                        className="border rounded px-2 py-1"
                        required
                        disabled={actionLoading}
                      />
                      <input
                        type="email"
                        placeholder="Admin Email"
                        value={adminInputs[hospital._id]?.email || ''}
                        onChange={(e) => handleAdminInputChange(hospital._id, 'email', e.target.value)}
                        className="border rounded px-2 py-1"
                        required
                        disabled={actionLoading}
                      />
                      <input
                        type="text"
                        placeholder="Contact"
                        value={adminInputs[hospital._id]?.contact || ''}
                        onChange={(e) => handleAdminInputChange(hospital._id, 'contact', e.target.value)}
                        className="border rounded px-2 py-1"
                        disabled={actionLoading}
                      />
                      <div className="flex gap-2">
                        <Button 
                          type="submit" 
                          disabled={actionLoading}
                          className="medical-gradient text-white hover:opacity-90 transition-opacity"
                        >
                          {actionLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                          {editingAdmin ? 'Update Admin' : 'Create Admin'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setAdminForms((prev) => ({ ...prev, [hospital._id]: false }));
                            setEditingAdmin(null);
                          }}
                          disabled={actionLoading}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <Button onClick={() => handleShowAdminForm(hospital._id)} className="mt-2" disabled={actionLoading}>
                      Add Admin
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard; 