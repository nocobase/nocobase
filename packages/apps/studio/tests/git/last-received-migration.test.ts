// @vitest-environment node
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';

describeMigration('202610190010_studio_git_last_received', {
  sources: [
    {
      packageName: 'studio-last-received-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('studioGitRepos').toHaveField('lastReceivedAt');
    await expectCollection('studioGitConnections').toHaveField(
      'lastReceivedAt',
    );
  },
  down: async ({ expectCollection }) => {
    await expectCollection('studioGitRepos').not.toHaveField('lastReceivedAt');
    await expectCollection('studioGitConnections').not.toHaveField(
      'lastReceivedAt',
    );
  },
});
