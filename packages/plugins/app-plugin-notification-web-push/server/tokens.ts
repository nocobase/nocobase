import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import type { WebPushService } from './service.js';
export const webPushServiceToken: ServiceToken<WebPushService> =
  createServiceToken<WebPushService>(
    '@nocobase/app-plugin-notification-web-push/service',
  );
