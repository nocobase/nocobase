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
