import { defineSeed, type SeedDefinition } from '@nocobase/db';

// The single settings row. An existing row is left as it is.
const seed: SeedDefinition = defineSeed({
  name: '202609300005_pm_default_settings',

  async run({ query }) {
    const existing = await query
      .selectFrom('pmSettings')
      .select('id')
      .where('id', '=', 'default')
      .executeTakeFirst();
    if (existing) return;
    const now = new Date();
    await query
      .insertInto('pmSettings')
      .values({
        id: 'default',
        issuePrefix: 'PM',
        issueCounter: 0,
        values: JSON.stringify({}),
        createdAt: now,
        updatedAt: now,
      })
      .execute();
  },
});

export default seed;
