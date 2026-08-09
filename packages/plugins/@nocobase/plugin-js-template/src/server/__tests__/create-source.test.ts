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
import { JsTemplateCreateJobRunner } from '../services/JsTemplateCreateJobRunner';
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
    const internalProject = await app.db.getRepository('jsTemplateProjects').findOne({
      filterByTk: accepted.targetProjectId,
    });
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
    const internalProject = await app.db.getRepository('jsTemplateProjects').findOne({
      filterByTk: accepted.targetProjectId,
    });
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
    await expect(
      initialStore.fail(pending.id, 'main', 'claim-old', 'JS_TEMPLATE_CREATE_FAILED', 'JS Template creation failed'),
    ).resolves.toBeNull();
    if (!currentClaim?.claimToken) {
      throw new Error('Expected one recovery claimant');
    }
    const currentStore = currentClaim.claimToken === 'claim-first-recovery' ? firstRecovery : secondRecovery;
    const persistedCurrentClaim = await app.db
      .getRepository('jsTemplateCreateJobs')
      .findOne({ filterByTk: pending.id });
    expect(persistedCurrentClaim?.toJSON()).toMatchObject({
      status: 'running',
      claimToken: currentClaim.claimToken,
      claimOwner: currentClaim.claimOwner,
      attempt: 2,
    });
    await expect(
      currentStore.succeed(pending.id, 'main', currentClaim.claimToken, pending.targetProjectId),
    ).resolves.toMatchObject({ status: 'succeeded', resultProjectId: pending.targetProjectId });
  });

  it('keeps cleanup failures recoverable until a later lease claim can clean and fail the job', async () => {
    let now = new Date('2026-07-27T00:00:00.000Z');
    const claimTokenFactory = vi
      .fn()
      .mockReturnValueOnce('claim-cleanup-first')
      .mockReturnValueOnce('claim-cleanup-retry');
    const store = new JsTemplateCreateJobStore(app.db, () => now, claimTokenFactory);
    const pending = await store.enqueue({
      ...createJobInput('cleanup-recovery'),
      applicationName: 'cleanup-recovery-app',
      actorUserId: '7',
    });
    const executor = {
      execute: vi.fn(async () => Promise.reject(new Error('injected execution failure'))),
      cleanup: vi.fn().mockRejectedValueOnce(new Error('injected cleanup failure')).mockResolvedValueOnce(true),
    } as unknown as JsTemplateCreateJobExecutor;
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
    const runner = new JsTemplateCreateJobRunner(store, executor, {
      applicationName: 'cleanup-recovery-app',
      eventQueue: { subscribe: vi.fn(), unsubscribe: vi.fn(), publish: vi.fn(async () => undefined) },
      logger,
      runningTimeoutMs: 1_000,
      heartbeatIntervalMs: 100,
      claimOwner: 'cleanup-recovery-runner',
    });

    await runner.run(pending.id);

    const retained = await app.db.getRepository('jsTemplateCreateJobs').findOne({ filterByTk: pending.id });
    expect(retained?.toJSON()).toMatchObject({
      status: 'running',
      targetProjectId: pending.targetProjectId,
      payload: pending.payload,
      reservationKey: pending.reservationKey,
      claimToken: 'claim-cleanup-first',
      claimOwner: 'cleanup-recovery-runner',
      leaseExpiresAt: new Date('2026-07-27T00:00:01.000Z'),
      heartbeatAt: new Date('2026-07-27T00:00:00.000Z'),
      attempt: 1,
    });
    await expect(store.findClaimableIds('cleanup-recovery-app')).resolves.toEqual([]);
    expect(logger.warn).toHaveBeenCalledWith(
      'JS Template failed-creation cleanup failed; job retained for lease recovery',
      expect.objectContaining({ jobId: pending.id, targetProjectId: pending.targetProjectId }),
    );

    now = new Date('2026-07-27T00:00:02.000Z');
    await expect(store.findClaimableIds('cleanup-recovery-app')).resolves.toEqual([pending.id]);
    await runner.run(pending.id);

    const failed = await app.db.getRepository('jsTemplateCreateJobs').findOne({ filterByTk: pending.id });
    expect(failed?.toJSON()).toMatchObject({
      status: 'failed',
      targetProjectId: pending.targetProjectId,
      payload: null,
      reservationKey: null,
      claimToken: null,
      claimOwner: null,
      leaseExpiresAt: null,
      heartbeatAt: null,
      attempt: 2,
    });
    expect(executor.execute).toHaveBeenCalledTimes(2);
    expect(executor.cleanup).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ id: pending.id, claimToken: 'claim-cleanup-retry', attempt: 2 }),
      'claim-cleanup-retry',
    );
    await expect(
      store.enqueue({
        ...createJobInput('cleanup-recovery-released'),
        applicationName: 'cleanup-recovery-app',
        normalizedName: pending.normalizedName,
        actorUserId: '7',
      }),
    ).resolves.toMatchObject({ status: 'pending', normalizedName: pending.normalizedName });
  });

  it('fences old cleanup and lets the current claimant recover a residual non-ready Project', async () => {
    let now = new Date('2026-07-27T00:00:00.000Z');
    const store = new JsTemplateCreateJobStore(
      app.db,
      () => now,
      vi.fn().mockReturnValueOnce('claim-residual-old').mockReturnValueOnce('claim-residual-current'),
    );
    const pending = await store.enqueue({
      ...createJobInput('residual-recovery'),
      applicationName: 'residual-recovery-app',
      actorUserId: '7',
    });
    const oldClaim = await store.claim(pending.id, 'residual-recovery-app', 'runner-old', 1_000);
    if (!oldClaim?.claimToken) {
      throw new Error('Expected old residual-recovery claim');
    }
    const projectRepository = app.db.getRepository('jsTemplateProjects');
    await projectRepository.create({
      values: {
        id: pending.targetProjectId,
        vscRepoId: 'vscr_residual_recovery',
        applicationName: 'residual-recovery-app',
        name: pending.name,
        normalizedName: pending.normalizedName,
        healthStatus: 'pending',
        headCommitId: null,
        creationJobId: pending.id,
      },
    });
    const findInternalProjectById = vi.fn(async (projectId: string, ctx: { transaction?: Transaction } = {}) => {
      const record = await projectRepository.findOne({ filterByTk: projectId, transaction: ctx.transaction });
      return record?.toJSON() || null;
    });
    const lockInternalProjectForUpdate = vi.fn(async (projectId: string, ctx: { transaction?: Transaction } = {}) => {
      const record = await app.db.getModel('jsTemplateProjects').findByPk(projectId, {
        transaction: ctx.transaction,
        lock: ctx.transaction?.LOCK.UPDATE,
      });
      if (!record) {
        throw new Error(`Residual Project ${projectId} was not found`);
      }
      return record.toJSON();
    });
    const deleteProject = vi.fn(async (input: { projectId: string }, ctx: { transaction?: Transaction } = {}) => {
      const record = await projectRepository.findOne({
        filterByTk: input.projectId,
        transaction: ctx.transaction,
      });
      await projectRepository.destroy({ filterByTk: input.projectId, transaction: ctx.transaction });
      return record?.toJSON();
    });
    const createProject = vi.fn(
      async (
        input: { name: string; title?: string | null; description?: string | null },
        ctx: { transaction?: Transaction },
        identity: { projectId: string; creationJobId: string },
      ) => {
        await projectRepository.create({
          values: {
            id: identity.projectId,
            vscRepoId: 'vscr_residual_recovered',
            applicationName: 'residual-recovery-app',
            name: input.name,
            normalizedName: pending.normalizedName,
            title: input.title,
            description: input.description,
            healthStatus: 'ready',
            headCommitId: 'vscc_residual_recovered',
            creationJobId: identity.creationJobId,
          },
          transaction: ctx.transaction,
        });
        return { id: identity.projectId, headCommitId: 'vscc_residual_recovered' };
      },
    );
    const executor = new JsTemplateCreateJobExecutor(
      app.db,
      {
        findInternalProjectById,
        lockInternalProjectForUpdate,
        deleteProject,
        createProject,
      } as unknown as JsTemplateProjectService,
      {
        compileCurrentRuntime: vi.fn(async (projectId: string) => ({ project: { id: projectId } })),
      } as unknown as JsTemplateCompileService,
      {} as JsTemplateCreateFromRemoteService,
      store,
    );

    now = new Date('2026-07-27T00:00:02.000Z');
    const currentClaim = await store.claim(pending.id, 'residual-recovery-app', 'runner-current', 1_000);
    if (!currentClaim?.claimToken) {
      throw new Error('Expected current residual-recovery claim');
    }

    await expect(executor.cleanup(oldClaim, oldClaim.claimToken)).rejects.toMatchObject({
      code: 'JS_TEMPLATE_CONFLICT',
    });
    await expect(projectRepository.findOne({ filterByTk: pending.targetProjectId })).resolves.not.toBeNull();
    expect(deleteProject).not.toHaveBeenCalled();

    await expect(executor.execute(currentClaim, currentClaim.claimToken)).resolves.toBe(pending.targetProjectId);
    expect(deleteProject).toHaveBeenCalledTimes(1);
    const recoveredProject = await projectRepository.findOne({ filterByTk: pending.targetProjectId });
    expect(recoveredProject?.toJSON()).toMatchObject({
      healthStatus: 'ready',
      headCommitId: 'vscc_residual_recovered',
      creationJobId: pending.id,
    });
    await expect(
      store.succeed(currentClaim.id, 'residual-recovery-app', currentClaim.claimToken, pending.targetProjectId),
    ).resolves.toMatchObject({ status: 'succeeded', attempt: 2, resultProjectId: pending.targetProjectId });
  });

  it('lists every active job with only the newest 20 terminal jobs in stable order and owner scope', async () => {
    const store = new JsTemplateCreateJobStore(app.db, () => new Date('2026-07-27T00:00:00.000Z'));
    const terminalJobs: Array<{ id: string; createdAt: Date }> = [];
    for (let index = 0; index < 22; index += 1) {
      const job = await createTerminalJob(store, `visible-terminal-${index}`, 'main', '7', index % 2 === 0);
      const createdAt = new Date(Date.UTC(2026, 6, 27, 0, 0, index === 21 ? 20 : index));
      await setCreateJobCreatedAt(app, job.id, createdAt);
      terminalJobs.push({ id: job.id, createdAt });
    }
    const activeJobs: Array<{ id: string; createdAt: Date }> = [];
    for (let index = 0; index < 23; index += 1) {
      const pending = await store.enqueue({ ...createJobInput(`visible-active-${index}`), actorUserId: '7' });
      const active = index % 2 === 0 ? pending : await store.claim(pending.id, 'main', `runner-${index}`, 60_000);
      if (!active) {
        throw new Error(`Expected active job ${index}`);
      }
      const createdAt = new Date(Date.UTC(2026, 6, 27, 0, 0, index, index % 3 === 0 ? 0 : 500));
      await setCreateJobCreatedAt(app, active.id, createdAt);
      activeJobs.push({ id: active.id, createdAt });
    }
    await createTerminalJob(store, 'visible-other-actor', 'main', '8', true);
    await createTerminalJob(store, 'visible-other-app', 'secondary', '7', false);

    const firstList = await store.listOwnVisibleJobs('main', '7');
    const secondList = await store.listOwnVisibleJobs('main', '7');
    const expectedIds = [...activeJobs, ...terminalJobs.slice(2)]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime() || right.id.localeCompare(left.id))
      .map(({ id }) => id);

    expect(firstList.map((job) => job.id)).toEqual(expectedIds);
    expect(secondList.map((job) => job.id)).toEqual(expectedIds);
    expect(firstList.filter((job) => job.status === 'pending' || job.status === 'running')).toHaveLength(23);
    expect(firstList.filter((job) => job.status === 'succeeded' || job.status === 'failed')).toHaveLength(20);
  });

  it('retains 100 terminal jobs per application and actor without pruning active jobs', async () => {
    const store = new JsTemplateCreateJobStore(app.db, () => new Date('2026-07-27T00:00:00.000Z'));
    const repository = app.db.getRepository('jsTemplateCreateJobs');
    const terminalBacklogIds = await seedTerminalJobBacklog(app, {
      applicationName: 'retention-app',
      actorUserId: '7',
      count: 1_105,
      prefix: 'retained',
    });
    const auditLog = await app.db.getRepository('jsTemplateLogs').create({ values: {} });
    const activePending = await store.enqueue({
      ...createJobInput('retention-pending'),
      applicationName: 'retention-app',
      actorUserId: '7',
    });
    const activeRunningPending = await store.enqueue({
      ...createJobInput('retention-running'),
      applicationName: 'retention-app',
      actorUserId: '7',
    });
    const activeRunning = await store.claim(activeRunningPending.id, 'retention-app', 'runner', 60_000);
    if (!activeRunning?.claimToken) {
      throw new Error('Expected active running job claim');
    }
    const otherActor = await createTerminalJob(store, 'retention-other-actor', 'retention-app', '8', true);
    const otherApplication = await createTerminalJob(store, 'retention-other-app', 'secondary', '7', false);

    const firstPrunePending = await store.enqueue({
      ...createJobInput('retention-first-prune'),
      applicationName: 'retention-app',
      actorUserId: '7',
    });
    await setCreateJobCreatedAt(app, firstPrunePending.id, new Date('2026-07-27T00:00:00.000Z'));
    const firstPruneClaim = await store.claim(firstPrunePending.id, 'retention-app', 'runner', 60_000);
    if (!firstPruneClaim?.claimToken) {
      throw new Error('Expected first retention claim');
    }
    await store.succeed(
      firstPruneClaim.id,
      'retention-app',
      firstPruneClaim.claimToken,
      firstPruneClaim.targetProjectId,
    );

    await expect(
      repository.count({
        filter: { applicationName: 'retention-app', actorUserId: '7', status: { $in: ['succeeded', 'failed'] } },
      }),
    ).resolves.toBe(100);
    const retainedAfterFirstPrune = await repository.find({
      filter: { applicationName: 'retention-app', actorUserId: '7', status: { $in: ['succeeded', 'failed'] } },
      fields: ['id'],
      sort: ['-createdAt', '-id'],
    });
    expect(retainedAfterFirstPrune.map((record) => String(record.get('id')))).toEqual([
      firstPruneClaim.id,
      ...terminalBacklogIds.slice(-99).reverse(),
    ]);
    await expect(repository.findOne({ filterByTk: activePending.id })).resolves.not.toBeNull();
    await expect(repository.findOne({ filterByTk: activeRunning.id })).resolves.not.toBeNull();

    const warn = vi.spyOn(app.db.logger, 'warn');
    const destroy = vi.spyOn(repository, 'destroy').mockRejectedValueOnce(new Error('injected prune failure'));
    const failedPrunePending = await store.enqueue({
      ...createJobInput('retention-failed-prune'),
      applicationName: 'retention-app',
      actorUserId: '7',
    });
    await setCreateJobCreatedAt(app, failedPrunePending.id, new Date('2026-07-28T00:00:00.000Z'));
    const failedPruneClaim = await store.claim(failedPrunePending.id, 'retention-app', 'runner', 60_000);
    if (!failedPruneClaim?.claimToken) {
      throw new Error('Expected failed retention claim');
    }
    await expect(
      store.fail(
        failedPruneClaim.id,
        'retention-app',
        failedPruneClaim.claimToken,
        'JS_TEMPLATE_CREATE_FAILED',
        'JS Template creation failed',
      ),
    ).resolves.toMatchObject({ status: 'failed' });
    const persistedFailedPrune = await repository.findOne({ filterByTk: failedPruneClaim.id });
    expect(persistedFailedPrune?.get('status')).toBe('failed');
    expect(warn).toHaveBeenCalledWith(
      'JS Template create-job terminal-history pruning failed',
      expect.objectContaining({ applicationName: 'retention-app', actorUserId: '7', errorName: 'Error' }),
    );
    await expect(
      repository.count({
        filter: { applicationName: 'retention-app', actorUserId: '7', status: { $in: ['succeeded', 'failed'] } },
      }),
    ).resolves.toBe(101);
    destroy.mockRestore();

    const repairPending = await store.enqueue({
      ...createJobInput('retention-repair'),
      applicationName: 'retention-app',
      actorUserId: '7',
    });
    await setCreateJobCreatedAt(app, repairPending.id, new Date('2026-07-29T00:00:00.000Z'));
    const repairClaim = await store.claim(repairPending.id, 'retention-app', 'runner', 60_000);
    if (!repairClaim?.claimToken) {
      throw new Error('Expected retention repair claim');
    }
    await store.succeed(repairClaim.id, 'retention-app', repairClaim.claimToken, repairClaim.targetProjectId);

    await expect(
      repository.count({
        filter: { applicationName: 'retention-app', actorUserId: '7', status: { $in: ['succeeded', 'failed'] } },
      }),
    ).resolves.toBe(100);
    await expect(repository.findOne({ filterByTk: activePending.id })).resolves.not.toBeNull();
    await expect(repository.findOne({ filterByTk: activeRunning.id })).resolves.not.toBeNull();
    await expect(repository.findOne({ filterByTk: otherActor.id })).resolves.not.toBeNull();
    await expect(repository.findOne({ filterByTk: otherApplication.id })).resolves.not.toBeNull();
    await expect(
      app.db.getRepository('jsTemplateLogs').findOne({ filterByTk: auditLog.get('id') }),
    ).resolves.not.toBeNull();
    await store.dismiss(repairClaim.id, 'retention-app', '7');
    await expect(repository.findOne({ filterByTk: repairClaim.id })).resolves.toBeNull();

    await seedTerminalJobBacklog(app, {
      applicationName: 'retention-null-actor-app',
      actorUserId: null,
      count: 101,
      prefix: 'retained-null-actor',
    });
    const nullActorPending = await store.enqueue({
      ...createJobInput('retention-null-actor-trigger'),
      applicationName: 'retention-null-actor-app',
      actorUserId: null,
    });
    const nullActorClaim = await store.claim(
      nullActorPending.id,
      'retention-null-actor-app',
      'runner-null-actor',
      60_000,
    );
    if (!nullActorClaim?.claimToken) {
      throw new Error('Expected null-actor retention claim');
    }
    await store.succeed(
      nullActorClaim.id,
      'retention-null-actor-app',
      nullActorClaim.claimToken,
      nullActorClaim.targetProjectId,
    );
    await expect(
      repository.count({
        filter: {
          applicationName: 'retention-null-actor-app',
          actorUserId: null,
          status: { $in: ['succeeded', 'failed'] },
        },
      }),
    ).resolves.toBe(100);
    warn.mockRestore();
  });

  it('allows owners to dismiss retained terminal jobs but not active jobs', async () => {
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
});

