import express from 'express';
import { CHAT_SYSTEM, CLICK_EXPAND_SYSTEM } from '../lib/prompts.js';
import { validateKey, truncateToWords, chatStream, AppError } from '../lib/groq.js';

const router = express.Router();

router.post('/stream', async (req, res) => {
  try {
    const apiKey = validateKey(req.headers['x-groq-key'] as string);
    const { messages = [], fullTranscript, suggestionDetail } = req.body;

    if (!Array.isArray(messages)) throw new AppError('messages must be an array', 400);

    // Cap transcript to stay within free tier token budget
    const safeTranscript = truncateToWords(fullTranscript || '', 2000);

    const systemPrompt = suggestionDetail
      ? CLICK_EXPAND_SYSTEM(safeTranscript, suggestionDetail)
      : CHAT_SYSTEM(safeTranscript);

    // Only pass last 12 messages to keep context window lean
    const recentMessages = messages.slice(-12) as {
      role: 'user' | 'assistant';
      content: string;
    }[];

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const stream = await chatStream(
      [{ role: 'system', content: systemPrompt }, ...recentMessages],
      1200,
      apiKey
    );

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) res.write(`data: ${JSON.stringify({ delta })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    const status = err?.status || 500;
    // If headers already sent (streaming started), just end
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    } else {
      res.status(status).json({ error: err.message });
    }
  }
});

export default router;