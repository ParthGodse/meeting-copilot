import { useCallback } from 'react';
import { useSession } from '../store/session';
import { streamChat } from '../lib/api';
import type { Suggestion } from '../store/session';

export function useChat() {
  const {
    apiKey,
    isChatting,
    setIsChatting,
    addChatMessage,
    appendAssistantDelta,
    getFullTranscript,
    chatMessages,
  } = useSession();

  const sendMessage = useCallback(
    async (
      content: string,
      suggestion?: Suggestion
    ) => {
      if (isChatting || !apiKey) return;
      setIsChatting(true);

      // 1. Add user message to store immediately
      addChatMessage({
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: new Date(),
        source: suggestion
          ? { type: 'suggestion', preview: suggestion.preview }
          : undefined,
      });

      // 2. Create empty assistant message — we'll stream into it
      const assistantId = crypto.randomUUID();
      addChatMessage({
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      });

      // 3. Build message history to send (last 12, excluding the empty assistant msg we just added)
      const history = [...chatMessages, { id: '', role: 'user' as const, content, timestamp: new Date() }]
        .slice(-12)
        .map((m) => ({ role: m.role, content: m.content }));

      const fullTranscript = getFullTranscript(2000);

      try {
        await streamChat(
          history,
          fullTranscript,
          apiKey,
          suggestion?.detail ?? null,
          // onDelta — append each streamed token
          (delta) => appendAssistantDelta(assistantId, delta),
          // onDone
          () => setIsChatting(false),
          // onError
          (err) => {
            appendAssistantDelta(assistantId, `\n\n_Error: ${err}_`);
            setIsChatting(false);
          }
        );
      } catch (err: any) {
        appendAssistantDelta(assistantId, `\n\n_Error: ${err.message}_`);
        setIsChatting(false);
      }
    },
    [apiKey, isChatting, setIsChatting, addChatMessage, appendAssistantDelta, getFullTranscript, chatMessages]
  );

  return { sendMessage };
}