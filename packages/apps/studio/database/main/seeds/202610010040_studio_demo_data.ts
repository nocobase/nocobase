import { defineSeed, type SeedDefinition } from '@nocobase/db';

// Studio's demo data, when `studio.demoData` is on at installation (`config.preview.example.yml`). A seed cannot reach
// the plugins' services, and the demo goes through them (accounts, projects, issues, agents), so this only asks for it:
// it records `demoData` as pending in Studio's settings, and Studio's demo provider (`server/demo`) builds the data once
// the application is ready, then records it done. Seeds run once, so turning the switch on later adds nothing.
//
// Self-contained on purpose: a seed is a fixed historical operation, so nothing is imported from server/ or shared/.

const seed: SeedDefinition = defineSeed({
  name: '202610010040_studio_demo_data',
  async run({ query, config }) {
    if (config.get<unknown>('studio.demoData') !== true) return;
    const existing = await query
      .selectFrom('studioSettings')
      .select('key')
      .where('key', '=', 'demoData')
      .executeTakeFirst();
    if (existing) return;
    const now = new Date();
    await query
      .insertInto('studioSettings')
      .values({
        key: 'demoData',
        value: JSON.stringify({ state: 'pending' }),
        createdAt: now,
        updatedAt: now,
      })
      .execute();
  },
});

export default seed;
