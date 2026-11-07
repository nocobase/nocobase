import { fileURLToPath } from 'node:url';
import { describeMigration } from '@nocobase/app-testing/server';

export const sources = [
  {
    packageName: '@nocobase/app-plugin-foundation',
    directory: fileURLToPath(
      new URL('../../database/migrations', import.meta.url),
    ),
  },
];

describeMigration('202611070002_foundation_snapshots', {
  sources,
  up: async ({ expectCollection }) => {
    await expectCollection('foundationSnapshots').toHaveField('revision', {
      type: 'integer',
      nullable: false,
    });
    await expectCollection('foundationSnapshots').toHaveField('overview', {
      type: 'json',
    });
    await expectCollection('foundationSnapshots').toHaveField('kernelVersion', {
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('foundationSnapshots').not.toExist();
  },
});
