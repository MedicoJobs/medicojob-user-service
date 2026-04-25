const express = require('express');
const { register, login, getProfile, verifyUser, updateProfile, getUserById } = require('../controllers/authController');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.get('/user/:userId', getUserById);  // Public: for fetching applicant names
router.patch('/verify/:userId', authMiddleware, authorize('admin'), verifyUser);

module.exports = router;
