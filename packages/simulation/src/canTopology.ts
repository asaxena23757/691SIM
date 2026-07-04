import type { CircuitComponent } from './components.js';

const CONTROLLER_TYPES = new Set(['RoboRIO', 'SystemCore']);
const TERMINATOR_TYPES = new Set(['PDH', 'PDP']);

export interface CanEdge {
  connectionId: string;
  a: string;
  b: string;
}

export interface CanTopologyIssue {
  code: string;
  message: string;
  deviceIds: string[];
}

export interface CanTopologyResult {
  hasCanBus: boolean;
  isValidChain: boolean;
  terminationOk: boolean;
  endpoints: string[];
  segments: number;
  issues: CanTopologyIssue[];
}

function edgeKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * Verify the CAN bus is a single daisy chain terminated at both ends.
 *
 * A healthy FRC CAN bus is a linear chain that starts at the roboRIO (built-in
 * 120Ω terminator) and ends at the PDH/PDP (switchable 120Ω terminator), with
 * every device in between having exactly two neighbours. This detects branches,
 * loops, isolated segments, and missing/incorrect termination.
 */
export function verifyCanTopology(
  components: Map<string, CircuitComponent>,
  canEdges: CanEdge[],
): CanTopologyResult {
  const adjacency = new Map<string, Set<string>>();
  const seenEdges = new Set<string>();

  const touch = (id: string) => {
    if (!adjacency.has(id)) adjacency.set(id, new Set());
    return adjacency.get(id)!;
  };

  for (const edge of canEdges) {
    if (edge.a === edge.b) continue;
    const key = edgeKey(edge.a, edge.b);
    if (seenEdges.has(key)) continue;
    seenEdges.add(key);
    touch(edge.a).add(edge.b);
    touch(edge.b).add(edge.a);
  }

  const nodes = [...adjacency.keys()];
  if (nodes.length === 0) {
    return {
      hasCanBus: false,
      isValidChain: true,
      terminationOk: true,
      endpoints: [],
      segments: 0,
      issues: [],
    };
  }

  const issues: CanTopologyIssue[] = [];
  const typeOf = (id: string) => components.get(id)?.type ?? '';

  // Branch detection: any node with more than two neighbours.
  const branchNodes = nodes.filter((id) => (adjacency.get(id)?.size ?? 0) > 2);
  for (const id of branchNodes) {
    issues.push({
      code: 'CAN_BRANCH_DETECTED',
      message: `${id} has ${adjacency.get(id)!.size} CAN connections — the bus must be a single daisy chain, not a branch.`,
      deviceIds: [id],
    });
  }

  // Connected components + cycle detection (a tree component has edges = nodes - 1).
  const visited = new Set<string>();
  const componentGroups: string[][] = [];
  let hasLoop = false;

  for (const start of nodes) {
    if (visited.has(start)) continue;
    const group: string[] = [];
    const queue = [start];
    visited.add(start);
    let edgeEndpointCount = 0;

    while (queue.length > 0) {
      const current = queue.shift()!;
      group.push(current);
      const neighbours = adjacency.get(current) ?? new Set();
      edgeEndpointCount += neighbours.size;
      for (const next of neighbours) {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push(next);
        }
      }
    }

    const groupEdges = edgeEndpointCount / 2;
    if (groupEdges >= group.length) {
      hasLoop = true;
    }
    componentGroups.push(group);
  }

  if (hasLoop) {
    issues.push({
      code: 'CAN_LOOP_DETECTED',
      message: 'CAN bus forms a loop. A closed ring prevents proper 120Ω termination at both ends.',
      deviceIds: nodes,
    });
  }

  if (componentGroups.length > 1) {
    for (const group of componentGroups.slice(1)) {
      issues.push({
        code: 'CAN_ISOLATED_SEGMENT',
        message: `Isolated CAN segment not joined to the main bus: ${group.join(', ')}.`,
        deviceIds: group,
      });
    }
  }

  const endpoints = nodes.filter((id) => (adjacency.get(id)?.size ?? 0) === 1);
  const rioIsEndpoint = endpoints.some((id) => CONTROLLER_TYPES.has(typeOf(id)));
  const terminatorIsEndpoint = endpoints.some((id) => TERMINATOR_TYPES.has(typeOf(id)));
  const terminationOk =
    endpoints.length === 2 && rioIsEndpoint && terminatorIsEndpoint;

  if (!terminationOk && !hasLoop) {
    issues.push({
      code: 'CAN_MISSING_TERMINATION',
      message:
        'CAN chain is not terminated correctly. It should start at the roboRIO and end at the PDH/PDP with a 120Ω terminating resistor at each end.',
      deviceIds: nodes,
    });
  }

  const isValidChain =
    componentGroups.length === 1 &&
    branchNodes.length === 0 &&
    !hasLoop &&
    terminationOk;

  return {
    hasCanBus: true,
    isValidChain,
    terminationOk,
    endpoints,
    segments: componentGroups.length,
    issues,
  };
}
