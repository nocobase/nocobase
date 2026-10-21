import type { ApiClient } from '@nocobase/app-client';

export type NotificationStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'partial'
  | 'preparing'
  | 'submitting'
  | 'retrying'
  | 'accepted'
  | 'failed'
  | 'unknown';

export interface NotificationAttempt {
  readonly id: string;
  readonly sequence: number;
  readonly providerType: string;
  readonly status: NotificationStatus;
  readonly startedAt: string;
  readonly finishedAt?: string;
  readonly providerMessageId?: string;
  readonly error?: { readonly message: string; readonly code?: string };
}

export interface NotificationRetryAudit {
  readonly id: string;
  readonly deliveryId: string;
  readonly resolution: {
    readonly type: 'terminal_failure';
    readonly reason: string;
    readonly requestedAt: string;
  };
  readonly providerIdempotency?: {
    readonly startedAt: string;
    readonly expiresAt?: string;
  };
  readonly createdAt: string;
}

export interface NotificationDeliveryDetails {
  readonly delivery: {
    readonly id: string;
    readonly channelName: string;
    readonly channelType: string;
    readonly providerType: string;
    readonly attemptCount: number;
    readonly status: NotificationStatus;
    readonly nextRunAt?: string;
    readonly lastError?: { readonly message: string; readonly code?: string };
    readonly createdAt: string;
    readonly updatedAt: string;
  };
  readonly attempts: readonly NotificationAttempt[];
  readonly retryAudits: readonly NotificationRetryAudit[];
}

export interface NotificationLogDetails {
  readonly log: {
    readonly id: string;
    readonly sourceType: string;
    readonly sourceReferenceId?: string;
    readonly status: NotificationStatus;
    readonly createdAt: string;
    readonly updatedAt: string;
  };
  readonly deliveries: readonly NotificationDeliveryDetails[];
}

interface DataResponse<T> {
  readonly data: T;
}

export class NotificationClient {
  constructor(private readonly api: ApiClient) {}

  /** The newest logs, the most the server returns in one page. */
  listLogs(): Promise<readonly NotificationLogDetails[]> {
    return this.api
      .request<DataResponse<readonly NotificationLogDetails[]>>({
        path: 'notifications/logs',
        query: { pageSize: 100 },
      })
      .then((response) => response.data);
  }
}
