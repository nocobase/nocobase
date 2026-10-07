import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { SecretsService } from './service.js';

export const secretsServiceToken: ServiceToken<SecretsService> =
  createServiceToken<SecretsService>('@nocobase/app-server/secrets');
