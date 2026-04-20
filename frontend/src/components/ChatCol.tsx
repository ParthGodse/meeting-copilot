import { useEffect, useRef, useState } from 'react';
import { useSession } from '../store/session';
import { useChat } from '../hooks/useChat';

function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n+/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

function formatStamp(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function ChatCol() {
  const { chatMessages, isChatting } = useSession();
  const { sendMessage } = useChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on every message or delta
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || isChatting) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await sendMessage(text);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 h-10.5 shrink-0 border-b"
        style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
      >
        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--color-text-muted)' }}>
          3. Chat (Detailed Answers)
        </span>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full border"
          style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}
        >
          SESSION-ONLY
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {chatMessages.length === 0 ? (
          <div
            className="rounded-xl p-3 text-xs leading-relaxed border mb-4"
            style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            Clicking a suggestion adds it here and streams a detailed answer. You can also type questions directly below.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {chatMessages.map((msg, i) => {
              const isUser = msg.role === 'user';
              const isLastAssistant = !isUser && i === chatMessages.length - 1;
              const isStreaming = isLastAssistant && isChatting;

              return (
                <div key={msg.id} className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Source badge for suggestion clicks */}
                  {msg.source?.type === 'suggestion' && (
                    <div
                      className="text-[10px] px-2 py-0.5 rounded border"
                      style={{ color: 'var(--color-accent-light)', background: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.2)' }}
                    >
                      ↗ {msg.source.preview}
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={`max-w-[90%] px-3 py-2.5 rounded-xl text-sm leading-relaxed ${
                      isUser
                        ? 'rounded-br-sm text-white'
                        : 'rounded-bl-sm border'
                    } ${isStreaming && msg.content === '' ? 'streaming-cursor' : ''}`}
                    style={
                      isUser
                        ? { background: 'var(--color-accent)' }
                        : {
                            background: 'var(--color-bg-tertiary)',
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-text-primary)',
                          }
                    }
                  >
                    {isUser ? (
                      msg.content
                    ) : (
                      <span
                        className={isStreaming && msg.content !== '' ? 'streaming-cursor' : ''}
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                      />
                    )}
                  </div>

                  {/* Timestamp */}
                  <span className="text-[10px] px-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {formatStamp(msg.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Input */}
      <div
        className="px-4 py-3 shrink-0 border-t"
        style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Ask anything..."
            rows={1}
            className="flex-1 rounded-lg px-3 py-2 text-sm resize-none outline-none border transition-colors"
            style={{
              background: 'var(--color-bg-tertiary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
              minHeight: '38px',
              maxHeight: '120px',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--color-accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
          />
          <button
            onClick={handleSend}
            disabled={isChatting || !input.trim()}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-9.5"
            style={{ background: 'var(--color-accent)' }}
            onMouseEnter={(e) => { if (!isChatting) (e.currentTarget as HTMLElement).style.background = 'var(--color-accent-light)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-accent)'; }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}