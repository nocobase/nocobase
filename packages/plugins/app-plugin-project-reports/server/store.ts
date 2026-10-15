import { createHash } from 'node:crypto';
import type { DatabaseConnection } from '@nocobase/db';
import { z } from 'zod';
import { ContextSchema, PublishedSchema, REPORT_STATES, SettingsSchema, TotalsSchema, type PublishedReport, type ReportContext, type ReportSettings, type ReportTotals } from '../shared/reports.js';
import { FactsSchema, type ReportFacts } from '../shared/page.js';

export const SETTINGS = 'projectReportSettings';
export const REPORTS = 'projectReports';
export const ATTEMPTS = 'projectReportAttempts';
export const hash = (value: unknown): string => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const json = (value: unknown): unknown => typeof value === 'string' ? JSON.parse(value) as unknown : value;
export const iso = (value: unknown): string => value instanceof Date ? value.toISOString() : String(value);
export const nullableString = (value: unknown): string | null => value === null || value === undefined ? null : String(value);

export interface ReportRecord {
  id: string; projectId: string; date: string; timezone: string; scopeHash: string;
  generation: number; attemptId: string; publishedAttemptId: string | null;
  createdAt: string; updatedAt: string;
}
export interface Attempt {
  id: string; reportId: string; runId: string | null;
  state: (typeof REPORT_STATES)[number]; error: string | null;
  context: ReportContext; facts: ReportFacts | null; factsHash: string | null;
  totals: ReportTotals | null; published: PublishedReport | null; publishedHash: string | null;
}

function reportOf(row: Record<string, unknown>): ReportRecord {
  return { id: String(row.id), projectId: String(row.projectId), date: String(row.date), timezone: String(row.timezone), scopeHash: String(row.scopeHash), generation: Number(row.generation), attemptId: String(row.attemptId), publishedAttemptId: nullableString(row.publishedAttemptId), createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt) };
}
function attemptOf(row: Record<string, unknown>): Attempt {
  return { id: String(row.id), reportId: String(row.reportId), runId: nullableString(row.runId), state: z.enum(REPORT_STATES).parse(row.state), error: nullableString(row.error), context: ContextSchema.parse(json(row.context)), facts: row.facts == null ? null : FactsSchema.parse(json(row.facts)), factsHash: nullableString(row.factsHash), totals: row.totals == null ? null : TotalsSchema.parse(json(row.totals)), published: row.published == null ? null : PublishedSchema.parse(json(row.published)), publishedHash: nullableString(row.publishedHash) };
}

export async function settings(conn: DatabaseConnection, projectId: string): Promise<ReportSettings | null> {
  const row = await conn.query.selectFrom(SETTINGS).select('config').where('projectId', '=', projectId).executeTakeFirst();
  return row ? SettingsSchema.parse(json(row.config)) : null;
}
export async function enabledSettings(conn: DatabaseConnection): Promise<ReportSettings[]> {
  const rows = await conn.query.selectFrom(SETTINGS).select('config').where('enabled', '=', true).execute();
  return rows.map((row) => SettingsSchema.parse(json(row.config)));
}
export async function report(conn: DatabaseConnection, id: string): Promise<ReportRecord | null> {
  const row = await conn.query.selectFrom(REPORTS).selectAll().where('id', '=', id).executeTakeFirst();
  return row ? reportOf(row) : null;
}
export async function attempt(conn: DatabaseConnection, id: string): Promise<Attempt | null> {
  const row = await conn.query.selectFrom(ATTEMPTS).selectAll().where('id', '=', id).executeTakeFirst();
  return row ? attemptOf(row) : null;
}
export async function reportsIn(conn: DatabaseConnection, projectIds: readonly string[], from: string, to: string): Promise<ReportRecord[]> {
  if (!projectIds.length) return [];
  const rows = await conn.query.selectFrom(REPORTS).selectAll().where('projectId', 'in', [...projectIds]).where('date', '>=', from).where('date', '<=', to).orderBy('createdAt', 'desc').limit(10_001).execute();
  if (rows.length > 10_000) throw new Error('Narrow the project report query.');
  // A changed repository scope starts a new history series, not a duplicate daily card.
  const latest = new Map<string, ReportRecord>();
  for (const row of rows) {
    const record = reportOf(row);
    const key = `${record.projectId}:${record.date}`;
    if (!latest.has(key)) latest.set(key, record);
  }
  return [...latest.values()];
}
export async function attemptsById(conn: DatabaseConnection, ids: readonly string[]): Promise<Map<string, Attempt>> {
  const result = new Map<string, Attempt>();
  const unique = [...new Set(ids)];
  for (let offset = 0; offset < unique.length; offset += 200) {
    const rows = await conn.query.selectFrom(ATTEMPTS).selectAll().where('id', 'in', unique.slice(offset, offset + 200)).execute();
    for (const row of rows) { const value = attemptOf(row); result.set(value.id, value); }
  }
  return result;
}
export async function trendTotals(conn: DatabaseConnection, ids: readonly string[]): Promise<Map<string, ReportTotals>> {
  const result = new Map<string, ReportTotals>();
  const unique = [...new Set(ids)];
  for (let offset = 0; offset < unique.length; offset += 200) {
    const rows = await conn.query.selectFrom(ATTEMPTS).select(['id', 'totals']).where('id', 'in', unique.slice(offset, offset + 200)).where('state', '=', 'completed').execute();
    for (const row of rows) if (row.totals != null) result.set(String(row.id), TotalsSchema.parse(json(row.totals)));
  }
  return result;
}

export function uniqueViolation(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = 'code' in error ? String(error.code) : '';
  return code === '23505' || code === 'ER_DUP_ENTRY' || /SQLITE_CONSTRAINT_(UNIQUE|PRIMARYKEY)/u.test(code) || /UNIQUE constraint failed|duplicate key|Duplicate entry/iu.test(error.message);
}
