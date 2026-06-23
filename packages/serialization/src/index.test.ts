import { PROJECT_SCHEMA_VERSION, type RobotModel } from '@691sim/core';
import { describe, expect, it } from 'vitest';
import { exportProject, importProject, ProjectValidationError, validateProject } from './index.js';

function sampleModel(): RobotModel {
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    id: 'robot-1',
    name: 'Test Bot',
    devices: [
      { id: 'pdh-1', type: 'PDH', position: { x: 0, y: 0 } },
      { id: 'spark-1', type: 'SparkMax', label: 'Left Front', position: { x: 10, y: 0 } },
    ],
    connections: [
      {
        id: 'conn-1',
        sourceDevice: 'pdh-1',
        sourcePort: 'ch_0',
        targetDevice: 'spark-1',
        targetPort: 'pwr_in',
      },
    ],
    metadata: { author: 'team 691' },
  };
}

describe('exportProject', () => {
  it('serializes a valid model to pretty-printed JSON', () => {
    const json = exportProject(sampleModel());
    expect(json).toContain('"schemaVersion": 1');
    expect(json).toContain('"Left Front"');
  });

  it('rejects a model that fails schema validation', () => {
    const broken = { ...sampleModel(), devices: [{ id: 'missing-type' }] } as unknown as RobotModel;
    expect(() => exportProject(broken)).toThrow(ProjectValidationError);
  });
});

describe('importProject', () => {
  it('round-trips a model through export then import unchanged', () => {
    const original = sampleModel();
    const json = exportProject(original);
    const imported = importProject(json);
    expect(imported).toEqual(original);
  });

  it('throws a plain Error on malformed JSON', () => {
    expect(() => importProject('{ not valid json')).toThrow(/not valid JSON/);
  });

  it('throws ProjectValidationError when a required field is missing', () => {
    const badJson = JSON.stringify({ schemaVersion: 1, id: 'robot-1' });
    expect(() => importProject(badJson)).toThrow(ProjectValidationError);
  });

  it('throws ProjectValidationError on an unrecognized schema version', () => {
    const futureJson = JSON.stringify({ ...sampleModel(), schemaVersion: 999 });
    expect(() => importProject(futureJson)).toThrow(ProjectValidationError);
  });
});

describe('validateProject', () => {
  it('returns valid: true with the parsed model for good data', () => {
    const result = validateProject(sampleModel());
    expect(result.valid).toBe(true);
  });

  it('returns valid: false with issues for bad data, without throwing', () => {
    const result = validateProject({ id: 'robot-1' });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.issues.length).toBeGreaterThan(0);
    }
  });
});
