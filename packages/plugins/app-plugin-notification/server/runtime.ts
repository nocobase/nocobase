import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import type { Hono } from 'hono';

import type { NotificationService } from './types.js';

/** Internal lifecycle and route surface. Public consumers use narrower tokens. */
export interface NotificationRuntime extends NotificationService {
  readonly router: Hono;
  activate(): Promise<void>;
  close(): Promise<void>;
}

export const notificationRuntimeToken: ServiceToken<NotificationRuntime> =
  createServiceToken<NotificationRuntime>(
    '@nocobase/app-plugin-notification/runtime',
  );
