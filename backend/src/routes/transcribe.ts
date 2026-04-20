import express from 'express';
import multer from 'multer';
import { validateKey, transcribe, AppError } from '../lib/groq.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('audio'), async (req, res) => {
  try {
    const apiKey = validateKey(req.headers['x-groq-key'] as string);
    const file = req.file;
    if (!file) throw new AppError('No audio file received', 400);

    const text = await transcribe(file.buffer, file.mimetype, apiKey);
    res.json({ text });
  } catch (err: any) {
    const status = err?.status || 500;
    res.status(status).json({ error: err.message });
  }
});

export default router;