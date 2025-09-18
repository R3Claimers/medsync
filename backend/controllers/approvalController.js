const Approval = require('../models/Approval');
const User = require('../models/User');

// Get all approvals for admin's hospital
exports.getApprovals = async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id);
    if (!adminUser) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    const hospitalId = adminUser.hospitalId;
    if (!hospitalId) {
      return res.status(400).json({ message: 'Admin user must be associated with a hospital' });
    }

    const approvals = await Approval.find({ hospitalId })
      .populate('user', 'name email')
      .populate('hospitalId', 'name')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ 
      approvals,
      totalCount: approvals.length,
      pendingCount: approvals.filter(a => a.status === 'pending').length
    });
  } catch (err) {
    console.error('Error fetching approvals:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update approval status (approve/deny)
exports.updateApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body; // status: 'approved' or 'denied'

    if (!['approved', 'denied'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be approved or denied.' });
    }

    const approval = await Approval.findById(id).populate('user');
    if (!approval) {
      return res.status(404).json({ message: 'Approval request not found' });
    }

    // Update approval record
    approval.status = status;
    approval.reviewedBy = req.user.id;
    approval.reviewDate = new Date();
    approval.reviewComments = comments || '';
    
    await approval.save();

    // If approved, update the user's role and status
    if (status === 'approved') {
      const user = approval.user;
      user.role = approval.requestedRole;
      user.isApproved = true;
      user.hospitalId = approval.hospitalId;
      
      // Add any additional details based on role
      if (approval.requestDetails) {
        if (approval.requestedRole === 'doctor' && approval.requestDetails.specialty) {
          // Create or update doctor profile
          const Doctor = require('../models/Doctor');
          await Doctor.findOneAndUpdate(
            { user: user._id },
            { 
              specialty: approval.requestDetails.specialty,
              department: approval.requestDetails.department 
            },
            { upsert: true, new: true }
          );
        }
      }
      
      await user.save();
    }

    res.json({ 
      message: `User registration ${status} successfully`,
      approval: await Approval.findById(id).populate('user', 'name email').populate('reviewedBy', 'name')
    });
  } catch (err) {
    console.error('Error updating approval:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Create approval request (used during registration)
exports.createApproval = async (userId, hospitalId, requestedRole, requestDetails = {}) => {
  try {
    const approval = new Approval({
      user: userId,
      hospitalId,
      requestedRole,
      requestDetails,
      type: 'user_registration'
    });
    
    await approval.save();
    return approval;
  } catch (err) {
    console.error('Error creating approval:', err);
    throw err;
  }
};
