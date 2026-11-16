import { z } from 'zod';

export const DIAGNOSTICS_FEATURE = 'diagnostics' as const;
export const DIAGNOSTICS_MAX_BYTES: number = 20 * 1024 * 1024;
export const DIAGNOSTICS_MAX_RECORD: number = 64 * 1024;
export interface DiagnosticsWindow {
  since: string;
  until: string;
  runIds: string[];
  level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
}
export const DiagnosticsWindowSchema: z.ZodType<DiagnosticsWindow> = z
  .object({
    /** UTC instants bounding the selected local calendar days, end exclusive (DST supported). */
    since: z.iso.datetime({ offset: true }),
    until: z.iso.datetime({ offset: true }),
    /** Selected runs include all retained dates, subject to the same byte budget. */
    runIds: z
      .array(z.string().regex(/^[a-zA-Z0-9_-]{1,120}$/))
      .max(20)
      .default([]),
    level: z
      .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
      .optional(),
  })
  .refine((value) => {
    const duration = Date.parse(value.until) - Date.parse(value.since);
    return duration > 0 && duration <= 7 * 86400000 + 3 * 3600000;
  }, 'Select at most seven local calendar days');

export interface DiagnosticsRequest {
  requestId: string;
  window: DiagnosticsWindow;
  maxBytes: number;
  expiresAt: string;
}
export const DiagnosticsRequestSchema: z.ZodType<DiagnosticsRequest> = z.object(
  {
    requestId: z.uuid(),
    window: DiagnosticsWindowSchema,
    maxBytes: z
      .number()
      .int()
      .min(128 * 1024)
      .max(DIAGNOSTICS_MAX_BYTES),
    expiresAt: z.iso.datetime(),
  },
);

export interface DiagnosticsFile {
  file: string;
  dates: string[];
  bytes: number;
  truncated: boolean;
  omittedLines: number;
}
const FileSchema = z.object({
  file: z
    .string()
    .max(200)
    .regex(
      /^(?:runner\.\d{4}-\d{2}-\d{2}\.\d+\.log|runs\/\d{4}-\d{2}-\d{2}\/[a-zA-Z0-9_-]+\.log)$/,
    ),
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(1),
  bytes: z.number().int().nonnegative().max(DIAGNOSTICS_MAX_BYTES),
  truncated: z.boolean(),
  omittedLines: z.number().int().nonnegative(),
});
export const DiagnosticsFileSchema: z.ZodType<DiagnosticsFile> = FileSchema;
/** Gzip NDJSON: one environment, log records, then one terminal manifest. No archive paths are extracted. */
export type DiagnosticsRecord =
  | {
      type: 'environment';
      version: string;
      os: string;
      release: string;
      arch: string;
      node: string;
      tools: { tool: string; version: string | null }[];
    }
  | {
      type: 'log';
      file: string;
      entry: {
        time: string | number;
        level: string | number;
        msg: string;
        [key: string]: unknown;
      };
    }
  | { type: 'manifest'; files: DiagnosticsFile[]; truncated: boolean };
export const DiagnosticsRecordSchema: z.ZodType<DiagnosticsRecord> =
  z.discriminatedUnion('type', [
    z
      .object({
        type: z.literal('environment'),
        version: z.string().max(100),
        os: z.string().max(100),
        release: z.string().max(100),
        arch: z.string().max(30),
        node: z.string().max(100),
        tools: z
          .array(
            z.object({
              tool: z.string().max(50),
              version: z.string().max(100).nullable(),
            }),
          )
          .max(30),
      })
      .strict(),
    z
      .object({
        type: z.literal('log'),
        file: FileSchema.shape.file,
        entry: z
          .object({
            time: z.union([z.string().max(100), z.number()]),
            level: z.union([z.string().max(30), z.number()]),
            msg: z.string().max(32768),
          })
          .catchall(z.unknown()),
      })
      .strict(),
    z
      .object({
        type: z.literal('manifest'),
        files: z.array(DiagnosticsFileSchema).max(256),
        truncated: z.boolean(),
      })
      .strict(),
  ]);

/** Select UTC files that intersect the half-open local-day interval, including partial UTC days. */
export function diagnosticsDates(
  window: Pick<DiagnosticsWindow, 'since' | 'until'>,
): string[] {
  const first = new Date(window.since);
  first.setUTCHours(0, 0, 0, 0);
  const end = Date.parse(window.until);
  if (
    !Number.isFinite(first.getTime()) ||
    !Number.isFinite(end) ||
    end <= Date.parse(window.since) ||
    end - first.getTime() > 9 * 86400000
  )
    throw new Error('Invalid diagnostics date window');
  const dates: string[] = [];
  for (let time = first.getTime(); time < end; time += 86400000)
    dates.push(new Date(time).toISOString().slice(0, 10));
  return dates;
}
