import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { QueueService } from '@nocobase/queue';

/**
 * The application's queue service. Plugins resolve it here rather than
 * creating a token of their own: a token with the same name is a different
 * key.
 */
export const queueServiceToken: ServiceToken<QueueService> =
  createServiceToken<QueueService>('@nocobase/queue/service');
