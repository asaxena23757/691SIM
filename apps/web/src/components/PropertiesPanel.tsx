import { PortType, type Port } from '@691sim/core';
import { SUPPORTED_GAUGES, DEFAULT_WIRE_LENGTH_INCHES } from '@691sim/simulation';
import type { RobotModelState } from '../hooks/useRobotModel';
import { PORT_TYPE_NAMES, portTypeColor } from '../utils/labels';
import { isPortConnected } from '../utils/visiblePorts';

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
    updateConnection,
    removeConnection,
    pendingPort,
    setPendingPort,
    handlePortClick,
    simulation,
  } = state;

  const selectedConnection = model.connections.find((c) => c.id === selectedConnectionId);

  if (selectedConnection) {
    const wireSim = simulation?.voltage.wireCurrents.find(
      (w) => w.connectionId === selectedConnection.id,
    );
    const isPowerWire = wireSim !== undefined;
    const currentGauge = Number(
      selectedConnection.metadata?.gauge ?? wireSim?.gauge ?? 12,
    );
    const currentLength = Number(
      selectedConnection.metadata?.lengthInches ?? wireSim?.lengthInches ?? DEFAULT_WIRE_LENGTH_INCHES,
    );

    return (
      <div className="properties-scroll">
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

        {isPowerWire && (
          <>
            <div className="field">
              <label>Wire Gauge (AWG)</label>
              <select
                value={currentGauge}
                onChange={(e: { target: { value: string } }) =>
                  updateConnection(selectedConnection.id, {
                    metadata: { gauge: Number(e.target.value) },
                  })
                }
              >
                {SUPPORTED_GAUGES.map((g) => (
                  <option key={g} value={g}>
                    {g} AWG
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Wire Length (inches)</label>
              <input
                type="number"
                min="1"
                value={currentLength}
                onChange={(e: { target: { value: string } }) =>
                  updateConnection(selectedConnection.id, {
                    metadata: { lengthInches: Number(e.target.value) },
                  })
                }
              />
            </div>
            {wireSim && (
              <div className="field">
                <label>Wire Analysis ({simulation?.mode})</label>
                <ul className="info-list">
                  <li>Current: {wireSim.currentAmps.toFixed(1)} A</li>
                  <li>Ampacity: {wireSim.maxAmps} A</li>
                  <li>Resistance: {wireSim.resistanceOhms.toFixed(4)} Ω</li>
                  <li>Voltage drop: {wireSim.voltageDrop.toFixed(3)} V</li>
                </ul>
                {wireSim.exceedsAmpacity && (
                  <div className="sim-alert sim-alert-danger">
                    Exceeds Ampacity: Safety Hazard!
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <button
          type="button"
          className="btn btn-danger"
          onClick={() => removeConnection(selectedConnection.id)}
        >
          Delete Connection
        </button>
      </div>
    );
  }

  if (!selectedDevice || !selectedDefinition) {
    return (
      <div className="properties-scroll">
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
    );
  }

  const canId = selectedDevice.metadata?.canId;
  const ipAddress = selectedDevice.metadata?.ipAddress;

  return (
    <div className="properties-scroll">
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

      {selectedDefinition.ports.some((p: Port) => p.type === PortType.CAN) && (
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

      {selectedDefinition.ports.some((p: Port) => p.type === PortType.ETHERNET) && (
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
        <label>All Ports ({selectedDefinition.ports.filter((p) => p.type !== PortType.GROUND).length})</label>
        <div className="port-picker">
          {selectedDefinition.ports
            .filter((port: Port) => port.type !== PortType.GROUND)
            .map((port: Port) => {
              const connected = isPortConnected(
                selectedDevice.id,
                port.id,
                model.connections,
              );
              const isPending =
                pendingPort?.deviceId === selectedDeviceId && pendingPort.portId === port.id;
              return (
                <button
                  key={port.id}
                  type="button"
                  className={`port-btn ${isPending ? 'pending' : ''} ${connected ? 'connected' : 'disconnected'}`}
                  style={{ borderColor: portTypeColor(port.type) }}
                  title={`${PORT_TYPE_NAMES[port.type]}${port.required ? ' (required)' : ''}`}
                  onClick={() => handlePortClick(selectedDevice.id, port.id)}
                >
                  {port.id}
                </button>
              );
            })}
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
  );
}
