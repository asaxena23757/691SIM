import { useState } from 'react';
import type { RobotModelState } from '../hooks/useRobotModel';
import { ProjectValidationError } from '@691sim/serialization';

interface JsonPanelProps {
  state: RobotModelState;
}

export function JsonPanel({ state }: JsonPanelProps) {
  const [text, setText] = useState(() => state.exportJson());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refresh = () => {
    try {
      setText(state.exportJson());
      setError(null);
      setSuccess('Refreshed from current model.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSuccess(null);
    }
  };

  const apply = () => {
    try {
      state.loadFromJson(text);
      setError(null);
      setSuccess('JSON applied to editor.');
    } catch (err) {
      if (err instanceof ProjectValidationError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
      setSuccess(null);
    }
  };

  return (
    <div className="panel-content">
      <div className="toolbar" style={{ marginBottom: '0.75rem' }}>
        <button type="button" className="btn" onClick={refresh}>
          Refresh from Model
        </button>
        <button type="button" className="btn btn-primary" onClick={apply}>
          Apply to Model
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            navigator.clipboard.writeText(text);
            setSuccess('Copied to clipboard.');
          }}
        >
          Copy
        </button>
      </div>
      {error && (
        <div
          style={{
            background: '#7f1d1d',
            color: '#fecaca',
            padding: '0.5rem',
            borderRadius: 6,
            fontSize: '0.8rem',
            marginBottom: '0.5rem',
            whiteSpace: 'pre-wrap',
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            background: '#14532d',
            color: '#bbf7d0',
            padding: '0.5rem',
            borderRadius: 6,
            fontSize: '0.8rem',
            marginBottom: '0.5rem',
          }}
        >
          {success}
        </div>
      )}
      <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
    </div>
  );
}
