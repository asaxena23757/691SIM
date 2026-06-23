import {
  DeviceCategory,
  PortDirection,
  PortType,
  type DeviceDefinition,
  type Port,
} from "@691sim/core";

export interface DeviceRegistryPlugin {
  name: string;
  devices?: DeviceDefinition[];
  register?: (registry: DeviceRegistry) => void;
}

export interface RegisterOptions {
  overwrite?: boolean;
}

function port(
  id: string,
  type: PortType,
  direction: PortDirection,
  required = false,
  maxConnections = 1,
): Port {
  return { id, type, direction, required, maxConnections };
}

function powerOutput(id: string, maxConnections = 1): Port {
  return port(id, PortType.POWER, PortDirection.OUTPUT, false, maxConnections);
}

function canPort(id = "can_bus", maxConnections = 2, required = false): Port {
  return port(
    id,
    PortType.CAN,
    PortDirection.BIDIRECTIONAL,
    required,
    maxConnections,
  );
}

function ethernetPort(
  id = "eth_0",
  required = false,
  maxConnections = 1,
): Port {
  return port(
    id,
    PortType.ETHERNET,
    PortDirection.BIDIRECTIONAL,
    required,
    maxConnections,
  );
}

export const builtInDeviceDefinitions: DeviceDefinition[] = [
  {
    type: "Battery",
    displayName: "Battery",
    category: DeviceCategory.POWER,
    ports: [powerOutput("main_power", 1)],
    metadata: { nominalVoltage: 12, role: "primary-power-source" },
  },
  {
    type: "PDP",
    displayName: "Power Distribution Panel",
    category: DeviceCategory.POWER,
    ports: [
      port("main_power_in", PortType.POWER, PortDirection.INPUT, true, 1),
      powerOutput("channel_0"),
      powerOutput("channel_1"),
      powerOutput("channel_2"),
      powerOutput("channel_3"),
      powerOutput("vrm_power"),
      canPort("can_bus"),
    ],
    requirements: [{ portType: PortType.POWER, minConnections: 1 }],
    metadata: { manufacturer: "CTR Electronics", shortName: "PDP" },
  },
  {
    type: "PDH",
    displayName: "Power Distribution Hub",
    category: DeviceCategory.POWER,
    ports: [
      port("main_power_in", PortType.POWER, PortDirection.INPUT, true, 1),
      powerOutput("channel_0"),
      powerOutput("channel_1"),
      powerOutput("channel_2"),
      powerOutput("channel_3"),
      powerOutput("vrm_power"),
      canPort("can_bus"),
    ],
    requirements: [{ portType: PortType.POWER, minConnections: 1 }],
    metadata: { manufacturer: "REV Robotics", shortName: "PDH" },
  },
  {
    type: "VRM",
    displayName: "Voltage Regulator Module",
    category: DeviceCategory.POWER,
    ports: [
      port("power_in", PortType.POWER, PortDirection.INPUT, true, 1),
      powerOutput("12v_2a", 2),
      powerOutput("12v_500ma", 2),
      powerOutput("5v_2a", 2),
      powerOutput("5v_500ma", 2),
    ],
    requirements: [{ portType: PortType.POWER, minConnections: 1 }],
    metadata: { manufacturer: "CTR Electronics" },
  },
  {
    type: "RoboRIO",
    displayName: "RoboRIO",
    category: DeviceCategory.CONTROLLER,
    ports: [
      port("power_in", PortType.POWER, PortDirection.INPUT, true, 1),
      canPort("can_bus", 16, true),
      ethernetPort("eth_0", true),
      port("usb_b", PortType.USBA, PortDirection.BIDIRECTIONAL, false, 1),
      port("pwm_0", PortType.PWM, PortDirection.OUTPUT, false, 1),
      port("dio_0", PortType.DIO, PortDirection.BIDIRECTIONAL, false, 1),
      port("i2c", PortType.I2C, PortDirection.BIDIRECTIONAL, false, 4),
      port("spi", PortType.SPI, PortDirection.BIDIRECTIONAL, false, 4),
    ],
    requirements: [{ portType: PortType.POWER, minConnections: 1 }],
    metadata: { manufacturer: "NI", role: "main-controller" },
  },
  {
    type: "SystemCore",
    displayName: "SystemCore",
    category: DeviceCategory.CONTROLLER,
    ports: [
      port("power_in", PortType.POWER, PortDirection.INPUT, true, 1),
      canPort("can_bus", 16, true),
      ethernetPort("eth_0"),
    ],
    requirements: [{ portType: PortType.POWER, minConnections: 1 }],
    metadata: { manufacturer: "REV Robotics" },
  },
  {
    type: "SparkMax",
    displayName: "Spark MAX",
    category: DeviceCategory.MOTOR_CONTROLLER,
    ports: [
      port("power_in", PortType.POWER, PortDirection.INPUT, true, 1),
      powerOutput("motor_out", 1),
      canPort("can_bus", 2),
      port("usb_c", PortType.USBC, PortDirection.BIDIRECTIONAL, false, 1),
    ],
    requirements: [{ portType: PortType.POWER, minConnections: 1 }],
    metadata: { manufacturer: "REV Robotics" },
  },
  {
    type: "SparkFlex",
    displayName: "Spark Flex",
    category: DeviceCategory.MOTOR_CONTROLLER,
    ports: [
      port("power_in", PortType.POWER, PortDirection.INPUT, true, 1),
      powerOutput("motor_out", 1),
      canPort("can_bus", 2),
      port("usb_c", PortType.USBC, PortDirection.BIDIRECTIONAL, false, 1),
    ],
    requirements: [{ portType: PortType.POWER, minConnections: 1 }],
    metadata: { manufacturer: "REV Robotics" },
  },
  {
    type: "TalonFX",
    displayName: "Talon FX",
    category: DeviceCategory.MOTOR_CONTROLLER,
    ports: [
      port("power_in", PortType.POWER, PortDirection.INPUT, true, 1),
      powerOutput("motor_out", 1),
      canPort("can_bus", 2),
    ],
    requirements: [{ portType: PortType.POWER, minConnections: 1 }],
    metadata: { manufacturer: "CTR Electronics" },
  },
  {
    type: "CANcoder",
    displayName: "CANcoder",
    category: DeviceCategory.SENSOR,
    ports: [canPort("can_bus", 2, true)],
    requirements: [{ portType: PortType.CAN, minConnections: 1 }],
    metadata: { manufacturer: "CTR Electronics" },
  },
  {
    type: "Pigeon2",
    displayName: "Pigeon 2",
    category: DeviceCategory.SENSOR,
    ports: [canPort("can_bus", 2, true)],
    requirements: [{ portType: PortType.CAN, minConnections: 1 }],
    metadata: { manufacturer: "CTR Electronics" },
  },
  {
    type: "Limelight",
    displayName: "Limelight",
    category: DeviceCategory.VISION,
    ports: [
      port("power_in", PortType.POWER, PortDirection.INPUT, true, 1),
      ethernetPort("eth_0", true),
    ],
    requirements: [
      { portType: PortType.POWER, minConnections: 1 },
      { portType: PortType.ETHERNET, minConnections: 1 },
    ],
    metadata: { role: "vision-camera" },
  },
  {
    type: "PhotonVision",
    displayName: "PhotonVision",
    category: DeviceCategory.VISION,
    ports: [
      port("power_in", PortType.POWER, PortDirection.INPUT, true, 1),
      ethernetPort("eth_0", true),
    ],
    requirements: [
      { portType: PortType.POWER, minConnections: 1 },
      { portType: PortType.ETHERNET, minConnections: 1 },
    ],
    metadata: { role: "vision-software" },
  },
  {
    type: "OrangePi",
    displayName: "Orange Pi",
    category: DeviceCategory.VISION,
    ports: [
      port("power_in", PortType.POWER, PortDirection.INPUT, true, 1),
      ethernetPort("eth_0", true),
      port("usb_a", PortType.USBA, PortDirection.BIDIRECTIONAL, false, 4),
    ],
    requirements: [
      { portType: PortType.POWER, minConnections: 1 },
      { portType: PortType.ETHERNET, minConnections: 1 },
    ],
    metadata: { role: "coprocessor" },
  },
  {
    type: "Radio",
    displayName: "Radio",
    category: DeviceCategory.NETWORK,
    ports: [
      port("power_in", PortType.POWER, PortDirection.INPUT, true, 1),
      ethernetPort("rio_eth", true),
      ethernetPort("aux_eth"),
    ],
    requirements: [
      { portType: PortType.POWER, minConnections: 1 },
      { portType: PortType.ETHERNET, minConnections: 1 },
    ],
    metadata: { role: "field-network-bridge" },
  },
  {
    type: "EthernetSwitch",
    displayName: "Ethernet Switch",
    category: DeviceCategory.NETWORK,
    ports: [
      port("power_in", PortType.POWER, PortDirection.INPUT, true, 1),
      ethernetPort("eth_0"),
      ethernetPort("eth_1"),
      ethernetPort("eth_2"),
      ethernetPort("eth_3"),
      ethernetPort("eth_4"),
    ],
    requirements: [{ portType: PortType.POWER, minConnections: 1 }],
    metadata: { role: "network-switch" },
  },
];

