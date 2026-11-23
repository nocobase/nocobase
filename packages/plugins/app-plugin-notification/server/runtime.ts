import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import type { Hono } from 'hono';

import type {
  NotificationPreferenceChange,
  NotificationPreferencesView,
} from '../shared/preferences.js';
import type { NotificationLogs } from './logs.js';
import type {
  NotificationChannelView,
  NotificationDeliverySettingsView,
} from './manager.js';
import type { NotificationStore } from './store.js';
import type { NotificationSendResult, NotificationService } from './types.js';

/** Internal lifecycle and route surface. Public consumers use narrower tokens. */
export interface NotificationRuntime extends NotificationService {
  readonly router: Hono;
  readonly logs: NotificationLogs;
  readonly store: NotificationStore;
  activate(): Promise<void>;
  close(): Promise<void>;
  channels(): Promise<readonly NotificationChannelView[]>;
  deliverySettings(): NotificationDeliverySettingsView;
  testChannel(
    name: string,
    input: {
      readonly userId: string;
      readonly title: string;
      readonly body: string;
    },
  ): Promise<NotificationSendResult>;
  preferencesFor(userId: string): Promise<NotificationPreferencesView>;
  savePreferences(
    userId: string,
    changes: readonly NotificationPreferenceChange[],
  ): Promise<NotificationPreferencesView>;
}

export const notificationRuntimeToken: ServiceToken<NotificationRuntime> =
  createServiceToken<NotificationRuntime>(
    '@nocobase/app-plugin-notification/runtime',
  );
