import { z } from 'zod';

import {
  NotificationAttemptSchema,
  NotificationDeliverySchema,
  NotificationRetryAuditSchema,
} from './schemas.js';
import { templateTextSchema } from './template-schemas.js';

/** The outcome groups the delivery log filters and counts by. */
export const DELIVERY_OUTCOMES = [
  'failed',
  'retrying',
  'unknown',
  'pending',
  'accepted',
] as const;
export type NotificationDeliveryOutcome = (typeof DELIVERY_OUTCOMES)[number];

/** The delivery statuses of each outcome group. */
export const OUTCOME_STATUSES: Readonly<
  Record<NotificationDeliveryOutcome, readonly string[]>
> = {
  failed: ['failed'],
  retrying: ['retrying'],
  unknown: ['unknown'],
  pending: ['pending', 'preparing', 'submitting'],
  accepted: ['accepted'],
};

export const channelParams: z.ZodObject<{ name: z.ZodString }> = z.object({
  name: z.string().min(1).max(200),
});

export const deliveryParams: z.ZodObject<{ deliveryId: z.ZodString }> =
  z.object({ deliveryId: z.string().min(1).max(64) });

const summaryItem = z.object({
  label: templateTextSchema,
  value: z.string().meta({
    description: 'A safe value: secrets are masked, never returned.',
  }),
});

export const channelSchema: z.ZodType = z
  .object({
    name: z.string(),
    type: z.string().meta({ description: 'The configured channel type.' }),
    channelType: z.string().meta({
      description:
        'The message family kinds and preferences use: `in-app`, `email`, `web-push` or `im`.',
    }),
    typeLabel: templateTextSchema.optional(),
    contributor: z.string().optional().meta({
      description: 'The package that registered the channel type.',
    }),
    enabled: z.boolean(),
    summary: z.array(summaryItem),
    testable: z.boolean(),
    reachesUsers: z.boolean().meta({
      description: 'Whether `notify()` can send to users through it.',
    }),
    last24h: z.object({
      accepted: z.number().int().min(0),
      failed: z.number().int().min(0),
      pending: z.number().int().min(0),
      unknown: z.number().int().min(0),
    }),
  })
  .meta({ ref: 'NotificationChannel' });

export const deliverySettingsSchema: z.ZodType = z
  .object({
    retry: z.object({
      maxAttempts: z.number().int().min(1),
      intervalMs: z.number().int().min(0),
      configured: z.boolean().meta({
        description: 'Whether `notification.retry` sets them; else defaults.',
      }),
    }),
    jobs: z.string().optional().meta({
      description:
        'The `jobs` configuration deliveries run on; absent means `jobs.default`.',
    }),
  })
  .meta({ ref: 'NotificationDeliverySettings' });

export const testResultSchema: z.ZodType = z
  .object({
    notificationId: z.string(),
    status: z.string(),
  })
  .meta({ ref: 'NotificationChannelTestResult' });

const deliveryLogEntryShape = {
  delivery: NotificationDeliverySchema,
  kind: z.string().optional(),
  sourceType: z.string(),
  sourceReferenceId: z.string().optional(),
  idempotencyKey: z.string().optional(),
};

export const deliveryLogEntrySchema: z.ZodType = z
  .object(deliveryLogEntryShape)
  .meta({ ref: 'NotificationDeliveryLogEntry' });

export const deliveryLogDetailsSchema: z.ZodType = z
  .object({
    ...deliveryLogEntryShape,
    attempts: z.array(NotificationAttemptSchema),
    retryAudits: z.array(NotificationRetryAuditSchema),
  })
  .meta({ ref: 'NotificationDeliveryLogDetails' });

export const deliveryListMeta: z.ZodType = z.object({
  nextPageToken: z.string().optional(),
  statusCounts: z
    .record(z.enum(DELIVERY_OUTCOMES), z.number().int().min(0))
    .meta({
      description:
        'Deliveries matching every filter except `status`, per outcome.',
    }),
});

const preferenceChannel = z.object({
  type: z.string(),
  policy: z.enum(['required', 'on', 'off']),
  adjustable: z.boolean(),
  enabled: z.boolean(),
});

export const preferencesSchema: z.ZodType = z
  .object({
    channelTypes: z.array(z.string()).meta({
      description:
        'The channel types an enabled channel can reach the person on.',
    }),
    kinds: z.array(
      z.object({
        id: z.string(),
        contributor: z.string(),
        name: templateTextSchema,
        category: templateTextSchema,
        categoryKey: z.string(),
        channels: z.array(preferenceChannel),
      }),
    ),
  })
  .meta({ ref: 'NotificationPreferences' });
