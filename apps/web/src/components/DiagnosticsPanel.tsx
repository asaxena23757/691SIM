/* eslint-disable @typescript-eslint/no-explicit-any */
import { Severity, type Diagnostic } from '@691sim/core';
import type { RobotModelState } from '../hooks/useRobotModel';
import { SEVERITY_NAMES } from '../utils/labels';

interface DiagnosticsPanelProps {
  state: RobotModelState;
  collapsed: boolean;
  onToggle: () => void;
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

export function DiagnosticsPanel({ state, collapsed, onToggle }: DiagnosticsPanelProps) {
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

  const statusBadge = isVerifying ? (
    <span className="badge badge-info">Running…</span>
  ) : hasErrors ? (
    <span className="badge badge-error">Failed</span>
  ) : diagnostics.length > 0 ? (
    <span className="badge badge-warning">Warnings</span>
  ) : (
    <span className="badge badge-ok">OK</span>
  );

  return (
    <section className={`app-bottom diagnostics-panel ${collapsed ? 'collapsed' : ''}`}>
      <button type="button" className="panel-header diagnostics-header collapsible-header" onClick={onToggle}>
        <span className="collapse-chevron">{collapsed ? '▸' : '▾'}</span>
        <span>Diagnostics</span>
        <span className="diagnostics-status">{statusBadge}</span>
      </button>

      {!collapsed && (
        <>
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
        </>
      )}
    </section>
  );
}
