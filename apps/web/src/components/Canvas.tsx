import { useCallback, useRef, useState, type PointerEvent } from 'react';
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
import { isCompatibleTarget } from '../utils/connectionRules';
import { getPdhFuseInfo, getFuseRatingAmps, fuseRatingLabel } from '../utils/fuses';
import { DeviceIcon } from './DeviceIcon';

interface CanvasProps {
  state: RobotModelState;
}

const DEVICE_W = 168;
const WIRE_DRAG_THRESHOLD_PX = 4;

function WireLine({
  x1,
  y1,
  x2,
  y2,
  color,
  width,
  dash,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width: number;
  dash?: string;
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
      strokeDasharray={dash}
    />
  );
}

function FuseMarker({
  x,
  y,
  rating,
  fault,
}: {
  x: number;
  y: number;
  rating: string;
  fault?: boolean;
}) {
  return (
    <g className={`fuse-marker ${fault ? 'fuse-fault' : ''}`} transform={`translate(${x - 18}, ${y - 10})`}>
      <rect
        width="36"
        height="20"
        rx="6"
        fill={fault ? '#f5c4c8' : '#f1bf98'}
        stroke={fault ? '#cc2936' : '#08415c'}
        strokeWidth="1"
      />
      <text
        x="18"
        y="13"
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        fill={fault ? '#cc2936' : '#08415c'}
      >
        {rating}
      </text>
    </g>
  );
}

