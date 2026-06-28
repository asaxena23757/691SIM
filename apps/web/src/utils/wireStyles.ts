import { PortType } from '@691sim/core';

export interface WireVisual {
  kind: 'single' | 'pair';
  colors: string[];
  label: string;
  width: number;
}

export function wireVisualForPortType(type: PortType): WireVisual {
  switch (type) {
    case PortType.POWER:
      return {
        kind: 'pair',
        colors: ['#ef4444', '#111827'],
        label: '12V (+ red / − black)',
        width: 3,
      };
    case PortType.GROUND:
      return {
        kind: 'single',
        colors: ['#111827'],
        label: 'Ground (black)',
        width: 2.5,
      };
    case PortType.CAN:
      return {
        kind: 'pair',
        colors: ['#22c55e', '#eab308'],
        label: 'CAN (green / yellow)',
        width: 2.5,
      };
    case PortType.ETHERNET:
      return {
        kind: 'single',
        colors: ['#2563eb'],
        label: 'Ethernet (blue)',
        width: 2.5,
      };
    case PortType.PWM:
      return {
        kind: 'single',
        colors: ['#f8fafc'],
        label: 'PWM (white)',
        width: 2,
      };
    case PortType.DIO:
      return {
        kind: 'single',
        colors: ['#f472b6'],
        label: 'DIO',
        width: 2,
      };
    case PortType.USBA:
    case PortType.USBC:
      return {
        kind: 'single',
        colors: ['#94a3b8'],
        label: 'USB',
        width: 2,
      };
    default:
      return {
        kind: 'single',
        colors: ['#64748b'],
        label: 'Signal',
        width: 2,
      };
  }
}

export function resolveConnectionPortType(
  registry: { get(type: string): { ports: { id: string; type: PortType }[] } | undefined },
  deviceId: string,
  deviceType: string,
  portId: string,
): PortType | undefined {
  const definition = registry.get(deviceType);
  return definition?.ports.find((port) => port.id === portId)?.type;
}
