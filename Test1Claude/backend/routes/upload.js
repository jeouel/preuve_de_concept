import express from 'express';
import { uploadVideo } from '../middleware/upload.js';

const router = express.Router();

router.post('/', uploadVideo.single('video'), (req, res) => {
  try {
    console.log('🔵 [Upload Route] Received upload request');

    if (!req.file) {
      console.log('🔴 [Upload Route] No file uploaded');
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    console.log('🔵 [Upload Route] File uploaded successfully:', {
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
    console.error('🔴 [Upload Route] Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
