import express from 'express';
import { uploadVideo } from '../middleware/upload.js';
import fs from 'fs/promises';
import path from 'path';
import { debugLog } from '../utils/logger.js';

const router = express.Router();

const uploadsDir = path.join(process.cwd(), 'uploads');
const gifsDir = path.join(uploadsDir, 'gifs');

async function cleanUploads() {
  // Supprimer toutes les vidéos sauf les dossiers gifs et guides
  const files = await fs.readdir(uploadsDir);
  for (const file of files) {
    const filePath = path.join(uploadsDir, file);
    const stat = await fs.stat(filePath);
    if (stat.isFile()) {
      await fs.unlink(filePath);
    }
  }
  // Supprimer tous les GIFs (récursif)
  try {
    const gifs = await fs.readdir(gifsDir);
    for (const gif of gifs) {
      const gifPath = path.join(gifsDir, gif);
      const stat = await fs.stat(gifPath);
      if (stat.isFile()) {
        await fs.unlink(gifPath);
      } else if (stat.isDirectory()) {
        await fs.rm(gifPath, { recursive: true, force: true });
      }
    }
  } catch (e) { }
  // Ne pas supprimer les guides pour conserver l'historique
}

router.post('/', async (req, res, next) => {
  try {
    await cleanUploads();
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Erreur lors du nettoyage des fichiers.' });
  }
}, uploadVideo.single('video'), (req, res) => {
  try {
    debugLog('🔵 [Upload Route] Received upload request');

    if (!req.file) {
      debugLog('🔴 [Upload Route] No file uploaded');
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    debugLog('🔵 [Upload Route] File uploaded successfully:', {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      path: req.file.path
    });

    res.json({
      success: true,
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        path: req.file.path
      }
    });
  } catch (error) {
    debugLog('🔴 [Upload Route] Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
