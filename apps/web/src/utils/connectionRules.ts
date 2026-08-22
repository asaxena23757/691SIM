import { PortDirection, PortType, type Connection } from '@691sim/core';
import type { DeviceRegistry } from '@691sim/registry';
import type { SelectedPort } from '../hooks/useRobotModel';

export interface ConnectCheck {
  ok: boolean;
  reason?: string;
  oriented?: Connection;
}

function getPort(
  registry: DeviceRegistry,
  deviceType: string,
  portId: string,
) {
  return registry.get(deviceType)?.ports.find((p) => p.id === portId);
}

function sourceAllowed(direction: PortDirection): boolean {
  return direction === PortDirection.OUTPUT || direction === PortDirection.BIDIRECTIONAL;
}

function targetAllowed(direction: PortDirection): boolean {
  return direction === PortDirection.INPUT || direction === PortDirection.BIDIRECTIONAL;
}

export function countPortConnections(
  connections: Connection[],
  deviceId: string,
  portId: string,
): number {
  return connections.filter(
    (c) =>
      (c.sourceDevice === deviceId && c.sourcePort === portId) ||
      (c.targetDevice === deviceId && c.targetPort === portId),
  ).length;
}

export function isPortAtCapacity(
  connections: Connection[],
  registry: DeviceRegistry,
  deviceTypes: Map<string, string>,
  deviceId: string,
  portId: string,
): boolean {
  const deviceType = deviceTypes.get(deviceId);
  if (!deviceType) return false;
  const port = getPort(registry, deviceType, portId);
  if (!port || port.maxConnections === undefined) return false;
  return countPortConnections(connections, deviceId, portId) >= port.maxConnections;
}

function isDuplicateConnection(connections: Connection[], oriented: Connection): boolean {
  return connections.some(
    (c) =>
      (c.sourceDevice === oriented.sourceDevice &&
        c.sourcePort === oriented.sourcePort &&
        c.targetDevice === oriented.targetDevice &&
        c.targetPort === oriented.targetPort) ||
      (c.sourceDevice === oriented.targetDevice &&
        c.sourcePort === oriented.targetPort &&
        c.targetDevice === oriented.sourceDevice &&
        c.targetPort === oriented.sourcePort),
  );
}

function checkPortCapacity(
  connections: Connection[],
  registry: DeviceRegistry,
  deviceTypes: Map<string, string>,
  deviceId: string,
  portId: string,
): ConnectCheck | null {
  const deviceType = deviceTypes.get(deviceId);
  if (!deviceType) return null;
  const port = getPort(registry, deviceType, portId);
  if (!port || port.maxConnections === undefined) return null;

  const count = countPortConnections(connections, deviceId, portId);
  if (count >= port.maxConnections) {
    return {
      ok: false,
      reason: `${deviceId}.${portId} is full (${count}/${port.maxConnections} wire${port.maxConnections === 1 ? '' : 's'}).`,
    };
  }
  return null;
}

/** Whether two ports can be wired together (type, direction, capacity, duplicates). */
export function canConnectPorts(
  registry: DeviceRegistry,
  deviceTypes: Map<string, string>,
  connections: Connection[],
  a: SelectedPort,
  b: SelectedPort,
): ConnectCheck {
  if (a.deviceId === b.deviceId && a.portId === b.portId) {
    return { ok: false, reason: 'Cannot connect a port to itself.' };
  }

  const aType = deviceTypes.get(a.deviceId);
  const bType = deviceTypes.get(b.deviceId);
  if (!aType || !bType) return { ok: false, reason: 'Unknown device.' };

  const aPort = getPort(registry, aType, a.portId);
  const bPort = getPort(registry, bType, b.portId);
  if (!aPort || !bPort) return { ok: false, reason: 'Unknown port.' };

  if (aPort.type !== bPort.type) {
    return {
      ok: false,
      reason: `Port types must match (${PortType[aPort.type]} ≠ ${PortType[bPort.type]}).`,
    };
  }

  let oriented: Connection | undefined;

  if (sourceAllowed(aPort.direction) && targetAllowed(bPort.direction)) {
    oriented = {
      id: '',
      sourceDevice: a.deviceId,
      sourcePort: a.portId,
      targetDevice: b.deviceId,
      targetPort: b.portId,
    };
  } else if (sourceAllowed(bPort.direction) && targetAllowed(aPort.direction)) {
    oriented = {
      id: '',
      sourceDevice: b.deviceId,
      sourcePort: b.portId,
      targetDevice: a.deviceId,
      targetPort: a.portId,
    };
  } else if (
    aPort.direction === PortDirection.BIDIRECTIONAL &&
    bPort.direction === PortDirection.BIDIRECTIONAL
  ) {
    oriented = {
      id: '',
      sourceDevice: a.deviceId,
      sourcePort: a.portId,
      targetDevice: b.deviceId,
      targetPort: b.portId,
    };
  }

  if (!oriented) {
    return { ok: false, reason: 'Incompatible port directions (need output → input).' };
  }

  if (isDuplicateConnection(connections, oriented)) {
    return { ok: false, reason: 'These ports are already connected.' };
  }

  const srcCap = checkPortCapacity(
    connections,
    registry,
    deviceTypes,
    oriented.sourceDevice,
    oriented.sourcePort,
  );
  if (srcCap) return srcCap;

  const tgtCap = checkPortCapacity(
    connections,
    registry,
    deviceTypes,
    oriented.targetDevice,
    oriented.targetPort,
  );
  if (tgtCap) return tgtCap;

  return { ok: true, oriented };
}

/** True when `target` is a valid second click/drop for `from`. */
export function isCompatibleTarget(
  registry: DeviceRegistry,
  deviceTypes: Map<string, string>,
  connections: Connection[],
  from: SelectedPort,
  target: SelectedPort,
): boolean {
  return canConnectPorts(registry, deviceTypes, connections, from, target).ok;
}
