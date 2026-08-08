/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Transaction } from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';
import JSZip from 'jszip';
import { vi } from 'vitest';

import { DEFAULT_JS_TEMPLATE_TEMPLATE_FILES } from '../../shared/default-template';
import PluginJsTemplateServer from '../plugin';
import type { JsTemplateCreateJob } from '../../shared/types';
import { JsTemplateCreateJobExecutor } from '../services/JsTemplateCreateJobExecutor';
import { JsTemplateCreateJobStore } from '../services/JsTemplateCreateJobStore';
import type { JsTemplateCreateFromRemoteService } from '../services/JsTemplateCreateFromRemoteService';
import type { JsTemplateProjectService } from '../services/JsTemplateProjectService';
import type { JsTemplateCompileService } from '../services/JsTemplateCompileService';

describe('plugin-js-template initial source creation', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: [PluginJsTemplateServer],
    });
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('creates and compiles the default source as the first version when ZIP is omitted', async () => {
    const createResponse = await app.agent().post('/jsTemplateProjects:create').send({ name: 'Default Source' });
    expect(createResponse.status).toBe(202);
    const accepted = createResponse.body.data;
    await waitForSuccessfulCreate(app, accepted.id, accepted.targetProjectId);
    const repoResponse = await app.agent().resource('jsTemplateProjects').get({ filterByTk: accepted.targetProjectId });
    const repo = repoResponse.body.data;
    const pullResponse = await app
      .agent()
      .resource('jsTemplateFiles')
      .pull({
        values: { projectId: repo.id, includeContent: 'all' },
      });
    const historyResponse = await app
      .agent()
      .resource('jsTemplateFiles')
      .listCommits({
        values: { projectId: repo.id },
      });
    const entriesResponse = await app
      .agent()
      .resource('jsTemplates')
      .list({
        values: { projectId: repo.id },
      });

    expect(repo).toMatchObject({
      healthStatus: 'ready',
      headCommitId: expect.stringMatching(/^vscc_/),
      lastCompiledAt: expect.any(String),
    });
    expect(pullResponse.body.data.files.map((file) => file.path).sort()).toEqual(
      DEFAULT_JS_TEMPLATE_TEMPLATE_FILES.map((file) => file.path).sort(),
    );
    expect(historyResponse.body.data).toHaveLength(1);
    expect(entriesResponse.body.data).toHaveLength(6);
    expect(entriesResponse.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'js-block', templateName: 'welcome-card', healthStatus: 'ready' }),
        expect.objectContaining({ kind: 'js-action', templateName: 'refresh-data', healthStatus: 'ready' }),
        expect.objectContaining({ kind: 'js-field', templateName: 'status-tag', healthStatus: 'ready' }),
        expect.objectContaining({ kind: 'js-field', templateName: 'record-status-column', healthStatus: 'ready' }),
        expect.objectContaining({ kind: 'js-item', templateName: 'form-total-preview', healthStatus: 'ready' }),
        expect.objectContaining({ kind: 'js-page', templateName: 'hello-page', healthStatus: 'ready' }),
      ]),
    );
    expect(entriesResponse.body.data.some((entry) => entry.kind === 'runjs')).toBe(false);
    expect(entriesResponse.body.data.every((entry) => Boolean(entry.runtimeArtifact?.code))).toBe(true);
  });

  it('rejects uploaded source that uses the removed generic RunJS root', async () => {
    const zip = new JSZip();
    zip.file('src/client/runjs/example/index.ts', 'return 1;\n');
    zip.file('src/client/runjs/example/entry.json', '{"schemaVersion":1,"key":"example"}\n');
    const zipBase64 = await zip.generateAsync({ type: 'base64' });

    const createResponse = await app
      .agent()
      .post('/jsTemplateProjects:create')
      .send({ name: 'Removed RunJS Source', zipBase64 });

    expect(createResponse.status).toBe(202);
    await expect(waitForFailedCreateJob(app, createResponse.body.data.id)).resolves.toMatchObject({
      status: 'failed',
      errorCode: 'JS_TEMPLATE_VALIDATION_FAILED',
    });
  });

  it('uses uploaded ZIP source for the first version and compiles it immediately', async () => {
    const zip = new JSZip();
    zip.file('uploaded/README.md', '# Uploaded\n');
    zip.file('uploaded/src/client/js-blocks/example/index.jsx', 'ctx.render(<div>Uploaded</div>);\n');
    zip.file('uploaded/src/client/js-blocks/example/entry.json', '{"schemaVersion":1,"key":"example"}\n');
    const zipBase64 = await zip.generateAsync({ type: 'base64' });

    const createResponse = await app
      .agent()
      .post('/jsTemplateProjects:create')
      .send({ name: 'Uploaded Source', zipBase64 });
    expect(createResponse.status).toBe(202);
    const accepted = createResponse.body.data;
    await waitForSuccessfulCreate(app, accepted.id, accepted.targetProjectId);
    const repoResponse = await app.agent().resource('jsTemplateProjects').get({ filterByTk: accepted.targetProjectId });
    const repo = repoResponse.body.data;
    const pullResponse = await app
      .agent()
      .resource('jsTemplateFiles')
      .pull({
        values: { projectId: repo.id, includeContent: 'all' },
      });
    const entriesResponse = await app
      .agent()
      .resource('jsTemplates')
      .list({
        values: { projectId: repo.id },
      });

    expect(repo).toMatchObject({ healthStatus: 'ready', headCommitId: expect.any(String) });
    expect(pullResponse.body.data.files.map((file) => file.path)).toEqual([
      'README.md',
      'src/client/js-blocks/example/entry.json',
      'src/client/js-blocks/example/index.jsx',
    ]);
    expect(entriesResponse.body.data).toEqual([
      expect.objectContaining({
        kind: 'js-block',
        templateName: 'example',
        healthStatus: 'ready',
        runtimeArtifact: expect.objectContaining({ code: expect.any(String) }),
      }),
    ]);
  });

  it('rolls back repository creation when uploaded source cannot be compiled', async () => {
    const zip = new JSZip();
    zip.file('src/client/js-blocks/broken/index.tsx', "import Missing from './missing';\nctx.render(<Missing />);\n");
    zip.file('src/client/js-blocks/broken/entry.json', '{"schemaVersion":1,"key":"broken"}\n');
    const zipBase64 = await zip.generateAsync({ type: 'base64' });
    const projectCount = await app.db.getRepository('jsTemplateProjects').count();
    const vscProjectCount = await app.db.getRepository('vscFileRepositories').count();
    const commitCount = await app.db.getRepository('vscFileCommits').count();

    const createResponse = await app
      .agent()
      .post('/jsTemplateProjects:create')
      .send({ name: 'Broken Uploaded Source', zipBase64 });

    expect(createResponse.status).toBe(202);
    await expect(waitForFailedCreateJob(app, createResponse.body.data.id)).resolves.toMatchObject({
      status: 'failed',
      errorCode: 'JS_TEMPLATE_VALIDATION_FAILED',
    });
    await expect(app.db.getRepository('jsTemplateProjects').count()).resolves.toBe(projectCount);
    await expect(app.db.getRepository('vscFileRepositories').count()).resolves.toBe(vscProjectCount);
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCount);
  });

  it('rolls back repository creation when the initial source commit is missing', async () => {
    const projectId = 'jtp_missing_initial_commit';
    const projectService = {
      createProject: vi.fn(async (_input: unknown, ctx: { transaction?: Transaction }) => {
        await app.db.getRepository('jsTemplateProjects').create({
          values: {
            id: projectId,
            vscRepoId: 'vscr_missing_initial_commit',
            name: 'Missing Initial Commit',
            normalizedName: 'missing-initial-commit',
            headCommitId: null,
          },
          transaction: ctx.transaction,
        });

        return {
          id: projectId,
          headCommitId: null,
        };
      }),
    } as unknown as JsTemplateProjectService;
    const runtimeCompileService = {
      compileCurrentRuntime: vi.fn(),
    } as unknown as JsTemplateCompileService;
    Object.assign(projectService, { findInternalProjectById: vi.fn(async () => null) });
    const executor = new JsTemplateCreateJobExecutor(
      app.db,
      projectService,
      runtimeCompileService,
      {} as JsTemplateCreateFromRemoteService,
    );

    await expect(
      executor.execute(createJob('jtcj_missing_commit', projectId, 'Missing Initial Commit')),
    ).rejects.toMatchObject({
      code: 'JS_TEMPLATE_SOURCE_ERROR',
      details: { projectId },
    });

    expect(runtimeCompileService.compileCurrentRuntime).not.toHaveBeenCalled();
    await expect(
      app.db.getRepository('jsTemplateProjects').findOne({
        filterByTk: projectId,
      }),
    ).resolves.toBeNull();
  });

  it('fails stale pending and running jobs and releases their retained input', async () => {
    const createdAt = new Date('2026-07-27T00:00:00.000Z');
    const store = new JsTemplateCreateJobStore(app.db, () => createdAt);
    const pending = await store.enqueue(createJobInput('pending'));
    const running = await store.enqueue(createJobInput('running'));
    await store.start(running.id, 'main');

    const cleanupStore = new JsTemplateCreateJobStore(app.db, () => new Date('2030-07-27T00:11:00.000Z'));
    const failed = await cleanupStore.failStale('main', {
      pendingTimeoutMs: 5 * 60_000,
      runningTimeoutMs: 10 * 60_000,
    });

    expect(failed.map((job) => job.id).sort()).toEqual([pending.id, running.id].sort());
    expect(failed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: 'failed', payload: null, reservationKey: null }),
        expect.objectContaining({ status: 'failed', payload: null, reservationKey: null }),
      ]),
    );
  });
});

