import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import type { ClientFileRepositoryManager } from './manager.js';
export const clientFileRepositoryManagerToken: ServiceToken<ClientFileRepositoryManager> =
  createServiceToken('clientFileRepositoryManager');

export const fileUploadLimitsToken: ServiceToken<
  import('../shared/upload-limits.js').FileUploadLimits
> =
  createServiceToken<import('../shared/upload-limits.js').FileUploadLimits>(
    'file.uploadLimits',
  );
