import type { S3ClientConfig } from '@aws-sdk/client-s3';
import { DriveManager } from 'flydrive';
import { FSDriver } from 'flydrive/drivers/fs';
import { S3Driver } from 'flydrive/drivers/s3';
import type { S3DriverOptions } from 'flydrive/drivers/s3/types';
import type { DriverContract } from 'flydrive/types';

import { createOssDriver } from './oss.js';
import type {
  AppDriveConfig,
  AppDriveDiskDefinition,
  CreateDriveManagerOptions,
  FsDriveDiskConfig,
  NocoBaseDriveManager,
  S3DriveDiskConfig,
} from './types.js';
import { DEFAULT_FILE_UPLOAD_LIMIT } from './upload-limits.js';
import { joinDriveUrl } from './url.js';

export function createDriveManager(
  config: AppDriveConfig,
  options: CreateDriveManagerOptions = {},
): NocoBaseDriveManager {
  assertDefaultDisk(config);

  const limits = Object.fromEntries(
    Object.entries(config.disks).map(([disk, definition]) => [
      disk,
      {
        maxFileSizeMb:
          definition.maxFileSizeMb ?? DEFAULT_FILE_UPLOAD_LIMIT.maxFileSizeMb,
      },
    ]),
  );
  const manager = new DriveManager({
    default: config.default,
    fakes: options.fakes,
    services: Object.fromEntries(
      Object.entries(config.disks).map(([name, disk]) => [
        name,
        () => createDriver(disk),
      ]),
    ),
  });
  return Object.assign(manager, {
    limits,
    getUploadLimit: (disk = config.default) => {
      if (!Object.hasOwn(limits, disk))
        throw new Error(`Drive disk "${disk}" is not configured.`);
      return limits[disk];
    },
  });
}

export function assertDefaultDisk(config: AppDriveConfig): void {
  if (
    !Object.hasOwn(config.disks, config.default) ||
    !config.disks[config.default]
  ) {
    throw new Error(
      `Default drive disk "${config.default}" is not configured.`,
    );
  }
}

function createDriver(disk: AppDriveDiskDefinition): DriverContract {
  if (typeof disk === 'function') {
    return disk();
  }

  if (disk.driver === 'fs') {
    return createFsDriver(disk);
  }

  if (disk.driver === 'oss') {
    return createOssDriver(disk);
  }

  return createS3Driver(disk);
}

function createFsDriver(disk: FsDriveDiskConfig): DriverContract {
  return new FSDriver(
    compactObject({
      location: disk.location,
      visibility: disk.visibility,
      urlBuilder: disk.url
        ? {
            generateURL: async (key: string) => joinDriveUrl(disk.url!, key),
          }
        : undefined,
    }),
  );
}

function createS3Driver(disk: S3DriveDiskConfig): DriverContract {
  const options = compactObject({
    bucket: disk.bucket,
    region: disk.region,
    endpoint: disk.endpoint,
    cdnUrl: disk.cdnUrl,
    forcePathStyle: disk.forcePathStyle,
    supportsACL: disk.supportsACL,
    encryption: disk.encryption,
    credentials: createS3Credentials(disk),
    visibility: disk.visibility,
  }) as S3DriverOptions;

  return new S3Driver(options);
}

function createS3Credentials(
  disk: S3DriveDiskConfig,
): S3ClientConfig['credentials'] {
  const { accessKeyId, secretAccessKey } = disk.credentials;
  if (!accessKeyId || !secretAccessKey) {
    return undefined;
  }

  return {
    accessKeyId,
    secretAccessKey,
  };
}

function compactObject<TValue extends Record<string, unknown>>(
  value: TValue,
): TValue {
  for (const key of Object.keys(value)) {
    if (value[key] === undefined) {
      delete value[key];
    }
  }

  return value;
}
