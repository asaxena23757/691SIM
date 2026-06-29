import { PortType } from '@691sim/core';
import type { Connection } from '@691sim/core';
import type { RobotModelState } from '../hooks/useRobotModel';
import { PORT_TYPE_NAMES } from '../utils/labels';
import { resolveConnectionPortType } from '../utils/wireStyles';

interface ConnectionsPanelProps {
  state: RobotModelState;
}

export function ConnectionsPanel({ state }: ConnectionsPanelProps) {
  const { model, registry } = state;

  const lines = model.connections.map((conn: Connection, index: number) => {
    const srcDevice = model.devices.find((d) => d.id === conn.sourceDevice);
    const portType =
      resolveConnectionPortType(
        registry,
        conn.sourceDevice,
        srcDevice?.type ?? '',
        conn.sourcePort,
      ) ?? PortType.POWER;
    const hidden = portType === PortType.GROUND ? ' (auto ground)' : '';
    return `${index + 1}. [${conn.id}] ${conn.sourceDevice}.${conn.sourcePort} → ${conn.targetDevice}.${conn.targetPort}  (${PORT_TYPE_NAMES[portType]}${hidden})`;
  });

  const text = lines.length > 0 ? lines.join('\n') : 'No connections yet.';

  return (
    <div className="panel-content connections-debug">
      <div className="toolbar" style={{ marginBottom: '0.75rem' }}>
        <button
          type="button"
          className="btn"
          onClick={() => navigator.clipboard.writeText(text)}
        >
          Copy
        </button>
        <span className="badge badge-ok">{model.connections.length} total</span>
      </div>
      <pre>{text}</pre>
    </div>
  );
}
