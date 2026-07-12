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

import {
  LIGHT_EXTENSION_ENTRY_HEALTH_STATUSES,
  LIGHT_EXTENSION_REFERENCE_RESOLVED_STATUSES,
  LIGHT_EXTENSION_REPO_HEALTH_STATUSES,
  LIGHT_EXTENSION_REPO_LIFECYCLE_STATUSES,
} from '../../constants';
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

  it('loads all phase-0 collections with the canonical lifecycle and health fields', async () => {
    expectCollectionFields('lightExtensionRepos', [
      'id',
      'vscRepoId',
      'name',
      'normalizedName',
      'lifecycleStatus',
      'healthStatus',
      'headCommitId',
    ]);
    expectCollectionFields('lightExtensionEntries', [
      'id',
      'repoId',
      'target',
      'kind',
      'entryName',
      'entryPath',
      'settingsSchema',
      'compiledCommitId',
      'runtimeArtifact',
      'runtimeVersion',
      'surfaceStyle',
      'runtimeCodeHash',
      'artifactHash',
      'filesHash',
      'settingsDefaultsHash',
      'compiledAt',
      'healthStatus',
      'diagnostics',
    ]);
    expectCollectionFields('lightExtensionRuntimeArtifacts', [
      'artifactHash',
      'runtimeCodeHash',
      'code',
      'sourceMap',
      'version',
      'entryPath',
      'runtimeContract',
      'byteSize',
    ]);
    expect(app.db.getCollection('lightExtensionEntries')?.getField('validatorVersion')).toBeFalsy();
    expect(app.db.getCollection('lightExtensionEntryPublications')).toBeFalsy();
    expectCollectionFields('lightExtensionReferences', [
      'id',
      'repoId',
      'entryId',
      'kind',
      'ownerKind',
      'ownerLocator',
      'ownerLocatorHash',
      'settingsHash',
      'resolvedStatus',
    ]);
    expectCollectionFields('lightExtensionLogs', [
      'id',
      'repoId',
      'entryId',
      'level',
      'action',
      'result',
      'requestId',
      'rawResourceAction',
      'denyReason',
      'details',
    ]);
    expect(app.db.getCollection('lightExtensionRepos')?.getField('lastError')).toBeFalsy();
    expect(app.db.getCollection('lightExtensionLogs')?.getField('stack')).toBeFalsy();

    expect(LIGHT_EXTENSION_REPO_LIFECYCLE_STATUSES).toEqual(['enabled', 'disabled', 'archived']);
    expect(LIGHT_EXTENSION_REPO_HEALTH_STATUSES).toEqual(['pending', 'ready']);
    expect(LIGHT_EXTENSION_ENTRY_HEALTH_STATUSES).toEqual(['ready', 'missing']);
    expect(LIGHT_EXTENSION_REFERENCE_RESOLVED_STATUSES).toEqual([
      'active',
      'binding_outdated',
      'repo_missing',
      'repo_disabled',
      'repo_archived',
      'entry_missing',
      'owner_missing',
      'settings_invalid',
      'runtime_missing',
    ]);
  });

  it('persists default statuses without using enabled plus archived booleans', async () => {
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
      },
    });

    expect(repo.get('lifecycleStatus')).toBe('enabled');
    expect(repo.get('healthStatus')).toBe('pending');
    expect(repo.get('version')).toBeUndefined();
    expect(repo.get('enabled')).toBeUndefined();
    expect(repo.get('archived')).toBeUndefined();
    expect(entry.get('target')).toBe('client');
    expect(entry.get('healthStatus')).toBe('missing');
  });

  it('stores every derived reference resolvedStatus used by runtime/status APIs', async () => {
    for (const resolvedStatus of LIGHT_EXTENSION_REFERENCE_RESOLVED_STATUSES) {
      const repo = await app.db.getRepository('lightExtensionRepos').create({
        values: {
          id: `repo_${resolvedStatus}`,
          vscRepoId: `vscr_${resolvedStatus}`,
          name: `repo ${resolvedStatus}`,
          normalizedName: `repo-${resolvedStatus}`,
        },
      });
      const reference = await app.db.getRepository('lightExtensionReferences').create({
        values: {
          repoId: repo.get('id'),
          entryId: `entry_${resolvedStatus}`,
          kind: 'js-block',
          ownerKind: 'flowModel.step',
          ownerLocator: {
            kind: 'flowModel.step',
            modelUid: `flow_${resolvedStatus}`,
            use: 'JSBlockModel',
            stepPath: ['stepParams', 'jsSettings'],
          },
          ownerLocatorHash: `owner_${resolvedStatus}`,
          settingsHash: 'sha256:44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a',
          resolvedStatus,
        },
      });

      expect(reference.get('resolvedStatus')).toBe(resolvedStatus);
    }
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

  function expectCollectionFields(collectionName: string, fieldNames: string[]) {
    const collection = app.db.getCollection(collectionName) as Collection | undefined;
    expect(collection).toBeTruthy();
    for (const fieldName of fieldNames) {
      expect(collection?.getField(fieldName), `${collectionName}.${fieldName}`).toBeTruthy();
    }
  }

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
