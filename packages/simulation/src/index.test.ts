import { createHealthyRobotModel, type RobotModel } from '@691sim/core';
import { describe, expect, it } from 'vitest';
import {
  AWG_TABLE,
  Battery,
  MotorController,
  SimWire,
  createComponent,
  simulateCircuit,
  verifyCanTopology,
  type CanEdge,
} from './index.js';

describe('CircuitComponent model', () => {
  it('builds the correct subclass and tracks current/voltage/CAN attributes', () => {
    const battery = createComponent({ id: 'battery-1', type: 'Battery' });
    expect(battery).toBeInstanceOf(Battery);
    expect(battery.isPowerSource()).toBe(true);
    expect(battery.currentDraw('peak')).toBe(0);

    const spark = createComponent({ id: 'spark-1', type: 'SparkMax', metadata: { canId: 7 } });
    expect(spark).toBeInstanceOf(MotorController);
    expect(spark.canId).toBe(7);
    expect(spark.peakCurrentAmps).toBeGreaterThan(spark.continuousCurrentAmps);
  });

  it('honours instance metadata overrides for current limits', () => {
    const spark = createComponent({
      id: 'spark-1',
      type: 'SparkMax',
      metadata: { continuousCurrentAmps: 12, peakCurrentAmps: 99 },
    });
    expect(spark.continuousCurrentAmps).toBe(12);
    expect(spark.peakCurrentAmps).toBe(99);
  });
});

describe('SimWire (AWG / ampacity)', () => {
  it('computes resistance from gauge and length and flags ampacity', () => {
    const wire = new SimWire('w1', 18, 24); // 18 AWG, 24 inches = 2 ft
    expect(wire.resistanceOhms).toBeCloseTo(AWG_TABLE[18].ohmsPerFoot * 2, 6);
    expect(wire.exceedsAmpacity(30)).toBe(true); // 18 AWG max is 16A
    expect(wire.exceedsAmpacity(10)).toBe(false);
    expect(wire.voltageDrop(10)).toBeCloseTo(10 * wire.resistanceOhms, 6);
  });
});

describe('simulateCircuit voltage/brownout', () => {
  it('keeps a healthy robot above the brownout threshold', () => {
    const result = simulateCircuit(createHealthyRobotModel(), { mode: 'peak' });
    expect(result.voltage.hasBattery).toBe(true);
    expect(result.voltage.systemVoltage).toBeLessThan(result.voltage.batteryVoltage);
    expect(result.voltage.systemVoltage).toBeGreaterThan(6.3);
    expect(result.voltage.brownoutRisk).toBe(false);
  });

  it('detects brownout risk when loads are extreme', () => {
    const model = createHealthyRobotModel();
    // Crank the SparkMax to an unrealistic draw to force a sag below 6.3V.
    const spark = model.devices.find((d) => d.id === 'spark-1')!;
    spark.metadata = { ...spark.metadata, peakCurrentAmps: 900 };

    const result = simulateCircuit(model, { mode: 'peak' });
    expect(result.voltage.brownoutRisk).toBe(true);
    expect(result.diagnostics.some((d) => d.code === 'BROWNOUT_RISK')).toBe(true);
  });

  it('flags an ampacity hazard on an undersized wire', () => {
    const model = createHealthyRobotModel();
    const powerConn = model.connections.find((c) => c.id === 'pdh-spark-power')!;
    powerConn.metadata = { gauge: 18, lengthInches: 24 };

    const result = simulateCircuit(model, { mode: 'peak' });
    expect(result.ampacityViolations.length).toBeGreaterThan(0);
    expect(result.diagnostics.some((d) => d.code === 'WIRE_AMPACITY_EXCEEDED')).toBe(true);
  });
});

describe('verifyCanTopology', () => {
  function components(entries: Array<[string, string]>) {
    const map = new Map();
    for (const [id, type] of entries) map.set(id, createComponent({ id, type }));
    return map;
  }

  it('accepts a linear RIO -> ... -> PDH chain', () => {
    const comps = components([
      ['rio-1', 'RoboRIO'],
      ['spark-1', 'SparkMax'],
      ['pdh-1', 'PDH'],
    ]);
    const edges: CanEdge[] = [
      { connectionId: 'c1', a: 'rio-1', b: 'spark-1' },
      { connectionId: 'c2', a: 'spark-1', b: 'pdh-1' },
    ];
    const result = verifyCanTopology(comps, edges);
    expect(result.isValidChain).toBe(true);
    expect(result.terminationOk).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('detects a branch (device with 3 CAN links)', () => {
    const comps = components([
      ['rio-1', 'RoboRIO'],
      ['spark-1', 'SparkMax'],
      ['spark-2', 'SparkMax'],
      ['pdh-1', 'PDH'],
    ]);
    const edges: CanEdge[] = [
      { connectionId: 'c1', a: 'rio-1', b: 'spark-1' },
      { connectionId: 'c2', a: 'spark-1', b: 'spark-2' },
      { connectionId: 'c3', a: 'spark-1', b: 'pdh-1' },
    ];
    const result = verifyCanTopology(comps, edges);
    expect(result.issues.some((i) => i.code === 'CAN_BRANCH_DETECTED')).toBe(true);
    expect(result.isValidChain).toBe(false);
  });

  it('detects a loop', () => {
    const comps = components([
      ['rio-1', 'RoboRIO'],
      ['spark-1', 'SparkMax'],
      ['pdh-1', 'PDH'],
    ]);
    const edges: CanEdge[] = [
      { connectionId: 'c1', a: 'rio-1', b: 'spark-1' },
      { connectionId: 'c2', a: 'spark-1', b: 'pdh-1' },
      { connectionId: 'c3', a: 'pdh-1', b: 'rio-1' },
    ];
    const result = verifyCanTopology(comps, edges);
    expect(result.issues.some((i) => i.code === 'CAN_LOOP_DETECTED')).toBe(true);
  });

  it('flags missing termination when the chain does not end at RIO + PDH', () => {
    const comps = components([
      ['spark-1', 'SparkMax'],
      ['spark-2', 'SparkMax'],
    ]);
    const edges: CanEdge[] = [{ connectionId: 'c1', a: 'spark-1', b: 'spark-2' }];
    const result = verifyCanTopology(comps, edges);
    expect(result.terminationOk).toBe(false);
    expect(result.issues.some((i) => i.code === 'CAN_MISSING_TERMINATION')).toBe(true);
  });
});
