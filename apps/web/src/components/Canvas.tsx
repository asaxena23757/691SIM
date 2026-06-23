import { useCallback, useRef } from 'react';
import type { RobotModelState } from '../hooks/useRobotModel';
import { categoryColor, portTypeColor, PORT_TYPE_NAMES } from '../utils/labels';

interface CanvasProps {
  state: RobotModelState;
}

const DEVICE_W = 150;
const DEVICE_H = 90;

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
    (deviceId: string, e: React.PointerEvent) => {
      const device = model.devices.find((d) => d.id === deviceId);
      if (!device) return;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
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
    (e: React.PointerEvent) => {
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

  const deviceCenter = (deviceId: string) => {
    const device = model.devices.find((d) => d.id === deviceId);
    const x = (device?.position?.x ?? 0) + DEVICE_W / 2;
    const y = (device?.position?.y ?? 0) + DEVICE_H / 2;
    return { x, y };
  };

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
        {model.connections.map((conn) => {
          const src = deviceCenter(conn.sourceDevice);
          const tgt = deviceCenter(conn.targetDevice);
          const isSelected = conn.id === selectedConnectionId;
          const isHighlighted =
            highlightDeviceIds.includes(conn.sourceDevice) ||
            highlightDeviceIds.includes(conn.targetDevice);
          return (
            <g key={conn.id}>
              <line
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                className={`connection-line ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedConnectionId(conn.id);
                  setSelectedDeviceId(null);
                }}
              />
              <title>
                {conn.sourceDevice}.{conn.sourcePort} → {conn.targetDevice}.{conn.targetPort}
              </title>
            </g>
          );
        })}
      </svg>

      {model.devices.map((device) => {
        const def = registry.get(device.type);
        const x = device.position?.x ?? 0;
        const y = device.position?.y ?? 0;
        const isSelected = device.id === selectedDeviceId;
        const isHighlighted = highlightDeviceIds.includes(device.id);
        const color = def ? categoryColor(def.category) : '#64748b';

        return (
          <div
            key={device.id}
            className={`device-node ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
            style={{ left: x, top: y, borderColor: color }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => onPointerDown(device.id, e)}
          >
            <div className="device-title" style={{ color }}>
              {device.label ?? def?.displayName ?? device.type}
            </div>
            <div className="device-type">{device.type}</div>
            <div className="device-ports">
              {def?.ports.map((port) => {
                const isPending =
                  pendingPort?.deviceId === device.id && pendingPort.portId === port.id;
                return (
                  <button
                    key={port.id}
                    type="button"
                    className={`port-btn ${isPending ? 'pending' : ''}`}
                    style={{ borderColor: portTypeColor(port.type) }}
                    title={`${port.id} (${PORT_TYPE_NAMES[port.type]})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePortClick(device.id, port.id);
                    }}
                  >
                    {port.id}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {selectedConnectionId && (
        <div className="canvas-hint">
          Connection selected — delete in properties panel
        </div>
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
