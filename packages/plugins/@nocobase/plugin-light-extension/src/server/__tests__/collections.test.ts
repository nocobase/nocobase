/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Collection, CollectionOptions } from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';

import { LIGHT_EXTENSION_COLLECTIONS, LIGHT_EXTENSION_LEGACY_PERSISTENCE_CONTRACT } from '../../constants';
import lightExtensionCreateJobs from '../collections/lightExtensionCreateJobs';
import lightExtensionEntries from '../collections/lightExtensionEntries';
import lightExtensionLogs from '../collections/lightExtensionLogs';
import lightExtensionMoveOperations from '../collections/lightExtensionMoveOperations';
import lightExtensionReferences from '../collections/lightExtensionReferences';
import lightExtensionRepos from '../collections/lightExtensionRepos';
import lightExtensionRuntimeArtifacts from '../collections/lightExtensionRuntimeArtifacts';
import PluginLightExtensionServer from '../plugin';

const collectionDefinitions = [
  lightExtensionRepos,
  lightExtensionEntries,
  lightExtensionReferences,
  lightExtensionRuntimeArtifacts,
  lightExtensionLogs,
  lightExtensionMoveOperations,
  lightExtensionCreateJobs,
] as const;

const expectedFields: Record<string, string[]> = {
  lightExtensionRepos: [
    'id',
    'vscRepoId',
    'applicationName',
    'name',
    'normalizedName',
    'title',
    'description',
    'lifecycleStatus',
    'healthStatus',
    'headCommitId',
    'lastCompiledAt',
  ],
  lightExtensionEntries: [
    'id',
    'repoId',
    'repo',
    'target',
    'kind',
    'entryName',
    'entryPath',
    'descriptorPath',
    'title',
    'description',
    'category',
    'icon',
    'tags',
    'sort',
    'settingsSchema',
    'settingsSchemaHash',
    'compiledCommitId',
    'compiledInputKey',
    'compilerBuildId',
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
  ],
  lightExtensionReferences: [
    'id',
    'repoId',
    'entryId',
    'kind',
    'ownerKind',
    'ownerLocator',
    'ownerLocatorHash',
    'settingsHash',
    'resolvedStatus',
    'repo',
    'entry',
  ],
  lightExtensionRuntimeArtifacts: [
    'artifactHash',
    'runtimeCodeHash',
    'code',
    'sourceMap',
    'version',
    'entryPath',
    'runtimeContract',
    'byteSize',
  ],
  lightExtensionLogs: [
    'id',
    'repoId',
    'entryId',
    'level',
    'target',
    'kind',
    'name',
    'action',
    'result',
    'requestId',
    'actorUserId',
    'rawResource',
    'rawResourceAction',
    'denyReason',
    'reasonCode',
    'message',
    'details',
    'createdAt',
  ],
  lightExtensionMoveOperations: [
    'id',
    'identityHash',
    'applicationName',
    'idempotencyKey',
    'requestHash',
    'attemptId',
    'status',
    'result',
    'errorCode',
  ],
  lightExtensionCreateJobs: [
    'id',
    'applicationName',
    'targetRepoId',
    'name',
    'normalizedName',
    'title',
    'description',
    'sourceType',
    'status',
    'payload',
    'errorCode',
    'errorReasonCode',
    'errorMessage',
    'reservationKey',
    'actorUserId',
    'requestId',
    'startedAt',
    'finishedAt',
  ],
};

