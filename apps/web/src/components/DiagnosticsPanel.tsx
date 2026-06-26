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
  const { verification, focusDiagnostic } = state;
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
    <section className="app-bottom">
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Diagnostics</span>
        <span>
          {hasErrors ? (
            <span className="badge badge-error">Verification failed</span>
          ) : diagnostics.length > 0 ? (
            <span className="badge badge-warning">Passed with warnings</span>
          ) : (
            <span className="badge badge-ok">All checks passed</span>
          )}
        </span>
      </div>
      <div className="panel-content" style={{ padding: '0.5rem 0.75rem' }}>
        {diagnostics.length === 0 ? (
          <div className="empty-state" style={{ padding: '1rem' }}>
            No diagnostics. Run verification or edit the robot architecture.
          </div>
        ) : (
          grouped.map(
            ({ severity, items }) =>
              items.length > 0 && (
                <div key={severity} style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
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
