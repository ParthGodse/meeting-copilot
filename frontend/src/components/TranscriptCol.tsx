import { useEffect, useRef, useState } from 'react';
import { useSession } from '../store/session';
import { useMic } from '../hooks/useMic';

function formatTime(secs: number) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function formatStamp(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function TranscriptCol() {
  const { transcriptChunks, isRecording } = useSession();
  const { start, stop } = useMic();
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new chunk added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptChunks]);

  // Timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  async function toggleMic() {
    setError(null);
    if (isRecording) {
      stop();
    } else {
      try {
        await start();
      } catch (err: any) {
        setError(err.message);
      }
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 h-10.5 flex-0 border-b"
        style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
      >
        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--color-text-muted)' }}>
          1. Mic &amp; Transcript
        </span>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full border"
          style={{
            color: isRecording ? '#ef4444' : 'var(--color-text-muted)',
            background: 'var(--color-bg-tertiary)',
            borderColor: 'var(--color-border)',
          }}
        >
          {isRecording ? 'REC ●' : 'IDLE'}
        </span>
      </div>

      {/* Mic controls */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-0 border-b"
        style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
      >
        <button
          onClick={toggleMic}
          className={`w-11 h-11 rounded-full flex items-center justify-center text-lg flex-0 border-2 transition-all cursor-pointer ${
            isRecording ? 'recording-pulse' : ''
          }`}
          style={{
            background: isRecording ? '#ef4444' : 'var(--color-bg-tertiary)',
            borderColor: isRecording ? '#f87171' : 'var(--color-border)',
            color: isRecording ? 'white' : 'var(--color-text-secondary)',
          }}
        >
          {isRecording ? '⏹' : '🎙'}
        </button>

        <div className="flex flex-col">
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {isRecording ? 'Recording…' : transcriptChunks.length > 0 ? 'Stopped. Click to resume.' : 'Click mic to start'}
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {isRecording ? 'Transcribing every ~30s' : 'Transcript appends every ~30s'}
          </span>
        </div>

        <span
          className="ml-auto font-mono text-sm tabular-nums"
          style={{ color: isRecording ? '#ef4444' : 'var(--color-text-muted)' }}
        >
          {formatTime(elapsed)}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-lg text-xs text-red-400 border border-red-500/20 bg-red-500/10">
          {error}
        </div>
      )}

      {/* Transcript chunks */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {transcriptChunks.length === 0 ? (
          <p className="text-center text-sm mt-10" style={{ color: 'var(--color-text-muted)' }}>
            No transcript yet — start the mic.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {transcriptChunks.map((chunk, i) => (
              <div
                key={chunk.id}
                className="rounded-lg px-3 py-2.5 text-sm leading-relaxed border transition-all"
                style={{
                  background: i === transcriptChunks.length - 1
                    ? 'rgba(99,102,241,0.08)'
                    : 'var(--color-bg-tertiary)',
                  borderColor: i === transcriptChunks.length - 1
                    ? 'var(--color-accent)'
                    : 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <div className="text-[10px] mb-1 tabular-nums" style={{ color: 'var(--color-text-muted)' }}>
                  {formatStamp(chunk.timestamp)}
                </div>
                {chunk.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}