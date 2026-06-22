const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const bucketName = process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_REGION || 'ap-south-1';
const useLocalUploads = process.env.USE_LOCAL_UPLOADS === 'true' || !bucketName || process.env.NODE_ENV !== 'production';

const cleanPrefix = (value, fallback) => {
  const prefix = value || fallback;
  return prefix.replace(/^\/+/, '').replace(/\/?$/, '/');
};

const safeFileName = (fileName) => fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

const s3 = new S3Client({ region });
const uploadRoot = path.join(__dirname, '..', 'public', 'uploads');
const ONE_MB = 1024 * 1024;
const PROFILE_IMAGE_MAX_BYTES = 2 * ONE_MB;
const RESUME_MAX_BYTES = 10 * ONE_MB;
const MULTIPART_TEXT_FIELD_MAX_BYTES = 16 * 1024;

const ensureUploadDir = (folder) => {
  const dir = path.join(uploadRoot, folder);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const localStorage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => cb(null, ensureUploadDir(folder)),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${safeFileName(file.originalname)}`),
});

const s3Storage = (prefixEnvName, fallbackPrefix) => multerS3({
  s3,
  bucket: bucketName,
  metadata: (req, file, cb) => cb(null, { fieldName: file.fieldname }),
  key: (req, file, cb) => {
    const prefix = cleanPrefix(process.env[prefixEnvName], fallbackPrefix);
    cb(null, `${prefix}${Date.now()}-${safeFileName(file.originalname)}`);
  },
  contentType: multerS3.AUTO_CONTENT_TYPE,
  contentDisposition: (req, file, cb) => cb(null, 'inline')
});

const uploadProfileImage = multer({
  storage: useLocalUploads ? localStorage('profile-images') : s3Storage('S3_PROFILE_IMAGES_PREFIX', 'profile-images'),
  limits: {
    fileSize: PROFILE_IMAGE_MAX_BYTES,
    files: 1,
    fields: 0,
    parts: 1,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed!'), false);
    }
  }
});

const uploadResume = multer({
  storage: useLocalUploads ? localStorage('resumes') : s3Storage('S3_RESUMES_PREFIX', 'resume-pdfs'),
  limits: {
    fileSize: RESUME_MAX_BYTES,
    files: 1,
    fields: 0,
    parts: 1,
    fieldSize: MULTIPART_TEXT_FIELD_MAX_BYTES,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed!'), false);
    }
  }
});

module.exports = {
  uploadProfileImage,
  uploadResume
};
