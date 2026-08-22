import type { Connection } from '@691sim/core';
import { PortType } from '@691sim/core';
import { resolveConnectionPortType } from './wireStyles';

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
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

export type DeviceBoundsLookup = (deviceId: string) => Rect | undefined;

const BUNDLE_SPACING = 14;
const LANE_SPACING = 12;
const OBSTACLE_MARGIN = 10;
const ALIGN_THRESHOLD = 10;

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

function pointsEqual(a: Point, b: Point, eps = 0.5): boolean {
  return Math.abs(a.x - b.x) < eps && Math.abs(a.y - b.y) < eps;
}

/** Remove duplicate and collinear points. */
export function simplifyPath(path: Point[]): Point[] {
  if (path.length <= 2) return path;
  const out: Point[] = [path[0]!];
  for (let i = 1; i < path.length - 1; i++) {
    const prev = out[out.length - 1]!;
    const curr = path[i]!;
    const next = path[i + 1]!;
    const collinearH = Math.abs(prev.y - curr.y) < 0.5 && Math.abs(curr.y - next.y) < 0.5;
    const collinearV = Math.abs(prev.x - curr.x) < 0.5 && Math.abs(curr.x - next.x) < 0.5;
    if (collinearH || collinearV) continue;
    if (!pointsEqual(prev, curr)) out.push(curr);
  }
  const last = path[path.length - 1]!;
  if (!pointsEqual(out[out.length - 1]!, last)) out.push(last);
  return out;
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

function expandRect(rect: Rect, margin: number): Rect {
  return {
    x: rect.x - margin,
    y: rect.y - margin,
    width: rect.width + margin * 2,
    height: rect.height + margin * 2,
  };
}

function segmentIntersectsRect(p1: Point, p2: Point, rect: Rect): boolean {
  const r = expandRect(rect, OBSTACLE_MARGIN);
  const minX = Math.min(p1.x, p2.x);
  const maxX = Math.max(p1.x, p2.x);
  const minY = Math.min(p1.y, p2.y);
  const maxY = Math.max(p1.y, p2.y);

  if (maxX < r.x || minX > r.x + r.width) return false;
  if (maxY < r.y || minY > r.y + r.height) return false;

  const vertical = Math.abs(p1.x - p2.x) < 0.5;
  const horizontal = Math.abs(p1.y - p2.y) < 0.5;

  if (vertical) {
    const x = p1.x;
    return x >= r.x && x <= r.x + r.width && maxY >= r.y && minY <= r.y + r.height;
  }
  if (horizontal) {
    const y = p1.y;
    return y >= r.y && y <= r.y + r.height && maxX >= r.x && minX <= r.x + r.width;
  }

  return true;
}

function pathHitsObstacles(path: Point[], obstacles: Rect[]): boolean {
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!;
    const b = path[i]!;
    if (obstacles.some((obs) => segmentIntersectsRect(a, b, obs))) return true;
  }
  return false;
}

function nudgeCandidate(base: number, attempt: number, step: number): number {
  if (attempt === 0) return base;
  const magnitude = Math.ceil(attempt / 2) * step;
  return attempt % 2 === 1 ? base + magnitude : base - magnitude;
}

/**
 * Orthogonal autoroute: horizontal-vertical or vertical-horizontal with lane offset
 * so parallel wires do not fully overlap.
 */
export function autoOrthogonalPath(
  start: Point,
  end: Point,
  laneOffset: number,
  obstacles: Rect[] = [],
): Point[] {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  if (Math.hypot(dx, dy) < 4) return [start, end];

  const alignedH = Math.abs(dy) < ALIGN_THRESHOLD;
  const alignedV = Math.abs(dx) < ALIGN_THRESHOLD;

  if (alignedH) {
    const straight = simplifyPath([start, end]);
    if (!pathHitsObstacles(straight, obstacles)) return straight;
    for (let attempt = 1; attempt <= 12; attempt++) {
      const detourY = nudgeCandidate(start.y, attempt, LANE_SPACING * 2);
      const path = simplifyPath([
        start,
        { x: start.x, y: detourY },
        { x: end.x, y: detourY },
        end,
      ]);
      if (!pathHitsObstacles(path, obstacles)) return path;
    }
  }

  if (alignedV) {
    const straight = simplifyPath([start, end]);
    if (!pathHitsObstacles(straight, obstacles)) return straight;
    for (let attempt = 1; attempt <= 12; attempt++) {
      const detourX = nudgeCandidate(start.x, attempt, LANE_SPACING * 2);
      const path = simplifyPath([
        start,
        { x: detourX, y: start.y },
        { x: detourX, y: end.y },
        end,
      ]);
      if (!pathHitsObstacles(path, obstacles)) return path;
    }
  }

  const preferHorizontal = Math.abs(dx) >= Math.abs(dy);
  const step = LANE_SPACING * 2;

  for (let attempt = 0; attempt < 24; attempt++) {
    const offset = nudgeCandidate(laneOffset, attempt, step);
    let path: Point[];

    if (preferHorizontal) {
      const midX = start.x + dx / 2 + offset;
      path = [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end];
    } else {
      const midY = start.y + dy / 2 + offset;
      path = [start, { x: start.x, y: midY }, { x: end.x, y: midY }, end];
    }

    path = simplifyPath(path);
    if (!pathHitsObstacles(path, obstacles)) return path;
  }

  if (preferHorizontal) {
    const midX = start.x + dx / 2 + laneOffset;
    return simplifyPath([start, { x: midX, y: start.y }, { x: midX, y: end.y }, end]);
  }
  const midY = start.y + dy / 2 + laneOffset;
  return simplifyPath([start, { x: start.x, y: midY }, { x: end.x, y: midY }, end]);
}

