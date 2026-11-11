import { ApiError } from '@nocobase/app-server/router';
import { limitBytes, type DriveUploadLimit } from '../shared/upload-limits.js';

export function fileTooLarge(limit: DriveUploadLimit): ApiError {
  return new ApiError({
    status: 'INVALID_ARGUMENT',
    reason: 'FILE_TOO_LARGE',
    domain: 'file',
    httpStatus: 413,
    message: `A file may have at most ${limit.maxFileSizeMb} MB.`,
    metadata: { ...limit },
  });
}
/** Attachment entry points check the destination disk's limit before writing bytes. */
export function assertFileUploadSize(
  file: File,
  limit: DriveUploadLimit,
): void {
  if (file.size > limitBytes(limit)) throw fileTooLarge(limit);
}
