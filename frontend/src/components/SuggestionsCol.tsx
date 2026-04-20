import { useEffect, useState } from 'react';
import { useSession } from '../store/session';
import { useSuggestions } from '../hooks/useSuggestions';
import { useChat } from '../hooks/useChat';
import { TYPE_CONFIG } from '../type';
import type { Suggestion } from '../store/session';

function formatStamp(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function SuggestionsCol() {
  const { suggestionBatches, isRefreshing } = useSession();
  const { manualRefresh, resetCountdown } = useSuggestions();
  const { sendMessage } = useChat();
  const [countdown, setCountdown] = useState(30);

  // Start countdown on mount
  useEffect(() => {
    resetCountdown(setCountdown);
  }, []);

  function handleRefresh() {
    manualRefresh(setCountdown);
  }

  async function handleSuggestionClick(sug: Suggestion) {
    await sendMessage(sug.preview, sug);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 h-10.5 shrink-0 border-b"
        style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
      >
        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--color-text-muted)' }}>
          2. Live Suggestions
        </span>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full border"
          style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}
        >
          {suggestionBatches.length} BATCHES
        </span>
      </div>

      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2 shrink-0 border-b"
        style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
      >
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'var(--color-bg-tertiary)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <span className={isRefreshing ? 'animate-spin' : ''}>↻</span>
          Reload suggestions
        </button>
        <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
          auto-refresh in{' '}
          <span style={{ color: 'var(--color-accent-light)' }} className="tabular-nums">
            {countdown}
          </span>
          s
        </span>
      </div>

      {/* Suggestions list */}
      <div className="flex-1 overflow-y-auto p-4">
        {suggestionBatches.length === 0 ? (
          <p className="text-center text-sm mt-10 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Suggestions appear here once recording starts.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {suggestionBatches.map((batch, bIdx) => (
              <div key={batch.id} className={bIdx > 0 ? 'opacity-50' : ''}>
                {/* Batch label */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                    {bIdx === 0 ? `Latest · ${formatStamp(batch.timestamp)}` : formatStamp(batch.timestamp)}
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2">
                  {batch.suggestions.map((sug, sIdx) => {
                    const cfg = TYPE_CONFIG[sug.type] ?? TYPE_CONFIG.clarification;
                    return (
                      <button
                        key={sIdx}
                        onClick={() => handleSuggestionClick(sug)}
                        className="w-full text-left rounded-xl p-3 border transition-all cursor-pointer hover:-translate-y-0.5"
                        style={{
                          background: 'var(--color-bg-card)',
                          borderColor: 'var(--color-border)',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-accent)';
                          (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-card-hover)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                          (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-card)';
                        }}
                      >
                        {/* Type badge */}
                        <div className={`inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded border mb-2 ${cfg.colorClass} ${cfg.bgClass}`}>
                          {cfg.icon} {cfg.label}
                        </div>

                        {/* Preview */}
                        <p className="text-sm leading-relaxed mb-1" style={{ color: 'var(--color-text-primary)' }}>
                          {sug.preview}
                        </p>

                        {/* Hint */}
                        <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                          ↗ Click for detailed answer
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}