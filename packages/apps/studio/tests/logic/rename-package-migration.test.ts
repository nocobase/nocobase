// @vitest-environment node
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import type { MigrationSource } from '@nocobase/db';
import { expect } from 'vitest';

const sources: readonly MigrationSource[] = [
  {
    packageName: '@nocobase/app-plugin-projects',
    directory: path.resolve(
      import.meta.dirname,
      '../fixtures/projects-workflows',
    ),
  },
  // Recorded under the name Studio had before it was published.
  {
    packageName: 'studio',
    directory: path.resolve(
      import.meta.dirname,
      '../../database/main/migrations',
    ),
  },
];

const definition = (ns: string) => ({
  stages: [
    {
      key: 'in_review',
      rules: [
        {
          type: 'notifyOwner',
          config: { message: { key: 'inReview', ns, defaultValue: 'Review' } },
        },
      ],
    },
  ],
  label: { key: 'name', ns: 'projects' },
});

type Row = { readonly packageName: string; readonly name: string };

describeMigration('202610220010_studio_rename_package', {
  sources,
  before: async ({ connection }) => {
    await connection.query
      .insertInto('pmWorkflows')
      .values({
        id: 'software',
        definition: definition('studio'),
      })
      .execute();
  },
  up: async ({ connection }) => {
    const history = (
      (await connection.query
        .selectFrom('__nocobase_migrations')
        .select(['packageName', 'name'])
        .execute()) as Row[]
    ).filter((row) => row.name.includes('_studio_'));
    expect(history.length).toBeGreaterThan(0);
    expect(new Set(history.map((row) => row.packageName))).toEqual(
      new Set(['@nocobase/studio', 'studio']),
    );
    // Every Studio migration before this one moved; this one is recorded by the run under its source's name.
    expect(
      history.filter(
        (row) =>
          row.packageName === 'studio' &&
          row.name !== '202610220010_studio_rename_package',
      ),
    ).toEqual([]);

    const workflow = await connection.query
      .selectFrom('pmWorkflows')
      .select('definition')
      .where('id', '=', 'software')
      .executeTakeFirstOrThrow();
    const stored: unknown =
      typeof workflow.definition === 'string'
        ? JSON.parse(workflow.definition)
        : workflow.definition;
    expect(stored).toEqual(definition('@nocobase/studio'));
  },
  down: async ({ connection }) => {
    const moved = await connection.query
      .selectFrom('__nocobase_migrations')
      .select('name')
      .where('packageName', '=', '@nocobase/studio')
      .execute();
    expect(moved).toEqual([]);

    const workflow = await connection.query
      .selectFrom('pmWorkflows')
      .select('definition')
      .where('id', '=', 'software')
      .executeTakeFirstOrThrow();
    const stored: unknown =
      typeof workflow.definition === 'string'
        ? JSON.parse(workflow.definition)
        : workflow.definition;
    expect(stored).toEqual(definition('studio'));
  },
});
