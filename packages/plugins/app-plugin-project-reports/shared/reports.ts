import { z } from 'zod';
import { validDay, validTimezone } from './time.js';

export const REPORT_NAMESPACE = '@nocobase/app-plugin-project-reports';
export const REPORT_SUBJECT = 'project-report';
export const REPORT_PAGE = 'reports';
export const METRIC_VERSION = 1;
export const REPORT_KINDS = ['feature', 'architecture', 'criticalFix', 'risk', 'fix', 'maintenance'] as const;
export const FILE_KINDS = ['source', 'test', 'documentation', 'configuration', 'generated'] as const;
export const REPORT_STATES = ['queued', 'running', 'completed', 'failed', 'cancelled'] as const;
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const id = z.string().min(1).max(100);
const sha = z.string().regex(/^[a-f0-9]{40,64}$/u);
export const DaySchema = z.string().refine(validDay, 'Use a real calendar date in YYYY-MM-DD format.');
export const TimezoneSchema = z.string().refine(validTimezone, 'Use an IANA timezone.');

export const SettingsInputSchema = z.strictObject({
  enabled: z.boolean(),
  agentId: id,
  timezone: TimezoneSchema,
  hour: z.number().int().min(0).max(23),
  language: z.enum(['en', 'zh-CN']),
  expectedRevision: count,
});
export type SettingsInput = z.infer<typeof SettingsInputSchema>;
export const SettingsSchema = SettingsInputSchema.omit({ expectedRevision: true }).extend({
  projectId: id, actorUserId: id, revision: count, updatedAt: z.string(),
});
export type ReportSettings = z.infer<typeof SettingsSchema>;

export const RepositorySchema = z.strictObject({
  resourceId: id, url: z.string().min(1).max(2000), ref: z.string().min(1).max(255).nullable(),
});
export type ReportRepository = z.infer<typeof RepositorySchema>;
export const IssueEventSchema = z.strictObject({
  id, identifier: z.string().max(100), title: z.string().max(1000),
  event: z.enum(['created', 'completed', 'cancelled', 'reopened']),
  at: z.string(),
});
export type IssueEvent = z.infer<typeof IssueEventSchema>;
export const IssueMetricsSchema = z.strictObject({
  created: count, completed: count, cancelled: count, reopened: count,
});
export type IssueMetrics = z.infer<typeof IssueMetricsSchema>;
export const ContextSchema = z.strictObject({
  version: z.literal(1), attemptId: id, projectId: id, projectName: z.string().max(255),
  date: DaySchema, timezone: TimezoneSchema,
  start: z.iso.datetime(), end: z.iso.datetime(),
  language: z.enum(['en', 'zh-CN']),
  repositories: z.array(RepositorySchema).max(20),
  issues: IssueMetricsSchema,
  issueEvents: z.array(IssueEventSchema).max(1000),
  issueEventsTruncated: z.boolean(),
});
export type ReportContext = z.infer<typeof ContextSchema>;

export const FileChangeSchema = z.strictObject({
  path: z.string().min(1).max(2000), previousPath: z.string().max(2000).nullable(),
  kind: z.enum(FILE_KINDS), additions: count.nullable(), deletions: count.nullable(),
});
export type FileChange = z.infer<typeof FileChangeSchema>;
export const TestDeltaSchema = z.strictObject({
  quality: z.enum(['manifest', 'estimated', 'unavailable']),
  added: count.nullable(), removed: count.nullable(),
  reason: z.string().max(1000).nullable(),
});
export type TestDelta = z.infer<typeof TestDeltaSchema>;
export const CommitSchema = z.strictObject({ sha, title: z.string().max(2000) });
export const RepositoryResultSchema = z.strictObject({
  resourceId: id, state: z.enum(['complete', 'unavailable']),
  baseSha: sha.nullable(), headSha: sha.nullable(),
  boundary: z.literal('first-parent-committer-time'),
  files: z.array(FileChangeSchema).max(20_000),
  commits: z.array(CommitSchema).max(2000), commitsTruncated: z.boolean(),
  tests: TestDeltaSchema,
  warning: z.string().max(2000).nullable(),
});
export type RepositoryResult = z.infer<typeof RepositoryResultSchema>;
export const SourceSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('commit'), resourceId: id, sha }),
  z.strictObject({ type: z.literal('issue'), id }),
]);
export const HighlightSchema = z.strictObject({
  kind: z.enum(REPORT_KINDS), title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(2000),
  sources: z.array(SourceSchema).min(1).max(20),
});
export type Highlight = z.infer<typeof HighlightSchema>;
export const NarrativeSchema = z.strictObject({
  overview: z.string().trim().max(1600),
  highlights: z.array(HighlightSchema).max(20),
});
export const SubmissionSchema = z.strictObject({
  version: z.literal(1),
  repositories: z.array(RepositoryResultSchema).max(20),
  narrative: NarrativeSchema,
});
export type ReportSubmission = z.infer<typeof SubmissionSchema>;
export const TotalsSchema = z.strictObject({
  code: z.strictObject({ additions: count, deletions: count }),
  tests: TestDeltaSchema,
  issues: IssueMetricsSchema,
  coverage: z.enum(['complete', 'partial', 'unavailable']),
});
export type ReportTotals = z.infer<typeof TotalsSchema>;
export const PublishedSchema = z.strictObject({
  attemptId: id, generatedAt: z.string(), context: ContextSchema,
  totals: TotalsSchema, submission: SubmissionSchema,
});
export type PublishedReport = z.infer<typeof PublishedSchema>;
export const ReportSchema = z.strictObject({
  id, projectId: id, date: DaySchema, timezone: TimezoneSchema, scopeHash: z.string(),
  state: z.enum(REPORT_STATES), attemptId: id, runId: id.nullable(),
  error: z.string().nullable(), published: PublishedSchema.nullable(),
  createdAt: z.string(), updatedAt: z.string(),
});
export type ProjectReport = z.infer<typeof ReportSchema>;
export const ProjectOptionSchema = z.strictObject({
  id, name: z.string(), canManage: z.boolean(), settings: SettingsSchema.nullable(),
});
export const PageSchema = z.strictObject({
  projects: z.array(ProjectOptionSchema),
  agents: z.array(z.strictObject({ id, name: z.string() })),
  reports: z.array(ReportSchema),
});
export type ReportsPage = z.infer<typeof PageSchema>;

