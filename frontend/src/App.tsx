import { useState } from 'react';
import { useSession } from './store/session';
import { TranscriptCol } from './components/TranscriptCol';
import { SuggestionsCol } from './components/SuggestionsCol';
import { ChatCol } from './components/ChatCol';
import { SettingsModal } from './components/SettingsModal';
import { exportSession } from './lib/export';

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const { sessionId, apiKey, transcriptChunks, suggestionBatches, chatMessages } = useSession();

  function handleExport() {
    exportSession(sessionId, transcriptChunks, suggestionBatches, chatMessages);
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header
        className="flex items-center justify-between px-5 h-12 shrink-0 border-b"
        style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm tracking-tight">
            Twin<span style={{ color: 'var(--color-accent-light)' }}>Mind</span>
          </span>
          <span
            className="text-[11px] px-2 py-0.5 rounded-full border"
            style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)' }}
          >
            {sessionId}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs cursor-pointer transition-all"
            style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          >
            ⬇ Export Session
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs cursor-pointer transition-all"
            style={{ background: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          >
            ⚙ Settings
          </button>
        </div>
      </header>

      {/* No API key warning */}
      {!apiKey && (
        <div
          className="flex items-center justify-between px-5 py-2 text-xs border-b"
          style={{ background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.2)', color: 'var(--color-accent-light)' }}
        >
          <span>⚠ No Groq API key set — open Settings to get started.</span>
          <button
            onClick={() => setShowSettings(true)}
            className="underline cursor-pointer"
            style={{ background: 'none', border: 'none', color: 'var(--color-accent-light)' }}
          >
            Open Settings
          </button>
        </div>
      )}

      {/* 3-column layout */}
      <div
        className="flex-1 overflow-hidden grid"
        style={{ gridTemplateColumns: '1fr 1fr 1fr' }}
      >
        <div className="border-r overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
          <TranscriptCol />
        </div>
        <div className="border-r overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
          <SuggestionsCol />
        </div>
        <div className="overflow-hidden">
          <ChatCol />
        </div>
      </div>

      {/* Settings modal */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}