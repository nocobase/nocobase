/**
 * The skill collections: `agSkills`, their versions (`agSkillVersions`) and where they are attached
 * (`agSkillAttachments`). Only the skills domain reads or writes them.
 */
import type { DatabaseConnection, Repository } from '@nocobase/db';

import type { SkillScope } from '../../../shared/skills.js';

export interface SkillRecord {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly currentVersion: number;
  readonly createdById: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SkillVersionRecord {
  readonly id: string;
  readonly skillId: string;
  readonly version: number;
  readonly name: string;
  readonly description: string;
  readonly content: string;
  /** `ManifestEntry[]`, as stored. */
  readonly manifest: unknown;
  readonly note: string | null;
  readonly contentHash: string;
  readonly createdById: string | null;
  readonly createdAt: string;
}

export interface AttachmentRecord {
  readonly id: string;
  readonly skillId: string;
  readonly scope: SkillScope;
  readonly scopeId: string;
  readonly createdAt: string;
}

export function skillsRepo(conn: DatabaseConnection): Repository<SkillRecord> {
  return conn.repository<SkillRecord>('agSkills');
}

export function versionsRepo(
  conn: DatabaseConnection,
): Repository<SkillVersionRecord> {
  return conn.repository<SkillVersionRecord>('agSkillVersions');
}

export function attachmentsRepo(
  conn: DatabaseConnection,
): Repository<AttachmentRecord> {
  return conn.repository<AttachmentRecord>('agSkillAttachments');
}

/** The skills attached to a scope, in the order they were attached. */
export async function attachedSkillIds(
  conn: DatabaseConnection,
  scope: SkillScope,
  scopeId: string,
): Promise<string[]> {
  const rows = await attachmentsRepo(conn).findMany({
    filter: { scope, scopeId },
    sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
  });
  return rows.map((row) => row.skillId);
}

/** Per scope id, the skills attached, for many scopes of one kind at once. */
export async function attachedSkillIdsOf(
  conn: DatabaseConnection,
  scope: SkillScope,
  scopeIds: readonly string[],
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  if (scopeIds.length === 0) return result;
  const rows = await attachmentsRepo(conn).findMany({
    filter: (f) =>
      f.and([
        f.string('scope').eq(scope),
        f.or(scopeIds.map((id) => f.string('scopeId').eq(id))),
      ]),
    sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
  });
  for (const row of rows) {
    const list = result.get(row.scopeId) ?? [];
    list.push(row.skillId);
    result.set(row.scopeId, list);
  }
  return result;
}

/**
 * Makes `skillIds` the skills attached to the scope, keeping the order given; unknown skills are refused by the
 * caller. Returns the ids now attached.
 */
export async function replaceAttachments(
  conn: DatabaseConnection,
  scope: SkillScope,
  scopeId: string,
  skillIds: readonly string[],
  ids: () => string,
  now: string,
): Promise<string[]> {
  await attachmentsRepo(conn).deleteMany({ filter: { scope, scopeId } });
  const unique = [...new Set(skillIds)];
  // Distinct, increasing times keep the order given.
  const base = Date.parse(now);
  for (const [index, skillId] of unique.entries())
    await attachmentsRepo(conn).createOne({
      values: {
        id: ids(),
        skillId,
        scope,
        scopeId,
        createdAt: new Date(base + index).toISOString(),
      },
    });
  return unique;
}
