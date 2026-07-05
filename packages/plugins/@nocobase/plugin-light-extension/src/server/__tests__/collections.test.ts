/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Collection, MigrationContext } from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';

import {
  LIGHT_EXTENSION_ENTRY_HEALTH_STATUSES,
  LIGHT_EXTENSION_REFERENCE_RESOLVED_STATUSES,
  LIGHT_EXTENSION_REPO_HEALTH_STATUSES,
  LIGHT_EXTENSION_REPO_LIFECYCLE_STATUSES,
} from '../../constants';
import AddReferenceRepoForeignKeyMigration from '../migrations/20260706000000-add-reference-repo-fk';
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
      'lastScannedCommitId',
    ]);
    expectCollectionFields('lightExtensionEntries', [
      'id',
      'repoId',
      'target',
      'kind',
      'entryName',
      'entryPath',
      'settingsSchema',
      'activePublicationId',
      'healthStatus',
      'diagnostics',
    ]);
    expectCollectionFields('lightExtensionEntryPublications', [
      'id',
      'repoId',
      'entryId',
      'commitId',
      'artifact',
      'settingsSchemaSnapshot',
      'settingsDefaultsHash',
      'filesHash',
      'runtimeCodeHash',
      'diagnostics',
    ]);
    expectCollectionFields('lightExtensionReferences', [
      'id',
      'repoId',
      'entryId',
      'publicationId',
      'ownerKind',
      'ownerLocator',
      'ownerLocatorHash',
      'versionPolicy',
      'resolvedStatus',
    ]);
    expectCollectionFields('lightExtensionLogs', [
      'id',
      'repoId',
      'entryId',
      'publicationId',
      'level',
      'action',
      'result',
      'requestId',
      'rawResourceAction',
      'denyReason',
      'details',
    ]);

    expect(LIGHT_EXTENSION_REPO_LIFECYCLE_STATUSES).toEqual(['enabled', 'disabled', 'archived']);
    expect(LIGHT_EXTENSION_REPO_HEALTH_STATUSES).toEqual(['draft', 'ready', 'partial_failed', 'scan_failed']);
    expect(LIGHT_EXTENSION_ENTRY_HEALTH_STATUSES).toEqual(['ready', 'failed', 'missing']);
    expect(LIGHT_EXTENSION_REFERENCE_RESOLVED_STATUSES).toEqual([
      'active',
      'repo_disabled',
      'repo_archived',
      'entry_missing',
      'publication_missing',
      'owner_missing',
      'settings_invalid',
      'no_active_publication',
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
    expect(repo.get('healthStatus')).toBe('draft');
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
          publicationId: `publication_${resolvedStatus}`,
          ownerKind: 'flowModel.step',
          ownerLocator: {
            kind: 'flowModel.step',
            flowModelId: `flow_${resolvedStatus}`,
            stepId: 'step_1',
            surface: 'js-block',
            bindingPath: 'props.sourceBinding',
          },
          ownerLocatorHash: `owner_${resolvedStatus}`,
          versionPolicy: 'pinned',
          resolvedStatus,
        },
      });

      expect(reference.get('resolvedStatus')).toBe(resolvedStatus);
    }
  });

  it('installs the repo reference foreign key when upgrading a legacy schema', async () => {
    await removeReferenceRepoForeignKeyIfExists(app);
    await app.db.getRepository('lightExtensionReferences').create({
      values: {
        repoId: 'repo_orphan',
        entryId: 'entry_orphan',
        ownerKind: 'flowModel.step',
        ownerLocator: {
          kind: 'flowModel.step',
          flowModelId: 'flow_orphan',
          stepId: 'step_orphan',
        },
        ownerLocatorHash: 'owner_orphan',
      },
    });

    const migration = new AddReferenceRepoForeignKeyMigration({
      db: app.db,
      queryInterface: app.db.sequelize.getQueryInterface(),
      sequelize: app.db.sequelize,
    } satisfies MigrationContext);
    await migration.up();

    const repoConstraint = await findReferenceRepoForeignKey(app);

    expect(repoConstraint).toBeTruthy();
    expect(repoConstraint?.constraintName || repoConstraint?.constraint_name).toBe(
      'light_extension_references_repo_id_fk',
    );
    expect(await app.db.getRepository('lightExtensionReferences').count({ filter: { repoId: 'repo_orphan' } })).toBe(0);
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

  async function removeReferenceRepoForeignKeyIfExists(app: MockServer) {
    const queryInterface = app.db.sequelize.getQueryInterface();
    const referencesCollection = app.db.getCollection('lightExtensionReferences') as Collection;
    const constraints = await queryInterface.getForeignKeyReferencesForTable(
      referencesCollection.getTableNameWithSchema(),
    );
    for (const constraint of constraints as ConstraintDescription[]) {
      if (!isReferenceRepoForeignKey(app, constraint)) {
        continue;
      }

      const constraintName = constraint.constraintName || constraint.constraint_name;
      if (!constraintName) {
        continue;
      }

      try {
        await queryInterface.removeConstraint(referencesCollection.getTableNameWithSchema(), constraintName);
      } catch {
        // The legacy schema being simulated may not contain this constraint name.
      }
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
