import { PortType, type Connection, type RobotModel } from '@691sim/core';
import type { DeviceRegistry } from '@691sim/registry';
import { resolveConnectionPortType } from './wireStyles';
import { getPdhFuseInfo, getFuseRatingAmps, fuseRatingLabel } from './fuses';

const CAN_NET_NAME = 'CAN';

function deviceDisplayName(
  deviceId: string,
  model: RobotModel,
  registry: DeviceRegistry,
): string {
  const device = model.devices.find((d) => d.id === deviceId);
  if (!device) return deviceId;
  const def = registry.get(device.type);
  return device.label ?? def?.displayName ?? device.type;
}

/** Auto label: "PDH → SparkMax" using display names. */
export function autoWireLabel(
  connection: Connection,
  model: RobotModel,
  registry: DeviceRegistry,
): string {
  const from = deviceDisplayName(connection.sourceDevice, model, registry);
  const to = deviceDisplayName(connection.targetDevice, model, registry);
  return `${from} → ${to}`;
}

function isCanConnection(
  connection: Connection,
  deviceTypes: Map<string, string>,
  registry: DeviceRegistry,
): boolean {
  const srcType = deviceTypes.get(connection.sourceDevice);
  if (!srcType) return false;
  const portType = resolveConnectionPortType(
    registry,
    connection.sourceDevice,
    srcType,
    connection.sourcePort,
  );
  return portType === PortType.CAN;
}

/** Build adjacency for CAN connections. */
function canAdjacency(
  connections: Connection[],
  deviceTypes: Map<string, string>,
  registry: DeviceRegistry,
): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  const touch = (id: string) => {
    if (!adj.has(id)) adj.set(id, new Set());
    return adj.get(id)!;
  };

  for (const conn of connections) {
    if (!isCanConnection(conn, deviceTypes, registry)) continue;
    touch(conn.sourceDevice).add(conn.targetDevice);
    touch(conn.targetDevice).add(conn.sourceDevice);
  }
  return adj;
}

/**
 * KiCad-style CAN net labels: one shared "CAN" label per bus segment graph.
 * On loops, only the canonical (lowest connection id) wire shows the net label
 * so the ring does not get cluttered with duplicate labels.
 */
export function buildCanLabelCarriers(
  connections: Connection[],
  deviceTypes: Map<string, string>,
  registry: DeviceRegistry,
): Set<string> {
  const carriers = new Set<string>();
  const canConns = connections.filter((c) => isCanConnection(c, deviceTypes, registry));
  if (canConns.length === 0) return carriers;

  const adj = canAdjacency(connections, deviceTypes, registry);
  const visited = new Set<string>();

  for (const startId of adj.keys()) {
    if (visited.has(startId)) continue;

    const componentDevices = new Set<string>();
    const queue = [startId];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      componentDevices.add(id);
      for (const n of adj.get(id) ?? []) {
        if (!visited.has(n)) queue.push(n);
      }
    }

    const componentConns = canConns.filter(
      (c) => componentDevices.has(c.sourceDevice) && componentDevices.has(c.targetDevice),
    );
    if (componentConns.length === 0) continue;

    const canonical = [...componentConns].sort((a, b) => a.id.localeCompare(b.id))[0]!;
    carriers.add(canonical.id);
  }

  return carriers;
}

export interface WireLabelInfo {
  text: string;
  detail: string;
  show: boolean;
}

export function resolveWireLabel(
  connection: Connection,
  model: RobotModel,
  registry: DeviceRegistry,
  deviceTypes: Map<string, string>,
  canLabelCarriers: Set<string>,
  simulationGauge?: number,
): WireLabelInfo {
  const custom = connection.metadata?.label;
  if (typeof custom === 'string' && custom.trim()) {
    return { text: custom.trim(), detail: buildDetail(connection, simulationGauge), show: true };
  }

  const srcType = deviceTypes.get(connection.sourceDevice) ?? '';
  const tgtType = deviceTypes.get(connection.targetDevice) ?? '';
  const portType =
    resolveConnectionPortType(registry, connection.sourceDevice, srcType, connection.sourcePort) ??
    PortType.POWER;

  if (portType === PortType.CAN) {
    if (canLabelCarriers.has(connection.id)) {
      return { text: CAN_NET_NAME, detail: buildDetail(connection, simulationGauge), show: true };
    }
    return { text: '', detail: buildDetail(connection, simulationGauge), show: false };
  }

  const hideAuto = connection.metadata?.hideAutoLabel === true;
  if (hideAuto) {
    return { text: '', detail: buildDetail(connection, simulationGauge), show: false };
  }

  return {
    text: autoWireLabel(connection, model, registry),
    detail: buildDetail(connection, simulationGauge),
    show: true,
  };
}

function buildDetail(connection: Connection, simulationGauge?: number): string {
  const parts: string[] = [];
  const gauge = Number(connection.metadata?.gauge ?? simulationGauge);
  if (Number.isFinite(gauge) && gauge > 0) parts.push(`${gauge} AWG`);

  const fuse = connection.metadata?.fuseRatingAmps;
  if (typeof fuse === 'number' && fuse > 0) parts.push(`${fuse}A fuse`);

  return parts.join(' · ');
}

export function wireAnnotation(
  connection: Connection,
  srcType: string,
  tgtType: string,
  portType: PortType,
  simulationGauge?: number,
  simulationFuse?: number,
): string {
  const parts: string[] = [];
  const gauge = Number(connection.metadata?.gauge ?? simulationGauge);
  if (Number.isFinite(gauge) && gauge > 0) parts.push(`${gauge}AWG`);

  const fuseInfo = getPdhFuseInfo(
    portType,
    srcType,
    connection.sourcePort,
    tgtType,
    connection.targetPort,
  );
  if (fuseInfo.show) {
    const amps = getFuseRatingAmps(connection, fuseInfo.port);
    parts.push(fuseRatingLabel(amps));
  } else if (typeof simulationFuse === 'number') {
    parts.push(`${simulationFuse}A`);
  }

  return parts.join(' ');
}
