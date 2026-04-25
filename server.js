const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const { ensureDemoUsers } = require('./utils/seedDemoUsers');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);

const MONGO_URI = process.env.MONGO_URI_USER || process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('User Service DB Connected');
    await ensureDemoUsers();
    console.log('Demo users ensured');
  })
  .catch(err => console.error(err));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`User Service running on port ${PORT}`));
