// @vitest-environment node
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import type { MigrationSource } from '@nocobase/db';
import { expect } from 'vitest';

const sources: readonly MigrationSource[] = [
  {
    packageName: '@nocobase/app-plugin-releases',
    directory: path.resolve(import.meta.dirname, '../database/migrations'),
  },
];

// Deployment variables and the first administrator.
describeMigration('202610100001_rel_variables_initial_admin', {
  sources,
  up: async ({ expectCollection }) => {
    await expectCollection('relReleases').toHaveField('variables');
    await expectCollection('relApps').toHaveField('previewOf');
    await expectCollection('relEnvironments').toHaveField(
      'sampleDataOnFirstDeploy',
    );
    for (const field of [
      'env',
      'variablesFingerprint',
      'initialAdmin',
      'initialAdminExpiresAt',
      'initialAdminSavedBy',
      'initialAdminSavedAt',
    ])
      await expectCollection('relDeployments').toHaveField(field);
    await expectCollection('relEnvironmentVariables').toExist();
    await expectCollection('relEnvironmentVariables').toHaveIndex(
      ['environmentId', 'name'],
      { unique: true },
    );
    await expectCollection('relAppVariables').toExist();
    await expectCollection('relAppVariables').toHaveIndex(['appId', 'name'], {
      unique: true,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('relEnvironmentVariables').not.toExist();
    await expectCollection('relAppVariables').not.toExist();
    await expectCollection('relReleases').not.toHaveField('variables');
    await expectCollection('relApps').not.toHaveField('previewOf');
    await expectCollection('relEnvironments').not.toHaveField(
      'sampleDataOnFirstDeploy',
    );
    await expectCollection('relDeployments').not.toHaveField('env');
    await expectCollection('relDeployments').not.toHaveField('initialAdmin');
  },
});

// An App no longer keeps a separate value for its previews.
describeMigration('202610170001_rel_drop_app_preview_values', {
  sources,
  before: async ({ connection }) => {
    const now = new Date();
    const row = {
      appId: 'shop',
      secret: false,
      generated: false,
      createdAt: now,
      updatedAt: now,
    };
    await connection.query
      .insertInto('relAppVariables')
      .values([
        { ...row, id: 'kept', name: 'A', value: 'v', previewValue: 'p' },
        { ...row, id: 'gone', name: 'B', value: null, previewValue: 'p' },
      ])
      .execute();
  },
  up: async ({ connection, expectCollection }) => {
    await expectCollection('relAppVariables').not.toHaveField('previewValue');
    const rows = await connection.query
      .selectFrom('relAppVariables')
      .select(['id'])
      .execute();
    expect(rows.map((row) => String(row.id))).toEqual(['kept']);
  },
  down: async ({ expectCollection }) => {
    await expectCollection('relAppVariables').toHaveField('previewValue');
  },
});

// "Requires approval" is what "protected" means now.
describeMigration('202610210001_rel_protected_requires_approval', {
  sources,
  before: async ({ connection }) => {
    const now = new Date();
    const row = {
      driver: 'host',
      config: '{}',
      approvers: '[]',
      createdAt: now,
      updatedAt: now,
    };
    await connection.query
      .insertInto('relEnvironments')
      .values([
        {
          ...row,
          id: 'open',
          name: 'Open',
          protected: false,
          requiresApproval: false,
        },
        {
          ...row,
          id: 'approval',
          name: 'Approval',
          protected: false,
          requiresApproval: true,
        },
        {
          ...row,
          id: 'guarded',
          name: 'Guarded',
          protected: true,
          requiresApproval: false,
        },
      ])
      .execute();
  },
  up: async ({ connection, expectCollection }) => {
    await expectCollection('relEnvironments').not.toHaveField(
      'requiresApproval',
    );
    const rows = await connection.query
      .selectFrom('relEnvironments')
      .select(['id', 'protected'])
      .orderBy('id')
      .execute();
    expect(rows.map((row) => [String(row.id), Boolean(row.protected)])).toEqual(
      [
        ['approval', true],
        ['guarded', true],
        ['open', false],
      ],
    );
  },
  down: async ({ expectCollection }) => {
    await expectCollection('relEnvironments').toHaveField('requiresApproval');
  },
});

// What an environment is for: preview when it holds a pull request preview App, else test.
describeMigration('202611020001_rel_environment_purpose', {
  sources,
  before: async ({ connection }) => {
    const now = new Date();
    const environment = {
      driver: 'host',
      config: '{}',
      approvers: '[]',
      protected: false,
      createdAt: now,
      updatedAt: now,
    };
    await connection.query
      .insertInto('relEnvironments')
      .values([
        { ...environment, id: 'previews', name: 'Previews' },
        { ...environment, id: 'staging', name: 'Staging' },
      ])
      .execute();
    const app = {
      enabled: true,
      activation: 'eager',
      labels: '{}',
      createdVia: 'human',
      createdAt: now,
      updatedAt: now,
    };
    await connection.query
      .insertInto('relApps')
      .values([
        { ...app, id: 'shop', name: 'Shop', environmentId: 'staging' },
        {
          ...app,
          id: 'shop-pr-1',
          name: 'Shop #1',
          environmentId: 'previews',
          previewOf: 'shop',
        },
      ])
      .execute();
  },
  up: async ({ connection, expectCollection }) => {
    await expectCollection('relEnvironments').toHaveField('purpose');
    const rows = await connection.query
      .selectFrom('relEnvironments')
      .select(['id', 'purpose'])
      .orderBy('id')
      .execute();
    expect(rows.map((row) => [String(row.id), String(row.purpose)])).toEqual([
      ['previews', 'preview'],
      ['staging', 'test'],
    ]);
  },
  down: async ({ expectCollection }) => {
    await expectCollection('relEnvironments').not.toHaveField('purpose');
  },
});
