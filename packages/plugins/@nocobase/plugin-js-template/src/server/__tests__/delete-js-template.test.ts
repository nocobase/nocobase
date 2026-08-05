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

import { JsTemplateError } from '../../shared/errors';
import { createJsTemplateEntryStarter } from '../../shared/jsTemplateEntryStarter';
import type { JsTemplate } from '../../shared/types';
import PluginJsTemplateServer from '../plugin';
import { DeleteJsTemplateService } from '../services/DeleteJsTemplateService';

describe('template-level JS Template deletion protection', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({ plugins: [PluginJsTemplateServer] });
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('blocks an effective usage and deletes only the selected entry after that usage is detached', async () => {
    const createResponse = await app
      .agent()
      .post('/jsTemplateProjects:create')
      .send({
        name: 'delete-entry-source',
        title: 'Delete entry source',
        initialFiles: [
          ...createJsTemplateEntryStarter({
            kind: 'js-block',
            templateName: 'sales-card',
            title: 'Sales card',
          }),
          ...createJsTemplateEntryStarter({
            kind: 'js-action',
            templateName: 'mark-won',
            title: 'Mark won',
          }),
        ],
        message: 'Create deletion test Source Project',
      });

    expect(createResponse.status).toBe(202);
    const projectId = String(createResponse.body.data.targetProjectId);
    await waitForSuccessfulCreate(app, String(createResponse.body.data.id), projectId);

    const templates = await app.db.getRepository('jsTemplates').find({ filter: { projectId } });
    const selected = templates.find((template) => template.get('templateName') === 'sales-card');
    const remaining = templates.find((template) => template.get('templateName') === 'mark-won');
    if (!selected || !remaining) {
      throw new Error('Expected both Template Entries to be compiled');
    }
    const selectedTemplateId = String(selected.get('id'));
    const selectedArtifactHash = String(selected.get('artifactHash'));
    const originalHeadCommitId = String(
      (await app.db.getRepository('jsTemplateProjects').findOne({ filterByTk: projectId }))?.get('headCommitId'),
    );
    await app.db.getRepository('jsTemplateUsages').create({
      values: {
        id: 'jtu_delete_entry_usage',
        projectId,
        templateId: selectedTemplateId,
        kind: 'js-block',
        ownerKind: 'flowModel.step',
        ownerLocator: {
          kind: 'flowModel.step',
          modelUid: 'fm_delete_entry_usage',
          use: 'JSBlockModel',
          stepPath: ['stepParams', 'jsSettings'],
        },
        ownerLocatorHash: 'sha256:delete-entry-usage',
        settingsHash: 'sha256:delete-entry-settings',
        resolvedStatus: 'active',
      },
    });

    const blocked = await app.agent().post('/jsTemplates:delete').send({ templateId: selectedTemplateId });

    expect(blocked.status).toBe(409);
    expect(blocked.body.errors?.[0]).toMatchObject({
      code: 'JS_TEMPLATE_USAGE_EXISTS',
      details: { templateId: selectedTemplateId, usageCount: 1 },
    });
    expect(await app.db.getRepository('jsTemplates').findOne({ filterByTk: selectedTemplateId })).toBeTruthy();
    expect(
      (await app.db.getRepository('jsTemplateProjects').findOne({ filterByTk: projectId }))?.get('headCommitId'),
    ).toBe(originalHeadCommitId);

    await app.db.getRepository('jsTemplateUsages').update({
      filterByTk: 'jtu_delete_entry_usage',
      values: { resolvedStatus: 'owner_missing' },
    });
    const deleted = await app.agent().post('/jsTemplates:delete').send({ templateId: selectedTemplateId });

    expect(deleted.status).toBe(200);
    expect(deleted.body.data).toMatchObject({
      templateId: selectedTemplateId,
      project: { id: projectId },
    });
    expect(await app.db.getRepository('jsTemplates').findOne({ filterByTk: selectedTemplateId })).toBeNull();
    expect(await app.db.getRepository('jsTemplates').findOne({ filterByTk: String(remaining.get('id')) })).toBeTruthy();
    expect(await app.db.getRepository('jsTemplateUsages').findOne({ filterByTk: 'jtu_delete_entry_usage' })).toBeNull();
    expect(await app.db.getRepository('jsTemplateArtifacts').findOne({ filterByTk: selectedArtifactHash })).toBeNull();

    const source = await app.agent().post('/jsTemplateFiles:pull').send({ projectId, includeContent: 'none' });
    expect(source.status).toBe(200);
    expect(source.body.data.files.map((file: { path: string }) => file.path)).not.toContain(
      'src/client/js-blocks/sales-card/entry.json',
    );
    expect(source.body.data.files.map((file: { path: string }) => file.path)).toContain(
      'src/client/js-actions/mark-won/entry.json',
    );

    const catalog = await app.agent().post('/jsTemplates:listCatalog');
    expect(catalog.body.data.filter((template: { projectId: string }) => template.projectId === projectId)).toEqual([
      expect.objectContaining({ id: String(remaining.get('id')), templateName: 'mark-won' }),
    ]);
    expect(
      await app.db.getRepository('jsTemplateLogs').count({
        filter: { projectId, action: 'templateDelete', result: 'blocked' },
      }),
    ).toBe(1);
    expect(
      await app.db.getRepository('jsTemplateLogs').count({
        filter: { projectId, action: 'templateDelete', result: 'success' },
      }),
    ).toBe(1);
  });

  it('allows an unused Template Entry to be deleted while its Source Project is disabled', async () => {
    const createResponse = await app
      .agent()
      .post('/jsTemplateProjects:create')
      .send({
        name: 'disabled-delete-source',
        title: 'Disabled delete source',
        initialFiles: createJsTemplateEntryStarter({
          kind: 'js-block',
          templateName: 'disabled-card',
          title: 'Disabled card',
        }),
        message: 'Create disabled deletion test Source Project',
      });
    const projectId = String(createResponse.body.data.targetProjectId);
    await waitForSuccessfulCreate(app, String(createResponse.body.data.id), projectId);
    const template = await app.db.getRepository('jsTemplates').findOne({
      filter: { projectId, templateName: 'disabled-card' },
    });
    if (!template) {
      throw new Error('Expected the disabled deletion Template Entry to be compiled');
    }
    const templateId = String(template.get('id'));
    await app.db.getRepository('jsTemplateProjects').update({
      filterByTk: projectId,
      values: { lifecycleStatus: 'disabled' },
    });

    const response = await app.agent().post('/jsTemplates:delete').send({ templateId });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ templateId, project: { id: projectId, lifecycleStatus: 'disabled' } });
    expect(await app.db.getRepository('jsTemplates').findOne({ filterByTk: templateId })).toBeNull();
  });

  it('rejects an archived Source Project without changing its Template Entry', async () => {
    const projectId = 'jtp_archived_delete';
    const templateId = 'jtt_archived_delete';
    await app.db.getRepository('jsTemplateProjects').create({
      values: {
        id: projectId,
        applicationName: app.name,
        vscRepoId: 'vscr_archived_delete',
        name: 'archived-delete',
        normalizedName: 'archived-delete',
        title: 'Archived delete',
        lifecycleStatus: 'archived',
        healthStatus: 'ready',
        headCommitId: 'vscc_archived_delete',
      },
    });
    await app.db.getRepository('jsTemplates').create({
      values: {
        id: templateId,
        projectId,
        target: 'client',
        kind: 'js-block',
        templateName: 'archived-card',
        entryPath: 'src/client/js-blocks/archived-card/index.tsx',
        descriptorPath: 'src/client/js-blocks/archived-card/entry.json',
        healthStatus: 'ready',
        diagnostics: [],
      },
    });

    const response = await app.agent().post('/jsTemplates:delete').send({ templateId });

    expect(response.status).toBe(409);
    expect(response.body.errors?.[0]).toMatchObject({ code: 'JS_TEMPLATE_PROJECT_ARCHIVED' });
    expect(await app.db.getRepository('jsTemplates').findOne({ filterByTk: templateId })).toBeTruthy();
  });
});

