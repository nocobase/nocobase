import { defineSeed, type SeedDefinition } from '@nocobase/db';

const seed: SeedDefinition = defineSeed({
  name: '202601010001_library_seed_authors',
  async run({ repository }) {
    await repository('libraryAuthors').createOne({
      values: { id: 'author-1', name: 'Ada' },
    });
  },
});

export default seed;
