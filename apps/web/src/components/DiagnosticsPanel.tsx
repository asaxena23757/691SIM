/* eslint-disable @typescript-eslint/no-explicit-any */
import { Severity, type Diagnostic } from '@691sim/core';
import type { RobotModelState } from '../hooks/useRobotModel';
import { SEVERITY_NAMES } from '../utils/labels';

interface DiagnosticsPanelProps {
  state: RobotModelState;
}

function severityClass(severity: Severity): string {
  switch (severity) {
    case Severity.ERROR:
      return 'badge-error';
    case Severity.WARNING:
      return 'badge-warning';
    default:
      return 'badge-info';
  }
}

export function DiagnosticsPanel({ state }: DiagnosticsPanelProps) {
  const { verification, focusDiagnostic, isVerifying, verifyProgress } = state;
  const { diagnostics, hasErrors } = verification;

  const grouped = [
    Severity.ERROR,
    Severity.WARNING,
    Severity.INFO,
  ].map((severity) => ({
    severity,
    items: diagnostics.filter((d: Diagnostic) => d.severity === severity),
  }));

  return (
    <section className="app-bottom diagnostics-panel">
      <div className="panel-header diagnostics-header">
        <span>Diagnostics</span>
        <span>
          {isVerifying ? (
            <span className="badge badge-info">Running checks…</span>
          ) : hasErrors ? (
            <span className="badge badge-error">Verification failed</span>
          ) : diagnostics.length > 0 ? (
            <span className="badge badge-warning">Passed with warnings</span>
          ) : (
            <span className="badge badge-ok">All checks passed</span>
          )}
        </span>
      </div>

      {isVerifying && (
        <div className="verify-progress-wrap">
          <div className="verify-progress-bar" style={{ width: `${verifyProgress}%` }} />
        </div>
      )}

      <div className="panel-content diagnostics-content">
        {!isVerifying && diagnostics.length === 0 ? (
          <div className="empty-state diagnostics-empty">
            Click Verify to run checks on your robot wiring.
          </div>
        ) : (
          grouped.map(
            ({ severity, items }) =>
              items.length > 0 && (
                <div key={severity} className="diagnostic-group">
                  <div className="diagnostic-group-title">
                    {SEVERITY_NAMES[severity]} ({items.length})
                  </div>
                  {items.map((diag: Diagnostic) => (
                    <button
                      key={diag.id}
                      type="button"
                      className="list-item"
                      onClick={() => focusDiagnostic(diag.deviceIds, diag.connectionIds)}
                    >
                      <span className={`badge ${severityClass(diag.severity)}`}>
                        {diag.code ?? SEVERITY_NAMES[diag.severity]}
                      </span>{' '}
                      {diag.message}
                      {(diag.deviceIds?.length ?? 0) > 0 && (
                        <small>Devices: {diag.deviceIds!.join(', ')}</small>
                      )}
                    </button>
                  ))}
                </div>
              ),
          )
        )}
      </div>
    </section>
  );
}
