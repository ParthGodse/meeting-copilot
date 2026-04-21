import { create } from 'zustand';

export type SuggestionType =
  | 'question'
  | 'talking_point'
  | 'answer'
  | 'fact_check';

export interface Suggestion {
  type: SuggestionType;
  preview: string;
  detail: string;
}

export interface SuggestionBatch {
  id: string;
  timestamp: Date;
  suggestions: Suggestion[];
}

export interface TranscriptChunk {
  id: string;
  timestamp: Date;
  text: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source?: { type: 'suggestion'; preview: string };
}

interface SessionState {
  sessionId: string;
  apiKey: string;
  transcriptChunks: TranscriptChunk[];
  suggestionBatches: SuggestionBatch[];
  chatMessages: ChatMessage[];
  isRecording: boolean;
  isRefreshing: boolean;
  isChatting: boolean;

  setApiKey: (key: string) => void;
  addTranscriptChunk: (text: string) => void;
  addSuggestionBatch: (batch: SuggestionBatch) => void;
  addChatMessage: (msg: ChatMessage) => void;
  appendAssistantDelta: (id: string, delta: string) => void;
  setIsRecording: (v: boolean) => void;
  setIsRefreshing: (v: boolean) => void;
  setIsChatting: (v: boolean) => void;
  getRecentTranscript: (maxWords?: number) => string;
  getFullTranscript: (maxWords?: number) => string;
  getPreviousPreviews: () => string[];
}

export const useSession = create<SessionState>((set, get) => ({
  sessionId: 'sm-' + Date.now().toString(36),
  apiKey: localStorage.getItem('tm_api_key') || '',
  transcriptChunks: [],
  suggestionBatches: [],
  chatMessages: [],
  isRecording: false,
  isRefreshing: false,
  isChatting: false,

  setApiKey: (key) => {
    localStorage.setItem('tm_api_key', key);
    set({ apiKey: key });
  },

  addTranscriptChunk: (text) =>
    set((s) => ({
      transcriptChunks: [
        ...s.transcriptChunks,
        { id: crypto.randomUUID(), timestamp: new Date(), text },
      ],
    })),

  addSuggestionBatch: (batch) =>
    set((s) => ({
      suggestionBatches: [batch, ...s.suggestionBatches],
    })),

  addChatMessage: (msg) =>
    set((s) => ({
      chatMessages: [...s.chatMessages, msg],
    })),

  // Used for streaming — finds message by id and appends delta
  appendAssistantDelta: (id, delta) =>
    set((s) => ({
      chatMessages: s.chatMessages.map((m) =>
        m.id === id ? { ...m, content: m.content + delta } : m
      ),
    })),

  setIsRecording: (v) => set({ isRecording: v }),
  setIsRefreshing: (v) => set({ isRefreshing: v }),
  setIsChatting: (v) => set({ isChatting: v }),

  // Last ~400 words for suggestions
  getRecentTranscript: (maxWords = 400) => {
    const all = get()
      .transcriptChunks.map((c) => c.text)
      .join(' ');
    return all.split(' ').slice(-maxWords).join(' ');
  },

  // Full transcript with timestamps for chat
  getFullTranscript: (maxWords = 2000) => {
    const all = get()
      .transcriptChunks.map(
        (c) => `[${c.timestamp.toLocaleTimeString()}] ${c.text}`
      )
      .join('\n');
    return all.split(' ').slice(-maxWords).join(' ');
  },

  getPreviousPreviews: () =>
    get()
      .suggestionBatches.flatMap((b) => b.suggestions.map((s) => s.preview))
      .slice(-9),
}));