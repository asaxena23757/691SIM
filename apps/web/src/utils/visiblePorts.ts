import type { Connection, DeviceDefinition, Port } from '@691sim/core';
import { PortType } from '@691sim/core';

const PRIMARY_PORTS = new Set([
  'main_power',
  'main_power_in',
  'power_in',
  'can_bus',
  'usb_c',
  'usb_b',
  'usb_a',
  'eth_0',
  'eth_poe',
  'eth_aux',
  'vrm_out',
  'motor_a',
  'motor_b',
  'motor_c',
]);

export function isPortConnected(
  deviceId: string,
  portId: string,
  connections: Connection[],
): boolean {
  return connections.some(
    (c) =>
      (c.sourceDevice === deviceId && c.sourcePort === portId) ||
      (c.targetDevice === deviceId && c.targetPort === portId),
  );
}

export function getVisiblePorts(
  deviceId: string,
  definition: DeviceDefinition,
  connections: Connection[],
): Port[] {
  const connectedPortIds = new Set<string>();

  for (const connection of connections) {
    if (connection.sourceDevice === deviceId) {
      connectedPortIds.add(connection.sourcePort);
    }
    if (connection.targetDevice === deviceId) {
      connectedPortIds.add(connection.targetPort);
    }
  }

  const visible = definition.ports.filter(
    (port) =>
      port.type !== PortType.GROUND &&
      (port.required ||
        PRIMARY_PORTS.has(port.id) ||
        port.id.startsWith('channel_') ||
        connectedPortIds.has(port.id)),
  );

  if (visible.length <= 16) {
    return visible;
  }

  const channels = visible.filter((port) => port.id.startsWith('channel_'));
  const nonChannels = visible.filter((port) => !port.id.startsWith('channel_'));
  return [...nonChannels, ...channels.slice(0, 6)];
}

export function countHiddenPorts(
  deviceId: string,
  definition: DeviceDefinition,
  connections: Connection[],
): number {
  const uiPorts = definition.ports.filter((p) => p.type !== PortType.GROUND);
  return uiPorts.length - getVisiblePorts(deviceId, definition, connections).length;
}
