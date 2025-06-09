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

// Fonction pour nettoyer les anciennes vidéos
async function cleanupOldVideos() {
  try {
    const files = await fs.readdir(uploadsDir);
    const videoFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.mp4', '.avi', '.mov', '.mkv', '.webm'].includes(ext);
    });

    if (videoFiles.length > 5) {
      // Obtenir les informations de date de modification pour chaque fichier
      const fileStats = await Promise.all(
        videoFiles.map(async (file) => {
          const stats = await fs.stat(path.join(uploadsDir, file));
          return {
            name: file,
            mtime: stats.mtime
          };
        })
      );

      // Trier les fichiers par date de modification (les plus anciens en premier)
      fileStats.sort((a, b) => a.mtime - b.mtime);

      // Supprimer les fichiers les plus anciens jusqu'à ce qu'il n'en reste que 5
      const filesToDelete = fileStats.slice(0, fileStats.length - 5);
      for (const file of filesToDelete) {
        await fs.unlink(path.join(uploadsDir, file.name));
        console.log(`🔵 [Upload Middleware] Deleted old video: ${file.name}`);
      }
    }
  } catch (error) {
    console.error('🔴 [Upload Middleware] Error cleaning up old videos:', error);
  }
}

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

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter
});

// Middleware pour nettoyer les anciennes vidéos après chaque upload
export const uploadVideo = (req, res, next) => {
  upload.single('video')(req, res, async (err) => {
    if (err) {
      return next(err);
    }
    if (req.file) {
      await cleanupOldVideos();
    }
    next();
  });
}; 