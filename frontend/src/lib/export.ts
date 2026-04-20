import type { TranscriptChunk, SuggestionBatch, ChatMessage } from '../store/session';

interface SessionData {
  sessionId: string;
  exportedAt: string;
  transcript: { timestamp: string; text: string }[];
  suggestionBatches: { timestamp: string; suggestions: SuggestionBatch['suggestions'] }[];
  chatHistory: { timestamp: string; role: string; content: string; source?: ChatMessage['source'] }[];
}

export function exportSession(
  sessionId: string,
  transcriptChunks: TranscriptChunk[],
  suggestionBatches: SuggestionBatch[],
  chatMessages: ChatMessage[]
) {
  const data: SessionData = {
    sessionId,
    exportedAt: new Date().toISOString(),
    transcript: transcriptChunks.map((c) => ({
      timestamp: c.timestamp.toISOString(),
      text: c.text,
    })),
    suggestionBatches: suggestionBatches.map((b) => ({
      timestamp: b.timestamp.toISOString(),
      suggestions: b.suggestions,
    })),
    chatHistory: chatMessages.map((m) => ({
      timestamp: m.timestamp.toISOString(),
      role: m.role,
      content: m.content,
      source: m.source,
    })),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `twinmind-${sessionId}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}