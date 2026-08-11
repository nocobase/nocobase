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

  it('loads the canonical collections and persists behavior-critical defaults', async () => {
    for (const collectionName of JS_TEMPLATE_COLLECTION_NAMES) {
      const collection = app.db.getCollection(collectionName);
      expect(collection, collectionName).toBeTruthy();
      expect(collection?.tableNameAsString({ ignorePublicSchema: true }), collectionName).toBeTruthy();
    }

    const project = await app.db.getRepository('jsTemplateProjects').create({
      values: {
        vscRepoId: 'vscr_js_template_project_1',
        applicationName: 'main',
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
    const usage = await app.db.getRepository('jsTemplateUsages').create({
      values: {
        projectId: project.get('id'),
        templateId: template.get('id'),
        ownerLocator: { kind: 'flowModel.step', flowModelId: 'flow_default', stepId: 'step_default' },
        ownerLocatorHash: 'owner_default',
      },
    });
    const log = await app.db.getRepository('jsTemplateLogs').create({ values: {} });
    const createJob = await app.db.getRepository('jsTemplateCreateJobs').create({
      values: {
        applicationName: 'main',
        targetProjectId: 'jtp_create_default',
        name: 'create-default',
        normalizedName: 'create-default',
        sourceType: 'starter',
      },
    });

    expect(project.get('id')).toMatch(/^jtp_/u);
    expect(project.get('lifecycleStatus')).toBe('enabled');
    expect(project.get('healthStatus')).toBe('pending');
    expect(template.get('id')).toMatch(/^jtt_/u);
    expect(template.get('target')).toBe('client');
    expect(template.get('healthStatus')).toBe('missing');
    expect(usage.get('kind')).toBe('js-block');
    expect(usage.get('ownerKind')).toBe('flowModel.step');
    expect(usage.get('settingsHash')).toBe('sha256:44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a');
    expect(usage.get('resolvedStatus')).toBe('runtime_missing');
    expect(log.get('level')).toBe('info');
    expect(createJob.get('status')).toBe('pending');
    expect(createJob.get('attempt')).toBe(0);
  });

  it('keeps the persistence constraints and query indexes required by production behavior', () => {
    expect(new Set(collectionDefinitions.map((definition) => definition.name))).toEqual(
      new Set(JS_TEMPLATE_COLLECTION_NAMES),
    );

    expect(getFieldOptions(jsTemplates, 'project')).toMatchObject({
      target: JS_TEMPLATE_COLLECTIONS.projects,
      foreignKey: 'projectId',
    });
    expect(getFieldOptions(jsTemplateUsages, 'project')).toMatchObject({
      target: JS_TEMPLATE_COLLECTIONS.projects,
      foreignKey: 'projectId',
      onDelete: 'RESTRICT',
    });
    expect(getFieldOptions(jsTemplateUsages, 'template')).toMatchObject({
      target: JS_TEMPLATE_COLLECTIONS.templates,
      foreignKey: 'templateId',
    });
    expect(getFieldOptions(jsTemplateProjects, 'vscRepoId')).toMatchObject({ unique: true });
    expect(getFieldOptions(jsTemplateProjects, 'applicationName')).toMatchObject({ allowNull: false });
    expect(getFieldOptions(jsTemplateProjects, 'name')?.unique).not.toBe(true);
    expect(getFieldOptions(jsTemplateProjects, 'normalizedName')?.unique).not.toBe(true);
    expect(getFieldOptions(jsTemplateProjects, 'creationJobId')).toMatchObject({ unique: true });
    expect(getFieldOptions(jsTemplateSourceOperations, 'identityHash')).toMatchObject({ unique: true });
    expect(getFieldOptions(jsTemplateCreateJobs, 'targetProjectId')).toMatchObject({ unique: true });

    expectCriticalIndex(jsTemplateProjects, ['applicationName', 'normalizedName'], true);
    expectCriticalIndex(jsTemplateProjects, ['vscRepoId'], true);
    expectCriticalIndex(jsTemplateProjects, ['applicationName']);
    expectCriticalIndex(jsTemplateProjects, ['creationJobId'], true);
    expectCriticalIndex(jsTemplates, ['projectId', 'target', 'kind', 'templateName'], true);
    expectCriticalIndex(jsTemplates, ['projectId', 'target', 'kind', 'entryPath'], true);
    expectCriticalIndex(jsTemplates, ['projectId', 'healthStatus']);
    expectCriticalIndex(jsTemplates, ['artifactHash']);
    expectCriticalIndex(jsTemplateUsages, ['ownerLocatorHash', 'projectId', 'templateId'], true);
    expectCriticalIndex(jsTemplateUsages, ['projectId', 'templateId', 'resolvedStatus']);
    expectCriticalIndex(jsTemplateSourceOperations, ['identityHash'], true);
    expectCriticalIndex(jsTemplateCreateJobs, ['applicationName', 'reservationKey'], true);
    expectCriticalIndex(jsTemplateCreateJobs, ['applicationName', 'status']);
    expectCriticalIndex(jsTemplateCreateJobs, ['applicationName', 'status', 'leaseExpiresAt']);
    expectCriticalIndex(jsTemplateCreateJobs, ['applicationName', 'actorUserId', 'status']);

    expect(jsTemplateLogs.migrationRules).toEqual(['schema-only', 'skip']);
    expect(jsTemplateSourceOperations.migrationRules).toEqual(['overwrite', 'schema-only']);
  });

  it('scopes normalized project names to the application', async () => {
    const projects = app.db.getRepository('jsTemplateProjects');
    await projects.create({
      values: {
        vscRepoId: 'vscr_shared_main',
        applicationName: 'main',
        name: 'Shared Project',
        normalizedName: 'shared-project',
      },
    });
    await expect(
      projects.create({
        values: {
          vscRepoId: 'vscr_shared_support',
          applicationName: 'support',
          name: 'shared project',
          normalizedName: 'shared-project',
        },
      }),
    ).resolves.toBeTruthy();
    await expect(
      projects.create({
        values: {
          vscRepoId: 'vscr_shared_main_duplicate',
          applicationName: 'main',
          name: 'SHARED PROJECT',
          normalizedName: 'shared-project',
        },
      }),
    ).rejects.toThrow();
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

function expectCriticalIndex(definition: CollectionOptions, fields: string[], unique = false) {
  const match = (definition.indexes || []).find(
    (index) => Boolean(index.unique) === unique && (index.fields || []).map(String).join('\0') === fields.join('\0'),
  );
  expect(match, `${definition.name} index for ${fields.join(', ')}`).toBeTruthy();
}

function getFieldOptions(definition: CollectionOptions, fieldName: string) {
  return definition.fields?.find((field) => field.name === fieldName);
}
