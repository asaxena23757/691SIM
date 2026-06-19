import { describe, expect, it } from 'vitest';
import { DeviceCategory, PortDirection, PortType, Severity } from './types.js';
import { MotorControllerModule } from './hardwareModules.js';

describe('shared enums', () => {
  it('PortType has the expected members', () => {
    expect(Object.values(PortType)).toContain('POWER');
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
