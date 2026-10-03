import { defineSeed, type SeedDefinition } from '@nocobase/db';

const seed: SeedDefinition = defineSeed({
  name: '202601010001_fixture_seed_items',
  async run({ query }) {
    await query
      .insertInto('fixtureItems')
      .values([{ name: 'first' }, { name: 'second' }])
      .execute();
  },
});

export default seed;
