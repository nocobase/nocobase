import type { ApiClient } from '@nocobase/app-client';

import type {
  NotificationPreferenceChange,
  NotificationPreferencesView,
} from '../../shared/preferences.js';
import type {
  NotificationTemplatePreview,
  NotificationTemplateText,
  NotificationTemplateView,
} from '../../shared/templates.js';
import type {
  NotificationAttempt,
  NotificationRetryAudit,
  NotificationStatus,
} from '../notification-client.js';

/** One configured channel, as `GET /notifications/channels` answers it. */
export interface NotificationChannelView {
  readonly name: string;
  readonly type: string;
  /** The message family kinds and preferences use: `in-app`, `email`, `web-push` or `im`. */
  readonly channelType: string;
  readonly typeLabel?: NotificationTemplateText;
  readonly contributor?: string;
  readonly enabled: boolean;
  readonly summary: readonly {
    readonly label: NotificationTemplateText;
    readonly value: string;
  }[];
  readonly testable: boolean;
  readonly reachesUsers: boolean;
  readonly last24h: {
    readonly accepted: number;
    readonly failed: number;
    readonly pending: number;
    readonly unknown: number;
  };
}

export interface NotificationDeliverySettings {
  readonly retry: {
    readonly maxAttempts: number;
    readonly intervalMs: number;
    readonly configured: boolean;
  };
  readonly jobs?: string;
}

export interface NotificationKindListItem extends NotificationTemplateView {
  readonly sentLast7Days: number;
}

/** The outcome groups the delivery log filters by. */
export const DELIVERY_OUTCOMES = [
  'failed',
  'retrying',
  'unknown',
  'pending',
  'accepted',
] as const;
export type NotificationDeliveryOutcome = (typeof DELIVERY_OUTCOMES)[number];

export interface NotificationDeliveryView {
  readonly id: string;
  readonly notificationId: string;
  readonly channelName: string;
  readonly channelType: string;
  readonly providerType: string;
  readonly recipientKey?: string;
  readonly attemptCount: number;
  readonly status: NotificationStatus;
  readonly nextRunAt?: string;
  readonly lastError?: { readonly message: string; readonly code?: string };
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface NotificationDeliveryLogEntry {
  readonly delivery: NotificationDeliveryView;
  readonly kind?: string;
  readonly sourceType: string;
  readonly sourceReferenceId?: string;
  readonly idempotencyKey?: string;
}

export interface NotificationDeliveryLogDetails extends NotificationDeliveryLogEntry {
  readonly attempts: readonly NotificationAttempt[];
  readonly retryAudits: readonly NotificationRetryAudit[];
}

export interface NotificationDeliveryFilter {
  readonly status?: NotificationDeliveryOutcome;
  readonly channel?: string;
  readonly kind?: string;
  readonly q?: string;
  readonly from?: string;
  readonly to?: string;
}

export interface NotificationDeliveryPage {
  readonly data: readonly NotificationDeliveryLogEntry[];
  readonly meta: {
    readonly nextPageToken?: string;
    readonly statusCounts: Partial<Record<NotificationDeliveryOutcome, number>>;
  };
}

interface DataResponse<T> {
  readonly data: T;
}

export interface NotificationSettingsApi {
  channels(): Promise<{
    readonly data: readonly NotificationChannelView[];
    readonly meta: { readonly delivery: NotificationDeliverySettings };
  }>;
  testChannel(
    name: string,
  ): Promise<{ readonly notificationId: string; readonly status: string }>;
  kinds(): Promise<readonly NotificationKindListItem[]>;
  kind(id: string): Promise<NotificationTemplateView>;
  previewKind(id: string, locale: string): Promise<NotificationTemplatePreview>;
  deliveries(
    filter: NotificationDeliveryFilter,
    pageToken?: string,
  ): Promise<NotificationDeliveryPage>;
  delivery(id: string): Promise<NotificationDeliveryLogDetails>;
  retryDelivery(
    id: string,
    reason: string,
  ): Promise<NotificationDeliveryLogDetails>;
  preferences(): Promise<NotificationPreferencesView>;
  savePreferences(
    items: readonly NotificationPreferenceChange[],
  ): Promise<NotificationPreferencesView>;
}

const segment = (value: string): string => encodeURIComponent(value);

/** The settings and preferences endpoints of `/api/notifications`. */
export function notificationSettingsApi(
  api: ApiClient,
): NotificationSettingsApi {
  const data = async <T>(
    options: Parameters<ApiClient['request']>[0],
  ): Promise<T> => (await api.request<DataResponse<T>>(options)).data;
  return {
    channels: () => api.request({ path: 'notifications/channels' }),
    testChannel: (name) =>
      data({ path: `notifications/channels/${segment(name)}/test`, method: 'POST' }),
    kinds: () => data({ path: 'notifications/kinds' }),
    kind: (id) => data({ path: `notifications/kinds/${segment(id)}` }),
    previewKind: (id, locale) =>
      data({
        path: `notifications/kinds/${segment(id)}/preview`,
        method: 'POST',
        json: { locale },
      }),
    deliveries(filter, pageToken) {
      const query: Record<string, string | number> = { pageSize: 50 };
      for (const [key, value] of Object.entries(filter))
        if (typeof value === 'string' && value) query[key] = value;
      if (pageToken) query.pageToken = pageToken;
      return api.request({ path: 'notifications/deliveries', query });
    },
    delivery: (id) => data({ path: `notifications/deliveries/${segment(id)}` }),
    retryDelivery: (id, reason) =>
      data({
        path: `notifications/deliveries/${segment(id)}/retry`,
        method: 'POST',
        json: { reason },
      }),
    preferences: () => data({ path: 'notifications/preferences' }),
    savePreferences: (items) =>
      data({ path: 'notifications/preferences', method: 'PUT', json: { items } }),
  };
}
