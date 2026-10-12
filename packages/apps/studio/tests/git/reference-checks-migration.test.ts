// @vitest-environment node
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';

describeMigration('202610240010_studio_repo_reference_checks', {
  sources: [
    {
      packageName: 'studio-reference-checks-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('studioGitRepos').toHaveField('referenceChecks');
  },
  down: async ({ expectCollection }) => {
    await expectCollection('studioGitRepos').not.toHaveField('referenceChecks');
  },
});
