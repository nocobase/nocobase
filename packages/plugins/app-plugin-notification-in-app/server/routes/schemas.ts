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