function segmentKey(p1: Point, p2: Point): string {
  const a = `${Math.round(p1.x)}:${Math.round(p1.y)}`;
  const b = `${Math.round(p2.x)}:${Math.round(p2.y)}`;
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** Spread wires that reuse the same corridor segment. */
function applyCorridorDeconfliction(routes: RoutedSegment[]): void {
  const usage = new Map<string, string[]>();

  for (const route of routes) {
    for (let i = 1; i < route.path.length; i++) {
      const key = segmentKey(route.path[i - 1]!, route.path[i]!);
      const ids = usage.get(key) ?? [];
      ids.push(route.connectionId);
      usage.set(key, ids);
    }
  }

  for (const [, ids] of usage) {
    if (ids.length <= 1) continue;
    const sorted = [...ids].sort();
    sorted.forEach((id, index) => {
      const route = routes.find((r) => r.connectionId === id);
      if (!route || route.waypoints.length > 0) return;
      const extra = (index - (sorted.length - 1) / 2) * (LANE_SPACING * 0.6);
      if (Math.abs(extra) < 0.1) return;
      const start = route.start;
      const end = route.end;
      const rerouted = autoOrthogonalPath(start, end, route.bundleOffset + extra, []);
      route.path = rerouted;
      route.labelPoint = labelPointOnPath(rerouted);
    });
  }
}

/**
 * Spread wires that share the same device pair so they do not fully overlap.
 * Uses port positions when available, otherwise device centers.
 * Auto-routes orthogonally when no manual waypoints are set.
 */
export function computeWireRoutes(
  connections: Connection[],
  getCenter: (deviceId: string) => Point,
  getPortPosition?: PortPositionLookup,
  registry?: RegistryLookup,
  deviceTypeById?: Map<string, string>,
  getDeviceBounds?: DeviceBoundsLookup,
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

  const globalSorted = [...connections].sort((a, b) => a.id.localeCompare(b.id));
  const globalIndex = new Map(globalSorted.map((c, i) => [c.id, i]));
  const globalCount = globalSorted.length;

  const routes: RoutedSegment[] = [];

  for (const group of bundles.values()) {
    const sorted = [...group].sort((a, b) => a.id.localeCompare(b.id));
    const count = sorted.length;

    sorted.forEach((conn, index) => {
      const start =
        getPortPosition?.(conn.sourceDevice, conn.sourcePort) ??
        getCenter(conn.sourceDevice);
      const end =
        getPortPosition?.(conn.targetDevice, conn.targetPort) ?? getCenter(conn.targetDevice);
      const bundleOffset = count === 1 ? 0 : (index - (count - 1) / 2) * BUNDLE_SPACING;
      const { start: s, end: e } = offsetLineEndpoints(start, end, bundleOffset);
      const waypoints = parseWaypoints(conn);

      const gi = globalIndex.get(conn.id) ?? 0;
      const laneOffset =
        (gi - (globalCount - 1) / 2) * LANE_SPACING + bundleOffset * 0.35;

      const obstacles: Rect[] = [];
      if (getDeviceBounds) {
        for (const deviceId of new Set([conn.sourceDevice, conn.targetDevice])) {
          const bounds = getDeviceBounds(deviceId);
          if (bounds) obstacles.push(bounds);
        }
      }
      const allObstacles =
        getDeviceBounds != null
          ? [...new Set(connections.flatMap((c) => [c.sourceDevice, c.targetDevice]))]
              .filter((id) => id !== conn.sourceDevice && id !== conn.targetDevice)
              .map((id) => getDeviceBounds(id))
              .filter((r): r is Rect => r != null)
          : obstacles;

      const path =
        waypoints.length > 0
          ? simplifyPath([s, ...waypoints, e])
          : autoOrthogonalPath(s, e, laneOffset, allObstacles);

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

  applyCorridorDeconfliction(routes);
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
