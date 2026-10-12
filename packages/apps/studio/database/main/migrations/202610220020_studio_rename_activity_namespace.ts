import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';
import type { Knex } from 'knex';

const OLD_NAMESPACE = 'studio';
const NEW_NAMESPACE = '@nocobase/studio';

/** Rewrites every `{ ns: from }` in a JSON value to `to`; returns null when there is none. */
function renameNamespace(value: unknown, from: string, to: string): unknown {
  let changed = false;
  const visit = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(visit);
    if (node === null || typeof node !== 'object') return node;
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(node)) {
      if (key === 'ns' && child === from) {
        out[key] = to;
        changed = true;
      } else out[key] = visit(child);
    }
    return out;
  };
  const next = visit(value);
  return changed ? next : null;
}

async function rename(
  { query, connection }: MigrationContext,
  from: string,
  to: string,
): Promise<void> {
  // The projects plugin owns the activities; an application without it has none to rewrite.
  const knex = await connection.client<Knex>();
  if (!(await knex.schema.hasTable('pm_activities'))) return;
  // Only the workflow's owner notices copy a translatable message into their details.
  const activities = await query
    .selectFrom('pmActivities')
    .select(['id', 'details'])
    .where('action', '=', 'owner_notified')
    .execute();
  for (const activity of activities) {
    const details: unknown =
      typeof activity.details === 'string'
        ? JSON.parse(activity.details)
        : activity.details;
    const next = renameNamespace(details, from, to);
    if (next === null) continue;
    await query
      .updateTable('pmActivities')
      .set({ details: next })
      .where('id', '=', activity.id)
      .execute();
  }
}

/**
 * `202610220010_studio_rename_package` moved Studio's i18n namespace from `studio` to `@nocobase/studio` in the
 * workflow definitions; the owner notices those workflows already recorded keep a copy of the message in their
 * activity details, which the inbox and an issue's recent activity translate, so they move too.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610220020_studio_rename_activity_namespace',
  async up(context) {
    await rename(context, OLD_NAMESPACE, NEW_NAMESPACE);
  },
  async down(context) {
    await rename(context, NEW_NAMESPACE, OLD_NAMESPACE);
  },
});

export default migration;
