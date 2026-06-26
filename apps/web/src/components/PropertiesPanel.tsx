/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DeviceDefinition, Port } from '@691sim/core';
import type { RobotModelState } from '../hooks/useRobotModel';
import { PORT_TYPE_NAMES } from '../utils/labels';

interface PropertiesPanelProps {
  state: RobotModelState;
}

export function PropertiesPanel({ state }: PropertiesPanelProps) {
  const {
    model,
    selectedDevice,
    selectedDefinition,
    selectedConnectionId,
    selectedDeviceId,
    updateDevice,
    removeDevice,
    removeConnection,
    pendingPort,
    setPendingPort,
  } = state;

  const selectedConnection = model.connections.find((c) => c.id === selectedConnectionId);

  if (selectedConnection) {
    return (
      <aside className="panel">
        <div className="panel-header">Connection</div>
        <div className="panel-content">
          <div className="field">
            <label>ID</label>
            <input value={selectedConnection.id} readOnly />
          </div>
          <div className="field">
            <label>Source</label>
            <input
              value={`${selectedConnection.sourceDevice}.${selectedConnection.sourcePort}`}
              readOnly
            />
          </div>
          <div className="field">
            <label>Target</label>
            <input
              value={`${selectedConnection.targetDevice}.${selectedConnection.targetPort}`}
              readOnly
            />
          </div>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => removeConnection(selectedConnection.id)}
          >
            Delete Connection
          </button>
        </div>
      </aside>
    );
  }

  if (!selectedDevice || !selectedDefinition) {
    return (
      <aside className="panel">
        <div className="panel-header">Properties</div>
        <div className="panel-content">
          <div className="empty-state">
            Select a device or connection on the canvas to edit its properties.
          </div>
          <div className="field" style={{ marginTop: '1.5rem' }}>
            <label>Project Name</label>
            <input
              value={model.name}
              onChange={(e: { target: { value: string } }) =>
                state.setModel((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>
          <div className="field">
            <label>Project ID</label>
            <input value={model.id} readOnly />
          </div>
          <div className="field">
            <label>Schema Version</label>
            <input value={model.schemaVersion} readOnly />
          </div>
          <div className="status-bar" style={{ flexDirection: 'column', gap: '0.25rem' }}>
            <span>
              <strong>{model.devices.length}</strong> devices
            </span>
            <span>
              <strong>{model.connections.length}</strong> connections
            </span>
          </div>
        </div>
      </aside>
    );
  }

  const canId = selectedDevice.metadata?.canId;
  const ipAddress = selectedDevice.metadata?.ipAddress;

  return (
    <aside className="panel">
      <div className="panel-header">Properties</div>
      <div className="panel-content">
        <div className="field">
          <label>Label</label>
            <input
              value={selectedDevice.label ?? ''}
              onChange={(e: { target: { value: string } }) =>
                updateDevice(selectedDevice.id, { label: e.target.value })
              }
            />
        </div>
        <div className="field">
          <label>Device Type</label>
          <input value={selectedDefinition.displayName} readOnly />
        </div>
        <div className="field">
          <label>Instance ID</label>
          <input value={selectedDevice.id} readOnly />
        </div>

        {selectedDefinition.ports.some((p: Port) => p.type === 1) && (
          <div className="field">
            <label>CAN ID</label>
            <input
              type="number"
              value={canId !== undefined ? String(canId) : ''}
              placeholder="e.g. 2"
              onChange={(e: { target: { value: string } }) => {
                const val = e.target.value;
                updateDevice(selectedDevice.id, {
                  metadata: {
                    ...selectedDevice.metadata,
                    canId: val === '' ? undefined : Number(val),
                  },
                });
              }}
            />
          </div>
        )}

        {selectedDefinition.ports.some((p: Port) => p.type === 2) && (
          <div className="field">
            <label>IP Address</label>
            <input
              value={typeof ipAddress === 'string' ? ipAddress : ''}
              placeholder="10.6.91.x"
              onChange={(e: { target: { value: string } }) =>
                updateDevice(selectedDevice.id, {
                  metadata: {
                    ...selectedDevice.metadata,
                    ipAddress: e.target.value || undefined,
                  },
                })
              }
            />
          </div>
        )}

        <div className="field">
          <label>Ports</label>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            {selectedDefinition.ports.map((port: Port) => (
              <div key={port.id} style={{ marginBottom: '0.25rem' }}>
                <strong>{port.id}</strong> — {PORT_TYPE_NAMES[port.type]}
                {port.required ? ' (required)' : ''}
              </div>
            ))}
          </div>
        </div>

        {pendingPort?.deviceId === selectedDeviceId && (
          <button type="button" className="btn" onClick={() => setPendingPort(null)}>
            Cancel Connection
          </button>
        )}

        <button
          type="button"
          className="btn btn-danger"
          style={{ marginTop: '0.5rem' }}
          onClick={() => removeDevice(selectedDevice.id)}
        >
          Delete Device
        </button>
      </div>
    </aside>
  );
}
