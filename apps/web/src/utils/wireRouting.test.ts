import { describe, expect, it } from 'vitest';
import {
  autoOrthogonalPath,
  buildSmoothWirePathD,
  computeWireRoutes,
  controlPointForRoute,
  resolveLabelPositions,
  simplifyPath,
  type Point,
  type Rect,
} from './wireRouting';
import type { Connection } from '@691sim/core';

function conn(id: string, src: string, tgt: string): Connection {
  return {
    id,
    sourceDevice: src,
    sourcePort: 'out',
    targetDevice: tgt,
    targetPort: 'in',
  };
}

describe('autoOrthogonalPath', () => {
  it('creates an L-shaped path instead of a straight diagonal', () => {
    const path = autoOrthogonalPath({ x: 0, y: 0 }, { x: 100, y: 80 }, 0);
    expect(path.length).toBeGreaterThanOrEqual(3);
    const hasHorizontal = path.some((p, i) => i > 0 && Math.abs(p.y - path[i - 1]!.y) < 0.5);
    const hasVertical = path.some((p, i) => i > 0 && Math.abs(p.x - path[i - 1]!.x) < 0.5);
    expect(hasHorizontal && hasVertical).toBe(true);
  });

  it('offsets parallel wires so they do not share the same corridor', () => {
    const a = autoOrthogonalPath({ x: 0, y: 0 }, { x: 120, y: 60 }, -18);
    const b = autoOrthogonalPath({ x: 0, y: 0 }, { x: 120, y: 60 }, 18);
    const midA = a[1]!;
    const midB = b[1]!;
    expect(Math.abs(midA.x - midB.x) + Math.abs(midA.y - midB.y)).toBeGreaterThan(10);
  });

  it('routes around device obstacles when possible', () => {
    const obstacle: Rect = { x: 40, y: -20, width: 80, height: 80 };
    const path = autoOrthogonalPath({ x: 0, y: 0 }, { x: 160, y: 0 }, 0, [obstacle]);
    expect(path.length).toBeGreaterThanOrEqual(3);
  });
});

describe('buildSmoothWirePathD', () => {
  it('uses quadratic curve for three-point paths', () => {
    const d = buildSmoothWirePathD([
      { x: 0, y: 0 },
      { x: 50, y: 80 },
      { x: 100, y: 0 },
    ]);
    expect(d).toContain('Q 50 80');
  });

  it('rounds corners for orthogonal paths', () => {
    const d = buildSmoothWirePathD([
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 80 },
      { x: 100, y: 80 },
    ]);
    expect(d).toContain('Q');
  });
});

describe('controlPointForRoute', () => {
  it('returns the user waypoint when present', () => {
    const wp = { x: 40, y: 40 };
    expect(controlPointForRoute([{ x: 0, y: 0 }, wp, { x: 100, y: 0 }], [wp])).toEqual(wp);
  });
});

describe('resolveLabelPositions', () => {
  it('separates overlapping label anchors', () => {
    const positions = resolveLabelPositions([
      { id: 'a', anchor: { x: 100, y: 100 }, text: 'PDH → SparkMax' },
      { id: 'b', anchor: { x: 102, y: 101 }, text: 'PDH → VRM' },
    ]);
    const a = positions.get('a')!;
    const b = positions.get('b')!;
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(8);
  });
});

describe('computeWireRoutes', () => {
  const getCenter = (id: string): Point => {
    const map: Record<string, Point> = {
      a: { x: 50, y: 50 },
      b: { x: 250, y: 50 },
      c: { x: 150, y: 200 },
    };
    return map[id] ?? { x: 0, y: 0 };
  };

  it('auto-routes multiple wires on different corridors', () => {
    const connections = [conn('c1', 'a', 'b'), conn('c2', 'a', 'c')];
    const routes = computeWireRoutes(connections, getCenter);
    expect(routes).toHaveLength(2);
    for (const route of routes) {
      expect(route.path.length).toBeGreaterThanOrEqual(2);
      expect(route.controlPoint).toBeDefined();
    }
    const dist = Math.hypot(
      routes[0]!.controlPoint.x - routes[1]!.controlPoint.x,
      routes[0]!.controlPoint.y - routes[1]!.controlPoint.y,
    );
    expect(dist).toBeGreaterThan(0);
  });

  it('preserves manual waypoints when set', () => {
    const connections: Connection[] = [
      {
        ...conn('c1', 'a', 'b'),
        metadata: { waypoints: [{ x: 150, y: 120 }] },
      },
    ];
    const routes = computeWireRoutes(connections, getCenter);
    expect(routes[0]!.path.some((p) => p.x === 150 && p.y === 120)).toBe(true);
    expect(routes[0]!.controlPoint).toEqual({ x: 150, y: 120 });
  });
});

describe('simplifyPath', () => {
  it('removes collinear middle points', () => {
    const simplified = simplifyPath([
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 100, y: 0 },
    ]);
    expect(simplified).toHaveLength(2);
  });
});
