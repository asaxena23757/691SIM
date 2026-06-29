import { PortDirection, PortType, type Connection } from '@691sim/core';
import type { DeviceRegistry } from '@691sim/registry';

function pickGroundPort(
  registry: DeviceRegistry,
  deviceType: string,
  asSource: boolean,
): string | null {
  const def = registry.get(deviceType);
  if (!def) return null;

  const grounds = def.ports.filter((p) => p.type === PortType.GROUND);
  if (grounds.length === 0) return null;

  const preferred = asSource
    ? ['ground_bus', 'ground', 'ground_12v_2a_0', 'ground_12v_500ma_0']
    : ['ground_in', 'ground', 'ground_12v_2a_0', 'ground_12v_500ma_0'];

  for (const id of preferred) {
    const port = grounds.find((p) => p.id === id);
    if (!port) continue;
    if (asSource && port.direction === PortDirection.INPUT) continue;
    if (!asSource && port.direction === PortDirection.OUTPUT) continue;
    return port.id;
  }

  const fallback = grounds.find((p) =>
    asSource
      ? p.direction === PortDirection.OUTPUT || p.direction === PortDirection.BIDIRECTIONAL
      : p.direction === PortDirection.INPUT || p.direction === PortDirection.BIDIRECTIONAL,
  );
  return fallback?.id ?? null;
}

export function groundConnectionIdForPower(powerId: string): string {
  return `${powerId}-gnd`;
}

export function createPairedGroundConnection(
  registry: DeviceRegistry,
  power: Connection,
  sourceType: string,
  targetType: string,
): Connection | null {
  const sourceGround = pickGroundPort(registry, sourceType, true);
  const targetGround = pickGroundPort(registry, targetType, false);
  if (!sourceGround || !targetGround) return null;

  return {
    id: groundConnectionIdForPower(power.id),
    sourceDevice: power.sourceDevice,
    sourcePort: sourceGround,
    targetDevice: power.targetDevice,
    targetPort: targetGround,
  };
}

export function isGroundConnection(
  registry: DeviceRegistry,
  conn: Connection,
  sourceType: string,
): boolean {
  const def = registry.get(sourceType);
  const port = def?.ports.find((p) => p.id === conn.sourcePort);
  return port?.type === PortType.GROUND;
}

export function isPowerConnection(
  registry: DeviceRegistry,
  conn: Connection,
  sourceType: string,
): boolean {
  const def = registry.get(sourceType);
  const port = def?.ports.find((p) => p.id === conn.sourcePort);
  return port?.type === PortType.POWER;
}
