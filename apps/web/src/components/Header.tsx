/* eslint-disable @typescript-eslint/no-explicit-any */
import type { RobotModelState } from '../hooks/useRobotModel';

interface HeaderProps {
  state: RobotModelState;
  onOpenFile: () => void;
  onSaveFile: () => void;
  onLoadSample: () => void;
  onVerify: () => void;
  onExportPdf: () => void;
  isExportingPdf: boolean;
}

export function Header({
  state,
  onOpenFile,
  onSaveFile,
  onLoadSample,
  onVerify,
  onExportPdf,
  isExportingPdf,
}: HeaderProps) {
  const { model, verification, isVerifying } = state;
  const errorCount = verification.diagnostics.filter((d: any) => d.severity === 2).length;
  const warningCount = verification.diagnostics.filter((d: any) => d.severity === 1).length;

  return (
    <header className="app-header">
      <div className="app-brand">
        <h1>691SIM</h1>
        <span>Circuit Simulator</span>
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
        <button
          type="button"
          className="btn btn-primary"
          onClick={onVerify}
          disabled={isVerifying}
        >
          {isVerifying ? 'Verifying…' : 'Verify'}
        </button>
        <button
          type="button"
          className="btn"
          onClick={onExportPdf}
          disabled={isExportingPdf}
        >
          {isExportingPdf ? 'Exporting…' : 'Download PDF'}
        </button>
      </div>

      <div className="toolbar">
        <span className="badge badge-ok">{model.name}</span>
        {errorCount > 0 && <span className="badge badge-error">{errorCount} errors</span>}
        {warningCount > 0 && <span className="badge badge-warning">{warningCount} warnings</span>}
        {errorCount === 0 &&
          warningCount === 0 &&
          verification.diagnostics.length === 0 &&
          !isVerifying && <span className="badge badge-ok">No issues</span>}
      </div>

      <a
        className="github-credit"
        href="https://github.com/asaxena23757/691SIM"
        target="_blank"
        rel="noopener noreferrer"
      >
        GitHub ↗
      </a>
    </header>
  );
}
