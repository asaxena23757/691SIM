import { describe, expect, it } from 'vitest';
import {
  DeviceCategory,
  PortDirection,
  PortType,
  PROJECT_SCHEMA_VERSION,
  Severity,
  type Diagnostic,
  type DeviceDefinition,
  type DeviceInstance,
  type RobotModel,
} from './types.js';
import { MotorControllerModule } from './hardwareModules.js';

describe('shared enums', () => {
  it('PortType has the expected members', () => {
    expect(Object.values(PortType)).toContain('POWER');
    expect(Object.values(PortType)).toContain('GROUND');
    expect(Object.values(PortType)).toContain('CAN');
  });

  it('DeviceCategory has the expected members', () => {
    const names = Object.values(DeviceCategory).filter((v) => typeof v === 'string');
    expect(names).toEqual([
      'POWER',
      'CONTROLLER',
      'MOTOR_CONTROLLER',
      'SENSOR',
      'VISION',
      'NETWORK',
    ]);
  });

  it('Severity has the expected members', () => {
    const names = Object.values(Severity).filter((v) => typeof v === 'string');
    expect(names).toEqual(['INFO', 'WARNING', 'ERROR']);
  });
});

describe('MotorControllerModule', () => {
  it('requires at least one power connection', () => {
    const motor = new MotorControllerModule('motor-1');
    expect(motor.requirements).toEqual([{ portType: PortType.POWER, minConnections: 1 }]);
  });

  it('exposes a CAN input port', () => {
    const motor = new MotorControllerModule('motor-1');
    const canPort = motor.ports?.find((p: { id: string }) => p.id === 'can_in');
    expect(canPort?.direction).toBe(PortDirection.BIDIRECTIONAL);
  });
});

describe('core data model shapes', () => {
  it('builds a DeviceDefinition with ports and requirements', () => {
    const sparkMax: DeviceDefinition = {
      type: 'SparkMax',
      displayName: 'Spark MAX',
      category: DeviceCategory.MOTOR_CONTROLLER,
      ports: [{ id: 'pwr_in', type: PortType.POWER, direction: PortDirection.INPUT }],
      requirements: [{ portType: PortType.POWER, minConnections: 1 }],
    };

    expect(sparkMax.category).toBe(DeviceCategory.MOTOR_CONTROLLER);
    expect(sparkMax.ports).toHaveLength(1);
  });

  it('builds a DeviceInstance referencing a definition by type', () => {
    const instance: DeviceInstance = {
      id: 'spark-1',
      type: 'SparkMax',
      position: { x: 10, y: 20 },
    };

    expect(instance.type).toBe('SparkMax');
    expect(instance.position).toEqual({ x: 10, y: 20 });
  });

  it('builds a Diagnostic referencing affected devices', () => {
    const diagnostic: Diagnostic = {
      id: 'diag-1',
      severity: Severity.ERROR,
      message: 'No power connection found for spark-1',
      deviceIds: ['spark-1'],
    };

    expect(diagnostic.severity).toBe(Severity.ERROR);
  });

  it('assembles a RobotModel from devices and connections', () => {
    const model: RobotModel = {
      schemaVersion: PROJECT_SCHEMA_VERSION,
      id: 'robot-1',
      name: 'Test Bot',
      devices: [{ id: 'spark-1', type: 'SparkMax' }],
      connections: [
        {
          id: 'conn-1',
          sourceDevice: 'pdh-1',
          sourcePort: 'ch_0',
          targetDevice: 'spark-1',
          targetPort: 'pwr_in',
        },
      ],
    };

    expect(model.devices).toHaveLength(1);
    expect(model.connections).toHaveLength(1);
    expect(model.schemaVersion).toBe(1);
  });
});
