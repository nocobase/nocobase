/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { MigrationContext } from '@nocobase/database';
import { DataTypes } from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';

import AddReferenceRepoForeignKeyMigration from '../migrations/20260706000000-add-reference-repo-fk';

interface ForeignKeyReference {
  constraintName?: string;
  columnName?: string;
  referencedTableName?: string;
  referencedColumnName?: string;
}

describe('plugin-light-extension reference repo migration', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer();
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('cleans legacy orphan references and installs the repo foreign key before collections are loaded', async () => {
    await createLegacyTables(app);
    expect(app.db.getCollection('lightExtensionRepos')).toBeFalsy();
    expect(app.db.getCollection('lightExtensionReferences')).toBeFalsy();

    const migration = createMigration(app);
    await migration.up();
    await migration.up();

    const remainingReferences = await selectReferenceRepoIds(app);
    const foreignKeys = await findReferenceRepoForeignKeys(app);

    expect(remainingReferences).toEqual(['ler_valid']);
    expect(foreignKeys).toHaveLength(1);
    expect(foreignKeys[0]).toMatchObject({
      constraintName: 'light_extension_references_repo_id_fk',
      columnName: 'repoId',
      referencedTableName: 'lightExtensionRepos',
      referencedColumnName: 'id',
    });
    expect(app.db.getCollection('lightExtensionRepos')).toBeFalsy();
    expect(app.db.getCollection('lightExtensionReferences')).toBeFalsy();
  });
});

async function createLegacyTables(app: MockServer): Promise<void> {
  const queryInterface = app.db.sequelize.getQueryInterface();
  const now = new Date();

  await queryInterface.createTable('lightExtensionRepos', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    vscRepoId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    normalizedName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lifecycleStatus: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    healthStatus: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  });
  await queryInterface.createTable('lightExtensionReferences', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    repoId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    entryId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ownerKind: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ownerLocator: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    ownerLocatorHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    versionPolicy: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    resolvedStatus: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  });
  await queryInterface.bulkInsert('lightExtensionRepos', [
    {
      id: 'ler_valid',
      vscRepoId: 'vscr_valid',
      name: 'valid',
      normalizedName: 'valid',
      lifecycleStatus: 'enabled',
      healthStatus: 'draft',
      createdAt: now,
      updatedAt: now,
    },
  ]);
  await queryInterface.bulkInsert('lightExtensionReferences', [
    createReferenceRow('lef_valid', 'ler_valid', now),
    createReferenceRow('lef_orphan', 'ler_orphan', now),
  ]);
}

function createReferenceRow(id: string, repoId: string, now: Date) {
  return {
    id,
    repoId,
    entryId: `entry_${id}`,
    ownerKind: 'flowModel.step',
    ownerLocator: JSON.stringify({
      kind: 'flowModel.step',
      modelUid: `flow_${id}`,
      stepKey: 'runjs',
    }),
    ownerLocatorHash: `owner_${id}`,
    versionPolicy: 'pinned',
    resolvedStatus: 'no_active_publication',
    createdAt: now,
    updatedAt: now,
  };
}

function createMigration(app: MockServer): AddReferenceRepoForeignKeyMigration {
  return new AddReferenceRepoForeignKeyMigration({
    db: app.db,
    queryInterface: app.db.sequelize.getQueryInterface(),
    sequelize: app.db.sequelize,
  } satisfies MigrationContext);
}

async function selectReferenceRepoIds(app: MockServer): Promise<string[]> {
  const [rows] = await app.db.sequelize.query('SELECT "repoId" FROM "lightExtensionReferences" ORDER BY "repoId"');

  return (rows as Array<{ repoId: string }>).map((row) => row.repoId);
}

async function findReferenceRepoForeignKeys(app: MockServer): Promise<ForeignKeyReference[]> {
  const queryInterface = app.db.sequelize.getQueryInterface();
  const foreignKeys = (await queryInterface.getForeignKeyReferencesForTable(
    'lightExtensionReferences',
  )) as ForeignKeyReference[];

  return foreignKeys.filter(
    (foreignKey) =>
      foreignKey.columnName === 'repoId' &&
      foreignKey.referencedTableName === 'lightExtensionRepos' &&
      foreignKey.referencedColumnName === 'id',
  );
}
