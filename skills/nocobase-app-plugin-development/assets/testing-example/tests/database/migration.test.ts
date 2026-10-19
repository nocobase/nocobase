import { fileURLToPath } from 'node:url';

import { describeMigration } from '@nocobase/app-testing/server';

import metadata from '../../package.json' with { type: 'json' };

describeMigration('202610180001_reading_list', {
  sources: [
    {
      packageName: metadata.name,
      directory: fileURLToPath(
        new URL('../../database/migrations', import.meta.url),
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('readingListEntries').toHaveField('title', {
      type: 'string',
      nullable: false,
      length: 255,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('readingListEntries').not.toExist();
  },
});
