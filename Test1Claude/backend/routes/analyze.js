import express from 'express';
import { GeminiService } from '../services/geminiService.js';
import path from 'path';

const router = express.Router();
const geminiService = new GeminiService();

router.post('/', async (req, res) => {
  try {
    console.log('🔵 [Analyze Route] Received analysis request:', req.body);
    const { videoFilename, prompt } = req.body;

    if (!videoFilename || !prompt) {
      console.log('🔴 [Analyze Route] Missing required fields');
      return res.status(400).json({ error: 'Video filename and prompt are required' });
    }

    const videoPath = path.join(process.cwd(), 'backend', 'uploads', videoFilename);
    console.log('🔵 [Analyze Route] Video path:', videoPath);

    // Analyser directement avec Gemini
    console.log('🔵 [Analyze Route] Starting Gemini analysis');
    const result = await geminiService.analyzeFile(videoPath, prompt);
    console.log('🔵 [Analyze Route] Gemini analysis completed');

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
