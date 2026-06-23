import { PROJECT_SCHEMA_VERSION } from '@691sim/core';
import { z } from 'zod';

/**
 * Runtime schema for the on-disk project file format. This is the single
 * source of truth for what a valid `.691sim` project JSON looks like —
 * import/export and validation all go through this schema so the three
 * can never drift apart.
 *
 * Kept structurally in sync with the `RobotModel` family of interfaces in
 * `@691sim/core`. If you add a field there, add it here too.
 */

export const VectorSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const DeviceInstanceSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  label: z.string().optional(),
  position: VectorSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const ConnectionSchema = z.object({
  id: z.string().min(1),
  sourceDevice: z.string().min(1),
  sourcePort: z.string().min(1),
  targetDevice: z.string().min(1),
  targetPort: z.string().min(1),
});

export const RobotModelSchema = z.object({
  schemaVersion: z.literal(PROJECT_SCHEMA_VERSION),
  id: z.string().min(1),
  name: z.string().min(1),
  devices: z.array(DeviceInstanceSchema),
  connections: z.array(ConnectionSchema),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/** The validated, parsed shape of a project file. Matches `RobotModel` from `@691sim/core`. */
export type RobotModelJson = z.infer<typeof RobotModelSchema>;
