import {
  DeviceCategory,
  PortType,
  Severity,
  type Diagnostic,
  type RobotModel,
} from "@691sim/core";
import { createDefaultDeviceRegistry, type DeviceRegistry } from "@691sim/registry";
import { buildGraph, type RobotGraph } from "@691sim/verifier";

export const ESTIMATOR_PACKAGE_NAME = "@691sim/estimator";

export type BrownoutRisk = "low" | "medium" | "high";

export interface EstimationResult {
  peakCurrentAmps: number;
  nominalCurrentAmps: number;
  estimatedVoltageUnderLoad: number;
  brownoutRisk: BrownoutRisk;
  canUtilizationPercent: number;
  canDeviceCount: number;
  totalWeightLbs: number;
  diagnostics: Diagnostic[];
}

export interface EstimateOptions {
  registry?: DeviceRegistry;
  graph?: RobotGraph;
}

const BATTERY_NOMINAL_VOLTAGE = 12;
const BATTERY_INTERNAL_RESISTANCE_OHM = 0.009;
const CAN_BITRATE_BPS = 1_000_000;
const AVG_CAN_FRAME_BITS = 110;
const CAN_FRAMES_PER_DEVICE_PER_SEC = 50;

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function deviceCurrent(definition: { metadata?: Record<string, unknown> }): {
  nominal: number;
  peak: number;
} {
  const meta = definition.metadata ?? {};
  return {
    nominal: num(meta.nominalCurrentAmps, 0),
    peak: num(meta.peakCurrentAmps, num(meta.nominalCurrentAmps, 0)),
  };
}

function deviceWeight(definition: { metadata?: Record<string, unknown> }): number {
  return num(definition.metadata?.weightLbs, 0);
}

function brownoutRiskForVoltage(voltage: number): BrownoutRisk {
  if (voltage >= 11.5) return "low";
  if (voltage >= 10.5) return "medium";
  return "high";
}

function estimationDiagnostic(
  id: string,
  severity: Severity,
  message: string,
  code: string,
  deviceIds?: string[],
): Diagnostic {
  return { id, severity, message, code, deviceIds };
}

export function estimateRobotModel(
  model: RobotModel,
  options: EstimateOptions = {},
): EstimationResult {
  const registry = options.registry ?? createDefaultDeviceRegistry();
  const graph = options.graph ?? buildGraph(model, { registry });
  const diagnostics: Diagnostic[] = [];

  let nominalCurrentAmps = 0;
  let peakCurrentAmps = 0;
  let totalWeightLbs = 0;
  let canDeviceCount = 0;

  for (const node of graph.devices) {
    const { nominal, peak } = deviceCurrent(node.definition);
    totalWeightLbs += deviceWeight(node.definition);

    if (node.definition.category === DeviceCategory.POWER) {
      continue;
    }

    if (!graph.powerReachable(node.id) && nominal > 0) {
      diagnostics.push(
        estimationDiagnostic(
          `est-unpowered-${node.id}`,
          Severity.WARNING,
          `${node.id} draws current but is not on a verified power path.`,
          "UNPOWERED_LOAD",
          [node.id],
        ),
      );
      continue;
    }

    nominalCurrentAmps += nominal;
    peakCurrentAmps += peak;

    if (node.definition.ports.some((p) => p.type === PortType.CAN)) {
      canDeviceCount += 1;
    }
  }

  const estimatedVoltageUnderLoad =
    BATTERY_NOMINAL_VOLTAGE - peakCurrentAmps * BATTERY_INTERNAL_RESISTANCE_OHM;
  const brownoutRisk = brownoutRiskForVoltage(estimatedVoltageUnderLoad);

  if (brownoutRisk === "high") {
    diagnostics.push(
      estimationDiagnostic(
        "est-brownout-high",
        Severity.ERROR,
        `Peak load ${peakCurrentAmps.toFixed(1)}A may sag battery to ${estimatedVoltageUnderLoad.toFixed(2)}V (brownout risk).`,
        "BROWNOUT_RISK_HIGH",
      ),
    );
  } else if (brownoutRisk === "medium") {
    diagnostics.push(
      estimationDiagnostic(
        "est-brownout-medium",
        Severity.WARNING,
        `Estimated voltage under peak load is ${estimatedVoltageUnderLoad.toFixed(2)}V.`,
        "BROWNOUT_RISK_MEDIUM",
      ),
    );
  }

  const canBitsPerSecond = canDeviceCount * CAN_FRAMES_PER_DEVICE_PER_SEC * AVG_CAN_FRAME_BITS;
  const canUtilizationPercent = Math.min(
    100,
    (canBitsPerSecond / CAN_BITRATE_BPS) * 100,
  );

  if (canUtilizationPercent > 80) {
    diagnostics.push(
      estimationDiagnostic(
        "est-can-high",
        Severity.WARNING,
        `CAN bus utilization estimated at ${canUtilizationPercent.toFixed(1)}%.`,
        "CAN_UTILIZATION_HIGH",
      ),
    );
  }

  if (peakCurrentAmps > 120) {
    diagnostics.push(
      estimationDiagnostic(
        "est-overcurrent",
        Severity.ERROR,
        `Peak current ${peakCurrentAmps.toFixed(1)}A exceeds typical 120A main breaker.`,
        "MAIN_BREAKER_EXCEEDED",
      ),
    );
  }

  return {
    peakCurrentAmps,
    nominalCurrentAmps,
    estimatedVoltageUnderLoad,
    brownoutRisk,
    canUtilizationPercent,
    canDeviceCount,
    totalWeightLbs,
    diagnostics,
  };
}
