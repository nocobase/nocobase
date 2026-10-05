import { z } from 'zod';

export const DEFAULT_LOG_PAGE_SIZE = 20;
export const MAX_LOG_PAGE_SIZE = 100;
const MAX_PAGE_TOKEN_LENGTH = 2_048;

/** The query of `GET /notifications/logs`, a cursor-paged list, newest first. */
export const NotificationLogListQuery: z.ZodObject<{
  pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
  pageToken: z.ZodOptional<z.ZodString>;
}> = z.object({
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_LOG_PAGE_SIZE)
    .default(DEFAULT_LOG_PAGE_SIZE),
  pageToken: z.string().min(1).max(MAX_PAGE_TOKEN_LENGTH).optional(),
});
export type NotificationLogListQuery = z.infer<typeof NotificationLogListQuery>;

export const NotificationLogParams: z.ZodObject<{ logId: z.ZodString }> =
  z.object({ logId: z.string().min(1) });

export const NotificationTestSendParams: z.ZodObject<{
  testSendId: z.ZodString;
}> = z.object({ testSendId: z.string().min(1) });

/** The body of `POST /notifications/testSends`. */
export const NotificationTestSendBody: z.ZodObject<
  { channel: z.ZodString; values: z.ZodRecord<z.ZodString, z.ZodString> },
  z.core.$strict
> = z.strictObject({
  channel: z.string().min(1),
  values: z.record(z.string(), z.string()),
});
export type NotificationTestSendBody = z.infer<typeof NotificationTestSendBody>;

// Response schemas. They describe what the routes send in the API document at `/api/swagger/docs`; nothing validates a
// response against them.

const deliveryStatus = z.enum([
  'pending',
  'preparing',
  'submitting',
  'retrying',
  'accepted',
  'failed',
  'unknown',
]);

const notificationStatus = z.enum([
  'pending',
  'processing',
  'completed',
  'partial',
  'failed',
  'unknown',
]);

const errorSnapshot = z
  .object({
    code: z.string().optional(),
    message: z.string(),
    category: z
      .enum([
        'authentication',
        'channel',
        'configuration',
        'content',
        'network',
        'provider',
        'rate_limit',
        'recipient',
        'storage',
        'timeout',
        'unknown',
      ])
      .optional(),
  })
  .meta({ ref: 'NotificationProviderError' });

const retryResolution = z.object({
  type: z.literal('terminal_failure'),
  reason: z.string(),
  requestedAt: z.iso.datetime(),
});

const providerIdempotency = z.object({
  startedAt: z.iso.datetime(),
  expiresAt: z.iso.datetime().optional(),
});

export const NotificationLogDetailsSchema: z.ZodType = z
  .object({
    log: z
      .object({
        id: z.string().meta({ description: 'The notification id.' }),
        idempotencyKey: z.string().optional(),
        requestFingerprint: z.string().optional(),
        sourceType: z.string().meta({
          description:
            'Who sent the notification, such as `notification-test` for a test send.',
        }),
        sourceReferenceId: z.string().optional(),
        status: notificationStatus.meta({
          description: 'Summarized from the current state of every delivery.',
        }),
        createdAt: z.iso.datetime(),
        updatedAt: z.iso.datetime().meta({
          description: 'The latest change to the log or any of its deliveries.',
        }),
      })
      .meta({
        description:
          'The notification log. The message content is never included.',
      }),
    deliveries: z.array(
      z.object({
        delivery: z
          .object({
            id: z.string(),
            notificationId: z.string(),
            channelName: z.string(),
            channelType: z.string(),
            providerType: z.string(),
            attemptCount: z.number().int().min(0),
            status: deliveryStatus,
            nextRunAt: z.iso.datetime().optional(),
            lastError: errorSnapshot.optional(),
            retryResolution: retryResolution.optional(),
            providerIdempotency: providerIdempotency.optional(),
            createdAt: z.iso.datetime(),
            updatedAt: z.iso.datetime(),
          })
          .meta({
            description:
              'One channel delivery. The recipient and message snapshots are never included.',
          }),
        attempts: z.array(
          z.object({
            id: z.string(),
            deliveryId: z.string(),
            sequence: z.number().int().min(1),
            providerType: z.string(),
            status: z.enum(['submitting', 'accepted', 'failed', 'unknown']),
            startedAt: z.iso.datetime(),
            finishedAt: z.iso.datetime().optional(),
            providerMessageId: z.string().optional(),
            error: errorSnapshot.optional(),
            retryResolution: retryResolution.optional(),
          }),
        ),
        retryAudits: z.array(
          z.object({
            id: z.string(),
            deliveryId: z.string(),
            resolution: retryResolution,
            providerIdempotency: providerIdempotency.optional(),
            createdAt: z.iso.datetime(),
          }),
        ),
      }),
    ),
  })
  .meta({ ref: 'NotificationLogDetails' });

export const NotificationTestTargetSchema: z.ZodType = z
  .object({
    channel: z.object({
      name: z.string().meta({
        description:
          'The configured channel name to pass as `channel` when sending a test.',
      }),
      type: z.string(),
      label: z.string(),
    }),
    provider: z.object({ type: z.string(), label: z.string() }),
    fields: z
      .array(
        z.object({
          name: z
            .string()
            .meta({ description: 'The key of this field in `values`.' }),
          label: z.string(),
          type: z.enum(['text', 'email', 'textarea']),
          required: z.boolean().optional(),
          placeholder: z.string().optional(),
          defaultValue: z.string().optional(),
          maxLength: z.number().int().min(1).optional(),
        }),
      )
      .meta({
        description:
          'The values a test send to this channel takes. Labels are in the request locale.',
      }),
  })
  .meta({ ref: 'NotificationTestTarget' });

export const NotificationSendResultSchema: z.ZodType = z
  .object({
    notificationId: z.string().meta({
      description:
        'Pass it to `GET /api/notifications/testSends/{testSendId}` to follow the delivery.',
    }),
    idempotencyKey: z.string(),
    deduplicated: z.boolean(),
    status: notificationStatus,
    deliveries: z.array(
      z.object({
        id: z.string(),
        channelName: z.string(),
        channelType: z.string(),
        provider: z.object({ type: z.string() }),
        attemptCount: z.number().int().min(0),
        status: deliveryStatus,
        nextRunAt: z.iso.datetime().optional(),
        error: errorSnapshot.optional(),
        createdAt: z.iso.datetime(),
        updatedAt: z.iso.datetime(),
      }),
    ),
  })
  .meta({ ref: 'NotificationSendResult' });
