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

export type AppDriveDiskConfig = FsDriveDiskConfig | S3DriveDiskConfig;

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
