import Groq from 'groq-sdk';

const MODEL = 'openai/gpt-oss-120b';
const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25MB — Groq's limit
const TIMEOUT_MS = 30_000;
const RETRY_DELAY_MS = 2_000;

export function validateKey(apiKey: string | undefined): string {
  if (!apiKey || !apiKey.startsWith('gsk_')) {
    throw new AppError('Invalid or missing Groq API key', 401);
  }
  return apiKey;
}

export function validateAudioSize(bytes: number) {
  if (bytes > MAX_AUDIO_BYTES) {
    throw new AppError(`Audio chunk too large (${(bytes / 1024 / 1024).toFixed(1)}MB). Max is 25MB.`, 400);
  }
}

export function truncateToWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(-maxWords).join(' ');
}

export class AppError extends Error {
  constructor(public message: string, public status: number = 500) {
    super(message);
  }
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    const is429 = err?.status === 429 || err?.message?.includes('rate limit');
    if (is429) {
      await sleep(RETRY_DELAY_MS);
      return await fn(); // one retry
    }
    throw err;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new AppError('Groq request timed out', 504)), ms)
    ),
  ]);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function transcribe(
  fileBuffer: Buffer,
  mimeType: string,
  apiKey: string
): Promise<string> {
  validateAudioSize(fileBuffer.length);
  const groq = new Groq({ apiKey });
  const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';

  const result = await withTimeout(
    withRetry(() =>
      groq.audio.transcriptions.create({
        file: new File([fileBuffer as unknown as BlobPart], `audio.${ext}`, { type: mimeType }),
        model: 'whisper-large-v3',
        response_format: 'verbose_json',
        temperature: 0,
      })
    ),
    TIMEOUT_MS
  );

  return result.text?.trim() ?? '';
}

export async function chatComplete(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  maxTokens: number,
  apiKey: string,
  temperature = 0.7
) {
  const groq = new Groq({ apiKey });

  return await withTimeout(
    withRetry(() =>
      groq.chat.completions.create({
        model: MODEL,
        messages,
        max_tokens: maxTokens,
        temperature,
      })
    ),
    TIMEOUT_MS
  );
}

export async function chatStream(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  maxTokens: number,
  apiKey: string,
  temperature = 0.65
) {
  const groq = new Groq({ apiKey });

  return await withTimeout(
    withRetry(() =>
      groq.chat.completions.create({
        model: MODEL,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: true,
      })
    ),
    TIMEOUT_MS
  );
}