import type {
  AppDriveDiskConfig,
  FsDriveDiskConfig,
  S3DriveDiskConfig,
} from './types.js';

/**
 * Thrown for a disk configuration that no driver can use. The message names the offending field and never the
 * configured value, so credentials cannot leak into logs.
 */
export class DriveDiskConfigError extends Error {
  readonly field: string;

  constructor(field: string, message: string) {
    super(message);
    this.name = 'DriveDiskConfigError';
    this.field = field;
  }
}

/**
 * Validates a disk configuration and returns a copy holding only the fields the drivers read. Optional fields that
 * are absent stay absent, so the driver applies its own defaults, as `createDriveManager` does.
 */
export function parseDriveDiskConfig(value: unknown): AppDriveDiskConfig {
  if (!isRecord(value))
    throw new DriveDiskConfigError('', 'Disk configuration must be an object.');
  const visibility = value.visibility;
  if (visibility !== 'private' && visibility !== 'public')
    throw invalid('visibility', 'must be "private" or "public"');

  if (value.driver === 'fs') {
    const disk: FsDriveDiskConfig = {
      driver: 'fs',
      location: requiredString(value, 'location'),
      visibility,
    };
    const url = optionalString(value, 'url');
    if (url !== undefined) disk.url = url;
    return disk;
  }

  if (value.driver === 's3') {
    const credentials = value.credentials;
    if (!isRecord(credentials))
      throw invalid('credentials', 'must be an object');
    const disk: S3DriveDiskConfig = {
      driver: 's3',
      bucket: requiredString(value, 'bucket'),
      region: requiredString(value, 'region'),
      credentials: {},
      visibility,
    };
    for (const key of ['endpoint', 'cdnUrl', 'encryption'] as const) {
      const option = optionalString(value, key);
      if (option !== undefined) disk[key] = option;
    }
    for (const key of ['forcePathStyle', 'supportsACL'] as const) {
      const option = value[key];
      if (option === undefined) continue;
      if (typeof option !== 'boolean') throw invalid(key, 'must be a boolean');
      disk[key] = option;
    }
    for (const key of ['accessKeyId', 'secretAccessKey'] as const) {
      const option = credentials[key];
      if (option === undefined) continue;
      if (typeof option !== 'string')
        throw invalid(`credentials.${key}`, 'must be a string');
      disk.credentials[key] = option;
    }
    return disk;
  }

  throw invalid('driver', 'must be "fs" or "s3"');
}

function requiredString(value: Record<string, unknown>, key: string): string {
  const option = value[key];
  if (typeof option !== 'string' || !option.trim())
    throw invalid(key, 'must be a non-empty string');
  return option;
}

function optionalString(
  value: Record<string, unknown>,
  key: string,
): string | undefined {
  const option = value[key];
  if (option === undefined) return undefined;
  if (typeof option !== 'string') throw invalid(key, 'must be a string');
  return option;
}

function invalid(field: string, rule: string): DriveDiskConfigError {
  return new DriveDiskConfigError(field, `Disk field "${field}" ${rule}.`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
