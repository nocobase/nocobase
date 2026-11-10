import { defineSeed, type SeedDefinition } from '@nocobase/db';
const seed: SeedDefinition = defineSeed({
  name: '002_records',
  async run({ repository }) {
    await repository('moduleRecords').createOne({ values: { id: 'once' } });
  },
});
export default seed;
