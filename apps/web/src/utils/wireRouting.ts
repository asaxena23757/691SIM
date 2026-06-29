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
}

type RegistryLookup = {
  get(type: string): { ports: { id: string; type: PortType }[] } | undefined;
};

/** Connections drawn on the canvas (ground is implied by the red/black 12V pair). */
export function getDisplayConnections(
  connections: Connection[],
  registry: RegistryLookup,
  deviceTypeById: Map<string, string>,
): Connection[] {
  return connections.filter((conn) => {
    const srcType = deviceTypeById.get(conn.sourceDevice);
    const tgtType = deviceTypeById.get(conn.targetDevice);
    if (!srcType || !tgtType) return true;
    const portType =
      resolveConnectionPortType(registry, conn.sourceDevice, srcType, conn.sourcePort) ??
      PortType.POWER;
    return portType !== PortType.GROUND;
  });
}

function bundleKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * Spread wires that share the same device pair so they do not fully overlap.
 * Wires between the same two devices are offset perpendicular to the line.
 */
export function computeWireRoutes(
  connections: Connection[],
  getCenter: (deviceId: string) => Point,
): RoutedSegment[] {
  const bundles = new Map<string, Connection[]>();

  for (const conn of connections) {
    const key = bundleKey(conn.sourceDevice, conn.targetDevice);
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
      const start = getCenter(conn.sourceDevice);
      const end = getCenter(conn.targetDevice);
      const bundleOffset = count === 1 ? 0 : (index - (count - 1) / 2) * spacing;
      routes.push({ connectionId: conn.id, start, end, bundleOffset });
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
