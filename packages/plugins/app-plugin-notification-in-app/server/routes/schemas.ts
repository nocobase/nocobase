import { z } from 'zod';

export const DEFAULT_INBOX_PAGE_SIZE = 20;
export const MAX_INBOX_PAGE_SIZE = 100;
const MAX_PAGE_TOKEN_LENGTH = 2_048;

/** The query of `GET /notificationInApp/messages`, a cursor-paged list, newest first. */
export const InboxListQuery: z.ZodObject<{
  pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
  pageToken: z.ZodOptional<z.ZodString>;
  unreadOnly: z.ZodOptional<z.ZodEnum<{ true: 'true'; false: 'false' }>>;
}> = z.object({
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_INBOX_PAGE_SIZE)
    .default(DEFAULT_INBOX_PAGE_SIZE),
  pageToken: z.string().min(1).max(MAX_PAGE_TOKEN_LENGTH).optional(),
  unreadOnly: z.enum(['true', 'false']).optional(),
});
export type InboxListQuery = z.infer<typeof InboxListQuery>;

export const InboxMessageParams: z.ZodObject<{ messageId: z.ZodString }> =
  z.object({ messageId: z.string().min(1) });

// Response schemas. They describe what the routes send in the API document at `/api/swagger/docs`; nothing validates a
// response against them.

export const InboxMessageSchema: z.ZodType = z
  .object({
    id: z.string(),
    deliveryId: z.string().meta({
      description:
        'The notification delivery that put the message in this inbox.',
    }),
    notificationId: z.string(),
    userId: z
      .string()
      .meta({ description: 'The recipient, always the signed-in user.' }),
    title: z.string().optional(),
    body: z.string(),
    target: z
      .discriminatedUnion('type', [
        z.object({
          type: z.literal('route'),
          path: z.string().meta({
            description: 'An application route path starting with `/`.',
          }),
        }),
        z.object({
          type: z.literal('url'),
          url: z.string().meta({ description: 'A complete HTTP(S) URL.' }),
        }),
      ])
      .optional()
      .meta({ description: 'Where opening the message leads.' }),
    readAt: z.iso.datetime().optional().meta({
      description: 'When the message was read; absent while it is unread.',
    }),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ ref: 'NotificationInAppMessage' });

export const InboxUnreadCountSchema: z.ZodType = z.object({
  count: z
    .number()
    .int()
    .min(0)
    .meta({ description: 'The number of unread messages in the inbox.' }),
});

export const InboxMarkAllReadSchema: z.ZodType = z.object({
  updated: z
    .number()
    .int()
    .min(0)
    .meta({ description: 'How many messages this request marked read.' }),
});
