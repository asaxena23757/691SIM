import type { Connection } from '@691sim/core';
import { PortType } from '@691sim/core';
import { resolveConnectionPortType } from './wireStyles';

export interface Point {
  x: number;
  y: number;
}

export interface RoutedSegment {
  connectionId: string;
  start: Point;
  end: Point;
  bundleOffset: number;
  waypoints: Point[];
  path: Point[];
  labelPoint: Point;
}

type RegistryLookup = {
  get(type: string): { ports: { id: string; type: PortType }[] } | undefined;
};

export type PortPositionLookup = (
  deviceId: string,
  portId: string,
) => Point | undefined;

/** Connections drawn on the canvas (ground is implied by the red/black 12V pair). */
export function getDisplayConnections(
  connections: Connection[],
  registry: RegistryLookup,
  deviceTypeById: Map<string, string>,
): Connection[] {
  return connections.filter((conn) => {
    const srcType = deviceTypeById.get(conn.sourceDevice);
    if (!srcType) return true;
    const portType =
      resolveConnectionPortType(registry, conn.sourceDevice, srcType, conn.sourcePort) ??
      PortType.POWER;
    return portType !== PortType.GROUND;
  });
}

function bundleKey(a: string, b: string, portType: PortType): string {
  const pair = a < b ? `${a}|${b}` : `${b}|${a}`;
  return `${pair}:${portType}`;
}

function parseWaypoints(connection: Connection): Point[] {
  const raw = connection.metadata?.waypoints;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((wp) => {
      if (typeof wp !== 'object' || wp === null) return null;
      const x = Number((wp as { x?: unknown }).x);
      const y = Number((wp as { y?: unknown }).y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      return { x, y };
    })
    .filter((wp): wp is Point => wp !== null);
}

function polylineLength(points: Point[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += Math.hypot(points[i]!.x - points[i - 1]!.x, points[i]!.y - points[i - 1]!.y);
  }
  return len;
}

/** Midpoint along a polyline (for labels and drag handles). */
export function labelPointOnPath(path: Point[]): Point {
  if (path.length === 0) return { x: 0, y: 0 };
  if (path.length === 1) return path[0]!;
  const total = polylineLength(path);
  const half = total / 2;
  let walked = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!;
    const b = path[i]!;
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    if (walked + seg >= half) {
      const t = seg === 0 ? 0 : (half - walked) / seg;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    walked += seg;
  }
  return path[path.length - 1]!;
}

/**
 * Spread wires that share the same device pair so they do not fully overlap.
 * Uses port positions when available, otherwise device centers.
 */
export function computeWireRoutes(
  connections: Connection[],
  getCenter: (deviceId: string) => Point,
  getPortPosition?: PortPositionLookup,
  registry?: RegistryLookup,
  deviceTypeById?: Map<string, string>,
): RoutedSegment[] {
  const bundles = new Map<string, Connection[]>();

  for (const conn of connections) {
    const srcType = deviceTypeById?.get(conn.sourceDevice) ?? '';
    const portType =
      registry && deviceTypeById
        ? (resolveConnectionPortType(registry, conn.sourceDevice, srcType, conn.sourcePort) ??
          PortType.POWER)
        : PortType.POWER;
    const key = bundleKey(conn.sourceDevice, conn.targetDevice, portType);
    const group = bundles.get(key) ?? [];
    group.push(conn);
    bundles.set(key, group);
  }

  const routes: RoutedSegment[] = [];
  const spacing = 14;

  for (const group of bundles.values()) {
    const sorted = [...group].sort((a, b) => a.id.localeCompare(b.id));
    const count = sorted.length;

    sorted.forEach((conn, index) => {
      const start =
        getPortPosition?.(conn.sourceDevice, conn.sourcePort) ??
        getCenter(conn.sourceDevice);
      const end =
        getPortPosition?.(conn.targetDevice, conn.targetPort) ?? getCenter(conn.targetDevice);
      const bundleOffset = count === 1 ? 0 : (index - (count - 1) / 2) * spacing;
      const waypoints = parseWaypoints(conn);
      const { start: s, end: e } = offsetLineEndpoints(start, end, bundleOffset);
      const path = [s, ...waypoints, e];
      routes.push({
        connectionId: conn.id,
        start: s,
        end: e,
        bundleOffset,
        waypoints,
        path,
        labelPoint: labelPointOnPath(path),
      });
    });
  }

  return routes;
}

export function offsetLineEndpoints(
  start: Point,
  end: Point,
  bundleOffset: number,
): { start: Point; end: Point } {
  if (bundleOffset === 0) {
    return { start, end };
  }

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;
  const perpX = (-dy / length) * bundleOffset;
  const perpY = (dx / length) * bundleOffset;

  return {
    start: { x: start.x + perpX, y: start.y + perpY },
    end: { x: end.x + perpX, y: end.y + perpY },
  };
}

/** SVG polyline points string from a path. */
export function pathToPolylinePoints(path: Point[]): string {
  return path.map((p) => `${p.x},${p.y}`).join(' ');
}
