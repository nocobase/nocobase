import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// Opening pull requests and managing previews became actions of their own (`studio.git/open-pr`,
// `studio.previews/manage`); they used to ride on `pm.issues/edit`. An agent configured with that keeps what it could
// do: it is given both. Merging pull requests is new and stays off.
const EDIT = 'pm.issues/edit';
const ADDED = ['studio.git/open-pr', 'studio.previews/manage'];

const actionsOf = (value: unknown): string[] => {
  const parsed: unknown =
    typeof value === 'string' ? JSON.parse(value) : (value ?? []);
  return Array.isArray(parsed)
    ? parsed.filter((item): item is string => typeof item === 'string')
    : [];
};

const migration: MigrationDefinition = defineMigration({
  name: '202610060010_studio_agent_dedicated_actions',

  async up({ builder, query }) {
    // No agents table, no agents: a database built without the agents plugin's migrations has nothing to give.
    if (!(await builder.hasCollection('agAgents'))) return;
    const rows = await query
      .selectFrom('agAgents')
      .select(['id', 'actions'])
      .execute();
    for (const row of rows) {
      const actions = actionsOf(row.actions);
      if (!actions.includes(EDIT)) continue;
      const next = [
        ...actions,
        ...ADDED.filter((key) => !actions.includes(key)),
      ];
      if (next.length === actions.length) continue;
      await query
        .updateTable('agAgents')
        .set({ actions: JSON.stringify(next) })
        .where('id', '=', row.id)
        .execute();
    }
  },

  async down({ builder, query }) {
    if (!(await builder.hasCollection('agAgents'))) return;
    const rows = await query
      .selectFrom('agAgents')
      .select(['id', 'actions'])
      .execute();
    for (const row of rows) {
      const actions = actionsOf(row.actions);
      const next = actions.filter((key) => !ADDED.includes(key));
      if (next.length === actions.length) continue;
      await query
        .updateTable('agAgents')
        .set({ actions: JSON.stringify(next) })
        .where('id', '=', row.id)
        .execute();
    }
  },
});

export default migration;
