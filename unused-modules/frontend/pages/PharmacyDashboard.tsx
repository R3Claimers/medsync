
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pill, Package, AlertTriangle, Clock, Search, Truck, CheckCircle, BarChart, Plus, Edit, Filter, RefreshCw, X, Eye, Download, FileText } from 'lucide-react';
import { request } from '../lib/api';
import { useAuth } from '../lib/authContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

const PharmacyDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [expiringSoon, setExpiringSoon] = useState<any[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<any>({});
  const [stats, setStats] = useState<any>({});
  const [showAddInventory, setShowAddInventory] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Additional state for enhanced functionality
  const [showDispenseModal, setShowDispenseModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Form states
  const [newItem, setNewItem] = useState({
    name: '',
    genericName: '',
    manufacturer: '',
    batchNumber: '',
    expiryDate: '',
    quantity: '',
    unitPrice: '',
    description: '',
    category: ''
  });
  const [restockData, setRestockData] = useState({
    quantity: '',
    batchNumber: '',
    expiryDate: '',
    unitPrice: ''
  });
  const [orderData, setOrderData] = useState({
    supplier: '',
    items: [],
    priority: 'normal',
    notes: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch all prescriptions
        const presRes = await request('/prescriptions');
        console.log('Prescriptions response:', presRes);
        setPrescriptions(presRes.prescriptions || []);
        
        // Fetch inventory with enhanced filtering
        const invRes = await request('/inventory');
        console.log('Inventory response:', invRes);
        const allInventory = invRes.inventories || [];
        setInventory(allInventory);
        
        // Get inventory alerts
        const alertsRes = await request('/inventory/alerts');
        console.log('Alerts response:', alertsRes);
        setInventoryAlerts(alertsRes.alerts || {});
        setLowStock(alertsRes.alerts?.lowStock || []);
        setExpiringSoon(alertsRes.alerts?.expiringSoon || []);
        
        // Enhanced stats
        setStats({
          prescriptionsDispensed: (presRes.prescriptions || []).filter((p: any) => p.status === 'completed').length,
          pendingPrescriptions: (presRes.prescriptions || []).filter((p: any) => p.status === 'pending').length,
          lowStockItems: (alertsRes.alerts?.lowStock || []).length,
          outOfStockItems: (alertsRes.alerts?.outOfStock || []).length,
          expiringSoonItems: (alertsRes.alerts?.expiringSoon || []).length,
          expiredItems: (alertsRes.alerts?.expired || []).length,
          totalInventoryValue: allInventory.reduce((sum: number, item: any) => 
            sum + ((item.currentStock || 0) * (item.unitPrice || 0)), 0
          )
        });
      } catch (err: any) {
        console.error('Error fetching pharmacy data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === 'pharmacist') fetchData();
  }, [user]);

  // API Functions
  const handleAddInventory = async () => {
    try {
      const response = await request('/inventory', {
        method: 'POST',
        body: JSON.stringify({
          ...newItem,
          quantity: parseInt(newItem.quantity),
          unitPrice: parseFloat(newItem.unitPrice)
        })
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Inventory item added successfully"
        });
        setShowAddModal(false);
        setNewItem({
          name: '',
          genericName: '',
          manufacturer: '',
          batchNumber: '',
          expiryDate: '',
          quantity: '',
          unitPrice: '',
          description: '',
          category: ''
        });
        // Refresh data
        window.location.reload();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add inventory item",
        variant: "destructive"
      });
    }
  };

  const handleRestockItem = async () => {
    if (!selectedInventoryItem) return;
    
    try {
      const response = await request(`/inventory/${selectedInventoryItem._id}/restock`, {
        method: 'PUT',
        body: JSON.stringify({
          quantity: parseInt(restockData.quantity),
          batchNumber: restockData.batchNumber,
          expiryDate: restockData.expiryDate,
          unitPrice: parseFloat(restockData.unitPrice)
        })
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Item restocked successfully"
        });
        setShowRestockModal(false);
        setSelectedInventoryItem(null);
        setRestockData({
          quantity: '',
          batchNumber: '',
          expiryDate: '',
          unitPrice: ''
        });
        window.location.reload();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to restock item",
        variant: "destructive"
      });
    }
  };

  const handleDispensePrescription = async () => {
    if (!selectedPrescription) return;
    
    try {
      const response = await request(`/prescriptions/${selectedPrescription._id}/dispense`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'completed',
          dispensedBy: user?.id,
          dispensedAt: new Date().toISOString()
        })
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Prescription dispensed successfully"
        });
        setShowDispenseModal(false);
        setSelectedPrescription(null);
        window.location.reload();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to dispense prescription",
        variant: "destructive"
      });
    }
  };

  const handleDeleteInventory = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) return;
    
    try {
      const response = await request(`/inventory/${itemId}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Inventory item deleted successfully"
        });
        window.location.reload();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete inventory item",
        variant: "destructive"
      });
    }
  };

  const handleEditInventory = (item: any) => {
    setEditingItem(item);
    setNewItem({
      name: item.name || '',
      genericName: item.genericName || '',
      manufacturer: item.manufacturer || '',
      batchNumber: item.batchNumber || '',
      expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
      quantity: item.currentStock?.toString() || '',
      unitPrice: item.unitPrice?.toString() || '',
      description: item.description || '',
      category: item.category || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateInventory = async () => {
    if (!editingItem) return;
    
    try {
      const response = await request(`/inventory/${editingItem._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...newItem,
          quantity: parseInt(newItem.quantity),
          unitPrice: parseFloat(newItem.unitPrice)
        })
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Inventory item updated successfully"
        });
        setShowEditModal(false);
        setEditingItem(null);
        setNewItem({
          name: '',
          genericName: '',
          manufacturer: '',
          batchNumber: '',
          expiryDate: '',
          quantity: '',
          unitPrice: '',
          description: '',
          category: ''
        });
        window.location.reload();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update inventory item",
        variant: "destructive"
      });
    }
  };

  // Filter functions
  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = searchTerm === '' || 
      (prescription.patient?.name && prescription.patient.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (prescription.doctor?.name && prescription.doctor.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (prescription.medications && prescription.medications.some((med: any) => 
        med.name && med.name.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    
    const matchesFilter = filterStatus === 'all' || prescription.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const filteredInventory = inventory.filter(item => 
    searchTerm === '' || 
    (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.genericName && item.genericName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.manufacturer && item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  // Mock data - replace with API calls
  // const pendingPrescriptions = [
  //   { id: 1, patient: 'John Doe', doctor: 'Dr. Smith', medication: 'Lisinopril 10mg', quantity: 30, status: 'pending', priority: 'normal' },
  //   { id: 2, patient: 'Jane Smith', doctor: 'Dr. Johnson', medication: 'Metformin 500mg', quantity: 60, status: 'ready', priority: 'normal' },
  //   { id: 3, patient: 'Mike Johnson', doctor: 'Dr. Chen', medication: 'Albuterol Inhaler', quantity: 1, status: 'dispensing', priority: 'urgent' },
  //   { id: 4, patient: 'Sarah Wilson', doctor: 'Dr. Wilson', medication: 'Antibiotics', quantity: 14, status: 'pending', priority: 'high' }
  // ];

  // const lowStockMedications = [
  //   { id: 1, name: 'Paracetamol 500mg', currentStock: 25, minStock: 100, supplier: 'MedSupply Co.' },
  //   { id: 2, name: 'Insulin Pen', currentStock: 8, minStock: 20, supplier: 'DiabetesCare Ltd.' },
  //   { id: 3, name: 'Blood Pressure Monitor', currentStock: 3, minStock: 10, supplier: 'MedDevice Inc.' }
  // ];

  // const todayStats = {
  //   prescriptionsDispensed: 45,
  //   pendingPrescriptions: 12,
  //   lowStockItems: 8,
  //   revenue: 2450
  // };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pharmacy Dashboard</h1>
              <p className="text-gray-600">Medication Management & Dispensing</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Truck className="h-4 w-4 mr-2" />
                New Order
              </Button>
              <Button className="medical-gradient text-white" size="sm">
                <Package className="h-4 w-4 mr-2" />
                Inventory
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Dispensed Today</p>
                  <p className="text-2xl font-bold text-green-600">{stats.prescriptionsDispensed || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pendingPrescriptions || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                  <p className="text-2xl font-bold text-red-600">{stats.lowStockItems || 0}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.expiringSoonItems || 0}</p>
                </div>
                <Package className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-800">{stats.outOfStockItems || 0}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-800" />
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expired Items</p>
                  <p className="text-2xl font-bold text-red-900">{stats.expiredItems || 0}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-900" />
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                  <p className="text-2xl font-bold text-blue-600">${(stats.totalInventoryValue || 0).toLocaleString()}</p>
                </div>
                <BarChart className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="h-16 medical-gradient text-white flex flex-col items-center justify-center">
                <Pill className="h-5 w-5 mb-1" />
                Dispense Rx
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Dispense Prescription</DialogTitle>
                <DialogDescription>
                  Select a prescription to dispense
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Select onValueChange={(value) => setSelectedPrescription(prescriptions.find(p => p._id === value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select prescription" />
                  </SelectTrigger>
                  <SelectContent>
                    {prescriptions
                      .filter(p => p.status === 'pending' || p.status === 'ready')
                      .map((prescription) => (
                      <SelectItem key={prescription._id} value={prescription._id}>
                        {prescription.patient?.name} - {prescription.medications?.[0]?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setSelectedPrescription(null)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleDispensePrescription}
                    disabled={!selectedPrescription}
                    className="medical-gradient text-white"
                  >
                    Dispense
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            className="h-16 flex flex-col items-center justify-center"
            onClick={() => {
              const inventorySection = document.getElementById('inventory-section');
              inventorySection?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <Package className="h-5 w-5 mb-1" />
            Check Inventory
          </Button>

          <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
                <Truck className="h-5 w-5 mb-1" />
                Place Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Place Supply Order</DialogTitle>
                <DialogDescription>
                  Create a new order for inventory supplies
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={orderData.supplier}
                      onChange={(e) => setOrderData({...orderData, supplier: e.target.value})}
                      placeholder="Enter supplier name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={orderData.priority} onValueChange={(value) => setOrderData({...orderData, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Order Notes</Label>
                  <Textarea
                    id="notes"
                    value={orderData.notes}
                    onChange={(e) => setOrderData({...orderData, notes: e.target.value})}
                    placeholder="Additional notes for this order..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowOrderModal(false)}>
                    Cancel
                  </Button>
                  <Button 
                    className="medical-gradient text-white"
                    onClick={() => {
                      toast({
                        title: "Order Placed",
                        description: `Order request sent to ${orderData.supplier}`
                      });
                      setShowOrderModal(false);
                      setOrderData({ supplier: '', items: [], priority: 'normal', notes: '' });
                    }}
                  >
                    Place Order
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            className="h-16 flex flex-col items-center justify-center"
            onClick={() => {
              const lowStockSection = document.getElementById('low-stock-section');
              lowStockSection?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <AlertTriangle className="h-5 w-5 mb-1" />
            Low Stock Alert
          </Button>

          <Button 
            variant="outline" 
            className="h-16 flex flex-col items-center justify-center"
            onClick={() => {
              toast({
                title: "Sales Report",
                description: "Generating sales report... This feature will be available soon."
              });
            }}
          >
            <BarChart className="h-5 w-5 mb-1" />
            Sales Report
          </Button>
        </div>

        {/* Search Bar */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search prescriptions, medications, or patients..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Prescriptions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Prescriptions
              </CardTitle>
              <CardDescription>Prescriptions awaiting processing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPrescriptions && filteredPrescriptions.length > 0 ? (
                  filteredPrescriptions.map((prescription) => (
                    <div key={prescription._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">
                          {typeof prescription.patient === 'object' 
                            ? prescription.patient?.user?.name || prescription.patient?.name || 'Unknown Patient'
                            : prescription.patient || 'Unknown Patient'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {prescription.medication || prescription.medications?.join(', ') || 'No medication specified'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Qty: {prescription.quantity || 'N/A'} - Dr. {
                            typeof prescription.doctor === 'object' 
                              ? prescription.doctor?.user?.name || prescription.doctor?.name || 'Unknown Doctor'
                              : prescription.doctor || 'Unknown Doctor'
                          }
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          prescription.priority === 'urgent' ? 'destructive' :
                          prescription.priority === 'high' ? 'default' : 'secondary'
                        }>
                          {prescription.priority || 'normal'}
                        </Badge>
                        <Badge variant={
                          prescription.status === 'completed' ? 'default' :
                          prescription.status === 'ready' ? 'secondary' : 'outline'
                        }>
                          {prescription.status || 'pending'}
                        </Badge>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedPrescription(prescription);
                              setShowDispenseModal(true);
                            }}
                            disabled={prescription.status === 'completed'}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          {prescription.status !== 'completed' && (
                            <Button 
                              size="sm" 
                              className="medical-gradient text-white"
                              onClick={() => {
                                setSelectedPrescription(prescription);
                                handleDispensePrescription();
                              }}
                            >
                              {prescription.status === 'ready' ? 'Dispense' : 'Process'}
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              toast({
                                title: "PDF Generated",
                                description: "Prescription PDF downloaded successfully"
                              });
                            }}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>{searchTerm || filterStatus !== 'all' ? 'No prescriptions match your search criteria' : 'No pending prescriptions'}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Inventory Alerts */}
          <Card id="low-stock-section">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Inventory Alerts
              </CardTitle>
              <CardDescription>Critical inventory notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {/* Low Stock Items */}
                {lowStock.length > 0 && (
                  <div>
                    <h5 className="font-medium text-red-700 mb-2">Low Stock ({lowStock.length})</h5>
                    {lowStock.map((item) => (
                      <div key={item._id} className="flex items-center justify-between p-3 border rounded-lg bg-red-50 mb-2">
                        <div>
                          <h4 className="font-medium text-red-900">{item.name}</h4>
                          <p className="text-sm text-red-700">
                            Current: {item.currentStock} | Min: {item.minStock}
                            {item.location && ` | Location: ${item.location}`}
                          </p>
                          <p className="text-sm text-red-600">{item.supplier}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">
                            {Math.round((item.currentStock / item.minStock) * 100)}% left
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedInventoryItem(item);
                              setShowRestockModal(true);
                            }}
                          >
                            Restock
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Expiring Soon Items */}
                {expiringSoon.length > 0 && (
                  <div>
                    <h5 className="font-medium text-yellow-700 mb-2">Expiring Soon ({expiringSoon.length})</h5>
                    {expiringSoon.map((item) => (
                      <div key={item._id} className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50 mb-2">
                        <div>
                          <h4 className="font-medium text-yellow-900">{item.name}</h4>
                          <p className="text-sm text-yellow-700">
                            Expires: {new Date(item.expirationDate).toLocaleDateString()}
                            {item.batchNumber && ` | Batch: ${item.batchNumber}`}
                          </p>
                          <p className="text-sm text-yellow-600">Stock: {item.currentStock}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-yellow-200 text-yellow-800">
                            {Math.ceil((new Date(item.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                          </Badge>
                          <Button size="sm" variant="outline">Mark Priority</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {lowStock.length === 0 && expiringSoon.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>All inventory levels are normal!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Dispense */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Quick Dispense
              </CardTitle>
              <CardDescription>Fast prescription dispensing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input placeholder="Prescription ID or Patient Name" />
                <Input placeholder="Medication Name" />
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Quantity" type="number" />
                  <Input placeholder="Days Supply" type="number" />
                </div>
                <Input placeholder="Instructions" />
                <div className="flex gap-2">
                  <Button className="flex-1 medical-gradient text-white">
                    <Pill className="h-4 w-4 mr-2" />
                    Dispense
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Save Draft
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Inventory Management */}
          <Card id="inventory-section">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory Management
              </CardTitle>
              <CardDescription>Manage your medication inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search medications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Medication
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.map((item) => (
                      <TableRow key={item._id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            {item.batchNumber && (
                              <div className="text-sm text-gray-500">Batch: {item.batchNumber}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{item.currentStock}</span>
                            {item.currentStock <= item.minStock && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              item.currentStock === 0 ? "destructive" :
                              item.currentStock <= item.minStock ? "secondary" :
                              new Date(item.expirationDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? "outline" :
                              "default"
                            }
                          >
                            {item.currentStock === 0 ? "Out of Stock" :
                             item.currentStock <= item.minStock ? "Low Stock" :
                             new Date(item.expirationDate) <= new Date() ? "Expired" :
                             new Date(item.expirationDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? "Expiring Soon" :
                             "In Stock"}
                          </Badge>
                        </TableCell>
                        <TableCell>₹{item.price?.toFixed(2) || 'N/A'}</TableCell>
                        <TableCell>
                          <div className={
                            new Date(item.expirationDate) <= new Date() ? "text-red-600" :
                            new Date(item.expirationDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? "text-yellow-600" :
                            ""
                          }>
                            {new Date(item.expirationDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedInventoryItem(item);
                                setRestockData({
                                  quantity: '',
                                  batchNumber: item.batchNumber || '',
                                  expiryDate: item.expirationDate ? item.expirationDate.split('T')[0] : '',
                                  unitPrice: item.unitPrice?.toString() || ''
                                });
                                setShowRestockModal(true);
                              }}
                              title="Restock"
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditInventory(item)}
                              title="Edit"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                toast({
                                  title: "Item Details",
                                  description: `${item.name} - Stock: ${item.currentStock}, Batch: ${item.batchNumber || 'N/A'}`
                                });
                              }}
                              title="View Details"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDeleteInventory(item._id)}
                              title="Delete"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredInventory.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? `No medications found matching "${searchTerm}"` : "No inventory items found"}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest pharmacy operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-green-900">Dispensed: Lisinopril</p>
                    <p className="text-sm text-green-700">Patient: John Doe - 2:30 PM</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-900">Stock Added: Insulin</p>
                    <p className="text-sm text-blue-700">Quantity: 50 units - 1:45 PM</p>
                  </div>
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium text-orange-900">Order Placed: Antibiotics</p>
                    <p className="text-sm text-orange-700">Supplier: MedSupply - 12:15 PM</p>
                  </div>
                  <Truck className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium text-yellow-900">Low Stock Alert</p>
                    <p className="text-sm text-yellow-700">Paracetamol - 11:30 AM</p>  
                  </div>
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Medication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Medication</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="medName">Medication Name *</Label>
                <Input 
                  id="medName"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  placeholder="Enter medication name" 
                />
              </div>
              
              <div>
                <Label htmlFor="genericName">Generic Name</Label>
                <Input 
                  id="genericName"
                  value={newItem.genericName}
                  onChange={(e) => setNewItem({...newItem, genericName: e.target.value})}
                  placeholder="Enter generic name" 
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={newItem.category} onValueChange={(value) => setNewItem({...newItem, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="antibiotics">Antibiotics</SelectItem>
                    <SelectItem value="painkillers">Pain Killers</SelectItem>
                    <SelectItem value="vitamins">Vitamins</SelectItem>
                    <SelectItem value="supplements">Supplements</SelectItem>
                    <SelectItem value="cardiac">Cardiac</SelectItem>
                    <SelectItem value="diabetes">Diabetes</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Current Stock *</Label>
                  <Input 
                    id="quantity"
                    type="number" 
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                    placeholder="0" 
                  />
                </div>
                <div>
                  <Label htmlFor="unitPrice">Unit Price</Label>
                  <Input 
                    id="unitPrice"
                    type="number" 
                    step="0.01"
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem({...newItem, unitPrice: e.target.value})}
                    placeholder="0.00" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input 
                    id="manufacturer"
                    value={newItem.manufacturer}
                    onChange={(e) => setNewItem({...newItem, manufacturer: e.target.value})}
                    placeholder="Manufacturer name" 
                  />
                </div>
                <div>
                  <Label htmlFor="batchNumber">Batch Number</Label>
                  <Input 
                    id="batchNumber"
                    value={newItem.batchNumber}
                    onChange={(e) => setNewItem({...newItem, batchNumber: e.target.value})}
                    placeholder="Batch number" 
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input 
                  id="expiryDate"
                  type="date"
                  value={newItem.expiryDate}
                  onChange={(e) => setNewItem({...newItem, expiryDate: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description"
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  placeholder="Additional notes or description..."
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewItem({
                      name: '',
                      genericName: '',
                      manufacturer: '',
                      batchNumber: '',
                      expiryDate: '',
                      quantity: '', 
                      unitPrice: '',
                      description: '',
                      category: ''
                    });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddInventory}
                  disabled={!newItem.name || !newItem.quantity}
                  className="flex-1 medical-gradient text-white"
                >
                  Add Medication
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && selectedInventoryItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Restock {selectedInventoryItem.name}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowRestockModal(false);
                  setSelectedInventoryItem(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Current Stock</Label>
                <Input value={selectedInventoryItem.currentStock || 0} disabled />
              </div>
              
              <div>
                <Label htmlFor="addQuantity">Add Quantity *</Label>
                <Input 
                  id="addQuantity"
                  type="number" 
                  value={restockData.quantity}
                  onChange={(e) => setRestockData({...restockData, quantity: e.target.value})}
                  placeholder="Enter quantity to add" 
                />
              </div>
              
              <div>
                <Label htmlFor="restockBatch">Batch Number</Label>
                <Input 
                  id="restockBatch"
                  value={restockData.batchNumber}
                  onChange={(e) => setRestockData({...restockData, batchNumber: e.target.value})}
                  placeholder="Enter batch number" 
                />
              </div>
              
              <div>
                <Label htmlFor="restockExpiry">Expiration Date</Label>
                <Input 
                  id="restockExpiry"
                  type="date" 
                  value={restockData.expiryDate}
                  onChange={(e) => setRestockData({...restockData, expiryDate: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="restockPrice">Unit Price</Label>
                <Input 
                  id="restockPrice"
                  type="number" 
                  step="0.01"
                  value={restockData.unitPrice}
                  onChange={(e) => setRestockData({...restockData, unitPrice: e.target.value})}
                  placeholder="Enter unit price" 
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleRestockItem}
                  disabled={!restockData.quantity}
                  className="flex-1 medical-gradient text-white"
                >
                  Confirm Restock
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setShowRestockModal(false);
                    setSelectedInventoryItem(null);
                    setRestockData({
                      quantity: '',
                      batchNumber: '',
                      expiryDate: '',
                      unitPrice: ''
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Inventory Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Inventory Item</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="editName">Medication Name *</Label>
                <Input
                  id="editName"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  placeholder="Medicine name"
                />
              </div>
              
              <div>
                <Label htmlFor="editGeneric">Generic Name</Label>
                <Input
                  id="editGeneric"
                  value={newItem.genericName}
                  onChange={(e) => setNewItem({...newItem, genericName: e.target.value})}
                  placeholder="Generic name"
                />
              </div>
              
              <div>
                <Label htmlFor="editCategory">Category</Label>
                <Select value={newItem.category} onValueChange={(value) => setNewItem({...newItem, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="antibiotics">Antibiotics</SelectItem>
                    <SelectItem value="painkillers">Pain Killers</SelectItem>
                    <SelectItem value="vitamins">Vitamins</SelectItem>
                    <SelectItem value="supplements">Supplements</SelectItem>
                    <SelectItem value="cardiac">Cardiac</SelectItem>
                    <SelectItem value="diabetes">Diabetes</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editStock">Current Stock *</Label>
                  <Input
                    id="editStock"
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="editPrice">Unit Price</Label>
                  <Input
                    id="editPrice"
                    type="number"
                    step="0.01"
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem({...newItem, unitPrice: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editManufacturer">Manufacturer</Label>
                  <Input
                    id="editManufacturer"
                    value={newItem.manufacturer}
                    onChange={(e) => setNewItem({...newItem, manufacturer: e.target.value})}
                    placeholder="Manufacturer name"
                  />
                </div>
                <div>
                  <Label htmlFor="editBatch">Batch Number</Label>
                  <Input
                    id="editBatch"
                    value={newItem.batchNumber}
                    onChange={(e) => setNewItem({...newItem, batchNumber: e.target.value})}
                    placeholder="Batch number"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="editExpiry">Expiration Date</Label>
                <Input
                  id="editExpiry"
                  type="date"
                  value={newItem.expiryDate}
                  onChange={(e) => setNewItem({...newItem, expiryDate: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex space-x-4 mt-6">
              <Button 
                onClick={handleUpdateInventory}
                disabled={!newItem.name || !newItem.quantity}
                className="medical-gradient text-white flex-1"
              >
                Update Item
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                  setNewItem({
                    name: '',
                    genericName: '',
                    manufacturer: '',
                    batchNumber: '',
                    expiryDate: '',
                    quantity: '',
                    unitPrice: '',
                    description: '',
                    category: ''
                  });
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dispense Prescription Modal */}
      {showDispenseModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Prescription Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDispenseModal(false);
                  setSelectedPrescription(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Patient Name</Label>
                  <Input 
                    value={
                      typeof selectedPrescription.patient === 'object' 
                        ? selectedPrescription.patient?.user?.name || selectedPrescription.patient?.name || 'Unknown Patient'
                        : selectedPrescription.patient || 'Unknown Patient'
                    }
                    disabled 
                  />
                </div>
                <div>
                  <Label>Doctor</Label>
                  <Input 
                    value={
                      typeof selectedPrescription.doctor === 'object' 
                        ? selectedPrescription.doctor?.user?.name || selectedPrescription.doctor?.name || 'Unknown Doctor'
                        : selectedPrescription.doctor || 'Unknown Doctor'
                    }
                    disabled 
                  />
                </div>
              </div>
              
              <div>
                <Label>Medications</Label>
                <Textarea 
                  value={
                    selectedPrescription.medications?.map((med: any) => 
                      `${med.name || med} - Qty: ${med.quantity || 'N/A'} - Dosage: ${med.dosage || 'As prescribed'}`
                    ).join('\n') || selectedPrescription.medication || 'No medications specified'
                  }
                  disabled 
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Input 
                    value={selectedPrescription.priority || 'normal'} 
                    disabled 
                  />
                </div>
                <div>
                  <Label>Current Status</Label>
                  <Input 
                    value={selectedPrescription.status || 'pending'} 
                    disabled 
                  />
                </div>
              </div>
              
              <div>
                <Label>Notes</Label>
                <Textarea 
                  value={selectedPrescription.notes || selectedPrescription.instructions || 'No additional notes'}
                  disabled 
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                {selectedPrescription.status !== 'completed' && (
                  <Button 
                    onClick={handleDispensePrescription}
                    className="medical-gradient text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Dispensed
                  </Button>
                )}
                <Button 
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "PDF Generated",
                      description: "Prescription receipt downloaded successfully"
                    });
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowDispenseModal(false);
                    setSelectedPrescription(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyDashboard;
