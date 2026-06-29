/* eslint-disable @typescript-eslint/no-explicit-any */
import { DeviceCategory } from '@691sim/core';
import type { RobotModelState } from '../hooks/useRobotModel';
import { CATEGORY_NAMES, categoryColor } from '../utils/labels';
import { DeviceIcon } from './DeviceIcon';

const CATEGORY_ORDER = [
  DeviceCategory.POWER,
  DeviceCategory.CONTROLLER,
  DeviceCategory.MOTOR_CONTROLLER,
  DeviceCategory.SENSOR,
  DeviceCategory.VISION,
  DeviceCategory.NETWORK,
];

interface DevicePaletteProps {
  state: RobotModelState;
}

export function DevicePalette({ state }: DevicePaletteProps) {
  const { registry, addDevice } = state;
  const devices = registry.list();

  const byCategory = CATEGORY_ORDER.map((category) => ({
    category,
    devices: devices.filter((d: any) => d.category === category),
  })).filter((group) => group.devices.length > 0);

  return (
    <aside className="panel palette-panel">
      <div className="panel-header">Device Palette</div>
      <div className="panel-content palette-scroll">
        {byCategory.map(({ category, devices: groupDevices }) => (
          <div key={category} style={{ marginBottom: '1rem' }}>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: categoryColor(category),
                marginBottom: '0.4rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {CATEGORY_NAMES[category]}
            </div>
            {groupDevices.map((def: any) => (
              <button
                key={def.type}
                type="button"
                className="list-item palette-item"
                onClick={() => addDevice(def.type)}
                title={`Add ${def.displayName}`}
              >
                <DeviceIcon type={def.type} size={36} />
                <span>
                  {def.displayName}
                  <small>{def.type}</small>
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}