describe('DeleteJsTemplateService snapshot protection', () => {
  it('requires delete permission before reading Template or source state', async () => {
    const fixture = createDeleteServiceFixture({ permissionDenied: true });

    await expect(fixture.service.deleteTemplate({ templateId: fixture.template.id })).rejects.toMatchObject({
      code: 'JS_TEMPLATE_PERMISSION_DENIED',
      status: 403,
    });

    expect(fixture.assertActionAllowed).toHaveBeenCalledWith({ action: 'delete', ctx: {} });
    expect(fixture.getTemplate).not.toHaveBeenCalled();
    expect(fixture.publishPreparedSave).not.toHaveBeenCalled();
  });

  it('rechecks archived Source Project state under the deletion lock', async () => {
    const fixture = createDeleteServiceFixture({ lockedLifecycleStatus: 'archived' });

    await expect(fixture.service.deleteTemplate({ templateId: fixture.template.id })).rejects.toMatchObject({
      code: 'JS_TEMPLATE_PROJECT_ARCHIVED',
      status: 409,
    });

    expect(fixture.findTemplate).not.toHaveBeenCalled();
    expect(fixture.publishPreparedSave).not.toHaveBeenCalled();
  });

  it('rejects a concurrently replaced runtime artifact instead of leaking it after deletion', async () => {
    const fixture = createDeleteServiceFixture({ currentArtifactHash: 'artifact_new' });

    await expect(fixture.service.deleteTemplate({ templateId: fixture.template.id })).rejects.toMatchObject({
      code: 'JS_TEMPLATE_SOURCE_OUTDATED',
      status: 409,
    });

    expect(fixture.publishPreparedSave).not.toHaveBeenCalled();
  });

  it('locks the shared Artifact row before deciding whether it is unreferenced', async () => {
    const fixture = createDeleteServiceFixture({});

    await expect(fixture.service.deleteTemplate({ templateId: fixture.template.id })).resolves.toMatchObject({
      templateId: fixture.template.id,
    });

    expect(fixture.findArtifact).toHaveBeenCalledWith({
      filterByTk: fixture.template.artifactHash,
      transaction: fixture.transaction,
      lock: 'UPDATE',
    });
    expect(fixture.findArtifact.mock.invocationCallOrder[0]).toBeLessThan(
      fixture.countArtifactReferences.mock.invocationCallOrder[0],
    );
    expect(fixture.destroyArtifact).toHaveBeenCalledWith({
      filterByTk: fixture.template.artifactHash,
      transaction: fixture.transaction,
    });
  });
});

