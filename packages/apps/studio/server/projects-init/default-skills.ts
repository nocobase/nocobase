import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type { Projects } from '@nocobase/app-plugin-projects/server/tokens';
import type { DatabaseConnection } from '@nocobase/db';
import { SkillIdsSchema } from '@nocobase/app-plugin-agents/server/tokens';

export const ProjectDefaultSkillsSchema = SkillIdsSchema;
const KEY = 'projectDefaultSkills';

/** Missing configuration means no project defaults; creation copies this list once. */
export async function readProjectDefaultSkills(
  conn: DatabaseConnection,
): Promise<string[]> {
  const row = await conn.query
    .selectFrom('studioSettings')
    .select('value')
    .where('key', '=', KEY)
    .executeTakeFirst();
  if (!row) return [];
  const value: unknown =
    typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
  return ProjectDefaultSkillsSchema.parse(value).skillIds;
}

export async function writeProjectDefaultSkills(
  conn: DatabaseConnection,
  skillIds: readonly string[],
): Promise<void> {
  const existing = await conn.query
    .selectFrom('studioSettings')
    .select('key')
    .where('key', '=', KEY)
    .executeTakeFirst();
  const value = JSON.stringify({ skillIds });
  const at = new Date();
  if (existing)
    await conn.query
      .updateTable('studioSettings')
      .set({ value, updatedAt: at })
      .where('key', '=', KEY)
      .execute();
  else
    await conn.query
      .insertInto('studioSettings')
      .values({ key: KEY, value, createdAt: at, updatedAt: at })
      .execute();
}

/** Defaults are copied before commit so an invalid list rolls back the whole project. */
export function bindProjectDefaultSkills(
  projects: Projects,
  skills: Agents['skills'],
): () => void {
  return projects.tx.beforeCommit(async (tx, events) => {
    for (const event of events) {
      if (event.type !== 'project.created') continue;
      const skillIds = await readProjectDefaultSkills(tx.conn);
      if (skillIds.length > 0)
        await skills.attach(
          { scope: 'project', scopeId: event.projectId },
          skillIds,
          tx.conn,
        );
    }
  });
}
