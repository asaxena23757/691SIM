import type { RobotModel } from '@691sim/core';
import type { ZodIssue } from 'zod';
import { RobotModelSchema } from './schema.js';

export {
  RobotModelSchema,
  DeviceInstanceSchema,
  ConnectionSchema,
  VectorSchema,
} from './schema.js';
export type { RobotModelJson } from './schema.js';

/**
 * Thrown when a project file's JSON is well-formed but doesn't match the
 * `RobotModel` schema (wrong types, missing fields, unknown schema version).
 */
export class ProjectValidationError extends Error {
  readonly issues: ZodIssue[];

  constructor(issues: ZodIssue[]) {
    super(
      `Invalid project file: ${issues.length} issue(s) found\n` +
        issues
          .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
          .join('\n'),
    );
    this.name = 'ProjectValidationError';
    this.issues = issues;
  }
}

/** Result of validating arbitrary parsed JSON against the project schema. */
export type ValidationResult =
  | { valid: true; model: RobotModel }
  | { valid: false; issues: ZodIssue[] };

/**
 * Validate already-parsed JSON data against the project schema without
 * throwing. Use this when you want to report issues to a user instead of
 * handling an exception (e.g. in a UI form).
 */
export function validateProject(data: unknown): ValidationResult {
  const result = RobotModelSchema.safeParse(data);
  if (!result.success) {
    return { valid: false, issues: result.error.issues };
  }
  return { valid: true, model: result.data };
}

/**
 * Parse and validate a project file's raw JSON text into a `RobotModel`.
 * Throws a plain `Error` on malformed JSON, or `ProjectValidationError`
 * if the JSON is well-formed but doesn't match the schema.
 */
export function importProject(json: string): RobotModel {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Project file is not valid JSON: ${message}`);
  }

  const result = validateProject(parsed);
  if (!result.valid) {
    throw new ProjectValidationError(result.issues);
  }
  return result.model;
}

/**
 * Serialize a `RobotModel` to pretty-printed JSON text. Validates the
 * model against the schema first so we never write out a corrupt project
 * file, even if the caller built the object by hand.
 */
export function exportProject(model: RobotModel): string {
  const result = validateProject(model);
  if (!result.valid) {
    throw new ProjectValidationError(result.issues);
  }
  return JSON.stringify(result.model, null, 2);
}
