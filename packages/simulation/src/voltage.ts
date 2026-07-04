import { Battery, type CircuitComponent, type LoadMode } from './components.js';
import type { SimWire } from './wire.js';

/** RoboRIO brownout protection begins around 6.3V. */
export const BROWNOUT_VOLTAGE_THRESHOLD = 6.3;
export const BROWNOUT_MESSAGE = 'ROBORIO BROWNOUT RISK DETECTED';

export interface PowerEdge {
  connectionId: string;
  from: string;
  to: string;
  wire: SimWire;
}

export interface WireCurrentResult {
  connectionId: string;
  from: string;
  to: string;
  gauge: number;
  lengthInches: number;
  resistanceOhms: number;
  currentAmps: number;
  voltageDrop: number;
  maxAmps: number;
  exceedsAmpacity: boolean;
}

export interface VoltageSimResult {
  hasBattery: boolean;
  mode: LoadMode;
  batteryVoltage: number;
  internalResistanceOhms: number;
  totalCurrentAmps: number;
  internalVoltageDrop: number;
  wireVoltageDropTotal: number;
  systemVoltage: number;
  brownoutThreshold: number;
  brownoutRisk: boolean;
  wireCurrents: WireCurrentResult[];
}

/**
 * Dynamic voltage-drop / brownout engine.
 *
 * Implements V_system = V_battery − (I_total · R_internal) − Σ(I_branch · R_wire)
 * where each wire's branch current is the total draw of everything downstream
 * of it on the power tree. Pure function — no UI or registry dependencies.
 */
export function simulateVoltage(
  components: Map<string, CircuitComponent>,
  powerEdges: PowerEdge[],
  mode: LoadMode = 'peak',
): VoltageSimResult {
  const battery = [...components.values()].find(
    (component): component is Battery => component instanceof Battery,
  );

  // Downstream power adjacency (source output -> target input).
  const children = new Map<string, PowerEdge[]>();
  for (const edge of powerEdges) {
    const list = children.get(edge.from) ?? [];
    list.push(edge);
    children.set(edge.from, list);
  }

  const memo = new Map<string, number>();
  const downstreamCurrent = (deviceId: string, stack: Set<string>): number => {
    const cached = memo.get(deviceId);
    if (cached !== undefined) return cached;
    if (stack.has(deviceId)) return 0; // guard against wiring loops

    stack.add(deviceId);
    let total = components.get(deviceId)?.currentDraw(mode) ?? 0;
    for (const edge of children.get(deviceId) ?? []) {
      total += downstreamCurrent(edge.to, stack);
    }
    stack.delete(deviceId);
    memo.set(deviceId, total);
    return total;
  };

  const totalCurrentAmps = battery
    ? downstreamCurrent(battery.id, new Set())
    : [...components.values()].reduce((sum, c) => sum + c.currentDraw(mode), 0);

  const wireCurrents: WireCurrentResult[] = powerEdges.map((edge) => {
    const currentAmps = downstreamCurrent(edge.to, new Set());
    const resistanceOhms = edge.wire.resistanceOhms;
    return {
      connectionId: edge.connectionId,
      from: edge.from,
      to: edge.to,
      gauge: edge.wire.gauge,
      lengthInches: edge.wire.lengthInches,
      resistanceOhms,
      currentAmps,
      voltageDrop: edge.wire.voltageDrop(currentAmps),
      maxAmps: edge.wire.maxAmps,
      exceedsAmpacity: edge.wire.exceedsAmpacity(currentAmps),
    };
  });

  const wireVoltageDropTotal = wireCurrents.reduce((sum, w) => sum + w.voltageDrop, 0);
  const batteryVoltage = battery?.nominalVoltage ?? 12.6;
  const internalResistanceOhms = battery?.internalResistanceOhms ?? 0.011;
  const internalVoltageDrop = totalCurrentAmps * internalResistanceOhms;
  const systemVoltage = batteryVoltage - internalVoltageDrop - wireVoltageDropTotal;

  return {
    hasBattery: battery !== undefined,
    mode,
    batteryVoltage,
    internalResistanceOhms,
    totalCurrentAmps,
    internalVoltageDrop,
    wireVoltageDropTotal,
    systemVoltage,
    brownoutThreshold: BROWNOUT_VOLTAGE_THRESHOLD,
    brownoutRisk: battery !== undefined && systemVoltage < BROWNOUT_VOLTAGE_THRESHOLD,
    wireCurrents,
  };
}
