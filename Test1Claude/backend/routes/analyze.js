import express from 'express';
import { GeminiService } from '../services/geminiService.js';
import path from 'path';
import { debugLog } from '../utils/logger.js';

const router = express.Router();
const geminiService = new GeminiService();

router.post('/', async (req, res) => {
  try {
    debugLog('🔵 [Analyze Route] Received analysis request:', req.body);
    const { videoFilename, prompt } = req.body;

    if (!videoFilename || !prompt) {
      debugLog('🔴 [Analyze Route] Missing required fields');
      return res.status(400).json({ error: 'Video filename and prompt are required' });
    }

    const videoPath = path.join(process.cwd(), 'backend', 'uploads', videoFilename);
    debugLog('🔵 [Analyze Route] Video path:', videoPath);

    // Analyser directement avec Gemini
    debugLog('🔵 [Analyze Route] Starting Gemini analysis');
    const result = await geminiService.analyzeFile(videoPath, prompt);
    debugLog('🔵 [Analyze Route] Gemini analysis completed');

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('🔴 [Analyze Route] Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
