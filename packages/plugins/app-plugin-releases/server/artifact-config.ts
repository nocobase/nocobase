import path from 'node:path';

import {
  DriveDiskConfigError,
  parseDriveDiskConfig,
  type AppDriveConfig,
  type AppDriveDiskConfig,
} from '@nocobase/drive';

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
  const prefix = rawPrefix.replace(/\/{2,}/gu, '/').replace(/\/+$/u, '');
  if (!drive?.disks || !Object.hasOwn(drive.disks, name))
    throw invalid('drive.disks');
  let disk: AppDriveDiskConfig;
  try {
    disk = parseDriveDiskConfig(drive.disks[name]);
  } catch (error) {
    if (!(error instanceof DriveDiskConfigError)) throw error;
    throw new Error(
      `Invalid drive.disks ${JSON.stringify(name)} for releases.artifact.disk: ${error.message}`,
      { cause: error },
    );
  }
  // Release archives carry server code and configuration templates, so they must not be readable without the
  // plugin's permission checks. A public disk cannot promise that: on S3 without ACL support the bucket policy, not
  // the per-object visibility, decides who reads a file, and a prefix does not change it.
  if (disk.visibility !== 'private')
    throw new Error(
      `Invalid drive.disks ${JSON.stringify(name)} for releases.artifact.disk: release artifacts must be stored on a private disk.`,
    );
  return { disk, prefix };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
