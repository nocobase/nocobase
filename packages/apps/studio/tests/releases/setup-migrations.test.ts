// @vitest-environment node
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import type { MigrationSource } from '@nocobase/db';
import { expect } from 'vitest';

const sources: readonly MigrationSource[] = [
  {
    packageName: 'studio-setup-test',
    directory: path.resolve(
      import.meta.dirname,
      '../../database/main/migrations',
    ),
  },
];

const init = (id: string) => ({
  id,
  projectId: 'p1',
  method: 'prompt',
  state: 'pending',
  createdAt: new Date(),
  updatedAt: new Date(),
});

// A project keeps a row per initialized working directory.
describeMigration('202610110005_studio_project_inits_per_location', {
  sources,
  up: async ({ connection }) => {
    await connection.query
      .insertInto('studioProjectInits')
      .values(init('a'))
      .execute();
    await connection.query
      .insertInto('studioProjectInits')
      .values(init('b'))
      .execute();
    const rows = await connection.query
      .selectFrom('studioProjectInits')
      .select('id')
      .where('projectId', '=', 'p1')
      .execute();
    expect(rows).toHaveLength(2);
    await connection.query
      .deleteFrom('studioProjectInits')
      .where('projectId', '=', 'p1')
      .execute();
  },
  down: async ({ connection }) => {
    await connection.query
      .insertInto('studioProjectInits')
      .values(init('a'))
      .execute();
    await expect(
      connection.query
        .insertInto('studioProjectInits')
        .values(init('b'))
        .execute(),
    ).rejects.toThrow();
    await connection.query
      .deleteFrom('studioProjectInits')
      .where('projectId', '=', 'p1')
      .execute();
  },
});

// A repository's CI choice and where its setup stands.
describeMigration('202610110010_studio_create_repo_ci', {
  sources,
  up: async ({ connection, expectCollection }) => {
    const table = await expectCollection('studioRepoCi').toExist();
    expect(table.primaryKey).toEqual(['resourceId']);
    await connection.query
      .insertInto('studioRepoCi')
      .values({
        resourceId: 'r1',
        auto: true,
        state: 'manual',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .execute();
    const row = await connection.query
      .selectFrom('studioRepoCi')
      .selectAll()
      .where('resourceId', '=', 'r1')
      .executeTakeFirstOrThrow();
    expect(row).toMatchObject({
      secretName: 'NB_STUDIO_API_KEY',
      workflowPath: '.github/workflows/nb-studio.yml',
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('studioRepoCi').not.toExist();
  },
});

// What a preview build's variables change against the App it previews.
describeMigration('202610110020_studio_builds_new_variables', {
  sources,
  up: async ({ expectCollection }) => {
    await expectCollection('studioBuilds').toHaveField('newVariables');
  },
  down: async ({ expectCollection }) => {
    await expectCollection('studioBuilds').not.toHaveField('newVariables');
  },
});

// What a deleted App did for a repository, one row per repository and App.
describeMigration('202610120010_studio_create_repo_removed_apps', {
  sources,
  up: async ({ connection, expectCollection }) => {
    await expectCollection('studioRepoRemovedApps').toExist();
    const removed = (id: string) => ({
      id,
      resourceId: 'r1',
      appId: 'shop',
      appName: 'shop',
      role: 'production',
      environmentId: 'production',
      removedAt: new Date(),
    });
    await connection.query
      .insertInto('studioRepoRemovedApps')
      .values(removed('a'))
      .execute();
    await expect(
      connection.query
        .insertInto('studioRepoRemovedApps')
        .values(removed('b'))
        .execute(),
    ).rejects.toThrow();
    await connection.query
      .deleteFrom('studioRepoRemovedApps')
      .where('resourceId', '=', 'r1')
      .execute();
  },
  down: async ({ expectCollection }) => {
    await expectCollection('studioRepoRemovedApps').not.toExist();
  },
});
