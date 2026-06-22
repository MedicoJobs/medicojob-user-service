const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/auth');

const fileUrl = (req) => {
  if (req.file.location) return req.file.location;
  const relativePath = req.file.path.replace(/\\/g, '/').split('/public/')[1];
  return `${req.protocol}://${req.get('host')}/public/${relativePath}`;
};

const serializeUser = (user) => ({
  id: String(user._id),
  _id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  specialization: user.specialization || '',
  licenseNumber: user.licenseNumber || '',
  experience: user.experience || 0,
  bio: user.bio || '',
  phone: user.phone || '',
  currentLocation: user.currentLocation || '',
  latitude: typeof user.latitude === 'number' ? user.latitude : null,
  longitude: typeof user.longitude === 'number' ? user.longitude : null,
  preferredLocations: user.preferredLocations || [],
  skills: user.skills || [],
  profileImage: user.profileImage || '',
  resumeUrl: user.resumeUrl || '',
  resumeAnalysis: user.resumeAnalysis || null,
  verified: Boolean(user.verified),
});

exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      specialization,
      licenseNumber,
      experience,
      bio,
      phone,
      currentLocation,
      latitude,
      longitude,
      preferredLocations,
      skills,
    } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      specialization,
      licenseNumber,
      experience,
      bio,
      phone,
      currentLocation,
      latitude,
      longitude,
      preferredLocations,
      skills,
    });

    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, jwtSecret, { expiresIn: '1d' });
    res.json({ token, user: serializeUser(user) });
  } catch (error) {
    console.error('Login failed unexpectedly:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(serializeUser(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'bio', 'specialization', 'licenseNumber', 'experience', 'currentLocation', 'latitude', 'longitude', 'preferredLocations', 'skills', 'resumeAnalysis'];
    const updates = {};
    allowed.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(serializeUser(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(serializeUser(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.verifyUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(userId, { verified: true }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User verified successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.uploadProfileImageHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const imageUrl = fileUrl(req);
    const user = await User.findByIdAndUpdate(req.user.id, { profileImage: imageUrl }, { new: true });
    res.json({ message: 'Profile image uploaded successfully', profileImage: imageUrl, user: serializeUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.uploadResumeHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const resumeUrl = fileUrl(req);
    const user = await User.findByIdAndUpdate(req.user.id, { resumeUrl }, { new: true });
    res.json({ message: 'Resume uploaded successfully', resumeUrl, user: serializeUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
