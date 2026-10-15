import { z } from 'zod';
import { ContextSchema, DaySchema, NarrativeSchema, ProjectOptionSchema, RepositoryResultSchema, REPORT_STATES, SettingsSchema, TotalsSchema } from './reports.js';

export const FactsSchema = z.strictObject({ version: z.literal(1), repositories: z.array(RepositoryResultSchema).max(20) });
export type ReportFacts = z.infer<typeof FactsSchema>;
export const ReportCardSchema = z.strictObject({
  id: z.string(), projectId: z.string(), projectName: z.string(), date: DaySchema,
  timezone: z.string(), scopeHash: z.string(), attemptId: z.string(), runId: z.string().nullable(),
  state: z.enum(REPORT_STATES), error: z.string().nullable(),
  draftTotals: TotalsSchema.nullable(),
  published: z.strictObject({
    attemptId: z.string(), generatedAt: z.string(), totals: TotalsSchema,
    narrative: NarrativeSchema, warnings: z.array(z.string()),
  }).nullable(),
});
export type ReportCard = z.infer<typeof ReportCardSchema>;
export const TrendSchema = z.strictObject({
  projectId: z.string(), date: DaySchema, timezone: z.string(), scopeHash: z.string(),
  totals: TotalsSchema.nullable(),
});
export type ReportTrend = z.infer<typeof TrendSchema>;
export const PageDataSchema = z.strictObject({
  projects: z.array(ProjectOptionSchema.extend({ repositories: z.number().int().nonnegative() })),
  agents: z.array(z.strictObject({ id: z.string(), name: z.string() })),
  reports: z.array(ReportCardSchema), trends: z.array(TrendSchema),
});
export type PageData = z.infer<typeof PageDataSchema>;
export const CurrentContextSchema = z.strictObject({ context: ContextSchema, facts: FactsSchema.nullable() });
export const GenerateSchema = z.strictObject({ date: DaySchema, retry: z.boolean().default(false) });
export { SettingsSchema };
