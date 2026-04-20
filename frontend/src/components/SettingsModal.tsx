import { useState } from 'react';
import { useSession } from '../store/session';

interface Props {
  onClose: () => void;
}

export function SettingsModal({ onClose }: Props) {
  const { apiKey, setApiKey } = useSession();
  const [value, setValue] = useState(apiKey);

  function handleSave() {
    setApiKey(value.trim());
    onClose();
  }

  const isValid = value.trim().startsWith('gsk_');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl border w-120 max-w-[95vw] flex flex-col shadow-2xl"
        style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <span className="font-semibold text-sm">⚙ Settings</span>
          <button
            onClick={onClose}
            className="text-xl leading-none cursor-pointer transition-colors"
            style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                Groq API Key
              </label>
              <span
                className="text-[11px] px-2 py-0.5 rounded border"
                style={
                  isValid
                    ? { color: '#22c55e', background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' }
                    : { color: '#ef4444', background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }
                }
              >
                {isValid ? 'VALID ✓' : 'NOT SET'}
              </span>
            </div>
            <input
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="gsk_..."
              className="w-full px-3 py-2 rounded-lg text-sm outline-none border transition-colors"
              style={{
                background: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--color-accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
            />
            <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              Your key is stored only in your browser's localStorage. Never sent anywhere except directly to Groq.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex justify-end gap-2 px-5 py-4 border-t shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm border cursor-pointer transition-all"
            style={{
              background: 'var(--color-bg-tertiary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer transition-all"
            style={{ background: 'var(--color-accent)' }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}