import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { VerificationService } from './contracts.js';

export const verificationServiceToken: ServiceToken<VerificationService> =
  createServiceToken<VerificationService>(
    '@nocobase/app-plugin-verification/service',
  );