async function createTerminalJob(
  store: JsTemplateCreateJobStore,
  name: string,
  applicationName: string,
  actorUserId: string,
  succeed: boolean,
): Promise<JsTemplateCreateJob> {
  const pending = await store.enqueue({ ...createJobInput(name), applicationName, actorUserId });
  const claimed = await store.claim(pending.id, applicationName, 'runner', 60_000);
  if (!claimed?.claimToken) {
    throw new Error(`Expected terminal claim for ${name}`);
  }
  const terminal = succeed
    ? await store.succeed(claimed.id, applicationName, claimed.claimToken, claimed.targetProjectId)
    : await store.fail(
        claimed.id,
        applicationName,
        claimed.claimToken,
        'JS_TEMPLATE_CREATE_FAILED',
        'JS Template creation failed',
      );
  if (!terminal) {
    throw new Error(`Expected terminal job for ${name}`);
  }
  return terminal;
}

async function setCreateJobCreatedAt(app: MockServer, jobId: string, createdAt: Date): Promise<void> {
  await app.db.getModel('jsTemplateCreateJobs').update({ createdAt }, { where: { id: jobId }, silent: true });
}

async function seedTerminalJobBacklog(
  app: MockServer,
  options: { applicationName: string; actorUserId: string | null; count: number; prefix: string },
): Promise<string[]> {
  const ids = Array.from({ length: options.count }, (_, index) => `jtcj_${options.prefix}_${index}`);
  const model = app.db.getModel('jsTemplateCreateJobs');
  for (let offset = 0; offset < options.count; offset += 50) {
    await model.bulkCreate(
      ids.slice(offset, offset + 50).map((id, batchIndex) => {
        const index = offset + batchIndex;
        const createdAt = new Date(Date.UTC(2026, 6, 1, 0, 0, index));
        return {
          id,
          applicationName: options.applicationName,
          targetProjectId: `jtp_${options.prefix}_${index}`,
          name: `${options.prefix}-${index}`,
          normalizedName: `${options.prefix}-${index}`,
          sourceType: 'starter',
          status: index % 2 === 0 ? 'succeeded' : 'failed',
          resultProjectId: index % 2 === 0 ? `jtp_${options.prefix}_${index}` : null,
          actorUserId: options.actorUserId,
          finishedAt: createdAt,
          createdAt,
          updatedAt: createdAt,
        };
      }),
    );
  }
  return ids;
}

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
