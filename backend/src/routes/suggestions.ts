import express from 'express';
import { SUGGESTIONS_SYSTEM } from '../lib/prompts.js';
import { validateKey, truncateToWords, chatComplete, AppError } from '../lib/groq.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const apiKey = validateKey(req.headers['x-groq-key'] as string);
    const { recentTranscript, previousPreviews = [] } = req.body;

    const safeTranscript = truncateToWords(recentTranscript || '', 250);

    console.log('Transcript received:', safeTranscript); // debug

    const userMsg = `Recent transcript (last ~250 words — focus on the final 60-90 seconds):
"""
${safeTranscript || '(No transcript yet — meeting has not started)'}
"""

Previously shown suggestion previews to avoid repeating:
${previousPreviews.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n') || 'None'}

YOU MUST return EXACTLY 3 suggestions as JSON. No markdown. No explanation. Just raw JSON.`;

    const completion = await chatComplete(
      [
        { role: 'system', content: SUGGESTIONS_SYSTEM },
        { role: 'user', content: userMsg },
      ],
      600,
      apiKey
    );

    const raw = completion.choices[0].message.content || '';
    console.log('Raw LLM response:', raw); // debug

    // Strip markdown fences if present
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();

    // Extract JSON object
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON found in response: ' + raw);

    const parsed = JSON.parse(match[0]);

    if (!Array.isArray(parsed?.suggestions)) {
      throw new Error('Invalid suggestions format: ' + raw);
    }

    // Ensure exactly 3
    const suggestions = parsed.suggestions.slice(0, 3);
    res.json({ suggestions });

  } catch (err: any) {
    console.error('Suggestions error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;