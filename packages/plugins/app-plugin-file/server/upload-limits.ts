import { ApiError } from '@nocobase/app-server/router';
import type { FileUploadLimit } from '../shared/upload-limits.js';

export function fileTooLarge(limit: FileUploadLimit): ApiError {
  return new ApiError({
    status: 'INVALID_ARGUMENT',
    reason: 'FILE_TOO_LARGE',
    domain: 'file',
    httpStatus: 413,
    message: `A file may have at most ${limit.maxFileSizeMb} MB.`,
    metadata: { ...limit },
  });
}
/** Every File Repository upload uses the destination disk's limit before writing bytes. */
export function assertFileUploadSize(file: File, limit: FileUploadLimit): void {
  if (file.size > limit.maxBytes) throw fileTooLarge(limit);
}
