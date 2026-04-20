import express from 'express';
import cors from 'cors';
import transcribeRouter from './routes/transcribe.js';
import suggestionsRouter from './routes/suggestions.js';
import chatRouter from './routes/chat.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/transcribe', transcribeRouter);
app.use('/api/suggestions', suggestionsRouter);
app.use('/api/chat', chatRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on :${PORT}`));