import { useState } from 'react';
import type { DeviceDefinition } from '@691sim/core';
import type { RobotModelState } from '../hooks/useRobotModel';
import { CATEGORY_NAMES, PORT_TYPE_NAMES, categoryColor, portTypeColor } from '../utils/labels';
import { DeviceIcon } from './DeviceIcon';

interface RegistryExplorerProps {
  state: RobotModelState;
}

export function RegistryExplorer({ state }: RegistryExplorerProps) {
  const { registry } = state;
  const devices = registry.list();
  const [selected, setSelected] = useState<DeviceDefinition | null>(devices[0] ?? null);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', height: '100%' }}>
      <div style={{ borderRight: '1px solid #1f2937', overflow: 'auto', padding: '0.5rem' }}>
        {devices.map((def) => (
          <button
            key={def.type}
            type="button"
            className={`list-item ${selected?.type === def.type ? 'selected' : ''}`}
            onClick={() => setSelected(def)}
          >
            {def.displayName}
            <small>{CATEGORY_NAMES[def.category]}</small>
          </button>
        ))}
      </div>
      <div style={{ padding: '0.75rem', overflow: 'auto' }}>
        {selected ? (
          <>
            <h3 style={{ margin: '0 0 0.5rem', color: categoryColor(selected.category), display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DeviceIcon type={selected.type} size={40} />
              {selected.displayName}
            </h3>
            <p style={{ margin: '0 0 1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
              Type: <code>{selected.type}</code> · Category: {CATEGORY_NAMES[selected.category]}
            </p>

            {selected.metadata && Object.keys(selected.metadata).length > 0 && (
              <div className="field">
                <label>Metadata</label>
                <pre
                  style={{
                    background: '#111827',
                    padding: '0.5rem',
                    borderRadius: 6,
                    fontSize: '0.75rem',
                    overflow: 'auto',
                  }}
                >
                  {JSON.stringify(selected.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="field">
              <label>Ports ({selected.ports.length})</label>
              <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: '#64748b', textAlign: 'left' }}>
                    <th style={{ padding: '0.3rem' }}>ID</th>
                    <th style={{ padding: '0.3rem' }}>Type</th>
                    <th style={{ padding: '0.3rem' }}>Dir</th>
                    <th style={{ padding: '0.3rem' }}>Req</th>
                    <th style={{ padding: '0.3rem' }}>Max</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.ports.map((port) => (
                    <tr key={port.id} style={{ borderTop: '1px solid #1f2937' }}>
                      <td style={{ padding: '0.3rem' }}>{port.id}</td>
                      <td style={{ padding: '0.3rem', color: portTypeColor(port.type) }}>
                        {PORT_TYPE_NAMES[port.type]}
                      </td>
                      <td style={{ padding: '0.3rem' }}>
                        {port.direction === 0 ? 'IN' : port.direction === 1 ? 'OUT' : 'BI'}
                      </td>
                      <td style={{ padding: '0.3rem' }}>{port.required ? '✓' : ''}</td>
                      <td style={{ padding: '0.3rem' }}>{port.maxConnections ?? '∞'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selected.requirements && selected.requirements.length > 0 && (
              <div className="field">
                <label>Requirements</label>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem' }}>
                  {selected.requirements.map((req, i) => (
                    <li key={i}>
                      Min {req.minConnections} {PORT_TYPE_NAMES[req.portType]} connection(s)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">No devices in registry.</div>
        )}
      </div>
    </div>
  );
}
