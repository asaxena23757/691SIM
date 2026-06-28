import { useCallback, useRef, type PointerEvent } from 'react';
import { PortType, type DeviceInstance } from '@691sim/core';
import type { RobotModelState } from '../hooks/useRobotModel';
import { categoryColor, portTypeColor, PORT_TYPE_NAMES } from '../utils/labels';
import { wireVisualForPortType, resolveConnectionPortType } from '../utils/wireStyles';
import { getVisiblePorts, countHiddenPorts } from '../utils/visiblePorts';
import { DeviceIcon } from './DeviceIcon';

interface CanvasProps {
  state: RobotModelState;
}

const DEVICE_W = 168;

function ConnectionLines({ state }: { state: RobotModelState }) {
  const {
    model,
    registry,
    selectedConnectionId,
    setSelectedConnectionId,
    setSelectedDeviceId,
    highlightDeviceIds,
  } = state;

  const deviceCenter = (deviceId: string) => {
    const device = model.devices.find((d) => d.id === deviceId);
    const x = (device?.position?.x ?? 0) + DEVICE_W / 2;
    const y = (device?.position?.y ?? 0) + 72;
    return { x, y };
  };

  return (
    <>
      {model.connections.map((conn) => {
        const srcDevice = model.devices.find((d) => d.id === conn.sourceDevice);
        const portType =
          resolveConnectionPortType(
            registry,
            conn.sourceDevice,
            srcDevice?.type ?? '',
            conn.sourcePort,
          ) ?? PortType.POWER;
        const visual = wireVisualForPortType(portType);
        const src = deviceCenter(conn.sourceDevice);
        const tgt = deviceCenter(conn.targetDevice);
        const isSelected = conn.id === selectedConnectionId;
        const isHighlighted =
          highlightDeviceIds.includes(conn.sourceDevice) ||
          highlightDeviceIds.includes(conn.targetDevice);
        const opacity = isSelected || isHighlighted ? 1 : 0.85;
        const offset = visual.kind === 'pair' ? 4 : 0;

        return (
          <g
            key={conn.id}
            className={`connection-group ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
            opacity={opacity}
            onClick={(e: { stopPropagation(): void }) => {
              e.stopPropagation();
              setSelectedConnectionId(conn.id);
              setSelectedDeviceId(null);
            }}
          >
            {visual.kind === 'pair' ? (
              <>
                <line
                  x1={src.x}
                  y1={src.y - offset}
                  x2={tgt.x}
                  y2={tgt.y - offset}
                  stroke={visual.colors[0]}
                  strokeWidth={visual.width}
                  strokeLinecap="round"
                />
                <line
                  x1={src.x}
                  y1={src.y + offset}
                  x2={tgt.x}
                  y2={tgt.y + offset}
                  stroke={visual.colors[1]}
                  strokeWidth={visual.width}
                  strokeLinecap="round"
                />
              </>
            ) : (
              <line
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke={visual.colors[0]}
                strokeWidth={visual.width}
                strokeLinecap="round"
              />
            )}
            <title>
              {visual.label}: {conn.sourceDevice}.{conn.sourcePort} → {conn.targetDevice}.
              {conn.targetPort}
            </title>
          </g>
        );
      })}
    </>
  );
}

export function Canvas({ state }: CanvasProps) {
  const {
    model,
    registry,
    selectedDeviceId,
    setSelectedDeviceId,
    selectedConnectionId,
    setSelectedConnectionId,
    highlightDeviceIds,
    pendingPort,
    handlePortClick,
    moveDevice,
  } = state;

  const dragRef = useRef<{
    deviceId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const onPointerDown = useCallback(
    (deviceId: string, e: PointerEvent) => {
      const device = model.devices.find((d: DeviceInstance) => d.id === deviceId);
      if (!device) return;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        deviceId,
        startX: e.clientX,
        startY: e.clientY,
        origX: device.position?.x ?? 0,
        origY: device.position?.y ?? 0,
      };
      setSelectedDeviceId(deviceId);
      setSelectedConnectionId(null);
    },
    [model.devices, setSelectedConnectionId, setSelectedDeviceId],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      moveDevice(dragRef.current.deviceId, {
        x: Math.max(0, dragRef.current.origX + dx),
        y: Math.max(0, dragRef.current.origY + dy),
      });
    },
    [moveDevice],
  );

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  return (
    <main
      className="canvas"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onClick={() => {
        setSelectedDeviceId(null);
        setSelectedConnectionId(null);
        state.setPendingPort(null);
      }}
    >
      <svg className="canvas-svg">
        <ConnectionLines state={state} />
      </svg>

      {model.devices.map((device: DeviceInstance) => {
        const def = registry.get(device.type);
        const x = device.position?.x ?? 0;
        const y = device.position?.y ?? 0;
        const isSelected = device.id === selectedDeviceId;
        const isHighlighted = highlightDeviceIds.includes(device.id);
        const color = def ? categoryColor(def.category) : '#64748b';
        const visiblePorts = def
          ? getVisiblePorts(device.id, def, model.connections)
          : [];
        const hiddenCount = def
          ? countHiddenPorts(device.id, def, model.connections)
          : 0;

        return (
          <div
            key={device.id}
            className={`device-node ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
            style={{ left: x, top: y, borderColor: color, width: DEVICE_W }}
            onClick={(e: { stopPropagation(): void }) => e.stopPropagation()}
            onPointerDown={(e: PointerEvent) => onPointerDown(device.id, e)}
          >
            <div className="device-image-wrap">
              <DeviceIcon type={device.type} size={52} />
            </div>
            <div className="device-title" style={{ color }}>
              {device.label ?? def?.displayName ?? device.type}
            </div>
            <div className="device-type">{device.type}</div>
            <div className="device-ports">
              {visiblePorts.map((port) => {
                const isPending =
                  pendingPort?.deviceId === device.id && pendingPort?.portId === port.id;
                return (
                  <button
                    key={port.id}
                    type="button"
                    className={`port-btn ${isPending ? 'pending' : ''}`}
                    style={{
                      borderColor: portTypeColor(port.type),
                      color:
                        port.type === PortType.POWER
                          ? '#fecaca'
                          : port.type === PortType.GROUND
                            ? '#cbd5e1'
                            : undefined,
                    }}
                    title={`${port.id} (${PORT_TYPE_NAMES[port.type]})`}
                    onClick={(e: { stopPropagation(): void }) => {
                      e.stopPropagation();
                      handlePortClick(device.id, port.id);
                    }}
                  >
                    {port.id}
                  </button>
                );
              })}
              {hiddenCount > 0 && (
                <span className="port-more">+{hiddenCount} ports in properties</span>
              )}
            </div>
          </div>
        );
      })}

      {selectedConnectionId && (
        <div className="canvas-hint">Connection selected — delete in properties panel</div>
      )}
      {pendingPort && (
        <div className="canvas-hint">
          Click another port to connect from {pendingPort.deviceId}.{pendingPort.portId}
        </div>
      )}
      {model.devices.length === 0 && (
        <div className="canvas-empty">
          Add devices from the palette or load the sample robot to get started.
        </div>
      )}
    </main>
  );
}
