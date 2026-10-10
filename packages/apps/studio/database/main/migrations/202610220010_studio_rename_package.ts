import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';
import type { Knex } from 'knex';

const OLD_NAME = 'studio';
const NEW_NAME = '@nocobase/studio';

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
  // A fresh installation runs its migrations before any seed has been recorded, so the seed history may not exist.
  const knex = await connection.client<Knex>();
  for (const table of ['__nocobase_migrations', '__nocobase_seeds']) {
    if (!(await knex.schema.hasTable(table))) continue;
    await query
      .updateTable(table)
      .set({ packageName: to })
      .where('packageName', '=', from)
      .execute();
  }

  // The projects plugin owns the workflows; an application without it has none to rewrite.
  if (!(await knex.schema.hasTable('pm_workflows'))) return;
  const workflows = await query
    .selectFrom('pmWorkflows')
    .select(['id', 'definition'])
    .execute();
  for (const workflow of workflows) {
    const definition: unknown =
      typeof workflow.definition === 'string'
        ? JSON.parse(workflow.definition)
        : workflow.definition;
    const next = renameNamespace(definition, from, to);
    if (next === null) continue;
    await query
      .updateTable('pmWorkflows')
      .set({ definition: next })
      .where('id', '=', workflow.id)
      .execute();
  }
}

/**
 * Studio was published as `@nocobase/studio` when it moved into nocobase/nocobase; it had been `studio`. The package
 * name is the application's identity: the owner its migrations and seeds are recorded under, and its i18n namespace.
 * The history is matched by migration name, so nothing runs again without this, but the guard against an executed
 * migration missing from the sources only covers rows of a participating package, so the rows move to the new name.
 * Workflow definitions copied from the software template carry the namespace of their notification message.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610220010_studio_rename_package',
  async up(context) {
    await rename(context, OLD_NAME, NEW_NAME);
  },
  async down(context) {
    await rename(context, NEW_NAME, OLD_NAME);
  },
});

export default migration;