/** Numeric figures are derived from the collector's file facts, never from model-written prose. */
export function totalsOf(context: ReportContext, submission: ReportSubmission): ReportTotals {
  const complete = submission.repositories.filter((repo) => repo.state === 'complete');
  const code = { additions: 0, deletions: 0 };
  for (const repo of complete) for (const file of repo.files) {
    if (file.kind !== 'source') continue;
    code.additions += file.additions ?? 0;
    code.deletions += file.deletions ?? 0;
  }
  const measured = complete.filter((repo) => repo.tests.quality !== 'unavailable');
  const allTests = measured.length === submission.repositories.length && measured.length > 0;
  return {
    code,
    tests: allTests ? {
      quality: measured.every((repo) => repo.tests.quality === 'manifest') ? 'manifest' : 'estimated',
      added: measured.reduce((sum, repo) => sum + (repo.tests.added ?? 0), 0),
      removed: measured.reduce((sum, repo) => sum + (repo.tests.removed ?? 0), 0),
      reason: measured.some((repo) => repo.tests.quality === 'estimated') ? 'Static test declarations; parameterized and runtime-generated cases are not enumerated.' : null,
    } : { quality: 'unavailable', added: null, removed: null, reason: 'A complete comparable test inventory was not available for every repository.' },
    issues: context.issues,
    coverage: complete.length === submission.repositories.length ? 'complete' : complete.length > 0 ? 'partial' : 'unavailable',
  };
}

export function validateSubmission(context: ReportContext, submission: ReportSubmission): void {
  const expected = new Set(context.repositories.map((repo) => repo.resourceId));
  const seen = new Set<string>();
  for (const repo of submission.repositories) {
    if (!expected.has(repo.resourceId) || seen.has(repo.resourceId)) throw new Error('Unexpected or duplicate repository.');
    seen.add(repo.resourceId);
    if (repo.state === 'complete' && !repo.headSha) throw new Error('A complete repository needs a head commit.');
    if (repo.state === 'unavailable' && (repo.files.length || repo.tests.added !== null || repo.tests.removed !== null)) throw new Error('Unavailable repository metrics must not be fabricated as zero.');
    if (repo.tests.quality === 'unavailable' ? repo.tests.added !== null || repo.tests.removed !== null : repo.tests.added === null || repo.tests.removed === null) throw new Error('Inconsistent test precision.');
    const paths = new Set<string>();
    for (const file of repo.files) {
      if (paths.has(file.path)) throw new Error('Duplicate file statistics.');
      paths.add(file.path);
      if ((file.additions === null) !== (file.deletions === null)) throw new Error('Binary file counts must both be null.');
    }
  }
  if (seen.size !== expected.size) throw new Error('Every configured repository must have a result, including failures.');
  const issueIds = new Set(context.issueEvents.map((event) => event.id));
  for (const highlight of submission.narrative.highlights) for (const source of highlight.sources) {
    if (source.type === 'issue') {
      if (!issueIds.has(source.id)) throw new Error('The summary cites an issue outside its evidence.');
    } else {
      const repo = submission.repositories.find((item) => item.resourceId === source.resourceId);
      if (!repo || ![repo.headSha, ...repo.commits.map((commit) => commit.sha)].includes(source.sha)) throw new Error('The summary cites a commit outside its evidence.');
    }
  }
}
