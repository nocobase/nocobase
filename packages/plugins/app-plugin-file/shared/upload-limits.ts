import type { DriveUploadLimit } from '@nocobase/drive';
export type { DriveUploadLimit } from '@nocobase/drive';
export { DEFAULT_FILE_UPLOAD_LIMIT } from '@nocobase/drive/upload-limits';

export function limitBytes(limit: DriveUploadLimit): number {
  return limit.maxFileSizeMb * 1024 * 1024;
}

export interface FileUploadLimits {
  readonly default: string;
  readonly disks: Readonly<Record<string, DriveUploadLimit>>;
}
