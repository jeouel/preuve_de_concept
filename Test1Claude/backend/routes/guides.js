import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();
const guidesDir = path.join(process.cwd(), 'uploads', 'guides');

router.post('/save', async (req, res) => {
  const { html, filename } = req.body;
  if (!html || !filename) return res.status(400).json({ error: 'Missing data' });
  await fs.mkdir(guidesDir, { recursive: true });
  const filePath = path.join(guidesDir, filename);
  await fs.writeFile(filePath, html, 'utf-8');
  res.json({ success: true, path: `/uploads/guides/${filename}` });
});

router.get('/list', async (req, res) => {
  try {
    await fs.mkdir(guidesDir, { recursive: true });
    const files = await fs.readdir(guidesDir);
    res.json({ guides: files.filter(f => f.endsWith('.html')) });
  } catch (e) {
    res.status(500).json({ error: 'Erreur lors de la lecture des guides.' });
  }
});

router.get('/:filename', async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(guidesDir, filename);
  try {
    const html = await fs.readFile(filePath, 'utf-8');
    res.type('html').send(html);
  } catch (e) {
    res.status(404).json({ error: 'Guide non trouvé.' });
  }
});

export default router; 