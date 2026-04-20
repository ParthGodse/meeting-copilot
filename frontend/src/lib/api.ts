const API = import.meta.env.VITE_API_URL;

function headers(apiKey: string) {
  return {
    'x-groq-key': apiKey,
    'Content-Type': 'application/json',
  };
}

export async function transcribeAudio(
  blob: Blob,
  apiKey: string
): Promise<string> {
  const ext = blob.type.includes('mp4')
    ? 'mp4'
    : blob.type.includes('ogg')
    ? 'ogg'
    : 'webm';

  const fd = new FormData();
  fd.append('audio', blob, `chunk.${ext}`);

  const res = await fetch(`${API}/api/transcribe`, {
    method: 'POST',
    headers: { 'x-groq-key': apiKey },
    body: fd,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Transcription failed');
  return data.text || '';
}

export async function fetchSuggestions(
  recentTranscript: string,
  previousPreviews: string[],
  apiKey: string
) {
  const res = await fetch(`${API}/api/suggestions`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({ recentTranscript, previousPreviews }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Suggestions failed');
  return data;
}

export async function streamChat(
  messages: { role: string; content: string }[],
  fullTranscript: string,
  apiKey: string,
  suggestionDetail: string | null,
  onDelta: (delta: string) => void,
  onDone: () => void,
  onError: (err: string) => void
): Promise<void> {
  const res = await fetch(`${API}/api/chat/stream`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({ messages, fullTranscript, suggestionDetail }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    onError(data.error || 'Chat failed');
    return;
  }

  const reader = res.body!.getReader();
  const dec = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of dec.decode(value, { stream: true }).split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const d = line.slice(6).trim();
      if (d === '[DONE]') { onDone(); return; }
      try {
        const parsed = JSON.parse(d);
        if (parsed.delta) onDelta(parsed.delta);
        if (parsed.error) { onError(parsed.error); return; }
      } catch {}
    }
  }
}