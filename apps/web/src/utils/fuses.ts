import { PortType } from '@691sim/core';

export function getPdhFuseInfo(
  portType: PortType,
  sourceDeviceType: string,
  sourcePort: string,
  targetDeviceType: string,
  targetPort: string,
): { show: boolean; port: string } {
  if (portType !== PortType.POWER) {
    return { show: false, port: '' };
  }
  if (sourceDeviceType === 'PDH' || sourceDeviceType === 'PDP') {
    if (sourcePort.startsWith('channel_') || sourcePort === 'vrm_out') {
      return { show: true, port: sourcePort };
    }
  }
  if (targetDeviceType === 'PDH' || targetDeviceType === 'PDP') {
    if (targetPort.startsWith('channel_') || targetPort === 'vrm_out') {
      return { show: true, port: targetPort };
    }
  }
  return { show: false, port: '' };
}

export function fuseRatingForPort(sourcePort: string): string {
  if (sourcePort === 'vrm_out') return '20A';
  const match = sourcePort.match(/^channel_(\d+)$/);
  if (!match) return '40A';
  const channel = Number(match[1]);
  if (channel >= 20) return '15A';
  return '40A';
}
