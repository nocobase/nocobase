export { default } from './plugin.js';
export { serverFileRepositoryManagerToken } from './token.js';
export {
  ServerFileRepositoryManager,
  FileRepositoryError,
  FILE_COLUMNS,
} from './repository.js';
export type {
  FileColumn,
  ServerFileRepository,
  FileRepositoryOptions,
  FileOperations,
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
  defaultFileUploadLimit,
  type FileUploadLimit,
  type FileUploadLimits,
} from '../shared/upload-limits.js';
