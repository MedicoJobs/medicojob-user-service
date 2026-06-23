const express = require('express');
const { register, login, getProfile, verifyUser, updateProfile, getUserById, uploadProfileImageHandler, uploadResumeHandler } = require('../controllers/authController');
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const {
  enforceContentLength,
  PROFILE_IMAGE_MAX_BYTES,
  RESUME_MAX_CONTENT_LENGTH_BYTES,
  uploadProfileImage,
  uploadResume,
} = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.post('/profile/upload/image', authMiddleware, enforceContentLength(PROFILE_IMAGE_MAX_BYTES), uploadProfileImage.single('profileImage'), uploadProfileImageHandler);
router.post('/profile/upload/resume', authMiddleware, enforceContentLength(RESUME_MAX_CONTENT_LENGTH_BYTES), uploadResume.single('resume'), uploadResumeHandler);
router.get('/user/:userId', getUserById);  // Public: for fetching applicant names
router.patch('/verify/:userId', authMiddleware, authorize('admin'), verifyUser);

module.exports = router;
