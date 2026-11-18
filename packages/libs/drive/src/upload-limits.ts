import type { DriveUploadLimit } from './types.js';

export const DEFAULT_FILE_UPLOAD_LIMIT: DriveUploadLimit = {
  maxFileSizeMb: 20,
};

/** Configuration validation only; omitted limits use the shared default. */
export function readMaxFileSizeMb(entry: unknown): number | undefined {
  if (!entry || (typeof entry !== 'object' && typeof entry !== 'function'))
    return undefined;
  const configured = (entry as { maxFileSizeMb?: unknown }).maxFileSizeMb;
  const value =
    configured === undefined
      ? DEFAULT_FILE_UPLOAD_LIMIT.maxFileSizeMb
      : configured;
  return typeof value === 'number' && Number.isInteger(value) && value > 0
    ? value
    : undefined;
}
