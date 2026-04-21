import express from 'express';
import { SUGGESTIONS_SYSTEM } from '../lib/prompts.js';
import { validateKey, truncateToWords, chatComplete, AppError } from '../lib/groq.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const apiKey = validateKey(req.headers['x-groq-key'] as string);
    const { recentTranscript, previousPreviews = [] } = req.body;

    // Cap context sent to LLM — free tier token budget
    const safeTranscript = truncateToWords(recentTranscript || '', 250);

    const userMsg = `Recent transcript (last ~400 words — focus on the final 60-90 seconds):
"""
${safeTranscript || '(No transcript yet — meeting has not started)'}
"""

Previously shown suggestion previews to avoid repeating:
${previousPreviews.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n') || 'None'}

Generate 3 fresh, maximally useful suggestions now.`;

    const completion = await chatComplete(
      [
        { role: 'system', content: SUGGESTIONS_SYSTEM },
        { role: 'user', content: userMsg },
      ],
      600,
      apiKey
    );

    const text = completion.choices[0].message.content || '';
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (err: any) {
    const status = err?.status || 500;
    res.status(status).json({ error: err.message });
  }
});

export default router;