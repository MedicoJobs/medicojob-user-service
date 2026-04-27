const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const { ensureDemoUsers } = require('./utils/seedDemoUsers');

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
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin is not allowed by CORS'));
  },
}));
app.use(express.json());

app.use('/auth', authRoutes);

const MONGO_URI = process.env.MONGO_URI_USER || process.env.MONGO_URI;
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error('MONGO_URI_USER or MONGO_URI is required');
    }

    await mongoose.connect(MONGO_URI);
    console.log('User Service DB Connected');
    await ensureDemoUsers();
    console.log('Demo users ensured');

    app.listen(PORT, () => console.log(`User Service running on port ${PORT}`));
  } catch (err) {
    console.error('User Service startup failed:', err);
    process.exit(1);
  }
};

startServer();
