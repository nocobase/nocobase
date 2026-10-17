/** Account quota observations. Unknown reset times never expire automatically. */
import { z } from 'zod';
export interface QuotaWindow {
  readonly window: string;
  readonly scope: 'tool' | 'provider' | 'model';
  readonly target: string;
  readonly resetsAt: string | null;
  readonly usedPercent?: number;
  readonly exhausted: boolean;
}
export const QuotaWindowSchema: z.ZodType<QuotaWindow> = z.object({
  window: z.string().min(1).max(100),
  scope: z.enum(['tool', 'provider', 'model']),
  target: z.string().max(200).default(''),
  resetsAt: z.iso.datetime().nullable(),
  usedPercent: z.number().min(0).max(100).optional(),
  exhausted: z.boolean(),
});
export interface QuotaReport {
  readonly windows: readonly QuotaWindow[];
}
export const QuotaReportSchema: z.ZodType<QuotaReport> = z.object({
  windows: z.array(QuotaWindowSchema).min(1).max(20),
});
