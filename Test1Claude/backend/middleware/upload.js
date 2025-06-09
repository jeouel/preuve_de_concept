import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Créer les dossiers s'ils n'existent pas
const uploadsDir = path.join(dirname(__dirname), 'uploads');
const screenshotsDir = path.join(dirname(__dirname), 'screenshots');

await fs.mkdir(uploadsDir, { recursive: true });
await fs.mkdir(screenshotsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(mp4|avi|mov|mkv|webm)$/i;
  const allowedMimeTypes = /^(video\/(mp4|quicktime|x-msvideo|x-matroska|webm)|application\/octet-stream)$/i;

  console.log('File details:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    extension: path.extname(file.originalname)
  });

  const hasValidExtension = allowedExtensions.test(file.originalname);
  const hasValidMimeType = allowedMimeTypes.test(file.mimetype);

  console.log('Validation results:', {
    hasValidExtension,
    hasValidMimeType
  });

  if (hasValidExtension && hasValidMimeType) {
    return cb(null, true);
  } else {
    cb(new Error('Only video files are allowed'));
  }
};

export const uploadVideo = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter
});
