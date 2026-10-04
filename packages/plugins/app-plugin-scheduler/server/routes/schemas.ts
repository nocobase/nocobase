import { z } from 'zod';

/** Rows a page holds unless the caller asks otherwise, and the most it may ask for. */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

const PageSize = z.coerce
  .number()
  .int()
  .min(1)
  .max(MAX_PAGE_SIZE)
  .default(DEFAULT_PAGE_SIZE);

export const ScheduleParams: z.ZodObject<{ scheduleId: z.ZodString }> =
  z.object({ scheduleId: z.string().min(1) });

export type ScheduleParams = z.infer<typeof ScheduleParams>;

/** The administration table pages by number, so it can show a total. */
export const ScheduleListQuery: z.ZodObject<{
  page: z.ZodDefault<z.ZodCoercedNumber>;
  pageSize: z.ZodDefault<z.ZodCoercedNumber>;
}> = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: PageSize,
});

export type ScheduleListQuery = z.infer<typeof ScheduleListQuery>;

/**
 * The page token is opaque to clients: it encodes how many of the newest occurrences earlier pages already returned.
 * History grows at the head, so an offset can repeat a row a new firing pushed down; it never skips one.
 */
export function encodeOccurrencePageToken(offset: number): string {
  return Buffer.from(`occurrences:${offset}`, 'utf8').toString('base64url');
}

function decodeOccurrencePageToken(token: string): number | undefined {
  const match = /^occurrences:(\d{1,9})$/u.exec(
    Buffer.from(token, 'base64url').toString('utf8'),
  );
  return match ? Number(match[1]) : undefined;
}

/** History is a feed, so it pages by cursor. */
export const OccurrenceListQuery: z.ZodObject<{
  pageSize: z.ZodDefault<z.ZodCoercedNumber>;
  pageToken: z.ZodPipe<
    z.ZodOptional<z.ZodString>,
    z.ZodTransform<number, string | undefined>
  >;
}> = z.object({
  pageSize: PageSize,
  pageToken: z
    .string()
    .optional()
    .transform((token, context): number => {
      if (token === undefined || token === '') return 0;
      const offset = decodeOccurrencePageToken(token);
      if (offset !== undefined) return offset;
      context.addIssue({
        code: 'custom',
        message: 'The page token is not one this server issued.',
      });
      return z.NEVER;
    }),
});

export type OccurrenceListQuery = z.infer<typeof OccurrenceListQuery>;
