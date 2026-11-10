import type { Disk, DriveManager } from 'flydrive';
import type { DriverContract, SignedURLOptions } from 'flydrive/types';

export type DriveVisibility = 'public' | 'private';

export interface DriveUploadOptions {
  /** Single-file upload limit in MiB; defaults to 20. */
  maxFileSizeMb?: number;
}

export interface DriveUploadLimit {
  readonly disk: string;
  readonly maxFileSizeMb: number;
  readonly maxBytes: number;
}

export interface FsDriveDiskConfig extends DriveUploadOptions {
  driver: 'fs';
  location: string;
  visibility: DriveVisibility;
  url?: string;
}

export interface S3DriveDiskConfig extends DriveUploadOptions {
  driver: 's3';
  bucket: string;
  region: string;
  endpoint?: string;
  cdnUrl?: string;
  /** Omitted, the S3 driver's default applies. */
  forcePathStyle?: boolean;
  /** Omitted, the S3 driver's default applies. */
  supportsACL?: boolean;
  encryption?: string;
  credentials: {
    accessKeyId?: string;
    secretAccessKey?: string;
  };
  visibility: DriveVisibility;
}

export interface OssDriveDiskConfig extends DriveUploadOptions {
  driver: 'oss';
  region: string;
  bucket: string;
  internal?: boolean;
  domain?: string;
  /** OSS request timeout in milliseconds; defaults to 600000 (10 minutes). */
  timeout?: number;
  visibility: DriveVisibility;
  supportsACL?: boolean;
  credentials:
    | {
        accessKeyId: string;
        accessKeySecret: string;
        provider?: never;
        roleName?: never;
      }
    | {
        provider: 'aliyun-ecs-ram-role';
        roleName?: string;
        accessKeyId?: never;
        accessKeySecret?: never;
      };
}

export type AppDriveDiskConfig =
  FsDriveDiskConfig | S3DriveDiskConfig | OssDriveDiskConfig;

/** Creates a driver synchronously on first use, without a bound receiver. */
export type DriveDriverFactory = ((this: void) => DriverContract) &
  DriveUploadOptions;

export type AppDriveDiskDefinition = AppDriveDiskConfig | DriveDriverFactory;

export interface AppDriveConfig {
  default: string;
  disks: Record<string, AppDriveDiskDefinition>;
}

export type NocoBaseDriveDisk = Disk;

export type NocoBaseDriveManager = DriveManager<
  Record<string, () => DriverContract>
> & {
  getUploadLimit(disk?: string): DriveUploadLimit;
  uploadLimits(): {
    readonly default: string;
    readonly disks: Readonly<Record<string, DriveUploadLimit>>;
  };
};

export interface FlydriveFakesConfig {
  location: string | URL;
  urlBuilder?: {
    generateURL?(key: string, filePath: string): Promise<string>;
    generateSignedURL?(
      key: string,
      filePath: string,
      options: SignedURLOptions,
    ): Promise<string>;
    generateSignedUploadURL?(
      key: string,
      filePath: string,
      options: SignedURLOptions,
    ): Promise<string>;
  };
}

export interface CreateDriveManagerOptions {
  fakes?: FlydriveFakesConfig;
}
