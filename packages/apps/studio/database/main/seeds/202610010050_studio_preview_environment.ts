import { defineSeed, type SeedDefinition } from '@nocobase/db';

// Studio's "Preview" release environment, on the local App Host, created once on a fresh installation. A seed cannot
// reach release management's services (the environment is checked against its driver, which runs only in the
// application), so this only asks for it: it records `previewEnvironment` as pending in Studio's settings, and Studio's
// releases provider (`server/releases/provider.ts`) creates the environment once the application starts, then records
// it done. `studio.releases.previewEnvironment: false` asks for nothing. Seeds run once, so deleting the environment
// later does not bring it back.
//
// Self-contained on purpose: a seed is a fixed historical operation, so nothing is imported from server/ or shared/.

const seed: SeedDefinition = defineSeed({
  name: '202610010050_studio_preview_environment',
  async run({ query, config }) {
    if (config.get<unknown>('studio.releases.previewEnvironment') === false)
      return;
    const existing = await query
      .selectFrom('studioSettings')
      .select('key')
      .where('key', '=', 'previewEnvironment')
      .executeTakeFirst();
    if (existing) return;
    const now = new Date();
    await query
      .insertInto('studioSettings')
      .values({
        key: 'previewEnvironment',
        value: JSON.stringify({ state: 'pending' }),
        createdAt: now,
        updatedAt: now,
      })
      .execute();
  },
});

export default seed;
