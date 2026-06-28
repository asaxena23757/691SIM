import { PortType } from '@691sim/core';
import { wireVisualForPortType } from '../utils/wireStyles';

const LEGEND_TYPES = [
  PortType.POWER,
  PortType.GROUND,
  PortType.CAN,
  PortType.ETHERNET,
  PortType.PWM,
  PortType.USBC,
];

export function WireLegend() {
  return (
    <div className="wire-legend">
      {LEGEND_TYPES.map((type) => {
        const visual = wireVisualForPortType(type);
        return (
          <div key={type} className="wire-legend-item">
            <svg width="36" height="12" aria-hidden="true">
              {visual.kind === 'pair' ? (
                <>
                  <line x1="0" y1="3" x2="36" y2="3" stroke={visual.colors[0]} strokeWidth="3" />
                  <line x1="0" y1="9" x2="36" y2="9" stroke={visual.colors[1]} strokeWidth="3" />
                </>
              ) : (
                <line x1="0" y1="6" x2="36" y2="6" stroke={visual.colors[0]} strokeWidth="3" />
              )}
            </svg>
            <span>{visual.label}</span>
          </div>
        );
      })}
    </div>
  );
}
