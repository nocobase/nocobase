export { default } from './plugin.js';
export { serverFileRepositoryManagerToken } from './token.js';
export {
  ServerFileRepositoryManager,
  FileRepositoryError,
  FILE_COLUMNS,
} from './repository.js';
export type {
  FileColumn,
  FileUsageStats,
  ServerFileRepository,
  FileRepositoryOptions,
  FileOperations,
  FileDriveConfig,
  LocalDiskUsage,
} from './repository.js';
export { defineFileRepositoryApiRoutes } from './routes.js';
export type {
  DefineFileRepositoryApiRoutesOptions,
  FileRepositoryApiExposure,
  FileRepositoryApiActions,
} from './routes.js';
export type * from '../shared/types.js';

export { assertFileUploadSize, fileTooLarge } from './upload-limits.js';
export {
  DEFAULT_FILE_UPLOAD_LIMIT,
  limitBytes,
  type DriveUploadLimit,
  type FileUploadLimits,
} from '../shared/upload-limits.js';
export type {
  FileUsageDefinition,
  FileUsageDescription,
  FileUsageDisk,
  FileUsageDownload,
  FileUsageText,
} from './usages.js';
export {
  FILE_STORAGE_CHECK,
  FILE_STORAGE_PAGE,
} from '../shared/storage-access.js';
