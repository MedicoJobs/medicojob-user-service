const express = require('express');
const { register, login, getProfile, verifyUser, updateProfile, getUserById, uploadProfileImageHandler, uploadResumeHandler } = require('../controllers/authController');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const { uploadProfileImage, uploadResume } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.post('/profile/upload/image', authMiddleware, uploadProfileImage.single('profileImage'), uploadProfileImageHandler);
router.post('/profile/upload/resume', authMiddleware, uploadResume.single('resume'), uploadResumeHandler);
router.get('/user/:userId', getUserById);  // Public: for fetching applicant names
router.patch('/verify/:userId', authMiddleware, authorize('admin'), verifyUser);

module.exports = router;
