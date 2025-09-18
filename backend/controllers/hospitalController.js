const Hospital = require('../models/Hospital');

exports.getHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find();
    res.json({ hospitals });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 