function createJobInput(name: string) {
  return {
    applicationName: 'main',
    targetProjectId: `jtp_stale_${name}`,
    name,
    normalizedName: name,
    sourceType: 'starter' as const,
    payload: { sourceType: 'starter' as const, message: 'Initial JS Template source' },
  };
}

async function waitForSuccessfulCreate(app: MockServer, jobId: string, projectId: string): Promise<void> {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const job = await app.db.getRepository('jsTemplateCreateJobs').findOne({ filterByTk: jobId });
    if (job?.get('status') === 'failed') {
      throw new Error(`Creation job ${jobId} failed with ${String(job.get('errorCode'))}`);
    }
    if (!job) {
      const repo = await app.db.getRepository('jsTemplateProjects').findOne({ filterByTk: projectId });
      if (repo) {
        return;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Creation job ${jobId} did not finish`);
}

async function waitForFailedCreateJob(app: MockServer, jobId: string): Promise<JsTemplateCreateJob> {
  for (let attempt = 0; attempt < 1200; attempt += 1) {
    const record = await app.db.getRepository('jsTemplateCreateJobs').findOne({ filterByTk: jobId });
    if (record?.get('status') === 'failed') {
      return record.toJSON() as JsTemplateCreateJob;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Creation job ${jobId} did not finish`);
}

function createJob(id: string, targetProjectId: string, name: string): JsTemplateCreateJob {
  return {
    id,
    applicationName: 'main',
    targetProjectId,
    name,
    normalizedName: 'missing-initial-commit',
    title: null,
    description: null,
    sourceType: 'starter',
    status: 'running',
    payload: { sourceType: 'starter', message: 'Initial JS Template source' },
    errorCode: null,
    errorMessage: null,
    reservationKey: 'sha256:missing',
    actorUserId: null,
    requestId: null,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
