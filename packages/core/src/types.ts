export enum PortType {
  POWER,
  CAN,
  ETHERNET,
  PWM,
  DIO,
  I2C,
  SPI,
  USBA,
  USBC,
}

export enum PortDirection {
  INPUT,
  OUTPUT,
  BIDIRECTIONAL,
}

export enum DeviceCategory {
  POWER,
  CONTROLLER,
  MOTOR_CONTROLLER,
  SENSOR,
  VISION,
  NETWORK,
}

export enum Severity {
  INFO,
  WARNING,
  ERROR,
}

export interface Port {
  id: string;
  type: PortType;
  direction: PortDirection;
  required?: boolean;
  maxConnections?: number;
}

export interface Requirement {
  portType: PortType;
  minConnections: number;
}

export interface Connection {
  id: string;
  sourceDevice: string;
  sourcePort: string;
  targetDevice: string;
  targetPort: string;
}

export interface Vector {
  x: number;
  y: number;
}

/**
 * A reusable template describing a kind of device: what ports it exposes,
 * what it needs to function, and which category it belongs to. Populated
 * by the device registry in Phase 2; this is just the shape.
 */
export interface DeviceDefinition {
  type: string;
  displayName: string;
  category: DeviceCategory;
  ports: Port[];
  requirements?: Requirement[];
  metadata?: Record<string, unknown>;
}

/**
 * A placed device on the robot. References a `DeviceDefinition` by its
 * `type` key — the instance only carries what's specific to this one
 * placement (id, position, user-assigned label, instance-level metadata
 * like a CAN ID).
 */
export interface DeviceInstance {
  id: string;
  type: string;
  label?: string;
  position?: Vector;
  metadata?: Record<string, unknown>;
}

/**
 * A single finding produced by the verification engine (Phase 4) — an
 * error, warning, or info note tied to the device(s) or connection(s)
 * that caused it.
 */
export interface Diagnostic {
  id: string;
  severity: Severity;
  message: string;
  code?: string;
  deviceIds?: string[];
  connectionIds?: string[];
}

/** Bump this whenever the on-disk project JSON shape changes. */
export const PROJECT_SCHEMA_VERSION = 1;

/**
 * The full robot architecture: every placed device and every connection
 * between them. This is the root object serialized to/from project files.
 */
export interface RobotModel {
  schemaVersion: number;
  id: string;
  name: string;
  devices: DeviceInstance[];
  connections: Connection[];
  metadata?: Record<string, unknown>;
}

export class HardwareModel {
  id?: string;
  type?: string;
  position?: Vector;
  ports?: Port[];
  requirements?: Requirement[];
  metadata?: Record<string, unknown>;
}
