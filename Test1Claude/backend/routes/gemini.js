import express from 'express';
import { GeminiService } from '../services/geminiService.js';
import path from 'path';

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

export default router;
