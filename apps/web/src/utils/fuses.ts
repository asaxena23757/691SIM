import { PortType } from '@691sim/core';
import type { Connection } from '@691sim/core';

export const FUSE_RATING_OPTIONS = [10, 15, 20, 30, 40] as const;

export function getPdhFuseInfo(
  portType: PortType,
  sourceDeviceType: string,
  sourcePort: string,
  targetDeviceType: string,
  targetPort: string,
): { show: boolean; port: string; pdhDeviceId?: string; pdhPort?: string } {
  if (portType !== PortType.POWER) {
    return { show: false, port: '' };
  }
  if (sourceDeviceType === 'PDH' || sourceDeviceType === 'PDP') {
    if (sourcePort.startsWith('channel_') || sourcePort === 'vrm_out') {
      return { show: true, port: sourcePort, pdhPort: sourcePort };
    }
  }
  if (targetDeviceType === 'PDH' || targetDeviceType === 'PDP') {
    if (targetPort.startsWith('channel_') || targetPort === 'vrm_out') {
      return { show: true, port: targetPort, pdhPort: targetPort };
    }
  }
  return { show: false, port: '' };
}

export function defaultFuseRatingForPort(pdhPort: string): number {
  if (pdhPort === 'vrm_out') return 20;
  const match = pdhPort.match(/^channel_(\d+)$/);
  if (!match) return 40;
  const channel = Number(match[1]);
  if (channel >= 20) return 15;
  return 40;
}

export function fuseRatingLabel(amps: number): string {
  return `${amps}A`;
}

/** User-editable fuse rating on a connection, or the PDH default for that channel. */
export function getFuseRatingAmps(connection: Connection, pdhPort: string): number {
  const custom = connection.metadata?.fuseRatingAmps;
  if (typeof custom === 'number' && Number.isFinite(custom) && custom > 0) {
    return custom;
  }
  return defaultFuseRatingForPort(pdhPort);
}

export function fuseExceedsRating(branchCurrentAmps: number, fuseRatingAmps: number): boolean {
  return branchCurrentAmps > fuseRatingAmps;
}

/** @deprecated use fuseRatingLabel(getFuseRatingAmps(...)) */
export function fuseRatingForPort(sourcePort: string): string {
  return fuseRatingLabel(defaultFuseRatingForPort(sourcePort));
}