function AmpacityHazardMarker({ x, y }: { x: number; y: number }) {
  return (
    <g className="ampacity-marker" transform={`translate(${x}, ${y + 14})`}>
      <title>Exceeds Ampacity: Safety Hazard!</title>
      <path d="M0,-9 L9,7 L-9,7 Z" fill="#cc2936" stroke="#08415c" strokeWidth="1" />
      <text x="0" y="6" textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff">
        !
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
    ampacityConnectionIds,
    fuseViolationConnectionIds,
  } = state;

  const getCenter = (deviceId: string) => {
    const device = model.devices.find((d) => d.id === deviceId);
    return {
      x: (device?.position?.x ?? 0) + DEVICE_W / 2,
      y: (device?.position?.y ?? 0) + 72,
    };
  };

  const displayConnections = getDisplayConnections(model.connections, registry, deviceTypes);
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
        const opacity = isSelected || isHighlighted ? 1 : 0.92;
        const offset = visual.kind === 'pair' ? 4 : 0;
        const fuseInfo = getPdhFuseInfo(
          portType,
          srcType,
          conn.sourcePort,
          tgtType,
          conn.targetPort,
        );
        const fuseFault = fuseViolationConnectionIds.has(conn.id);
        const fuseRating = fuseInfo.show
          ? fuseRatingLabel(getFuseRatingAmps(conn, fuseInfo.port))
          : '';
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
              <FuseMarker x={midX} y={midY} rating={fuseRating} fault={fuseFault} />
            )}
            {ampacityConnectionIds.has(conn.id) && <AmpacityHazardMarker x={midX} y={midY} />}
            <title>
              {visual.label}: {conn.sourceDevice}.{conn.sourcePort} → {conn.targetDevice}.
              {conn.targetPort}
              {fuseFault ? ' — FUSE UNDERSIZED' : ''}
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
    deviceTypes,
    errorDeviceIds,
    selectedDeviceId,
    setSelectedDeviceId,
    selectedConnectionId,
    setSelectedConnectionId,
    highlightDeviceIds,
    pendingPort,
    wireMessage,
    startWireFrom,
    tryConnect,
    cancelWire,
    handlePortClick,
    moveDevice,
  } = state;

  const canvasRef = useRef<HTMLElement>(null);
  const [dragLine, setDragLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(
    null,
  );

  const dragRef = useRef<{
    deviceId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const wireFromRef = useRef<{ deviceId: string; portId: string } | null>(null);
  const wireDragActiveRef = useRef(false);
  const wireDragStartRef = useRef<{ x: number; y: number } | null>(null);

  const canvasPoint = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: clientX, y: clientY };
    return {
      x: clientX - rect.left + (canvasRef.current?.scrollLeft ?? 0),
      y: clientY - rect.top + (canvasRef.current?.scrollTop ?? 0),
    };
  }, []);

  const findPortAt = useCallback((clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY);
    const portBtn = el?.closest<HTMLElement>('[data-device-id][data-port-id]');
    if (!portBtn?.dataset.deviceId || !portBtn.dataset.portId) return null;
    return { deviceId: portBtn.dataset.deviceId, portId: portBtn.dataset.portId };
  }, []);

  const finishWireDrag = useCallback(
    (clientX: number, clientY: number) => {
      const from = wireFromRef.current;
      if (!from || !wireDragActiveRef.current) return;

      const target = findPortAt(clientX, clientY);
      if (target && (target.deviceId !== from.deviceId || target.portId !== from.portId)) {
        tryConnect(from, target);
      } else if (!target) {
        cancelWire();
      }
    },
    [cancelWire, findPortAt, tryConnect],
  );

  const onDevicePointerDown = useCallback(
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

  const onPortPointerDown = useCallback(
    (deviceId: string, portId: string, e: PointerEvent) => {
      e.stopPropagation();
      const pt = canvasPoint(e.clientX, e.clientY);
      wireFromRef.current = { deviceId, portId };
      wireDragActiveRef.current = false;
      wireDragStartRef.current = { x: e.clientX, y: e.clientY };
      setDragLine({ x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y });
    },
    [canvasPoint],
  );

  const onPortClick = useCallback(
    (deviceId: string, portId: string, e: { stopPropagation(): void }) => {
      e.stopPropagation();
      if (wireDragActiveRef.current) return;
      handlePortClick(deviceId, portId);
    },
    [handlePortClick],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (dragRef.current) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        moveDevice(dragRef.current.deviceId, {
          x: Math.max(0, dragRef.current.origX + dx),
          y: Math.max(0, dragRef.current.origY + dy),
        });
        return;
      }

      if (wireFromRef.current && dragLine && wireDragStartRef.current) {
        const dx = e.clientX - wireDragStartRef.current.x;
        const dy = e.clientY - wireDragStartRef.current.y;
        if (
          !wireDragActiveRef.current &&
          dx * dx + dy * dy > WIRE_DRAG_THRESHOLD_PX * WIRE_DRAG_THRESHOLD_PX
        ) {
          wireDragActiveRef.current = true;
          startWireFrom(wireFromRef.current.deviceId, wireFromRef.current.portId);
        }
        const pt = canvasPoint(e.clientX, e.clientY);
        setDragLine((line) => (line ? { ...line, x2: pt.x, y2: pt.y } : null));
      }
    },
    [canvasPoint, dragLine, moveDevice, startWireFrom],
  );

  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      dragRef.current = null;

      if (wireFromRef.current) {
        if (wireDragActiveRef.current) {
          finishWireDrag(e.clientX, e.clientY);
        }
        wireFromRef.current = null;
        wireDragActiveRef.current = false;
        wireDragStartRef.current = null;
        setDragLine(null);
        return;
      }

      if (pendingPort) {
        setDragLine(null);
      }
    },
    [finishWireDrag, pendingPort],
  );

  const pendingPortType = pendingPort
    ? registry.get(deviceTypes.get(pendingPort.deviceId) ?? '')?.ports.find(
        (p) => p.id === pendingPort.portId,
      )?.type
    : wireFromRef.current
      ? registry
          .get(deviceTypes.get(wireFromRef.current.deviceId) ?? '')
          ?.ports.find((p) => p.id === wireFromRef.current!.portId)?.type
      : undefined;

  return (
    <main
      ref={canvasRef}
      id="circuit-canvas"
      className="canvas"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onClick={() => {
        setSelectedDeviceId(null);
        setSelectedConnectionId(null);
        cancelWire();
        setDragLine(null);
        wireFromRef.current = null;
        wireDragActiveRef.current = false;
      }}
    >
      {model.devices.map((device: DeviceInstance) => {
        const def = registry.get(device.type);
        const x = device.position?.x ?? 0;
        const y = device.position?.y ?? 0;
        const isSelected = device.id === selectedDeviceId;
        const isHighlighted = highlightDeviceIds.includes(device.id);
        const hasError = errorDeviceIds.has(device.id);
        const visiblePorts = def ? getVisiblePorts(device.id, def, model.connections) : [];
        const hiddenCount = def ? countHiddenPorts(device.id, def, model.connections) : 0;

        return (
          <div
            key={device.id}
            className={`device-node ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''} ${hasError ? 'device-error' : ''}`}
            style={{ left: x, top: y, width: DEVICE_W }}
            onClick={(e: { stopPropagation(): void }) => e.stopPropagation()}
          >
            <div
              className="device-drag-handle"
              onPointerDown={(e: PointerEvent) => onDevicePointerDown(device.id, e)}
            >
              <div className="device-image-wrap">
                <DeviceIcon type={device.type} size={52} />
              </div>
              <div className="device-title">{device.label ?? def?.displayName ?? device.type}</div>
              <div className="device-type">{device.type}</div>
            </div>
            <div className="device-ports">
              {visiblePorts.map((port) => {
                const connected = isPortConnected(device.id, port.id, model.connections);
                const isPending =
                  pendingPort?.deviceId === device.id && pendingPort?.portId === port.id;
                const compatible =
                  pendingPort &&
                  !isPending &&
                  isCompatibleTarget(registry, deviceTypes, pendingPort, {
                    deviceId: device.id,
                    portId: port.id,
                  });
                return (
                  <button
                    key={port.id}
                    type="button"
                    data-device-id={device.id}
                    data-port-id={port.id}
                    className={`port-btn ${isPending ? 'pending' : ''} ${connected ? 'connected' : 'disconnected'} ${compatible ? 'compatible' : ''}`}
                    style={{ borderColor: portTypeColor(port.type) }}
                    title={`${port.id} (${PORT_TYPE_NAMES[port.type]}) — drag or click to wire`}
                    onPointerDown={(e: PointerEvent) => onPortPointerDown(device.id, port.id, e)}
                    onClick={(e: { stopPropagation(): void }) => onPortClick(device.id, port.id, e)}
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

      <svg className="canvas-svg canvas-wires" aria-hidden="true">
        <ConnectionLines state={state} />
        {dragLine && (
          <WireLine
            x1={dragLine.x1}
            y1={dragLine.y1}
            x2={dragLine.x2}
            y2={dragLine.y2}
            color={pendingPortType !== undefined ? portTypeColor(pendingPortType) : '#6b818c'}
            width={3}
            dash="6 4"
          />
        )}
      </svg>

      {wireMessage && (
        <div
          className={`canvas-hint ${wireMessage.includes('Cannot') || wireMessage.includes('Incompatible') ? 'canvas-hint-error' : ''}`}
        >
          {wireMessage}
          {pendingPort && (
            <button type="button" className="btn btn-inline" onClick={() => cancelWire()}>
              Cancel
            </button>
          )}
        </div>
      )}
      {!wireMessage && pendingPort && (
        <div className="canvas-hint">
          Drag to a{' '}
          <strong>{pendingPortType !== undefined ? PORT_TYPE_NAMES[pendingPortType] : 'matching'}</strong>{' '}
          port (highlighted), or click another port to finish.
        </div>
      )}
      {selectedConnectionId && !pendingPort && (
        <div className="canvas-hint">Connection selected — edit fuse/wire in properties panel</div>
      )}
      {model.devices.length === 0 && (
        <div className="canvas-empty">
          Add devices from the palette or load the sample robot to get started.
        </div>
      )}
    </main>
  );
}
