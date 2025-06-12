import express from 'express';
import { GeminiService } from '../services/geminiService.js';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { debugLog } from '../utils/logger.js';

const router = express.Router();
const geminiService = new GeminiService();

// Route pour l'upload vers Gemini
router.post('/upload', async (req, res) => {
  try {
    debugLog('🔵 [Gemini Route] Received upload request:', req.body);
    const { videoFilename, mimeType } = req.body;

    if (!videoFilename || !mimeType) {
      debugLog('🔴 [Gemini Route] Missing required fields');
      return res.status(400).json({ error: 'Video filename and mime type are required' });
    }

    const videoPath = path.join(process.cwd(), 'uploads', videoFilename);
    debugLog('🔵 [Gemini Route] Video path:', videoPath);

    // Upload vers Gemini
    debugLog('🔵 [Gemini Route] Starting Gemini upload');
    const uri = await geminiService.uploadFile(videoPath, mimeType);
    debugLog('🔵 [Gemini Route] Gemini upload completed');

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
    debugLog('🔵 [Gemini Route] Received analysis request:', req.body);
    const { uri, prompt } = req.body;

    if (!uri || !prompt) {
      debugLog('🔴 [Gemini Route] Missing required fields');
      return res.status(400).json({ error: 'URI and prompt are required' });
    }

    // Analyse avec Gemini
    debugLog('🔵 [Gemini Route] Starting Gemini analysis');
    const result = await geminiService.analyzeFile(uri, prompt);
    debugLog('🔵 [Gemini Route] Gemini analysis completed');

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('🔴 [Gemini Route] Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route pour générer des GIFs à partir d'une vidéo
router.post('/gifs', async (req, res) => {
  try {
    const { videoFilename, gifs } = req.body;
    debugLog('🔵 [Gifs Route] Received request:', { videoFilename, gifs });
    if (!videoFilename || !Array.isArray(gifs) || gifs.length === 0) {
      return res.status(400).json({ success: false, error: 'videoFilename and gifs[] are required' });
    }
    const videoPath = path.join(process.cwd(), 'uploads', videoFilename);
    if (!fs.existsSync(videoPath)) {
      console.error('🔴 [Gifs Route] Video file not found:', videoPath);
      return res.status(404).json({ success: false, error: 'Video file not found' });
    }
    const gifsDir = path.join(process.cwd(), 'uploads', 'gifs');
    if (!fs.existsSync(gifsDir)) {
      fs.mkdirSync(gifsDir, { recursive: true });
    }
    const results = {};
    for (const gif of gifs) {
      const { start, duration } = gif;
      const safeTs = start.replace(/:/g, '_');
      const outputFilename = `${path.parse(videoFilename).name}_${safeTs}.gif`;
      const outputPath = path.join(gifsDir, outputFilename);
      // ffmpeg -ss start -t duration -i input.mp4 output.gif
      const ffmpegCmd = `ffmpeg -ss ${start} -t ${duration} -i "${videoPath}" -vf "fps=10,scale=480:-1:flags=lanczos" -y "${outputPath}"`;
      debugLog(`🔵 [Gifs Route] Running ffmpeg: ${ffmpegCmd}`);
      try {
        await new Promise((resolve, reject) => {
          exec(ffmpegCmd, (error, stdout, stderr) => {
            if (error) {
              console.error('🔴 [Gifs Route] ffmpeg error:', error, stderr);
              reject(error);
            } else {
              debugLog('🔵 [Gifs Route] ffmpeg output:', stdout, stderr);
              resolve();
            }
          });
        });
        results[start] = outputFilename;
      } catch (err) {
        results[start] = null;
      }
    }
    debugLog('🟢 [Gifs Route] Extraction results:', results);
    res.json({ success: true, results });
  } catch (err) {
    console.error('🔴 [Gifs Route] Unexpected error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
