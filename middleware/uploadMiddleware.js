const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');

const bucketName = process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_REGION || 'ap-south-1';

if (!bucketName) {
  throw new Error('AWS_S3_BUCKET or AWS_BUCKET_NAME is required for S3 uploads');
}

const cleanPrefix = (value, fallback) => {
  const prefix = value || fallback;
  return prefix.replace(/^\/+/, '').replace(/\/?$/, '/');
};

const safeFileName = (fileName) => fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

const s3 = new S3Client({ region });

const uploadProfileImage = multer({
  storage: multerS3({
    s3,
    bucket: bucketName,
    metadata: (req, file, cb) => cb(null, { fieldName: file.fieldname }),
    key: (req, file, cb) => {
      const prefix = cleanPrefix(process.env.S3_PROFILE_IMAGES_PREFIX, 'profile-images');
      cb(null, `${prefix}${Date.now()}-${safeFileName(file.originalname)}`);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
    contentDisposition: (req, file, cb) => cb(null, 'inline')
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed!'), false);
    }
  }
});

const uploadResume = multer({
  storage: multerS3({
    s3,
    bucket: bucketName,
    metadata: (req, file, cb) => cb(null, { fieldName: file.fieldname }),
    key: (req, file, cb) => {
      const prefix = cleanPrefix(process.env.S3_RESUMES_PREFIX, 'resumes');
      cb(null, `${prefix}${Date.now()}-${safeFileName(file.originalname)}`);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
    contentDisposition: (req, file, cb) => cb(null, 'inline')
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
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
