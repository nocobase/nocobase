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

import { JS_TEMPLATE_COLLECTION_NAMES, JS_TEMPLATE_COLLECTIONS } from '../../constants';
import jsTemplateCreateJobs from '../collections/jsTemplateCreateJobs';
import jsTemplates from '../collections/jsTemplates';
import jsTemplateLogs from '../collections/jsTemplateLogs';
import jsTemplateSourceOperations from '../collections/jsTemplateSourceOperations';
import jsTemplateUsages from '../collections/jsTemplateUsages';
import jsTemplateProjects from '../collections/jsTemplateProjects';
import jsTemplateArtifacts from '../collections/jsTemplateArtifacts';
import PluginJsTemplateServer from '../plugin';

const collectionDefinitions = [
  jsTemplateProjects,
  jsTemplates,
  jsTemplateUsages,
  jsTemplateArtifacts,
  jsTemplateLogs,
  jsTemplateSourceOperations,
  jsTemplateCreateJobs,
] as const;

const expectedFields: Record<string, string[]> = {
  jsTemplateProjects: [
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
  jsTemplates: [
    'id',
    'projectId',
    'project',
    'target',
    'kind',
    'templateName',
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
  jsTemplateUsages: [
    'id',
    'projectId',
    'templateId',
    'kind',
    'ownerKind',
    'ownerLocator',
    'ownerLocatorHash',
    'settingsHash',
    'resolvedStatus',
    'project',
    'template',
  ],
  jsTemplateArtifacts: [
    'artifactHash',
    'runtimeCodeHash',
    'code',
    'sourceMap',
    'version',
    'entryPath',
    'runtimeContract',
    'byteSize',
  ],
  jsTemplateLogs: [
    'id',
    'projectId',
    'templateId',
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
  jsTemplateSourceOperations: [
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
  jsTemplateCreateJobs: [
    'id',
    'applicationName',
    'targetProjectId',
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
  jsTemplateProjects: [
    { name: 'jst_project_name_uq', fields: ['name'], unique: true },
    { name: 'jst_project_normalized_uq', fields: ['normalizedName'], unique: true },
    { name: 'jst_project_vsc_uq', fields: ['vscRepoId'], unique: true },
    { name: 'jst_project_health_idx', fields: ['lifecycleStatus', 'healthStatus'], unique: false },
    { name: 'jst_project_application_idx', fields: ['applicationName'], unique: false },
    { name: 'jst_project_head_idx', fields: ['headCommitId'], unique: false },
  ],
  jsTemplates: [
    { name: 'jst_template_name_uq', fields: ['projectId', 'target', 'kind', 'templateName'], unique: true },
    { name: 'jst_template_path_uq', fields: ['projectId', 'target', 'kind', 'entryPath'], unique: true },
    { name: 'jst_template_health_idx', fields: ['projectId', 'healthStatus'], unique: false },
    { name: 'jst_template_commit_idx', fields: ['compiledCommitId'], unique: false },
    { name: 'jst_template_code_idx', fields: ['runtimeCodeHash'], unique: false },
    { name: 'jst_template_artifact_idx', fields: ['artifactHash'], unique: false },
    { name: 'jst_template_input_idx', fields: ['compiledInputKey'], unique: false },
  ],
  jsTemplateUsages: [
    { name: 'jst_usage_owner_uq', fields: ['ownerLocatorHash', 'projectId', 'templateId'], unique: true },
    { name: 'jst_usage_status_idx', fields: ['projectId', 'templateId', 'resolvedStatus'], unique: false },
    { name: 'jst_usage_owner_kind_idx', fields: ['ownerKind'], unique: false },
    { name: 'jst_usage_kind_status_idx', fields: ['kind', 'resolvedStatus'], unique: false },
  ],
  jsTemplateArtifacts: [],
  jsTemplateLogs: [
    { name: 'jst_log_project_idx', fields: ['projectId', 'createdAt'], unique: false },
    { name: 'jst_log_template_idx', fields: ['templateId', 'createdAt'], unique: false },
    { name: 'jst_log_request_idx', fields: ['requestId'], unique: false },
    { name: 'jst_log_action_idx', fields: ['action', 'createdAt'], unique: false },
    { name: 'jst_log_project_action_idx', fields: ['projectId', 'action', 'createdAt'], unique: false },
    { name: 'jst_log_resource_idx', fields: ['rawResourceAction'], unique: false },
  ],
  jsTemplateSourceOperations: [{ name: 'jst_source_operation_identity_uq', fields: ['identityHash'], unique: true }],
  jsTemplateCreateJobs: [
    { name: 'jst_create_job_reservation_uq', fields: ['applicationName', 'reservationKey'], unique: true },
    { name: 'jst_create_job_status_idx', fields: ['applicationName', 'status'], unique: false },
    { name: 'jst_create_job_actor_idx', fields: ['applicationName', 'actorUserId', 'status'], unique: false },
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

describe('plugin-js-template collections', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: [PluginJsTemplateServer],
    });
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('loads the canonical collections and persists project and template defaults', async () => {
    for (const collectionName of JS_TEMPLATE_COLLECTION_NAMES) {
      const collection = app.db.getCollection(collectionName);
      expect(collection, collectionName).toBeTruthy();
      expect(collection?.tableNameAsString({ ignorePublicSchema: true }), collectionName).toBe(collectionName);
    }

    const project = await app.db.getRepository('jsTemplateProjects').create({
      values: {
        vscRepoId: 'vscr_js_template_project_1',
        name: 'demo',
        normalizedName: 'demo',
      },
    });
    const template = await app.db.getRepository('jsTemplates').create({
      values: {
        projectId: project.get('id'),
        kind: 'js-block',
        templateName: 'main',
        entryPath: 'src/client/index.tsx',
        descriptorPath: 'src/client/entry.json',
      },
    });

    expect(project.get('id')).toMatch(/^jtp_/u);
    expect(project.get('lifecycleStatus')).toBe('enabled');
    expect(project.get('healthStatus')).toBe('pending');
    expect(template.get('id')).toMatch(/^jtt_/u);
    expect(template.get('target')).toBe('client');
    expect(template.get('healthStatus')).toBe('missing');
  });

  it('pins physical collection, field, index, and association identities', () => {
    expect(collectionDefinitions.map((definition) => definition.name)).toEqual([...JS_TEMPLATE_COLLECTION_NAMES]);

    for (const definition of collectionDefinitions) {
      expect(definition.tableName, definition.name).toBeUndefined();
      expect(definition.fields?.map((field) => field.name), `${definition.name} fields`).toEqual(
        expectedFields[definition.name],
      );
      expect(normalizeIndexes(definition), `${definition.name} indexes`).toEqual(expectedIndexes[definition.name]);
    }

    expect(getFieldOptions(jsTemplates, 'project')).toMatchObject({
      target: JS_TEMPLATE_COLLECTIONS.projects,
      foreignKey: 'projectId',
    });
    expect(getFieldOptions(jsTemplateUsages, 'project')).toMatchObject({
      target: JS_TEMPLATE_COLLECTIONS.projects,
      foreignKey: 'projectId',
    });
    expect(getFieldOptions(jsTemplateUsages, 'template')).toMatchObject({
      target: JS_TEMPLATE_COLLECTIONS.templates,
      foreignKey: 'templateId',
    });
    expect(getUniqueFieldNames(jsTemplateProjects)).toEqual(['vscRepoId', 'name', 'normalizedName']);
    expect(getUniqueFieldNames(jsTemplateSourceOperations)).toEqual(['identityHash']);
    expect(getUniqueFieldNames(jsTemplateCreateJobs)).toEqual(['targetProjectId']);
    expect(jsTemplateLogs.migrationRules).toEqual(['schema-only', 'skip']);
    expect(jsTemplateSourceOperations.migrationRules).toEqual(['overwrite', 'schema-only']);
  });

  it('creates the project usage foreign key from the final collection schema', async () => {
    const projectConstraint = await findUsageProjectForeignKey(app);

    expect(projectConstraint).toBeTruthy();
    await expect(
      app.db.getRepository('jsTemplateUsages').create({
        values: {
          projectId: 'project_missing',
          templateId: 'template_missing',
          ownerKind: 'flowModel.step',
          ownerLocator: {
            kind: 'flowModel.step',
            flowModelId: 'flow_missing_after_schema_sync',
            stepId: 'step_missing_after_schema_sync',
          },
          ownerLocatorHash: 'owner_missing_after_schema_sync',
        },
      }),
    ).rejects.toThrow();
  });

  async function findUsageProjectForeignKey(app: MockServer): Promise<ConstraintDescription | undefined> {
    const queryInterface = app.db.sequelize.getQueryInterface();
    const usagesCollection = app.db.getCollection('jsTemplateUsages') as Collection;
    const constraints = (await queryInterface.getForeignKeyReferencesForTable(
      usagesCollection.getTableNameWithSchema(),
    )) as ConstraintDescription[];

    return constraints.find((constraint) => isUsageProjectForeignKey(app, constraint));
  }

  function isUsageProjectForeignKey(app: MockServer, constraint: ConstraintDescription): boolean {
    const usagesCollection = app.db.getCollection('jsTemplateUsages') as Collection;
    const projectsCollection = app.db.getCollection('jsTemplateProjects') as Collection;
    const projectIdColumn = usagesCollection.getField('projectId')?.columnName() || 'projectId';
    const projectsIdColumn = projectsCollection.getField('id')?.columnName() || 'id';
    const referencedTableName = constraint.referencedTableName || constraint.referencedTable;
    const referencedTableNames = new Set([
      projectsCollection.model.tableName,
      projectsCollection.tableNameAsString(),
      projectsCollection.tableNameAsString({ ignorePublicSchema: true }),
    ]);
    const columnNames = constraint.columnNames || (constraint.columnName ? [constraint.columnName] : []);
    const referencedColumnName = constraint.referencedColumnName || projectsIdColumn;

    return (
      columnNames.includes(projectIdColumn) &&
      typeof referencedTableName === 'string' &&
      referencedTableNames.has(referencedTableName) &&
      referencedColumnName === projectsIdColumn
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
