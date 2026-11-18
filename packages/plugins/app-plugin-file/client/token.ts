import type { FileUploadLimits } from '../shared/upload-limits.js';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import type { ClientFileRepositoryManager } from './manager.js';
export const clientFileRepositoryManagerToken: ServiceToken<ClientFileRepositoryManager> =
  createServiceToken('clientFileRepositoryManager');

export const fileUploadLimitsToken: ServiceToken<FileUploadLimits> =
  createServiceToken<FileUploadLimits>('file.uploadLimits');
