export { default } from './plugin.js';
export { ClientFileRepositoryManager } from './manager.js';
export type { ClientFileRepository, ClientUploadOptions } from './manager.js';
export { clientFileRepositoryManagerToken } from './token.js';
export type * from '../shared/types.js';

export { useFileUploadLimit } from './upload-limits.js';
export { fileUploadLimitsToken } from './token.js';
export type {
  DriveUploadLimit,
  FileUploadLimits,
} from '../shared/upload-limits.js';

export {
  DEFAULT_FILE_UPLOAD_LIMIT,
  limitBytes,
} from '../shared/upload-limits.js';

export {
  FILE_STORAGE_CHECK,
  FILE_STORAGE_PAGE,
} from '../shared/storage-access.js';
