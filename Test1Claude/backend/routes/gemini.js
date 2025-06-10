import express from 'express';
import { GeminiService } from '../services/geminiService.js';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';

const router = express.Router();
const geminiService = new GeminiService();

// Route pour l'upload vers Gemini
router.post('/upload', async (req, res) => {
  try {
    console.log('🔵 [Gemini Route] Received upload request:', req.body);
    const { videoFilename, mimeType } = req.body;

    if (!videoFilename || !mimeType) {
      console.log('🔴 [Gemini Route] Missing required fields');
      return res.status(400).json({ error: 'Video filename and mime type are required' });
    }

    const videoPath = path.join(process.cwd(), 'uploads', videoFilename);
    console.log('🔵 [Gemini Route] Video path:', videoPath);

    // Upload vers Gemini
    console.log('🔵 [Gemini Route] Starting Gemini upload');
    const uri = await geminiService.uploadFile(videoPath, mimeType);
    console.log('🔵 [Gemini Route] Gemini upload completed');

    res.json({
      success: true,
      uri
    });
  } catch (error) {
    console.error('🔴 [Gemini Route] Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route pour l'analyse avec Gemini
router.post('/analyze', async (req, res) => {
  try {
    console.log('🔵 [Gemini Route] Received analysis request:', req.body);
    const { uri, prompt } = req.body;

    if (!uri || !prompt) {
      console.log('🔴 [Gemini Route] Missing required fields');
      return res.status(400).json({ error: 'URI and prompt are required' });
    }

    // Analyse avec Gemini
    console.log('🔵 [Gemini Route] Starting Gemini analysis');
    const result = await geminiService.analyzeFile(uri, prompt);
    console.log('🔵 [Gemini Route] Gemini analysis completed');

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('🔴 [Gemini Route] Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route pour extraire des screenshots à partir d'une vidéo
router.post('/screenshots', async (req, res) => {
  try {
    const { videoFilename, timestamps } = req.body;
    console.log('🔵 [Screenshots Route] Received request:', { videoFilename, timestamps });
    if (!videoFilename || !Array.isArray(timestamps) || timestamps.length === 0) {
      return res.status(400).json({ success: false, error: 'videoFilename and timestamps[] are required' });
    }
    const videoPath = path.join(process.cwd(), 'uploads', videoFilename);
    if (!fs.existsSync(videoPath)) {
      console.error('🔴 [Screenshots Route] Video file not found:', videoPath);
      return res.status(404).json({ success: false, error: 'Video file not found' });
    }
    const screenshotsDir = path.join(process.cwd(), 'uploads', 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    const results = {};
    for (const ts of timestamps) {
      const safeTs = ts.replace(/:/g, '_');
      const outputFilename = `${path.parse(videoFilename).name}_${safeTs}.jpg`;
      const outputPath = path.join(screenshotsDir, outputFilename);
      const ffmpegCmd = `ffmpeg -ss ${ts} -i "${videoPath}" -frames:v 1 -q:v 2 "${outputPath}" -y`;
      console.log(`🔵 [Screenshots Route] Running ffmpeg: ${ffmpegCmd}`);
      try {
        await new Promise((resolve, reject) => {
          exec(ffmpegCmd, (error, stdout, stderr) => {
            if (error) {
              console.error('🔴 [Screenshots Route] ffmpeg error:', error, stderr);
              reject(error);
            } else {
              console.log('🔵 [Screenshots Route] ffmpeg output:', stdout, stderr);
              resolve();
            }
          });
        });
        results[ts] = outputFilename;
      } catch (err) {
        results[ts] = null;
      }
    }
    console.log('🟢 [Screenshots Route] Extraction results:', results);
    res.json({ success: true, results });
  } catch (err) {
    console.error('🔴 [Screenshots Route] Unexpected error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
