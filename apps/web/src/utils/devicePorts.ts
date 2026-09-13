import portsData from '../../../../component-images/ports.json';

/**
 * Places each registry port at the physical terminal it corresponds to on the
 * component diagram, so wires attach to real solder points instead of to an
 * abstract grid of buttons.
 *
 * Terminal pixel coordinates come from component-images/ports.json, which is
 * generated alongside the PNGs -- regenerate both with
 * `python3 component-images/buildall.py`.
 */

interface ImagePort {
  side: string;
  x: number;
  y: number;
}

interface ImagePart {
  width: number;
  height: number;
  ports: Record<string, ImagePort>;
}

const PARTS = (portsData as unknown as { parts: Record<string, ImagePart> }).parts;

/** Image folder + on-canvas width (px), roughly proportional to real hardware size. */
const DISPLAY: Record<string, { folder: string; width: number }> = {
  Battery: { folder: 'battery', width: 150 },
  MainBreaker: { folder: 'breaker120', width: 80 },
  PDP: { folder: 'pdp', width: 170 },
  PDH: { folder: 'pdh', width: 130 },
  VRM: { folder: 'vrm', width: 95 },
  RoboRIO: { folder: 'roborio', width: 185 },
  SystemCore: { folder: 'systemcore', width: 160 },
  SparkMax: { folder: 'sparkmax', width: 62 },
  SparkFlex: { folder: 'sparkflex', width: 66 },
  TalonFX: { folder: 'talonfx', width: 80 },
  CANcoder: { folder: 'cancoder', width: 52 },
  Pigeon2: { folder: 'pigeon2', width: 48 },
  Limelight: { folder: 'limelight', width: 72 },
  PhotonVision: { folder: 'photonvision', width: 56 },
  OrangePi: { folder: 'orangepi', width: 105 },
  Radio: { folder: 'radio', width: 115 },
  EthernetSwitch: { folder: 'ethswitch', width: 110 },
};

/**
 * An app port maps either to a named terminal on the diagram, or -- when the
 * app models something the hardware has no dedicated terminal for -- to an
 * explicit normalized position (0..1 of the image box).
 */
type Alias = string | { nx: number; ny: number };

function channelAliases(count: number): Record<string, Alias> {
  const out: Record<string, Alias> = {};
  for (let i = 0; i < count; i++) out[`channel_${i}`] = `CH${i}+`;
  return out;
}

function vrmRailAliases(): Record<string, Alias> {
  const out: Record<string, Alias> = {};
  for (const rail of ['12V_2A', '12V_500mA', '5V_2A', '5V_500mA']) {
    for (let i = 0; i < 2; i++) {
      const appRail = rail.toLowerCase();
      out[`${appRail}_${i}`] = `${rail}_${i + 1}+`;
      out[`ground_${appRail}_${i}`] = `${rail}_${i + 1}-`;
    }
  }
  return out;
}

