
import { 
    HardwareModel, 
    Port, 
    PortType, 
    PortDirection, 
    Requirement, 
    Vector 
} from './types';

/**
 * Base implementation of a standard Hardware Module extending HardwareModel
 */
export class GenericHardwareModule extends HardwareModel {
    constructor(
        id: string, 
        type: string, 
        position: Vector = { x: 0, y: 0 }, 
        ports: Port[] = [], 
        requirements: Requirement[] = [],
        metadata: Record<string, unknown> = {}
    ) {
        super();
        this.id = id;
        this.type = type;
        this.position = position;
        this.ports = ports;
        this.requirements = requirements;
        this.metadata = metadata;
    }
}

/**
 * Example Module: A standard Microcontroller (e.g., RoboRIO / Arduino)
 */
export class MicrocontrollerModule extends GenericHardwareModule {
    constructor(id: string, position: Vector = { x: 0, y: 0 }) {
        const defaultPorts: Port[] = [
            { id: 'pwr_in', type: PortType.POWER, direction: PortDirection.INPUT, required: true, maxConnections: 1 },
            { id: 'can_bus', type: PortType.CAN, direction: PortDirection.BIDIRECTIONAL, maxConnections: 16 },
            { id: 'dio_0', type: PortType.DIO, direction: PortDirection.BIDIRECTIONAL, maxConnections: 1 },
            { id: 'pwm_0', type: PortType.PWM, direction: PortDirection.OUTPUT, maxConnections: 1 },
            { id: 'eth_0', type: PortType.ETHERNET, direction: PortDirection.BIDIRECTIONAL, maxConnections: 1 }
        ];

        super(id, 'Microcontroller', position, defaultPorts, [], { manufacturer: 'Generic' });
    }
}

/**
 * Example Module: A Motor Controller (e.g., Spark Max / Talon FX)
 */
export class MotorControllerModule extends GenericHardwareModule {
    constructor(id: string, position: Vector = { x: 0, y: 0 }) {
        const defaultPorts: Port[] = [
            { id: 'pwr_in', type: PortType.POWER, direction: PortDirection.INPUT, required: true, maxConnections: 1 },
            { id: 'can_in', type: PortType.CAN, direction: PortDirection.BIDIRECTIONAL, maxConnections: 1 },
            { id: 'pwm_in', type: PortType.PWM, direction: PortDirection.INPUT, maxConnections: 1 }
        ];

        // Requires at least one power source connection to function
        const requirements: Requirement[] = [
            { portType: PortType.POWER, minConnections: 1 }
        ];

        super(id, 'MotorController', position, defaultPorts, requirements);
    }
}

/**
 * Example Module: A CAN-based Sensor (e.g., CANCoder / Gyro)
 */
export class CANSensorModule extends GenericHardwareModule {
    constructor(id: string, position: Vector = { x: 0, y: 0 }) {
        const defaultPorts: Port[] = [
            { id: 'can_io', type: PortType.CAN, direction: PortDirection.BIDIRECTIONAL, maxConnections: 2 }
        ];

        const requirements: Requirement[] = [
            { portType: PortType.CAN, minConnections: 1 }
        ];

        super(id, 'Sensor', position, defaultPorts, requirements);
    }
}
