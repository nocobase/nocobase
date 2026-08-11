/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Transaction } from '@nocobase/database';
import type { HandlerType } from '@nocobase/resourcer';
import { MockServer, createMockServer } from '@nocobase/test';
import JSZip from 'jszip';
import { vi } from 'vitest';

import { DEFAULT_JS_TEMPLATE_TEMPLATE_FILES } from '../../shared/default-template';
import PluginJsTemplateServer from '../plugin';
import type { JsTemplateCreateJob } from '../../shared/types';
import { createJsTemplateCreateJobsResource } from '../resources/jsTemplateCreateJobs';
import { JsTemplateCreateJobExecutor } from '../services/JsTemplateCreateJobExecutor';
import { JsTemplateCreateJobStore } from '../services/JsTemplateCreateJobStore';
import type { JsTemplateCreateFromRemoteService } from '../services/JsTemplateCreateFromRemoteService';
import { JsTemplatePermissionService } from '../services/JsTemplatePermissionService';
import type { JsTemplateProjectService } from '../services/JsTemplateProjectService';
import type { JsTemplateCompileService } from '../services/JsTemplateCompileService';
import { JsTemplateValidator } from '../services/JsTemplateValidator';
import { parseJsTemplateSourceArchive } from '../services/JsTemplateSourceArchive';

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
    const internalProject = await app.db.getRepository('jsTemplateProjects').findOne({
      filterByTk: accepted.targetProjectId,
    });
    const creationJob = await app.db.getRepository('jsTemplateCreateJobs').findOne({ filterByTk: accepted.id });
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
    expect(creationJob?.get('applicationName')).toBe('main');
    expect(internalProject?.get('applicationName')).toBe('main');
    expect(internalProject?.get('creationJobId')).toBe(accepted.id);
    expect(repo).not.toHaveProperty('creationJobId');
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

    await expect(parseJsTemplateSourceArchive(zipBase64, new JsTemplateValidator())).rejects.toMatchObject({
      code: 'JS_TEMPLATE_VALIDATION_FAILED',
      details: {
        diagnostics: expect.arrayContaining([
          expect.objectContaining({
            code: 'workspace_path_not_allowed',
            path: 'src/client/runjs/example/index.ts',
          }),
          expect.objectContaining({
            code: 'workspace_path_not_allowed',
            path: 'src/client/runjs/example/entry.json',
          }),
        ]),
      },
    });

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

  it('rejects directly supplied source that uses the removed generic RunJS root', async () => {
    const initialFiles = [
      {
        path: 'src/client/runjs/example/index.ts',
        content: 'return 1;\n',
      },
      {
        path: 'src/client/runjs/example/entry.json',
        content: '{"schemaVersion":1,"key":"example"}\n',
      },
    ];
    const diagnostics = new JsTemplateValidator().validateInitialFiles({ files: initialFiles });

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'workspace_path_not_allowed',
          path: 'src/client/runjs/example/index.ts',
        }),
        expect.objectContaining({
          code: 'workspace_path_not_allowed',
          path: 'src/client/runjs/example/entry.json',
        }),
      ]),
    );

    const createResponse = await app
      .agent()
      .post('/jsTemplateProjects:create')
      .send({ name: 'Direct Removed RunJS Source', initialFiles });

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
    const internalProject = await app.db.getRepository('jsTemplateProjects').findOne({
      filterByTk: accepted.targetProjectId,
    });
    const creationJob = await app.db.getRepository('jsTemplateCreateJobs').findOne({ filterByTk: accepted.id });
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
    expect(creationJob?.get('applicationName')).toBe('main');
    expect(internalProject?.get('applicationName')).toBe('main');
    expect(internalProject?.get('creationJobId')).toBe(accepted.id);
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
      getCurrentApplicationName: vi.fn(() => 'main'),
      createProject: vi.fn(async (_input: unknown, ctx: { transaction?: Transaction }) => {
        await app.db.getRepository('jsTemplateProjects').create({
          values: {
            id: projectId,
            vscRepoId: 'vscr_missing_initial_commit',
            applicationName: 'main',
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
      { assertCurrentClaim: vi.fn(async () => undefined) } as unknown as JsTemplateCreateJobStore,
    );

    await expect(
      executor.execute(createJob('jtcj_missing_commit', projectId, 'Missing Initial Commit'), 'claim-missing-commit'),
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

  it('reclaims an expired lease once and fences the old worker from terminal writes', async () => {
    let now = new Date('2026-07-27T00:00:00.000Z');
    const initialStore = new JsTemplateCreateJobStore(
      app.db,
      () => now,
      () => 'claim-old',
    );
    const pending = await initialStore.enqueue(createJobInput('reclaim'));
    const initialClaim = await initialStore.claim(pending.id, 'main', 'runner-old', 1_000);
    expect(initialClaim).toMatchObject({ status: 'running', claimToken: 'claim-old', attempt: 1 });

    now = new Date('2026-07-27T00:00:02.000Z');
    const firstRecovery = new JsTemplateCreateJobStore(
      app.db,
      () => now,
      () => 'claim-first-recovery',
    );
    const secondRecovery = new JsTemplateCreateJobStore(
      app.db,
      () => now,
      () => 'claim-second-recovery',
    );
    const recovered = await Promise.all([
      firstRecovery.claim(pending.id, 'main', 'runner-first', 1_000),
      secondRecovery.claim(pending.id, 'main', 'runner-second', 1_000),
    ]);
    const currentClaim = recovered.find((job): job is JsTemplateCreateJob => Boolean(job));

    expect(recovered.filter(Boolean)).toHaveLength(1);
    expect(currentClaim).toMatchObject({ status: 'running', attempt: 2 });
    await expect(initialStore.succeed(pending.id, 'main', 'claim-old', pending.targetProjectId)).resolves.toBeNull();
    if (!currentClaim?.claimToken) {
      throw new Error('Expected one recovery claimant');
    }
    const currentStore = currentClaim.claimToken === 'claim-first-recovery' ? firstRecovery : secondRecovery;
    await expect(
      currentStore.succeed(pending.id, 'main', currentClaim.claimToken, pending.targetProjectId),
    ).resolves.toMatchObject({ status: 'succeeded', resultProjectId: pending.targetProjectId });
    await expect(
      initialStore.fail(pending.id, 'main', 'claim-old', 'JS_TEMPLATE_CREATE_FAILED', 'JS Template creation failed'),
    ).resolves.toBeNull();
  });

  it('scopes claimable creation jobs and ZIP claims to the current application', async () => {
    const store = new JsTemplateCreateJobStore(app.db);
    const mainJob = await store.enqueue(createJobInput('main-claimable'));
    const supportZipJob = await store.enqueue({
      ...createJobInput('support-zip-claimable'),
      applicationName: 'support',
      sourceType: 'zip',
      payload: {
        sourceType: 'zip',
        message: 'Import support source',
        zipBase64: 'support-application-secret',
      },
    });

    await expect(store.findClaimableIds('main')).resolves.toEqual([mainJob.id]);
    await expect(store.findClaimableIds('support')).resolves.toEqual([supportZipJob.id]);
    await expect(store.claim(supportZipJob.id, 'main', 'main-runner', 60_000)).resolves.toBeNull();
    await expect(store.claim(supportZipJob.id, 'support', 'support-runner', 60_000)).resolves.toMatchObject({
      id: supportZipJob.id,
      applicationName: 'support',
      sourceType: 'zip',
    });
    await expect(store.findClaimableIds('main')).resolves.toEqual([mainJob.id]);
  });

  it('retains succeeded and failed jobs until their owner explicitly dismisses them', async () => {
    const store = new JsTemplateCreateJobStore(app.db, () => new Date('2026-07-27T00:00:00.000Z'));
    const succeededPending = await store.enqueue({ ...createJobInput('visible-success'), actorUserId: '7' });
    const succeededClaim = await store.claim(succeededPending.id, 'main', 'runner', 60_000);
    if (!succeededClaim?.claimToken) {
      throw new Error('Expected succeeded job claim');
    }
    await store.succeed(succeededClaim.id, 'main', succeededClaim.claimToken, succeededClaim.targetProjectId);

    const failedPending = await store.enqueue({ ...createJobInput('visible-failure'), actorUserId: '7' });
    const failedClaim = await store.claim(failedPending.id, 'main', 'runner', 60_000);
    if (!failedClaim?.claimToken) {
      throw new Error('Expected failed job claim');
    }
    await store.fail(
      failedClaim.id,
      'main',
      failedClaim.claimToken,
      'JS_TEMPLATE_CREATE_FAILED',
      'JS Template creation failed',
    );
    const activePending = await store.enqueue({ ...createJobInput('visible-pending'), actorUserId: '7' });

    await expect(store.listOwnVisibleJobs('main', '7')).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: succeededClaim.id,
          status: 'succeeded',
          resultProjectId: succeededClaim.targetProjectId,
        }),
        expect.objectContaining({ id: failedClaim.id, status: 'failed', errorMessage: 'JS Template creation failed' }),
        expect.objectContaining({ id: activePending.id, status: 'pending' }),
      ]),
    );
    await expect(store.dismiss(activePending.id, 'main', '7')).rejects.toMatchObject({ status: 409 });
    await store.dismiss(succeededClaim.id, 'main', '7');
    await store.dismiss(failedClaim.id, 'main', '7');
    await expect(store.listOwnVisibleJobs('main', '7')).resolves.toEqual([
      expect.objectContaining({ id: activePending.id, status: 'pending' }),
    ]);
  });

  it('uses one non-enumerating 404 for missing, pruned, foreign-actor, and foreign-application jobs', async () => {
    const store = new JsTemplateCreateJobStore(app.db);
    const pruned = await store.enqueue({ ...createJobInput('pruned-job'), actorUserId: '7' });
    const foreignActor = await store.enqueue({
      ...createJobInput('foreign-actor-job'),
      title: 'Foreign actor secret title',
      actorUserId: '8',
    });
    const foreignApplication = await store.enqueue({
      ...createJobInput('foreign-application-job'),
      applicationName: 'support',
      title: 'Foreign application secret title',
      actorUserId: '7',
    });
    await app.db.getRepository('jsTemplateCreateJobs').destroy({ filterByTk: pruned.id });

    const permissionService = new JsTemplatePermissionService({} as never);
    const auditService = { recordCreateJobEvent: vi.fn(async () => undefined) };
    const resource = createJsTemplateCreateJobsResource({
      store,
      permissionService,
      applicationName: 'main',
      auditService: auditService as never,
    });
    const assertActionAllowed = vi.spyOn(permissionService, 'assertActionAllowed');

    for (const jobId of ['jtcj_missing', pruned.id, foreignActor.id, foreignApplication.id]) {
      const ctx = {
        action: {
          params: {
            resourceName: 'jsTemplateCreateJobs',
            actionName: 'dismiss',
            values: { jobId },
          },
        },
        auth: { user: { id: 7 } },
        can: vi.fn(() => ({})),
      };
      const next = vi.fn(async () => undefined);

      await (resource.actions?.dismiss as HandlerType)(ctx as never, next);

      expect((ctx as { status?: number }).status).toBe(404);
      expect((ctx as { withoutDataWrapping?: boolean }).withoutDataWrapping).toBe(true);
      expect((ctx as { body?: unknown }).body).toEqual({
        errors: [
          {
            code: 'JS_TEMPLATE_CREATE_JOB_NOT_FOUND',
            message: `JS Template creation job "${jobId}" was not found`,
            status: 404,
          },
        ],
      });
      expect(JSON.stringify((ctx as { body?: unknown }).body)).not.toMatch(
        /Foreign actor secret title|Foreign application secret title|actorUserId|applicationName|sourceType|payload/u,
      );
      expect(next).not.toHaveBeenCalled();
    }

    const listContext = {
      action: {
        params: {
          resourceName: 'jsTemplateCreateJobs',
          actionName: 'list',
          values: {},
        },
      },
      auth: { user: { id: 7 } },
    };
    await (resource.actions?.list as HandlerType)(
      listContext as never,
      vi.fn(async () => undefined),
    );

    expect((listContext as { body?: unknown }).body).toEqual({ jobs: [] });
    expect(assertActionAllowed).not.toHaveBeenCalled();
    expect(auditService.recordCreateJobEvent).not.toHaveBeenCalled();
    await expect(app.db.getRepository('jsTemplateCreateJobs').count()).resolves.toBe(2);
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
    if (job?.get('status') === 'succeeded' && job.get('resultProjectId') === projectId) {
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
    resultProjectId: null,
    payload: { sourceType: 'starter', message: 'Initial JS Template source' },
    errorCode: null,
    errorMessage: null,
    reservationKey: 'sha256:missing',
    actorUserId: null,
    requestId: null,
    claimToken: 'claim-missing-commit',
    claimOwner: 'runner-test',
    leaseExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    heartbeatAt: new Date().toISOString(),
    attempt: 1,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
