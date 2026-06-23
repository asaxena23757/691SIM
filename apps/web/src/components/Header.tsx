import type { RobotModelState } from '../hooks/useRobotModel';

interface HeaderProps {
  state: RobotModelState;
  onOpenFile: () => void;
  onSaveFile: () => void;
  onLoadSample: () => void;
  onVerify: () => void;
}

export function Header({ state, onOpenFile, onSaveFile, onLoadSample, onVerify }: HeaderProps) {
  const { model, verification } = state;
  const errorCount = verification.diagnostics.filter((d) => d.severity === 2).length;
  const warningCount = verification.diagnostics.filter((d) => d.severity === 1).length;

  return (
    <header className="app-header">
      <div className="app-brand">
        <h1>691SIM</h1>
        <span>FRC Architecture Verifier</span>
      </div>

      <div className="toolbar">
        <button type="button" className="btn" onClick={() => state.newProject()}>
          New
        </button>
        <button type="button" className="btn" onClick={onOpenFile}>
          Open JSON
        </button>
        <button type="button" className="btn" onClick={onSaveFile}>
          Save JSON
        </button>
        <button type="button" className="btn" onClick={onLoadSample}>
          Load Sample
        </button>
        <button type="button" className="btn btn-primary" onClick={onVerify}>
          Verify
        </button>
      </div>

      <div className="toolbar">
        <span className="badge badge-ok">{model.name}</span>
        {errorCount > 0 && <span className="badge badge-error">{errorCount} errors</span>}
        {warningCount > 0 && <span className="badge badge-warning">{warningCount} warnings</span>}
        {errorCount === 0 && warningCount === 0 && verification.diagnostics.length === 0 && (
          <span className="badge badge-ok">No issues</span>
        )}
      </div>
    </header>
  );
}
