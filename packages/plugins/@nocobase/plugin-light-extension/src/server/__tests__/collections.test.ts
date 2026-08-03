/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Collection } from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';

import { LIGHT_EXTENSION_LEGACY_PERSISTENCE_CONTRACT } from '../../constants';
import PluginLightExtensionServer from '../plugin';

interface ConstraintDescription {
  constraintName?: string;
  constraint_name?: string;
  constraintType?: string;
  type?: string;
  columnName?: string;
  columnNames?: string[];
  referencedTableName?: string;
  referencedTable?: string;
  referencedColumnName?: string;
}

describe('plugin-light-extension collections', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: [PluginLightExtensionServer],
    });
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('loads the stable collections and persists repository and entry defaults', async () => {
    for (const collectionName of LIGHT_EXTENSION_LEGACY_PERSISTENCE_CONTRACT.collectionNames) {
      const collection = app.db.getCollection(collectionName);
      expect(collection, collectionName).toBeTruthy();
      expect(collection?.tableNameAsString({ ignorePublicSchema: true }), collectionName).toBe(collectionName);
    }

    const repo = await app.db.getRepository('lightExtensionRepos').create({
      values: {
        vscRepoId: 'vscr_light_repo_1',
        name: 'demo',
        normalizedName: 'demo',
      },
    });
    const entry = await app.db.getRepository('lightExtensionEntries').create({
      values: {
        repoId: repo.get('id'),
        kind: 'jsBlock',
        entryName: 'main',
        entryPath: 'src/client/index.tsx',
        descriptorPath: 'src/client/entry.json',
      },
    });

    expect(repo.get('lifecycleStatus')).toBe('enabled');
    expect(repo.get('healthStatus')).toBe('pending');
    expect(entry.get('target')).toBe('client');
    expect(entry.get('healthStatus')).toBe('missing');
  });

  it('creates the repo reference foreign key from the final collection schema', async () => {
    const repoConstraint = await findReferenceRepoForeignKey(app);

    expect(repoConstraint).toBeTruthy();
    await expect(
      app.db.getRepository('lightExtensionReferences').create({
        values: {
          repoId: 'repo_missing_after_migration',
          entryId: 'entry_missing_after_migration',
          ownerKind: 'flowModel.step',
          ownerLocator: {
            kind: 'flowModel.step',
            flowModelId: 'flow_missing_after_migration',
            stepId: 'step_missing_after_migration',
          },
          ownerLocatorHash: 'owner_missing_after_migration',
        },
      }),
    ).rejects.toThrow();
  });

  async function findReferenceRepoForeignKey(app: MockServer): Promise<ConstraintDescription | undefined> {
    const queryInterface = app.db.sequelize.getQueryInterface();
    const referencesCollection = app.db.getCollection('lightExtensionReferences') as Collection;
    const constraints = (await queryInterface.getForeignKeyReferencesForTable(
      referencesCollection.getTableNameWithSchema(),
    )) as ConstraintDescription[];

    return constraints.find((constraint) => isReferenceRepoForeignKey(app, constraint));
  }

  function isReferenceRepoForeignKey(app: MockServer, constraint: ConstraintDescription): boolean {
    const referencesCollection = app.db.getCollection('lightExtensionReferences') as Collection;
    const reposCollection = app.db.getCollection('lightExtensionRepos') as Collection;
    const repoIdColumn = referencesCollection.getField('repoId')?.columnName() || 'repoId';
    const reposIdColumn = reposCollection.getField('id')?.columnName() || 'id';
    const referencedTableName = constraint.referencedTableName || constraint.referencedTable;
    const referencedTableNames = new Set([
      reposCollection.model.tableName,
      reposCollection.tableNameAsString(),
      reposCollection.tableNameAsString({ ignorePublicSchema: true }),
    ]);
    const columnNames = constraint.columnNames || (constraint.columnName ? [constraint.columnName] : []);
    const referencedColumnName = constraint.referencedColumnName || reposIdColumn;

    return (
      columnNames.includes(repoIdColumn) &&
      typeof referencedTableName === 'string' &&
      referencedTableNames.has(referencedTableName) &&
      referencedColumnName === reposIdColumn
    );
  }
});
