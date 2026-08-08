/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import { vi } from 'vitest';

import { createJsTemplateEntryStarter } from '../../shared/jsTemplateEntryStarter';
import PluginJsTemplateServer from '../plugin';

describe('JS Template entry-centric catalog', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: [PluginJsTemplateServer],
    });
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('returns two Template Entry rows for one Source Project with aggregate usage counts', async () => {
    await createSourceProject(app, {
      id: 'jtp_catalog',
      lifecycleStatus: 'enabled',
      name: 'catalog-source',
      title: 'Catalog source',
    });
    await app.db.getRepository('jsTemplates').createMany({
      records: [
        createTemplateRecord({
          id: 'jtt_first',
          projectId: 'jtp_catalog',
          kind: 'js-block',
          templateName: 'first-card',
          title: 'First card',
        }),
        createTemplateRecord({
          id: 'jtt_second',
          projectId: 'jtp_catalog',
          kind: 'js-action',
          templateName: 'second-action',
          title: 'Second action',
        }),
      ],
    });
    await app.db.getRepository('jsTemplateUsages').createMany({
      records: [
        createUsageRecord('jtu_first_1', 'jtt_first', 'js-block'),
        createUsageRecord('jtu_first_orphan', 'jtt_first', 'js-block', 'owner_missing'),
        createUsageRecord('jtu_second_1', 'jtt_second', 'js-action'),
        createUsageRecord('jtu_second_2', 'jtt_second', 'js-action'),
      ],
    });

    const findTemplates = vi.spyOn(app.db.getRepository('jsTemplates'), 'find');
    const catalogResponse = await app.agent().post('/jsTemplates:listCatalog');

    expect(findTemplates).toHaveBeenCalledTimes(1);
    expect(findTemplates).toHaveBeenCalledWith(
      expect.objectContaining({
        fields: [
          'id',
          'projectId',
          'kind',
          'templateName',
          'title',
          'description',
          'healthStatus',
          'createdAt',
          'updatedAt',
        ],
      }),
    );
    const projectsResponse = await app.agent().post('/jsTemplateProjects:list');

    expect(catalogResponse.status).toBe(200);
    expect(catalogResponse.body.data).toEqual([
      expect.objectContaining({
        id: 'jtt_first',
        projectId: 'jtp_catalog',
        projectName: 'catalog-source',
        projectTitle: 'Catalog source',
        templateName: 'first-card',
        kind: 'js-block',
        status: 'ready',
        usageCount: 1,
      }),
      expect.objectContaining({
        id: 'jtt_second',
        projectId: 'jtp_catalog',
        projectName: 'catalog-source',
        projectTitle: 'Catalog source',
        templateName: 'second-action',
        kind: 'js-action',
        status: 'ready',
        usageCount: 2,
      }),
    ]);
    expect(projectsResponse.status).toBe(200);
    expect(projectsResponse.body.data).toEqual([expect.objectContaining({ id: 'jtp_catalog', templateCount: 2 })]);
  });

  it('projects disabled and archived Source Project states into each Template Entry status', async () => {
    await Promise.all([
      createSourceProject(app, {
        id: 'jtp_disabled',
        lifecycleStatus: 'disabled',
        name: 'disabled-source',
        title: 'Disabled source',
      }),
      createSourceProject(app, {
        id: 'jtp_archived',
        lifecycleStatus: 'archived',
        name: 'archived-source',
        title: 'Archived source',
      }),
    ]);
    await app.db.getRepository('jsTemplates').createMany({
      records: [
        createTemplateRecord({
          id: 'jtt_disabled',
          projectId: 'jtp_disabled',
          kind: 'js-page',
          templateName: 'disabled-page',
          title: 'Disabled page',
        }),
        createTemplateRecord({
          id: 'jtt_archived',
          projectId: 'jtp_archived',
          kind: 'js-item',
          templateName: 'archived-item',
          title: 'Archived item',
        }),
      ],
    });

    const response = await app.agent().post('/jsTemplates:listCatalog');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'jtt_disabled', status: 'disabled', projectLifecycleStatus: 'disabled' }),
        expect.objectContaining({ id: 'jtt_archived', status: 'archived', projectLifecycleStatus: 'archived' }),
      ]),
    );
  });

  it('creates and exposes exactly one Template Entry from the primary catalog starter payload', async () => {
    const createResponse = await app
      .agent()
      .post('/jsTemplateProjects:create')
      .send({
        name: 'single-entry-source',
        title: 'Single entry',
        initialFiles: createJsTemplateEntryStarter({
          kind: 'js-block',
          templateName: 'single-entry',
          title: 'Single entry',
        }),
        message: 'Create JS Template entry',
      });

    expect(createResponse.status).toBe(202);
    await waitForSuccessfulCreate(app, createResponse.body.data.id, createResponse.body.data.targetProjectId);

    const catalogResponse = await app.agent().post('/jsTemplates:listCatalog');
    const createdEntries = catalogResponse.body.data.filter(
      (entry: { projectId: string }) => entry.projectId === createResponse.body.data.targetProjectId,
    );

    expect(createdEntries).toEqual([
      expect.objectContaining({
        kind: 'js-block',
        templateName: 'single-entry',
        title: 'Single entry',
        status: 'ready',
      }),
    ]);
  });

  it('adds a sibling Template through Head CAS without replacing shared source, metadata, or history', async () => {
    const createResponse = await app
      .agent()
      .post('/jsTemplateProjects:create')
      .send({
        name: 'shared-source-project',
        title: 'Shared source project',
        description: 'Metadata must remain unchanged',
        initialFiles: [
          ...createJsTemplateEntryStarter({
            kind: 'js-block',
            templateName: 'first-card',
            title: 'First card',
          }),
          {
            path: 'src/shared/format.ts',
            content: 'export const format = (value: string) => `shared:${value}`;\n',
            language: 'typescript',
          },
          {
            path: 'README.md',
            content: '# Shared source metadata\n',
            language: 'markdown',
          },
        ],
        message: 'Create shared Source Project',
      });

    expect(createResponse.status).toBe(202);
    const projectId = createResponse.body.data.targetProjectId;
    await waitForSuccessfulCreate(app, createResponse.body.data.id, projectId);
    const beforeResponse = await app.agent().post('/jsTemplateProjects:get').send({ projectId });
    const before = beforeResponse.body.data;
    const commitCountBefore = await app.db.getRepository('vscFileCommits').count();
    const auditCountBefore = await app.db.getRepository('jsTemplateLogs').count({ filter: { projectId } });

    const addResponse = await app
      .agent()
      .post('/jsTemplateProjects:addTemplate')
      .send({
        destination: { type: 'existing', projectId },
        expectedHeadCommitId: before.headCommitId,
        kind: 'js-action',
        templateName: 'refresh-data',
        title: 'Refresh data',
        description: 'Second sibling Template',
      });

    expect(addResponse.status).toBe(200);
    expect(addResponse.body.data.project).toMatchObject({
      id: projectId,
      name: 'shared-source-project',
      title: 'Shared source project',
      description: 'Metadata must remain unchanged',
      templateCount: 2,
    });
    expect(addResponse.body.data.project.headCommitId).not.toBe(before.headCommitId);
    expect(addResponse.body.data.compile.templates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'js-action', templateName: 'refresh-data', status: 'success' }),
      ]),
    );

    const pullResponse = await app.agent().post('/jsTemplateFiles:pull').send({ projectId, includeContent: 'all' });
    const files = new Map(
      pullResponse.body.data.files.map((file: { path: string; content: string }) => [file.path, file.content]),
    );
    expect(files.get('src/client/js-blocks/first-card/entry.json')).toContain('First card');
    expect(files.get('src/client/js-actions/refresh-data/entry.json')).toContain('Second sibling Template');
    expect(files.get('src/shared/format.ts')).toContain('shared:${value}');
    expect(files.get('README.md')).toBe('# Shared source metadata\n');

    const catalogResponse = await app.agent().post('/jsTemplates:listCatalog');
    expect(catalogResponse.body.data.filter((entry: { projectId: string }) => entry.projectId === projectId)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'js-block', templateName: 'first-card' }),
        expect.objectContaining({ kind: 'js-action', templateName: 'refresh-data' }),
      ]),
    );
    const projectsResponse = await app.agent().post('/jsTemplateProjects:list');
    expect(projectsResponse.body.data).toEqual([
      expect.objectContaining({ id: projectId, templateCount: 2, title: 'Shared source project' }),
    ]);
    expect(await app.db.getRepository('vscFileCommits').count()).toBe(commitCountBefore + 1);
    expect(await app.db.getRepository('jsTemplateLogs').count({ filter: { projectId } })).toBeGreaterThan(
      auditCountBefore,
    );

    const committedHead = addResponse.body.data.project.headCommitId;
    const commitCountAfterSuccess = await app.db.getRepository('vscFileCommits').count();
    const staleResponse = await app
      .agent()
      .post('/jsTemplateProjects:addTemplate')
      .send({
        destination: { type: 'existing', projectId },
        expectedHeadCommitId: before.headCommitId,
        kind: 'js-field',
        templateName: 'stale-field',
        title: 'Stale field',
      });

    expect(staleResponse.status).toBe(409);
    expect(staleResponse.body.errors[0].code).toBe('JS_TEMPLATE_SOURCE_OUTDATED');
    const afterFailure = await app.agent().post('/jsTemplateProjects:get').send({ projectId });
    expect(afterFailure.body.data.headCommitId).toBe(committedHead);
    expect(await app.db.getRepository('vscFileCommits').count()).toBe(commitCountAfterSuccess);
    expect(await app.db.getRepository('jsTemplates').count({ filter: { projectId } })).toBe(2);
  });
});

