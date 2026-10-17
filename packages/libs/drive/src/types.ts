import type { Disk, DriveManager } from 'flydrive';
import type { DriverContract, SignedURLOptions } from 'flydrive/types';

export type DriveVisibility = 'public' | 'private';

export interface FsDriveDiskConfig {
  driver: 'fs';
  location: string;
  visibility: DriveVisibility;
  url?: string;
}

export interface S3DriveDiskConfig {
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

export interface OssDriveDiskConfig {
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

export interface AppDriveConfig {
  default: string;
  disks: Record<string, AppDriveDiskConfig>;
}

export type NocoBaseDriveDisk = Disk;

export type NocoBaseDriveManager = DriveManager<
  Record<string, () => DriverContract>
>;

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
