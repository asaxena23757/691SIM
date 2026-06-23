import type { RobotModelState } from '../hooks/useRobotModel';
import { ESTIMATOR_PACKAGE_NAME } from '@691sim/estimator';

interface GraphPanelProps {
  state: RobotModelState;
}

export function GraphPanel({ state }: GraphPanelProps) {
  const { graph, model } = state;

  if (!graph) {
    return (
      <div className="panel-content">
        <div className="empty-state">Unable to build graph from current model.</div>
      </div>
    );
  }

  const powerSources = graph.powerSources().map((d) => d.id);
  const canReachable = model.devices
    .filter((d) => graph.canReachable(d.id))
    .map((d) => d.id);
  const networkReachable = model.devices
    .filter((d) => graph.networkReachable(d.id))
    .map((d) => d.id);
  const components = graph.connectedComponents().map((c) => c.map((d) => d.id));

  return (
    <div className="panel-content" style={{ fontSize: '0.82rem' }}>
      <div className="field">
        <label>Graph Summary</label>
        <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#cbd5e1' }}>
          <li>{graph.devices.length} device nodes</li>
          <li>{graph.ports.length} port nodes</li>
          <li>{graph.edges.length} connection edges</li>
        </ul>
      </div>

      <div className="field">
        <label>Power Sources</label>
        <div>{powerSources.length ? powerSources.join(', ') : 'None'}</div>
      </div>

      <div className="field">
        <label>CAN Reachable Devices</label>
        <div>{canReachable.length ? canReachable.join(', ') : 'None'}</div>
      </div>

      <div className="field">
        <label>Network Reachable Devices</label>
        <div>{networkReachable.length ? networkReachable.join(', ') : 'None'}</div>
      </div>

      <div className="field">
        <label>Connected Components</label>
        {components.map((comp, i) => (
          <div key={i} style={{ marginBottom: '0.35rem', color: '#94a3b8' }}>
            Component {i + 1}: {comp.join(', ')}
          </div>
        ))}
      </div>

      <div className="field">
        <label>Estimator</label>
        <div className="coming-soon">
          Package <code>{ESTIMATOR_PACKAGE_NAME}</code> is a stub — power draw, brownout, and
          CAN utilization estimation coming in Phase 5.
        </div>
      </div>
    </div>
  );
}
