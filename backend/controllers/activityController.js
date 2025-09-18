const Activity = require('../models/Activity');
const User = require('../models/User');

// Get all activities for admin's hospital
exports.getActivities = async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id);
    if (!adminUser) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    const hospitalId = adminUser.hospitalId;
    if (!hospitalId) {
      return res.status(400).json({ message: 'Admin user must be associated with a hospital' });
    }

    const { page = 1, limit = 50, action } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { hospitalId };
    if (action) {
      query.action = action;
    }

    const activities = await Activity.find(query)
      .populate('user', 'name email role')
      .populate('hospitalId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalActivities = await Activity.countDocuments(query);

    res.json({ 
      activities,
      totalCount: totalActivities,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalActivities / parseInt(limit)),
      hasNextPage: skip + parseInt(limit) < totalActivities,
      hasPrevPage: parseInt(page) > 1
    });
  } catch (err) {
    console.error('Error fetching activities:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Create a new activity log
exports.createActivity = async (userId, hospitalId, action, description, targetType = null, targetId = null, metadata = {}) => {
  try {
    const activity = new Activity({
      user: userId,
      hospitalId,
      action,
      description,
      targetType,
      targetId,
      metadata
    });
    
    await activity.save();
    return activity;
  } catch (err) {
    console.error('Error creating activity log:', err);
    throw err;
  }
};

// Get activity statistics for dashboard
exports.getActivityStats = async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || !adminUser.hospitalId) {
      return res.status(400).json({ message: 'Admin user must be associated with a hospital' });
    }

    const hospitalId = adminUser.hospitalId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's activities
    const todayActivities = await Activity.countDocuments({
      hospitalId,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    // Get activities by action type for the last 7 days
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const actionStats = await Activity.aggregate([
      {
        $match: {
          hospitalId: hospitalId,
          createdAt: { $gte: lastWeek }
        }
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      todayActivities,
      actionStats,
      lastUpdated: new Date()
    });
  } catch (err) {
    console.error('Error fetching activity stats:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
