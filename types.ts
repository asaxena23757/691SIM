enum PortType {
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

enum PortDirection {
    INPUT,
    OUTPUT,
    BIDIRECTIONAL
}

interface Port {
    id: string;
    type: PortType;
    direction: PortDirection;
    required?: boolean;
    maxConnections?: number;
}

interface Requirement {
    portType: PortType;
    minConnections: number;
}

interface Connection {
    id: string;
    sourceDevice: string;
    sourcePort: string;
    targetDevice: string;
    targetPort: string;
}

interface Vector {
    x: number,
    y: number
}

class HardwareModel {
    id?: string;
    type?: string;
    position?: Vector;
    ports?: Port[];
    requirements?: Requirement[];
    metadata?: Record<string, unknown>;
}