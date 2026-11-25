import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';

describeMigration('202611250001_ag_skill_version_via', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-agents',
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  up: async ({ expectCollection }) => {
    for (const field of ['viaAgentId', 'viaRunId'])
      await expectCollection('agSkillVersions').toHaveField(field, {
        type: 'string',
        nullable: true,
      });
    await expectCollection('agSkillVersions').toHaveField('createdById');
  },
  down: async ({ expectCollection }) => {
    await expectCollection('agSkillVersions').not.toHaveField('viaAgentId');
    await expectCollection('agSkillVersions').not.toHaveField('viaRunId');
    await expectCollection('agSkillVersions').toHaveField('createdById');
  },
});
