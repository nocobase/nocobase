export { default } from './plugin.js';
export { ClientFileRepositoryManager } from './manager.js';
export type { ClientFileRepository, ClientUploadOptions } from './manager.js';
export { clientFileRepositoryManagerToken } from './token.js';
export type * from '../shared/types.js';

export { useFileUploadLimit } from './upload-limits.js';
export { fileUploadLimitsToken } from './token.js';
export type {
  FileUploadLimit,
  FileUploadLimits,
} from '../shared/upload-limits.js';

export { defaultFileUploadLimit } from '../shared/upload-limits.js';
