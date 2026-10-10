import path from 'node:path';

import type { AppDriveConfig, AppDriveDiskConfig } from '@nocobase/drive';

import type { ReleasesPluginConfig } from './config.js';

export interface ResolvedArtifact {
  readonly disk: AppDriveDiskConfig;
  readonly prefix: string;
}

/** Resolves a serializable disk configuration without sharing or changing the application's disk. */
export function resolveArtifact(
  artifact: ReleasesPluginConfig['artifact'],
  drive?: AppDriveConfig,
): ResolvedArtifact {
  if (!isRecord(artifact))
    throw new Error('Invalid releases.artifact configuration.');
  if (!('disk' in artifact)) return { disk: artifact, prefix: '' };

  const name = artifact.disk;
  const invalid = (configPath: string): Error =>
    new Error(
      `Invalid ${configPath} for releases.artifact.disk${typeof name === 'string' ? ` ${JSON.stringify(name)}` : ''}.`,
    );
  if (typeof name !== 'string' || !name.trim())
    throw invalid('releases.artifact.disk');
  if (Object.keys(artifact).some((key) => key !== 'disk' && key !== 'prefix'))
    throw invalid('releases.artifact');
  const rawPrefix = artifact.prefix === undefined ? '' : artifact.prefix;
  if (
    typeof rawPrefix !== 'string' ||
    path.posix.isAbsolute(rawPrefix) ||
    path.win32.isAbsolute(rawPrefix) ||
    rawPrefix.includes('\\') ||
    /^[a-z]:/i.test(rawPrefix) ||
    rawPrefix.split('/').some((part) => part === '.' || part === '..') ||
    Array.from(rawPrefix).some(
      (char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127,
    )
  )
    throw invalid('releases.artifact.prefix');
  const disk =
    drive?.disks && Object.hasOwn(drive.disks, name)
      ? drive.disks[name]
      : undefined;
  if (
    !isRecord(disk) ||
    (disk.visibility !== 'private' && disk.visibility !== 'public')
  )
    throw invalid('drive.disks');
  if (disk.driver === 'fs') {
    if (
      !nonempty(disk.location) ||
      (disk.url !== undefined && typeof disk.url !== 'string')
    )
      throw invalid('drive.disks');
    return { disk: { ...disk }, prefix: rawPrefix.replace(/\/+$/u, '') };
  }
  if (
    disk.driver !== 's3' ||
    ['endpoint', 'cdnUrl', 'encryption'].some(
      (key) => disk[key] !== undefined && typeof disk[key] !== 'string',
    ) ||
    !nonempty(disk.bucket) ||
    !nonempty(disk.region) ||
    typeof disk.forcePathStyle !== 'boolean' ||
    typeof disk.supportsACL !== 'boolean' ||
    !isRecord(disk.credentials) ||
    [disk.credentials.accessKeyId, disk.credentials.secretAccessKey].some(
      (value) => value !== undefined && typeof value !== 'string',
    )
  )
    throw invalid('drive.disks');
  // Empty credentials preserve the S3 driver's default credential provider chain.
  return {
    disk: { ...disk, credentials: { ...disk.credentials } },
    prefix: rawPrefix.replace(/\/+$/u, ''),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonempty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
