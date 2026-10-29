import path from 'node:path';
import { expect } from 'vitest';
import { describeMigration } from '@nocobase/app-testing/server';

describeMigration('202611030001_create_skill_projects', {
  sources: [
    {
      packageName: 'skill-projects-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../database/main/migrations',
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('skillProjects').toHaveField('name', {
      type: 'string',
      nullable: false,
    });
    expect(
      (await expectCollection('skillProjects').toExist()).primaryKey,
    ).toEqual(['id']);
  },
  down: async ({ expectCollection }) => {
    await expectCollection('skillProjects').not.toExist();
  },
});
