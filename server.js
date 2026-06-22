const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
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

const startServer = async () => {
  try {
    if (MONGO_URI) {
      console.warn('MONGO_URI_USER or MONGO_URI is configured, but this service now persists users in DynamoDB.');
    }

    await ensureDemoUsers();

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