const ALIASES: Record<string, Record<string, Alias>> = {
  Battery: { main_power: 'BATT+', ground: 'BATT-' },
  MainBreaker: {
    power_in: 'STUD_BATT',
    power_out: 'STUD_LOAD',
    // The breaker only switches the positive leg; it has no ground studs, so
    // these sit on the body next to their matching power terminal.
    ground_in: { nx: 0.28, ny: 0.24 },
    ground_out: { nx: 0.72, ny: 0.78 },
  },
  PDP: {
    main_power_in: 'BATT+',
    ground_in: 'BATT-',
    ...channelAliases(16),
    ground_bus: 'CH0-',
    can_bus: 'CAN_H_IN',
  },
  PDH: {
    main_power_in: 'BATT+',
    ground_in: 'BATT-',
    ...channelAliases(24),
    ground_bus: 'CH0-',
    vrm_out: 'CH22+',
    can_bus: 'CAN_H_IN',
    usb_c: 'USB-C',
  },
  VRM: { power_in: 'VIN+', ground: 'VIN-', ...vrmRailAliases() },
  RoboRIO: {
    power_in: 'V+',
    ground: 'V-',
    can_bus: 'CAN_H',
    eth_0: 'ETH',
    usb_b: 'USB_DEVICE',
    pwm_0: 'PWM0',
    dio_0: 'DIO0',
    i2c: 'I2C_SDA',
    spi: { nx: 0.85, ny: 0.11 },
  },
  SystemCore: { power_in: 'PWR+', ground: 'PWR-', can_bus: 'CAN_H', eth_0: 'ETH1' },
  SparkMax: {
    power_in: 'V+',
    ground: 'V-',
    motor_a: 'PHASE_A',
    motor_b: 'PHASE_B',
    motor_c: 'PHASE_C',
    can_bus: 'DATA',
    usb_c: { nx: 0.34, ny: 0.09 },
  },
  SparkFlex: {
    power_in: 'V+',
    ground: 'V-',
    motor_a: 'PHASE_A',
    motor_b: 'PHASE_B',
    motor_c: 'PHASE_C',
    can_bus: 'DATA',
    usb_c: { nx: 0.34, ny: 0.09 },
  },
  TalonFX: {
    power_in: 'PWR+',
    ground: 'PWR-',
    can_bus: 'CAN_H',
    // Phases are internal to the integrated motor -- no exposed terminals.
    motor_a: { nx: 0.38, ny: 0.46 },
    motor_b: { nx: 0.5, ny: 0.46 },
    motor_c: { nx: 0.62, ny: 0.46 },
  },
  CANcoder: { power_in: 'PWR+', ground: 'PWR-', can_bus: 'CAN_H' },
  Pigeon2: { power_in: 'PWR+', ground: 'PWR-', can_bus: 'CAN_H' },
  Limelight: { power_in: 'PWR+', ground: 'PWR-', eth_0: 'ETH' },
  PhotonVision: {
    // A USB camera is bus-powered -- power and data share the one connector.
    eth_0: 'USB',
    power_in: { nx: 0.4, ny: 0.82 },
    ground: { nx: 0.6, ny: 0.82 },
  },
  OrangePi: {
    power_in: 'USB_C_PWR',
    ground: { nx: 0.11, ny: 0.33 },
    eth_0: 'ETH',
    usb_a: 'USB3_1',
  },
  Radio: { power_in: 'PWR+', ground: 'PWR-', eth_poe: 'ETH1', eth_aux: 'ETH2' },
  EthernetSwitch: {
    power_in: 'PWR+',
    ground: 'PWR-',
    eth_0: 'ETH1',
    eth_1: 'ETH2',
    eth_2: 'ETH3',
    eth_3: 'ETH4',
    eth_4: 'ETH5',
  },
};

export interface DeviceLayout {
  width: number;
  height: number;
  /** Port offsets in display px, relative to the device's top-left corner. */
  ports: Map<string, { x: number; y: number }>;
}

const cache = new Map<string, DeviceLayout | null>();

/** Resolved image box + terminal positions for a device type, or undefined if it has no diagram. */
export function deviceLayout(type: string): DeviceLayout | undefined {
  const cached = cache.get(type);
  if (cached !== undefined) return cached ?? undefined;

  const display = DISPLAY[type];
  const part = display ? PARTS[display.folder] : undefined;
  if (!display || !part) {
    cache.set(type, null);
    return undefined;
  }

  const scale = display.width / part.width;
  const layout: DeviceLayout = {
    width: display.width,
    height: Math.round(part.height * scale),
    ports: new Map(),
  };

  const aliases = ALIASES[type] ?? {};
  for (const [portId, alias] of Object.entries(aliases)) {
    if (typeof alias === 'string') {
      const terminal = part.ports[alias];
      if (terminal) {
        layout.ports.set(portId, { x: terminal.x * scale, y: terminal.y * scale });
      }
    } else {
      layout.ports.set(portId, { x: alias.nx * layout.width, y: alias.ny * layout.height });
    }
  }

  cache.set(type, layout);
  return layout;
}

/**
 * Where a port sits on a device, in display px from its top-left corner.
 * Ports with no mapping fall back to a spread along the bottom edge so they
 * stay visible and connectable.
 */
export function portOffset(
  type: string,
  portId: string,
  fallbackIndex: number,
  fallbackCount: number,
): { x: number; y: number } | undefined {
  const layout = deviceLayout(type);
  if (!layout) return undefined;
  const mapped = layout.ports.get(portId);
  if (mapped) return mapped;

  const span = layout.width / (fallbackCount + 1);
  return { x: span * (fallbackIndex + 1), y: layout.height - 4 };
}