const expectedIndexes: Record<string, Array<{ name: string; fields: string[]; unique: boolean }>> = {
  lightExtensionRepos: [
    { name: 'le_repo_name_uq', fields: ['name'], unique: true },
    { name: 'le_repo_normalized_uq', fields: ['normalizedName'], unique: true },
    { name: 'le_repo_vsc_uq', fields: ['vscRepoId'], unique: true },
    { name: 'le_repo_health_idx', fields: ['lifecycleStatus', 'healthStatus'], unique: false },
    { name: 'le_repo_application_idx', fields: ['applicationName'], unique: false },
    { name: 'le_repo_head_idx', fields: ['headCommitId'], unique: false },
  ],
  lightExtensionEntries: [
    { name: 'le_entry_name_uq', fields: ['repoId', 'target', 'kind', 'entryName'], unique: true },
    { name: 'le_entry_path_uq', fields: ['repoId', 'target', 'kind', 'entryPath'], unique: true },
    { name: 'le_entry_health_idx', fields: ['repoId', 'healthStatus'], unique: false },
    { name: 'le_entry_commit_idx', fields: ['compiledCommitId'], unique: false },
    { name: 'le_entry_code_idx', fields: ['runtimeCodeHash'], unique: false },
    { name: 'le_entry_artifact_idx', fields: ['artifactHash'], unique: false },
    { name: 'le_entry_input_idx', fields: ['compiledInputKey'], unique: false },
  ],
  lightExtensionReferences: [
    { name: 'le_ref_owner_uq', fields: ['ownerLocatorHash', 'repoId', 'entryId'], unique: true },
    { name: 'le_ref_status_idx', fields: ['repoId', 'entryId', 'resolvedStatus'], unique: false },
    { name: 'le_ref_owner_kind_idx', fields: ['ownerKind'], unique: false },
    { name: 'le_ref_kind_status_idx', fields: ['kind', 'resolvedStatus'], unique: false },
  ],
  lightExtensionRuntimeArtifacts: [],
  lightExtensionLogs: [
    { name: 'le_log_repo_idx', fields: ['repoId', 'createdAt'], unique: false },
    { name: 'le_log_entry_idx', fields: ['entryId', 'createdAt'], unique: false },
    { name: 'le_log_request_idx', fields: ['requestId'], unique: false },
    { name: 'le_log_action_idx', fields: ['action', 'createdAt'], unique: false },
    { name: 'le_log_repo_action_idx', fields: ['repoId', 'action', 'createdAt'], unique: false },
    { name: 'le_log_resource_idx', fields: ['rawResourceAction'], unique: false },
  ],
  lightExtensionMoveOperations: [{ name: 'le_move_operation_identity_uq', fields: ['identityHash'], unique: true }],
  lightExtensionCreateJobs: [
    { name: 'le_cjob_reservation_uq', fields: ['applicationName', 'reservationKey'], unique: true },
    { name: 'le_cjob_status_idx', fields: ['applicationName', 'status'], unique: false },
    { name: 'le_cjob_actor_idx', fields: ['applicationName', 'actorUserId', 'status'], unique: false },
  ],
};

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

  it('pins physical collection, field, index, and association identities', () => {
    expect(collectionDefinitions.map((definition) => definition.name)).toEqual([
      ...LIGHT_EXTENSION_LEGACY_PERSISTENCE_CONTRACT.collectionNames,
    ]);

    for (const definition of collectionDefinitions) {
      expect(definition.tableName, definition.name).toBeUndefined();
      expect(definition.fields?.map((field) => field.name), `${definition.name} fields`).toEqual(
        expectedFields[definition.name],
      );
      expect(normalizeIndexes(definition), `${definition.name} indexes`).toEqual(expectedIndexes[definition.name]);
    }

    expect(getFieldOptions(lightExtensionEntries, 'repo')).toMatchObject({
      target: LIGHT_EXTENSION_COLLECTIONS.repos,
      foreignKey: 'repoId',
    });
    expect(getFieldOptions(lightExtensionReferences, 'repo')).toMatchObject({
      target: LIGHT_EXTENSION_COLLECTIONS.repos,
      foreignKey: 'repoId',
    });
    expect(getFieldOptions(lightExtensionReferences, 'entry')).toMatchObject({
      target: LIGHT_EXTENSION_COLLECTIONS.entries,
      foreignKey: 'entryId',
    });
    expect(getUniqueFieldNames(lightExtensionRepos)).toEqual(['vscRepoId', 'name', 'normalizedName']);
    expect(getUniqueFieldNames(lightExtensionMoveOperations)).toEqual(['identityHash']);
    expect(getUniqueFieldNames(lightExtensionCreateJobs)).toEqual(['targetRepoId']);
    expect(lightExtensionLogs.migrationRules).toEqual(['schema-only', 'skip']);
    expect(lightExtensionMoveOperations.migrationRules).toEqual(['overwrite', 'schema-only']);
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

function normalizeIndexes(definition: CollectionOptions) {
  return (definition.indexes || []).map((index) => ({
    name: String(index.name),
    fields: (index.fields || []).map(String),
    unique: Boolean(index.unique),
  }));
}

function getFieldOptions(definition: CollectionOptions, fieldName: string) {
  return definition.fields?.find((field) => field.name === fieldName);
}

function getUniqueFieldNames(definition: CollectionOptions): string[] {
  return (definition.fields || []).filter((field) => field.unique).map((field) => String(field.name));
}