async function createSourceProject(
  app: MockServer,
  input: { id: string; lifecycleStatus: 'enabled' | 'disabled' | 'archived'; name: string; title: string },
): Promise<void> {
  await app.db.getRepository('jsTemplateProjects').create({
    values: {
      ...input,
      applicationName: app.name,
      vscRepoId: `vscr_${input.id}`,
      normalizedName: input.name,
      healthStatus: 'ready',
      headCommitId: `vscc_${input.id}`,
    },
  });
}

function createTemplateRecord(input: {
  id: string;
  projectId: string;
  kind: string;
  templateName: string;
  title: string;
}) {
  const root = `src/client/${input.kind}/${input.templateName}`;
  return {
    ...input,
    target: 'client',
    entryPath: `${root}/index.tsx`,
    descriptorPath: `${root}/entry.json`,
    healthStatus: 'ready',
    diagnostics: [],
  };
}

function createUsageRecord(
  id: string,
  templateId: string,
  kind: string,
  resolvedStatus: 'active' | 'owner_missing' = 'active',
) {
  return {
    id,
    projectId: 'jtp_catalog',
    templateId,
    kind,
    ownerKind: 'flowModel.step',
    ownerLocator: { kind: 'flowModel.step', modelUid: `fm_${id}`, flowKey: 'settings', stepKey: 'run' },
    ownerLocatorHash: `sha256:${id}`,
    settingsHash: `sha256:settings-${id}`,
    resolvedStatus,
  };
}

async function waitForSuccessfulCreate(app: MockServer, jobId: string, projectId: string): Promise<void> {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const job = await app.db.getRepository('jsTemplateCreateJobs').findOne({ filterByTk: jobId });
    if (job?.get('status') === 'failed') {
      throw new Error(`Creation job ${jobId} failed with ${String(job.get('errorCode'))}`);
    }
    if (!job) {
      const project = await app.db.getRepository('jsTemplateProjects').findOne({ filterByTk: projectId });
      if (project) {
        return;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`Creation job ${jobId} did not finish`);
}
