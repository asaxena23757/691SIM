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

/** Whether two ports can be wired together (type + direction). */
export function canConnectPorts(
  registry: DeviceRegistry,
  deviceTypes: Map<string, string>,
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

  // Prefer output → input orientation; fall back to bidirectional pairs.
  if (sourceAllowed(aPort.direction) && targetAllowed(bPort.direction)) {
    return {
      ok: true,
      oriented: {
        id: '',
        sourceDevice: a.deviceId,
        sourcePort: a.portId,
        targetDevice: b.deviceId,
        targetPort: b.portId,
      },
    };
  }
  if (sourceAllowed(bPort.direction) && targetAllowed(aPort.direction)) {
    return {
      ok: true,
      oriented: {
        id: '',
        sourceDevice: b.deviceId,
        sourcePort: b.portId,
        targetDevice: a.deviceId,
        targetPort: a.portId,
      },
    };
  }
  if (aPort.direction === PortDirection.BIDIRECTIONAL && bPort.direction === PortDirection.BIDIRECTIONAL) {
    return {
      ok: true,
      oriented: {
        id: '',
        sourceDevice: a.deviceId,
        sourcePort: a.portId,
        targetDevice: b.deviceId,
        targetPort: b.portId,
      },
    };
  }

  return { ok: false, reason: 'Incompatible port directions (need output → input).' };
}

/** True when `target` is a valid second click/drop for `from`. */
export function isCompatibleTarget(
  registry: DeviceRegistry,
  deviceTypes: Map<string, string>,
  from: SelectedPort,
  target: SelectedPort,
): boolean {
  return canConnectPorts(registry, deviceTypes, from, target).ok;
}
