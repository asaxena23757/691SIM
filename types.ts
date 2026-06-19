export enum PortType {
    POWER,
    CAN,
    ETHERNET,
    PWM,
    DIO,
    I2C,
    SPI,
    USBA,
    USBC
}

export enum PortDirection {
    INPUT,
    OUTPUT,
    BIDIRECTIONAL
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
    x: number,
    y: number
}

export class HardwareModel {
    id?: string;
    type?: string;
    position?: Vector;
    ports?: Port[];
    requirements?: Requirement[];
    metadata?: Record<string, unknown>;
}