import { useCallback, useRef, useState, type PointerEvent } from 'react';
import { PortType, type DeviceInstance } from '@691sim/core';
import type { RobotModelState } from '../hooks/useRobotModel';
import { portTypeColor, PORT_TYPE_NAMES } from '../utils/labels';
import { resolveConnectionPortType, resolveWireColors } from '../utils/wireStyles';
import {
  computeWireRoutes,
  getDisplayConnections,
  pathToPolylinePoints,
  type Point,
} from '../utils/wireRouting';
import {
  getVisiblePorts,
  countHiddenPorts,
  isPortConnected,
  portDisplayLabel,
} from '../utils/visiblePorts';
import {
  isCompatibleTarget,
  isPortAtCapacity,
} from '../utils/connectionRules';
import { getPdhFuseInfo, getFuseRatingAmps, fuseRatingLabel } from '../utils/fuses';
import { buildCanLabelCarriers, resolveWireLabel, wireAnnotation } from '../utils/wireLabels';
import { DeviceIcon } from './DeviceIcon';

interface CanvasProps {
  state: RobotModelState;
}

const DEVICE_W = 168;
const WIRE_DRAG_THRESHOLD_PX = 4;

function WirePolyline({
  path,
  color,
  width,
  dash,
  offset = 0,
}: {
  path: Point[];
  color: string;
  width: number;
  dash?: string;
  offset?: number;
}) {
  if (path.length < 2) return null;
  const shifted =
    offset === 0
      ? path
      : path.map((p, i) => {
          if (i === 0 && path[1]) {
            const dx = path[1].x - p.x;
            const dy = path[1].y - p.y;
            const len = Math.hypot(dx, dy) || 1;
            return { x: p.x + (-dy / len) * offset, y: p.y + (dx / len) * offset };
          }
          if (i === path.length - 1 && path[i - 1]) {
            const prev = path[i - 1]!;
            const dx = p.x - prev.x;
            const dy = p.y - prev.y;
            const len = Math.hypot(dx, dy) || 1;
            return { x: p.x + (-dy / len) * offset, y: p.y + (dx / len) * offset };
          }
          return p;
        });

  return (
    <polyline
      points={pathToPolylinePoints(shifted)}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
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
        className="fuse-marker-rect"
        fill={fault ? 'var(--fuse-fault-fill)' : 'var(--fuse-fill)'}
        stroke={fault ? 'var(--fuse-fault-stroke)' : 'var(--fuse-stroke)'}
        strokeWidth="1"
      />
      <text
        x="18"
        y="13"
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        fill={fault ? 'var(--fuse-fault-text)' : 'var(--fuse-stroke)'}
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

function WireLabel({
  x,
  y,
  text,
  detail,
}: {
  x: number;
  y: number;
  text: string;
  detail?: string;
}) {
  const lines = detail ? [text, detail] : [text];
  const height = lines.length * 11 + 6;
  const width = Math.max(...lines.map((l) => l.length * 5.5), 40) + 10;

  return (
    <g className="wire-label" transform={`translate(${x - width / 2}, ${y - height / 2})`} pointerEvents="none">
      <rect
        width={width}
        height={height}
        rx="4"
        className="wire-label-bg"
        fill="var(--bg-panel)"
        stroke="var(--border-soft)"
        strokeWidth="1"
        opacity="0.92"
      />
      {lines.map((line, i) => (
        <text
          key={i}
          x={width / 2}
          y={12 + i * 11}
          textAnchor="middle"
          fontSize={i === 0 ? '9' : '7.5'}
          fontWeight={i === 0 ? '600' : '400'}
          fill={i === 0 ? 'var(--text)' : 'var(--text-muted)'}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

interface ConnectionLinesProps {
  state: RobotModelState;
  getPortPosition: (deviceId: string, portId: string) => Point | undefined;
  onWaypointDragStart: (connectionId: string, e: PointerEvent) => void;
}

function ConnectionLines({ state, getPortPosition, onWaypointDragStart }: ConnectionLinesProps) {
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
    simulation,
    showWireLabels,
  } = state;

  const getCenter = (deviceId: string) => {
    const device = model.devices.find((d) => d.id === deviceId);
    return {
      x: (device?.position?.x ?? 0) + DEVICE_W / 2,
      y: (device?.position?.y ?? 0) + 72,
    };
  };

  const getPortPositionInner = (deviceId: string, portId: string) =>
    getPortPosition(deviceId, portId);

  const displayConnections = getDisplayConnections(model.connections, registry, deviceTypes);
  const routes = computeWireRoutes(
    displayConnections,
    getCenter,
    getPortPositionInner,
    registry,
    deviceTypes,
  );

  const canLabelCarriers = buildCanLabelCarriers(model.connections, deviceTypes, registry);

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
        const visual = resolveWireColors(conn, portType);
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
        const wireSim = simulation?.voltage.wireCurrents.find((w) => w.connectionId === conn.id);
        const annotation = wireAnnotation(
          conn,
          srcType,
          tgtType,
          portType,
          wireSim?.gauge,
        );
        const labelInfo = resolveWireLabel(
          conn,
          model,
          registry,
          deviceTypes,
          canLabelCarriers,
          wireSim?.gauge,
        );
        const displayText = labelInfo.text || (showWireLabels ? '' : '');
        const displayDetail =
          showWireLabels && (labelInfo.detail || annotation)
            ? labelInfo.detail || annotation
            : showWireLabels
              ? annotation
              : '';

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
                <WirePolyline path={route.path} color={visual.colors[0]!} width={visual.width} offset={-offset} />
                <WirePolyline path={route.path} color={visual.colors[1]!} width={visual.width} offset={offset} />
              </>
            ) : (
              <WirePolyline path={route.path} color={visual.colors[0]!} width={visual.width} />
            )}
            {fuseInfo.show && (
              <FuseMarker
                x={route.labelPoint.x}
                y={route.labelPoint.y}
                rating={fuseRating}
                fault={fuseFault}
              />
            )}
            {ampacityConnectionIds.has(conn.id) && (
              <AmpacityHazardMarker x={route.labelPoint.x} y={route.labelPoint.y} />
            )}
            {showWireLabels && labelInfo.show && displayText && (
              <WireLabel
                x={route.labelPoint.x}
                y={route.labelPoint.y - (fuseInfo.show ? 18 : 0)}
                text={displayText}
                detail={displayDetail !== displayText ? displayDetail : undefined}
              />
            )}
            {isSelected && (
              <circle
                className="wire-route-handle"
                cx={route.labelPoint.x}
                cy={route.labelPoint.y}
                r="7"
                onPointerDown={(e: PointerEvent) => onWaypointDragStart(conn.id, e)}
              />
            )}
            <title>
              {visual.label}: {conn.sourceDevice}.{conn.sourcePort} → {conn.targetDevice}.
              {conn.targetPort}
              {annotation ? ` · ${annotation}` : ''}
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
    setConnectionWaypoints,
  } = state;

  const canvasRef = useRef<HTMLElement>(null);
  const [dragLine, setDragLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(
    null,
  );

  const estimatePortPosition = useCallback(
    (deviceId: string, portId: string): Point | undefined => {
      const device = model.devices.find((d) => d.id === deviceId);
      const type = deviceTypes.get(deviceId);
      const def = type ? registry.get(type) : undefined;
      if (!device || !def) return undefined;
      const visible = getVisiblePorts(deviceId, def, model.connections);
      const idx = visible.findIndex((p) => p.id === portId);
      if (idx < 0) return undefined;
      const cols = 3;
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      return {
        x: (device.position?.x ?? 0) + 18 + col * 50,
        y: (device.position?.y ?? 0) + 106 + row * 22,
      };
    },
    [deviceTypes, model.connections, model.devices, registry],
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
  const waypointDragRef = useRef<{ connectionId: string } | null>(null);

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

  const onWaypointDragStart = useCallback(
    (connectionId: string, e: PointerEvent) => {
      e.stopPropagation();
      (e.currentTarget as SVGElement).setPointerCapture(e.pointerId);
      waypointDragRef.current = { connectionId };
      setSelectedConnectionId(connectionId);
    },
    [setSelectedConnectionId],
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
      if (isPortAtCapacity(model.connections, registry, deviceTypes, deviceId, portId)) return;
      const pt = canvasPoint(e.clientX, e.clientY);
      wireFromRef.current = { deviceId, portId };
      wireDragActiveRef.current = false;
      wireDragStartRef.current = { x: e.clientX, y: e.clientY };
      setDragLine({ x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y });
    },
    [canvasPoint, deviceTypes, model.connections, registry],
  );

  const onPortClick = useCallback(
    (deviceId: string, portId: string, e: { stopPropagation(): void }) => {
      e.stopPropagation();
      if (wireDragActiveRef.current) return;
      if (isPortAtCapacity(model.connections, registry, deviceTypes, deviceId, portId)) return;
      handlePortClick(deviceId, portId);
    },
    [deviceTypes, handlePortClick, model.connections, registry],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (waypointDragRef.current) {
        const pt = canvasPoint(e.clientX, e.clientY);
        setConnectionWaypoints(waypointDragRef.current.connectionId, [pt]);
        return;
      }

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
    [canvasPoint, dragLine, moveDevice, setConnectionWaypoints, startWireFrom],
  );

  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      waypointDragRef.current = null;
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

  const isWiring = pendingPort !== null || dragLine !== null;

  return (
    <main
      ref={canvasRef}
      id="circuit-canvas"
      className={`canvas ${isWiring ? 'canvas-wiring' : ''}`}
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
                const portFull = isPortAtCapacity(
                  model.connections,
                  registry,
                  deviceTypes,
                  device.id,
                  port.id,
                );
                const isPending =
                  pendingPort?.deviceId === device.id && pendingPort?.portId === port.id;
                const compatible =
                  pendingPort &&
                  !isPending &&
                  !portFull &&
                  isCompatibleTarget(registry, deviceTypes, model.connections, pendingPort, {
                    deviceId: device.id,
                    portId: port.id,
                  });
                return (
                  <button
                    key={port.id}
                    type="button"
                    data-device-id={device.id}
                    data-port-id={port.id}
                    className={`port-btn ${isPending ? 'pending' : ''} ${connected ? 'connected' : 'disconnected'} ${compatible ? 'compatible' : ''} ${portFull ? 'port-full' : ''}`}
                    style={{ borderColor: portTypeColor(port.type) }}
                    title={`${portDisplayLabel(port.id, device.type)} (${PORT_TYPE_NAMES[port.type]})${portFull ? ' — full' : ''}`}
                    disabled={portFull && !connected}
                    onPointerDown={(e: PointerEvent) => onPortPointerDown(device.id, port.id, e)}
                    onClick={(e: { stopPropagation(): void }) => onPortClick(device.id, port.id, e)}
                  >
                    {portDisplayLabel(port.id, device.type)}
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
        <ConnectionLines
          state={state}
          getPortPosition={estimatePortPosition}
          onWaypointDragStart={onWaypointDragStart}
        />
        {dragLine && (
          <line
            x1={dragLine.x1}
            y1={dragLine.y1}
            x2={dragLine.x2}
            y2={dragLine.y2}
            stroke={pendingPortType !== undefined ? portTypeColor(pendingPortType) : '#6b818c'}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray="6 4"
          />
        )}
      </svg>

      {wireMessage && (
        <div
          className={`canvas-hint ${wireMessage.includes('Cannot') || wireMessage.includes('Incompatible') || wireMessage.includes('full') ? 'canvas-hint-error' : ''}`}
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
        <div className="canvas-hint">
          Connection selected — drag the orange handle to reroute, or edit in properties
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
