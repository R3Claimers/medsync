const Department = require('../models/Department');

// Create department (admin)
exports.createDepartment = async (req, res) => {
  try {
    const { name, staff, patients, utilization, status } = req.body;
    const department = new Department({ name, staff, patients, utilization, status });
    await department.save();
    res.status(201).json({ department });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all departments (admin, doctor, receptionist)
exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().populate('staff').populate('patients');
    res.json({ departments });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get single department (admin, doctor, receptionist)
exports.getDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id).populate('staff').populate('patients');
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.json({ department });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update department (admin)
exports.updateDepartment = async (req, res) => {
  try {
    const { name, staff, patients, utilization, status } = req.body;
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found' });
    if (name) department.name = name;
    if (staff) department.staff = staff;
    if (patients) department.patients = patients;
    if (utilization) department.utilization = utilization;
    if (status) department.status = status;
    await department.save();
    res.json({ department });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete department (admin)
exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found' });
    await department.deleteOne();
    res.json({ message: 'Department deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 