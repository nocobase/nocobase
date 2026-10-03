import { describeMigration } from '@nocobase/app-testing/server';

import { aiEmployeeMigrations } from './support/migrations.js';

describeMigration('202608310001_replace_ai_file_storage_id_with_disk', {
  sources: aiEmployeeMigrations,
  up: async ({ expectCollection }) => {
    await expectCollection('aiFiles').toHaveField('disk');
    await expectCollection('aiFiles').not.toHaveField('storageId');
  },
  down: async ({ expectCollection }) => {
    await expectCollection('aiFiles').toHaveField('storageId');
    await expectCollection('aiFiles').not.toHaveField('disk');
  },
});
