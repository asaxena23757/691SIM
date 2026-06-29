import { useCallback, useRef, type PointerEvent } from 'react';
import { PortType, type DeviceInstance } from '@691sim/core';
import type { RobotModelState } from '../hooks/useRobotModel';
import { portTypeColor, PORT_TYPE_NAMES } from '../utils/labels';
import { wireVisualForPortType, resolveConnectionPortType } from '../utils/wireStyles';
import {
  computeWireRoutes,
  getDisplayConnections,
  offsetLineEndpoints,
} from '../utils/wireRouting';
import { getVisiblePorts, countHiddenPorts, isPortConnected } from '../utils/visiblePorts';
import { getPdhFuseInfo, fuseRatingForPort } from '../utils/fuses';
import { DeviceIcon } from './DeviceIcon';

interface CanvasProps {
  state: RobotModelState;
}

const DEVICE_W = 168;

function WireLine({
  x1,
  y1,
  x2,
  y2,
  color,
  width,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width: number;
}) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
    />
  );
}

function FuseMarker({
  x,
  y,
  rating,
}: {
  x: number;
  y: number;
  rating: string;
}) {
  return (
    <g className="fuse-marker" transform={`translate(${x - 18}, ${y - 10})`}>
      <rect width="36" height="20" rx="3" fill="#fbbf24" stroke="#92400e" strokeWidth="1" />
      <text x="18" y="13" textAnchor="middle" fontSize="8" fontWeight="700" fill="#451a03">
        {rating}
      </text>
    </g>
  );
}

function ConnectionLines({ state }: { state: RobotModelState }) {
  const {
    model,
    registry,
    deviceTypes,
    selectedConnectionId,
    setSelectedConnectionId,
    setSelectedDeviceId,
    highlightDeviceIds,
  } = state;

  const getCenter = (deviceId: string) => {
    const device = model.devices.find((d) => d.id === deviceId);
    return {
      x: (device?.position?.x ?? 0) + DEVICE_W / 2,
      y: (device?.position?.y ?? 0) + 72,
    };
  };

  const displayConnections = getDisplayConnections(
    model.connections,
    registry,
    deviceTypes,
  );
  const routes = computeWireRoutes(displayConnections, getCenter);

  return (
    <>
      {routes.map((route) => {
        const conn = displayConnections.find((c) => c.id === route.connectionId);
        if (!conn) return null;

        const srcDevice = model.devices.find((d) => d.id === conn.sourceDevice);
        const tgtDevice = model.devices.find((d) => d.id === conn.targetDevice);
        const srcType = srcDevice?.type ?? '';
        const tgtType = tgtDevice?.type ?? '';
        const portType =
          resolveConnectionPortType(registry, conn.sourceDevice, srcType, conn.sourcePort) ??
          PortType.POWER;
        const visual = wireVisualForPortType(portType);
        const { start, end } = offsetLineEndpoints(route.start, route.end, route.bundleOffset);
        const isSelected = conn.id === selectedConnectionId;
        const isHighlighted =
          highlightDeviceIds.includes(conn.sourceDevice) ||
          highlightDeviceIds.includes(conn.targetDevice);
        const opacity = isSelected || isHighlighted ? 1 : 0.9;
        const offset = visual.kind === 'pair' ? 4 : 0;
        const fuseInfo = getPdhFuseInfo(
          portType,
          srcType,
          conn.sourcePort,
          tgtType,
          conn.targetPort,
        );
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

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
                <WireLine
                  x1={start.x}
                  y1={start.y - offset}
                  x2={end.x}
                  y2={end.y - offset}
                  color={visual.colors[0]!}
                  width={visual.width}
                />
                <WireLine
                  x1={start.x}
                  y1={start.y + offset}
                  x2={end.x}
                  y2={end.y + offset}
                  color={visual.colors[1]!}
                  width={visual.width}
                />
              </>
            ) : (
              <WireLine
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                color={visual.colors[0]!}
                width={visual.width}
              />
            )}
            {fuseInfo.show && (
              <FuseMarker x={midX} y={midY} rating={fuseRatingForPort(fuseInfo.port)} />
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
    errorDeviceIds,
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
      id="circuit-canvas"
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
        const hasError = errorDeviceIds.has(device.id);
        const visiblePorts = def
          ? getVisiblePorts(device.id, def, model.connections)
          : [];
        const hiddenCount = def
          ? countHiddenPorts(device.id, def, model.connections)
          : 0;

        return (
          <div
            key={device.id}
            className={`device-node ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''} ${hasError ? 'device-error' : ''}`}
            style={{ left: x, top: y, width: DEVICE_W }}
            onClick={(e: { stopPropagation(): void }) => e.stopPropagation()}
            onPointerDown={(e: PointerEvent) => onPointerDown(device.id, e)}
          >
            <div className="device-image-wrap">
              <DeviceIcon type={device.type} size={52} />
            </div>
            <div className="device-title">
              {device.label ?? def?.displayName ?? device.type}
            </div>
            <div className="device-type">{device.type}</div>
            <div className="device-ports">
              {visiblePorts.map((port) => {
                const connected = isPortConnected(device.id, port.id, model.connections);
                const isPending =
                  pendingPort?.deviceId === device.id && pendingPort?.portId === port.id;
                return (
                  <button
                    key={port.id}
                    type="button"
                    className={`port-btn ${isPending ? 'pending' : ''} ${connected ? 'connected' : 'disconnected'}`}
                    style={{ borderColor: portTypeColor(port.type) }}
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
