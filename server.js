const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRoutes = require('./routes/authRoutes');
const { ensureDemoUsers } = require('./utils/seedDemoUsers');
const path = require('path');

const app = express();
app.disable('x-powered-by');

const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
);

app.use(cors({
  origin(origin, callback) {
    const isLocalDevOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');

    if (!origin || allowedOrigins.has(origin) || isLocalDevOrigin) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin is not allowed by CORS'));
  },
}));
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

const MONGO_URI = process.env.MONGO_URI_USER || process.env.MONGO_URI;
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'local-dev-secret';

const createLocalUserStore = () => {
  const users = [];
  let nextId = 1;

  const serializeUser = (user) => ({
    id: user.id,
    _id: user.id,
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
    verified: Boolean(user.verified),
  });

  const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch (error) {
      res.status(401).json({ message: 'Token is not valid' });
    }
  };

  app.post('/auth/register', async (req, res) => {
    const existingUser = users.find(user => user.email === req.body.email);

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const password = await bcrypt.hash(req.body.password, 10);
    const user = {
      id: String(nextId++),
      ...req.body,
      password,
      verified: false,
    };

    users.push(user);
    res.status(201).json({ message: 'User registered successfully' });
  });

  app.post('/auth/login', async (req, res) => {
    const user = users.find(savedUser => savedUser.email === req.body.email);

    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: serializeUser(user) });
  });

  app.get('/auth/profile', authenticate, (req, res) => {
    const user = users.find(savedUser => savedUser.id === req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(serializeUser(user));
  });

  app.put('/auth/profile', authenticate, (req, res) => {
    const user = users.find(savedUser => savedUser.id === req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    Object.assign(user, req.body);
    res.json(serializeUser(user));
  });

  app.get('/auth/user/:userId', (req, res) => {
    const user = users.find(savedUser => savedUser.id === req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(serializeUser(user));
  });
};

const startServer = async () => {
  try {
    if (!MONGO_URI) {
      console.warn('MONGO_URI_USER or MONGO_URI is not configured. Starting User Service in local in-memory mode.');
      createLocalUserStore();
      app.listen(PORT, () => console.log(`User Service running on port ${PORT}`));
      return;
    }

    await mongoose.connect(MONGO_URI);
    console.log('User Service DB Connected');
    await ensureDemoUsers();
    console.log('Demo users ensured');

    app.use('/auth', authRoutes);
    app.use((err, req, res, next) => {
      console.error('[USER SERVICE ERROR]', err);
      res.status(500).json({ message: err.message || 'Internal Server Error' });
    });
    app.listen(PORT, () => console.log(`User Service running on port ${PORT}`));
  } catch (err) {
    console.error('User Service startup failed:', err);
    process.exit(1);
  }
};

startServer();
