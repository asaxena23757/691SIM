import {
  PROJECT_SCHEMA_VERSION,
  PortType,
  Severity,
  DeviceCategory,
  type RobotModel,
} from '@691sim/core';

export const PORT_TYPE_NAMES: Record<PortType, string> = {
  [PortType.POWER]: 'POWER',
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
      return '#f59e0b';
    case PortType.CAN:
      return '#22c55e';
    case PortType.ETHERNET:
      return '#3b82f6';
    case PortType.PWM:
      return '#a855f7';
    case PortType.DIO:
      return '#ec4899';
    default:
      return '#94a3b8';
  }
}

export function categoryColor(category: DeviceCategory): string {
  switch (category) {
    case DeviceCategory.POWER:
      return '#f59e0b';
    case DeviceCategory.CONTROLLER:
      return '#6366f1';
    case DeviceCategory.MOTOR_CONTROLLER:
      return '#ef4444';
    case DeviceCategory.SENSOR:
      return '#22c55e';
    case DeviceCategory.VISION:
      return '#06b6d4';
    case DeviceCategory.NETWORK:
      return '#3b82f6';
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

export function createHealthyModel(): RobotModel {
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    id: 'robot-1',
    name: 'Healthy Robot',
    devices: [
      { id: 'battery-1', type: 'Battery', position: { x: 40, y: 200 } },
      {
        id: 'pdh-1',
        type: 'PDH',
        metadata: { canId: 1 },
        position: { x: 220, y: 200 },
      },
      {
        id: 'rio-1',
        type: 'RoboRIO',
        metadata: { ipAddress: '10.6.91.2' },
        position: { x: 420, y: 80 },
      },
      {
        id: 'radio-1',
        type: 'Radio',
        metadata: { ipAddress: '10.6.91.1' },
        position: { x: 420, y: 320 },
      },
      {
        id: 'spark-1',
        type: 'SparkMax',
        label: 'Drive Left',
        metadata: { canId: 2 },
        position: { x: 620, y: 80 },
      },
      {
        id: 'coder-1',
        type: 'CANcoder',
        metadata: { canId: 3 },
        position: { x: 820, y: 80 },
      },
      {
        id: 'limelight-1',
        type: 'Limelight',
        metadata: { ipAddress: '10.6.91.11' },
        position: { x: 620, y: 320 },
      },
    ],
    connections: [
      {
        id: 'battery-pdh',
        sourceDevice: 'battery-1',
        sourcePort: 'main_power',
        targetDevice: 'pdh-1',
        targetPort: 'main_power_in',
      },
      {
        id: 'pdh-rio-power',
        sourceDevice: 'pdh-1',
        sourcePort: 'channel_0',
        targetDevice: 'rio-1',
        targetPort: 'power_in',
      },
      {
        id: 'pdh-spark-power',
        sourceDevice: 'pdh-1',
        sourcePort: 'channel_1',
        targetDevice: 'spark-1',
        targetPort: 'power_in',
      },
      {
        id: 'pdh-limelight-power',
        sourceDevice: 'pdh-1',
        sourcePort: 'channel_2',
        targetDevice: 'limelight-1',
        targetPort: 'power_in',
      },
      {
        id: 'rio-pdh-can',
        sourceDevice: 'rio-1',
        sourcePort: 'can_bus',
        targetDevice: 'pdh-1',
        targetPort: 'can_bus',
      },
      {
        id: 'pdh-spark-can',
        sourceDevice: 'pdh-1',
        sourcePort: 'can_bus',
        targetDevice: 'spark-1',
        targetPort: 'can_bus',
      },
      {
        id: 'spark-coder-can',
        sourceDevice: 'spark-1',
        sourcePort: 'can_bus',
        targetDevice: 'coder-1',
        targetPort: 'can_bus',
      },
      {
        id: 'radio-rio-eth',
        sourceDevice: 'radio-1',
        sourcePort: 'rio_eth',
        targetDevice: 'rio-1',
        targetPort: 'eth_0',
      },
      {
        id: 'radio-limelight-eth',
        sourceDevice: 'radio-1',
        sourcePort: 'aux_eth',
        targetDevice: 'limelight-1',
        targetPort: 'eth_0',
      },
    ],
  };
}

export function nextDeviceId(type: string, devices: RobotModel['devices']): string {
  const base = type.toLowerCase().replace(/\s+/g, '-');
  let n = 1;
  while (devices.some((d) => d.id === `${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export function nextConnectionId(connections: RobotModel['connections']): string {
  let n = 1;
  while (connections.some((c) => c.id === `conn-${n}`)) n++;
  return `conn-${n}`;
}