export class DeviceRegistry {
  private readonly definitions = new Map<string, DeviceDefinition>();

  constructor(definitions: DeviceDefinition[] = []) {
    this.registerMany(definitions);
  }

  register(
    definition: DeviceDefinition,
    options: RegisterOptions = {},
  ): DeviceDefinition {
    if (!options.overwrite && this.definitions.has(definition.type)) {
      throw new Error(
        `Device definition already registered: ${definition.type}`,
      );
    }

    this.definitions.set(definition.type, definition);
    return definition;
  }

  registerMany(
    definitions: DeviceDefinition[],
    options: RegisterOptions = {},
  ): DeviceDefinition[] {
    return definitions.map((definition) => this.register(definition, options));
  }

  loadPlugin(plugin: DeviceRegistryPlugin): void {
    this.registerMany(plugin.devices ?? []);
    plugin.register?.(this);
  }

  get(type: string): DeviceDefinition | undefined {
    return this.definitions.get(type);
  }

  require(type: string): DeviceDefinition {
    const definition = this.get(type);
    if (!definition) {
      throw new Error(`Unknown device definition: ${type}`);
    }
    return definition;
  }

  has(type: string): boolean {
    return this.definitions.has(type);
  }

  list(): DeviceDefinition[] {
    return [...this.definitions.values()];
  }

  listByCategory(category: DeviceCategory): DeviceDefinition[] {
    return this.list().filter((definition) => definition.category === category);
  }

  clear(): void {
    this.definitions.clear();
  }
}

export function createDefaultDeviceRegistry(): DeviceRegistry {
  return new DeviceRegistry(builtInDeviceDefinitions);
}

export const defaultDeviceRegistry = createDefaultDeviceRegistry();
