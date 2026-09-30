import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import type { Hono } from 'hono';

import type { NotificationLogDetails } from './logs.js';
import type {
  NotificationService,
  NotificationSendResult,
  NotificationTestActor,
  NotificationTestSendRequest,
  NotificationTestTargetDescriptor,
} from './types.js';

/** Internal lifecycle and route surface. Public consumers use narrower tokens. */
export interface NotificationRuntime extends NotificationService {
  readonly router: Hono;
  activate(): Promise<void>;
  listTestTargets(): readonly NotificationTestTargetDescriptor[];
  sendTest(
    request: NotificationTestSendRequest,
    actor: NotificationTestActor,
  ): Promise<NotificationSendResult>;
  getTestStatus(
    notificationId: string,
    actor: NotificationTestActor,
  ): Promise<NotificationLogDetails | undefined>;
  close(): Promise<void>;
}

export const notificationRuntimeToken: ServiceToken<NotificationRuntime> =
  createServiceToken<NotificationRuntime>(
    '@nocobase/app-plugin-notification/runtime',
  );
