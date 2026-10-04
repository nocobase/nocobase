import { ApiClientError, type ApiClient } from '@nocobase/app-client';
import type {
  NotificationSendResult,
  NotificationTestFieldDescriptor,
  NotificationTestSendRequest,
  NotificationTestTargetDescriptor,
} from '../server/types.js';

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

export type NotificationTestField = NotificationTestFieldDescriptor<string>;

export type NotificationTestTarget = NotificationTestTargetDescriptor<string>;

export type NotificationTestInput = NotificationTestSendRequest;

export type NotificationTestResult = NotificationSendResult;

interface DataResponse<T> {
  readonly data: T;
}

/**
 * A failed notification test request. `reason` is the server's standard error reason, such as
 * `NOTIFICATION_TEST_FORBIDDEN`, or `NOTIFICATION_TEST_UNAVAILABLE` when the application does not serve the test
 * routes at all. `message` is the server's localized message when it sent one.
 */
export class NotificationTestApiError extends Error {
  public readonly reason: string;
  public readonly status?: number;

  public constructor(
    input: {
      readonly reason: string;
      readonly message: string;
      readonly status?: number;
    },
    cause: unknown,
  ) {
    super(input.message, { cause });
    this.name = 'NotificationTestApiError';
    this.reason = input.reason;
    this.status = input.status;
  }
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

  listTestTargets(): Promise<readonly NotificationTestTarget[]> {
    return this.api
      .request<DataResponse<readonly NotificationTestTarget[]>>({
        path: 'notifications/testTargets',
        headers: { 'x-nocobase-notification-test': '1' },
      })
      .then((response) => response.data)
      .catch(rethrowNotificationTestError);
  }

  sendTest(input: NotificationTestInput): Promise<NotificationTestResult> {
    return this.api
      .request<DataResponse<NotificationTestResult>>({
        path: 'notifications/testSends',
        method: 'POST',
        headers: { 'x-nocobase-notification-test': '1' },
        json: input,
      })
      .then((response) => response.data)
      .catch(rethrowNotificationTestError);
  }

  getTestStatus(id: string): Promise<NotificationLogDetails> {
    return this.api
      .request<DataResponse<NotificationLogDetails>>({
        path: `notifications/testSends/${encodeURIComponent(id)}`,
        headers: { 'x-nocobase-notification-test': '1' },
      })
      .then((response) => response.data)
      .catch(rethrowNotificationTestError);
  }
}

function rethrowNotificationTestError(cause: unknown): never {
  if (!(cause instanceof ApiClientError)) throw cause;
  // The application answers an unknown `/api` path with `ROUTE_NOT_FOUND`: it does not serve notification testing.
  if (cause.reason === 'ROUTE_NOT_FOUND') {
    throw new NotificationTestApiError(
      {
        reason: 'NOTIFICATION_TEST_UNAVAILABLE',
        message: 'Notification testing is not available.',
        status: cause.status,
      },
      cause,
    );
  }
  if (!cause.reason) throw cause;
  throw new NotificationTestApiError(
    {
      reason: cause.reason,
      message: localizedMessage(cause.payload) ?? cause.message,
      status: cause.status,
    },
    cause,
  );
}

function localizedMessage(payload: unknown): string | undefined {
  if (!isRecord(payload) || !isRecord(payload.error)) return undefined;
  const localized = payload.error.localizedMessage;
  return isRecord(localized) && typeof localized.message === 'string'
    ? localized.message
    : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
