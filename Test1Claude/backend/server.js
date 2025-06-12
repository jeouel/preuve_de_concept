import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import uploadRoutes from './routes/upload.js';
import analyzeRoutes from './routes/analyze.js';
import geminiRoutes from './routes/gemini.js';
import guidesRoutes from './routes/guides.js';
import http from 'http';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(join(__dirname, 'uploads')));
app.use('/screenshots', express.static(join(__dirname, 'uploads', 'screenshots')));
app.use('/gifs', express.static(join(__dirname, 'uploads', 'gifs')));
app.use('/guides', express.static(join(__dirname, 'uploads', 'guides')));

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/guides', guidesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const server = http.createServer(app);
server.setTimeout(600000); // 10 minutes

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
