/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  PROJECT_SCHEMA_VERSION,
  PortType,
  Severity,
  DeviceCategory,
  createHealthyRobotModel,
  type RobotModel,
} from '@691sim/core';

export const PORT_TYPE_NAMES: Record<PortType, string> = {
  [PortType.POWER]: 'POWER',
  [PortType.GROUND]: 'GROUND',
  [PortType.CAN]: 'CAN',
  [PortType.ETHERNET]: 'ETHERNET',
  [PortType.PWM]: 'PWM',
  [PortType.DIO]: 'DIO',
  [PortType.I2C]: 'I2C',
  [PortType.SPI]: 'SPI',
  [PortType.USBA]: 'USBA',
  [PortType.USBC]: 'USBC',
};

export const CATEGORY_NAMES: Record<DeviceCategory, string> = {
  [DeviceCategory.POWER]: 'Power',
  [DeviceCategory.CONTROLLER]: 'Controller',
  [DeviceCategory.MOTOR_CONTROLLER]: 'Motor Controller',
  [DeviceCategory.SENSOR]: 'Sensor',
  [DeviceCategory.VISION]: 'Vision',
  [DeviceCategory.NETWORK]: 'Network',
};

export const SEVERITY_NAMES: Record<Severity, string> = {
  [Severity.INFO]: 'Info',
  [Severity.WARNING]: 'Warning',
  [Severity.ERROR]: 'Error',
};

export function portTypeColor(type: PortType): string {
  switch (type) {
    case PortType.POWER:
      return '#cc2936';
    case PortType.GROUND:
      return '#08415c';
    case PortType.CAN:
      return '#0d5a3a';
    case PortType.ETHERNET:
      return '#08415c';
    case PortType.PWM:
      return '#6b818c';
    case PortType.DIO:
      return '#b45309';
    default:
      return '#6b818c';
  }
}

export function categoryColor(category: DeviceCategory): string {
  switch (category) {
    case DeviceCategory.POWER:
      return '#f1bf98';
    case DeviceCategory.CONTROLLER:
      return '#08415c';
    case DeviceCategory.MOTOR_CONTROLLER:
      return '#cc2936';
    case DeviceCategory.SENSOR:
      return '#0d5a3a';
    case DeviceCategory.VISION:
      return '#6b818c';
    case DeviceCategory.NETWORK:
      return '#08415c';
    default:
      return '#94a3b8';
  }
}

export function createEmptyModel(name = 'New Robot'): RobotModel {
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    id: `robot-${crypto.randomUUID().slice(0, 8)}`,
    name,
    devices: [],
    connections: [],
  };
}

export { createHealthyRobotModel as createHealthyModel };

export function nextDeviceId(type: string, devices: RobotModel['devices']): string {
  const base = type.toLowerCase().replace(/\s+/g, '-');
  let n = 1;
  while (devices.some((d: any) => d.id === `${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export function nextConnectionId(connections: RobotModel['connections']): string {
  let n = 1;
  while (connections.some((c: any) => c.id === `conn-${n}`)) n++;
  return `conn-${n}`;
}