function createDeleteServiceFixture(options: {
  lockedLifecycleStatus?: 'enabled' | 'disabled' | 'archived';
  currentArtifactHash?: string;
  permissionDenied?: boolean;
}) {
  const template = createDeleteTemplate();
  const currentTemplate = createDeleteTemplate({ artifactHash: options.currentArtifactHash || template.artifactHash });
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  const findTemplate = vi.fn(async () => ({
    get: (key: string) => currentTemplate[key as keyof JsTemplate],
  }));
  const publishPreparedSave = vi.fn();
  const findArtifact = vi.fn(async () => ({ get: () => template.artifactHash }));
  const countArtifactReferences = vi.fn(async () => 0);
  const destroyArtifact = vi.fn(async () => 1);
  const getTemplate = vi.fn(async () => template);
  const assertActionAllowed = vi.fn(async () => {
    if (options.permissionDenied) {
      throw new JsTemplateError('JS_TEMPLATE_PERMISSION_DENIED', 'JS Template delete permission is required');
    }
  });
  const db = {
    sequelize: {
      transaction: vi.fn(async (run: (currentTransaction: typeof transaction) => Promise<unknown>) => run(transaction)),
    },
    getRepository: vi.fn((name: string) => {
      if (name === 'jsTemplates') {
        return { findOne: findTemplate, count: countArtifactReferences, destroy: vi.fn(async () => 1) };
      }
      if (name === 'jsTemplateArtifacts') {
        return { findOne: findArtifact, destroy: destroyArtifact };
      }
      if (name === 'jsTemplateUsages') {
        return { destroy: vi.fn(async () => 0) };
      }
      throw new Error(`Unexpected repository: ${name}`);
    }),
  };
  const projectService = {
    getProject: vi.fn(async () => ({ id: template.projectId, lifecycleStatus: 'enabled' })),
    lockInternalProjectForUpdate: vi.fn(async () => ({
      id: template.projectId,
      lifecycleStatus: options.lockedLifecycleStatus || 'enabled',
    })),
  };
  const service = new DeleteJsTemplateService(
    db as never,
    projectService as never,
    {
      pull: vi.fn(async () => ({
        project: { id: template.projectId },
        commit: { id: 'commit_1' },
        files: [{ path: template.descriptorPath }],
      })),
    } as never,
    { getTemplate } as never,
    { prepareSaveSource: vi.fn(async () => ({})), publishPreparedSave } as never,
    { countEffectiveUsages: vi.fn(async () => 0) } as never,
    { assertActionAllowed } as never,
    { recordLifecycleEvent: vi.fn(async () => undefined) } as never,
  );
  return {
    assertActionAllowed,
    countArtifactReferences,
    destroyArtifact,
    findArtifact,
    findTemplate,
    getTemplate,
    publishPreparedSave,
    service,
    template,
    transaction,
  };
}

function createDeleteTemplate(overrides: Partial<JsTemplate> = {}): JsTemplate {
  return {
    id: 'jtt_delete_snapshot',
    projectId: 'jtp_delete_snapshot',
    target: 'client',
    kind: 'js-block',
    templateName: 'snapshot-card',
    entryPath: 'src/client/js-blocks/snapshot-card/index.tsx',
    descriptorPath: 'src/client/js-blocks/snapshot-card/entry.json',
    title: 'Snapshot card',
    description: null,
    category: null,
    icon: null,
    tags: null,
    sort: null,
    settingsSchema: null,
    settingsSchemaHash: null,
    settingsDefaultsHash: null,
    compiledCommitId: 'commit_1',
    compiledInputKey: 'compile_key_1',
    compilerBuildId: 'compiler_build_1',
    runtimeArtifact: {
      code: 'ctx.render(<div />);',
      version: 'v2',
      entryPath: 'src/client/js-blocks/snapshot-card/index.tsx',
      filesHash: 'files_hash_1',
    },
    runtimeVersion: 'v2',
    surfaceStyle: 'render',
    runtimeCodeHash: 'runtime_code_hash_1',
    artifactHash: 'artifact_old',
    filesHash: 'files_hash_1',
    compiledAt: '2026-08-05T00:00:00.000Z',
    healthStatus: 'ready',
    diagnostics: [],
    ...overrides,
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
