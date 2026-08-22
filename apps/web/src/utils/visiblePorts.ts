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

/** PDH low-current channels (often used for 5V regulators / small loads). */
const PDH_LOW_CURRENT_CHANNELS = new Set(['channel_20', 'channel_21', 'channel_22', 'channel_23']);

function isLowCurrentOr5vPort(portId: string, deviceType: string): boolean {
  if (deviceType === 'PDH' && PDH_LOW_CURRENT_CHANNELS.has(portId)) return true;
  return portId.startsWith('5v_');
}

export function portDisplayLabel(portId: string, deviceType: string): string {
  if (deviceType === 'PDH' && PDH_LOW_CURRENT_CHANNELS.has(portId)) {
    return `${portId} (5V/low)`;
  }
  if (portId.startsWith('5v_')) {
    return portId.replace(/_/g, ' ').toUpperCase();
  }
  return portId;
}

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
        port.id.startsWith('5v_') ||
        isLowCurrentOr5vPort(port.id, definition.type) ||
        connectedPortIds.has(port.id)),
  );

  if (visible.length <= 20) {
    return visible;
  }

  const channels = visible.filter((port) => port.id.startsWith('channel_'));
  const lowChannels = channels.filter((port) => PDH_LOW_CURRENT_CHANNELS.has(port.id));
  const highChannels = channels.filter((port) => !PDH_LOW_CURRENT_CHANNELS.has(port.id));
  const nonChannels = visible.filter((port) => !port.id.startsWith('channel_'));
  return [...nonChannels, ...lowChannels, ...highChannels.slice(0, 8)];
}

export function countHiddenPorts(
  deviceId: string,
  definition: DeviceDefinition,
  connections: Connection[],
): number {
  const uiPorts = definition.ports.filter((p) => p.type !== PortType.GROUND);
  return uiPorts.length - getVisiblePorts(deviceId, definition, connections).length;
}
