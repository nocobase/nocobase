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
