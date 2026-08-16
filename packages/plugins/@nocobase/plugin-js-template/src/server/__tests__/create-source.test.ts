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
import { vi } from 'vitest';

import { JS_TEMPLATE_ACL_SNIPPET } from '../../constants';
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
import { createUnsignedSessionToken, createZipBase64 } from './security-test-fixtures';

describe('plugin-js-template initial source creation', () => {
  let app: MockServer;
  let agent: ReturnType<MockServer['agent']>;

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: ['field-sort', 'users', 'auth', 'acl', 'data-source-manager', 'system-settings', PluginJsTemplateServer],
    });
    agent = await createRoleAgent(app, 'jsTemplateCreateSourceAdmin', [JS_TEMPLATE_ACL_SNIPPET]);
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('creates and compiles the default source as the first version when ZIP is omitted', async () => {
    const createResponse = await agent
      .post('/jsTemplateProjects:create')
      .send({ idempotencyKey: 'create-default-source', name: 'Default Source' });
    expect(createResponse.status).toBe(202);
    const accepted = createResponse.body.data;
    await waitForSuccessfulCreate(app, accepted.id, accepted.targetProjectId);
    const internalProject = await app.db.getRepository('jsTemplateProjects').findOne({
      filterByTk: accepted.targetProjectId,
    });
    const creationJob = await app.db.getRepository('jsTemplateCreateJobs').findOne({ filterByTk: accepted.id });
    const repoResponse = await agent.resource('jsTemplateProjects').get({ filterByTk: accepted.targetProjectId });
    const repo = repoResponse.body.data;
    const pullResponse = await agent.resource('jsTemplateFiles').pull({
      values: { projectId: repo.id, includeContent: 'all' },
    });
    const historyResponse = await agent.resource('jsTemplateFiles').listCommits({
      values: { projectId: repo.id },
    });
    const entriesResponse = await agent.resource('jsTemplates').list({
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
    expect(entriesResponse.body.data).toHaveLength(5);
    expect(entriesResponse.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'js-block', templateName: 'welcome-card', healthStatus: 'ready' }),
        expect.objectContaining({ kind: 'js-action', templateName: 'refresh-data', healthStatus: 'ready' }),
        expect.objectContaining({ kind: 'js-field', templateName: 'status-tag', healthStatus: 'ready' }),
        expect.objectContaining({ kind: 'js-field', templateName: 'record-status-column', healthStatus: 'ready' }),
        expect.objectContaining({ kind: 'js-item', templateName: 'form-total-preview', healthStatus: 'ready' }),
      ]),
    );
    expect(entriesResponse.body.data.some((entry) => entry.kind === 'runjs')).toBe(false);
    expect(entriesResponse.body.data.every((entry) => Boolean(entry.runtimeArtifact?.code))).toBe(true);
  });

  it('rejects uploaded source that uses the removed generic RunJS root', async () => {
    const zipBase64 = await createZipBase64({
      'src/client/runjs/example/index.ts': 'return 1;\n',
      'src/client/runjs/example/entry.json': '{"schemaVersion":1,"key":"example"}\n',
    });

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

    const createResponse = await agent
      .post('/jsTemplateProjects:create')
      .send({ idempotencyKey: 'create-removed-runjs-source', name: 'Removed RunJS Source', zipBase64 });

    expect(createResponse.status).toBe(422);
    await expect(app.db.getRepository('jsTemplateCreateJobs').count()).resolves.toBe(0);
    await expect(app.db.getRepository('jsTemplateProjects').count()).resolves.toBe(0);
    await expect(app.db.getRepository('vscFileRepositories').count()).resolves.toBe(0);
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(0);
  });

  it('rejects directly supplied source that uses the removed generic RunJS root', async () => {
    const projectCount = await app.db.getRepository('jsTemplateProjects').count();
    const repositoryCount = await app.db.getRepository('vscFileRepositories').count();
    const commitCount = await app.db.getRepository('vscFileCommits').count();
    const artifactCount = await app.db.getRepository('jsTemplateArtifacts').count();
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

    const createResponse = await agent.post('/jsTemplateProjects:create').send({
      idempotencyKey: 'create-direct-removed-runjs-source',
      name: 'Direct Removed RunJS Source',
      initialFiles,
    });

    expect(createResponse.status).toBe(202);
    const failedJob = await waitForFailedCreateJob(app, createResponse.body.data.id);
    expect(failedJob).toMatchObject({
      status: 'failed',
      errorCode: 'JS_TEMPLATE_VALIDATION_FAILED',
      payload: null,
      actorUserId: expect.any(String),
      requestHash: expect.any(String),
      finishedAt: expect.any(Date),
    });
    await expect(app.db.getRepository('jsTemplateProjects').count()).resolves.toBe(projectCount);
    await expect(app.db.getRepository('vscFileRepositories').count()).resolves.toBe(repositoryCount);
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCount);
    await expect(app.db.getRepository('jsTemplateArtifacts').count()).resolves.toBe(artifactCount);
  });

  it('uses uploaded ZIP source for the first version and compiles it immediately', async () => {
    const zipBase64 = await createZipBase64({
      'uploaded/README.md': '# Uploaded\n',
      'uploaded/src/client/js-blocks/example/index.jsx': 'ctx.render(<div>Uploaded</div>);\n',
      'uploaded/src/client/js-blocks/example/entry.json': '{"schemaVersion":1,"key":"example"}\n',
    });

    const createResponse = await agent
      .post('/jsTemplateProjects:create')
      .send({ idempotencyKey: 'create-uploaded-source', name: 'Uploaded Source', zipBase64 });
    expect(createResponse.status).toBe(202);
    const accepted = createResponse.body.data;
    await waitForSuccessfulCreate(app, accepted.id, accepted.targetProjectId);
    const internalProject = await app.db.getRepository('jsTemplateProjects').findOne({
      filterByTk: accepted.targetProjectId,
    });
    const creationJob = await app.db.getRepository('jsTemplateCreateJobs').findOne({ filterByTk: accepted.id });
    const repoResponse = await agent.resource('jsTemplateProjects').get({ filterByTk: accepted.targetProjectId });
    const repo = repoResponse.body.data;
    const pullResponse = await agent.resource('jsTemplateFiles').pull({
      values: { projectId: repo.id, includeContent: 'all' },
    });
    const entriesResponse = await agent.resource('jsTemplates').list({
      values: { projectId: repo.id },
    });

    expect(repo).toMatchObject({ healthStatus: 'ready', headCommitId: expect.any(String) });
    expect(creationJob?.get('applicationName')).toBe('main');
    expect(creationJob?.get('payload')).toBeNull();
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
    const zipBase64 = await createZipBase64({
      'src/client/js-blocks/broken/index.tsx': "import Missing from './missing';\nctx.render(<Missing />);\n",
      'src/client/js-blocks/broken/entry.json': '{"schemaVersion":1,"key":"broken"}\n',
    });
    const projectCount = await app.db.getRepository('jsTemplateProjects').count();
    const vscProjectCount = await app.db.getRepository('vscFileRepositories').count();
    const commitCount = await app.db.getRepository('vscFileCommits').count();

    const createResponse = await agent
      .post('/jsTemplateProjects:create')
      .send({ idempotencyKey: 'create-broken-uploaded-source', name: 'Broken Uploaded Source', zipBase64 });

    expect(createResponse.status).toBe(202);
    await expect(waitForFailedCreateJob(app, createResponse.body.data.id)).resolves.toMatchObject({
      status: 'failed',
      errorCode: 'JS_TEMPLATE_VALIDATION_FAILED',
    });
    await expect(app.db.getRepository('jsTemplateCreateJobs').count()).resolves.toBe(1);
    await expect(app.db.getRepository('jsTemplateProjects').count()).resolves.toBe(projectCount);
    await expect(app.db.getRepository('vscFileRepositories').count()).resolves.toBe(vscProjectCount);
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCount);
  });

  it('rolls back repository creation when the initial source commit is missing', async () => {
    const projectId = 'jtp_missing_initial_commit';
    const projectService = {
      getCurrentApplicationName: vi.fn(() => 'main'),
      createProjectForCompositeUseCase: vi.fn(async (_input: unknown, ctx: { transaction?: Transaction }) => {
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
      prepareInitialWorkspace: vi.fn(async () => ({ projectId })),
      applyPreparedInitialWorkspace: vi.fn(),
    } as unknown as JsTemplateCompileService;
    Object.assign(projectService, { findInternalProjectById: vi.fn(async () => null) });
    const executor = new JsTemplateCreateJobExecutor(
      app.db,
      projectService,
      runtimeCompileService,
      {} as JsTemplateCreateFromRemoteService,
      { assertCurrentClaim: vi.fn(async () => undefined) } as unknown as JsTemplateCreateJobStore,
      vi.fn(async () => undefined),
    );

    await expect(
      executor.execute(createJob('jtcj_missing_commit', projectId, 'Missing Initial Commit'), 'claim-missing-commit'),
    ).rejects.toMatchObject({
      code: 'JS_TEMPLATE_SOURCE_ERROR',
      details: { projectId },
    });

    expect(runtimeCompileService.applyPreparedInitialWorkspace).not.toHaveBeenCalled();
    await expect(
      app.db.getRepository('jsTemplateProjects').findOne({
        filterByTk: projectId,
      }),
    ).resolves.toBeNull();
  });

  it.each([
    ['starter', 'first-write'],
    ['zip', 'first-write'],
    ['starter', 'final-transaction'],
    ['zip', 'final-transaction'],
  ] as const)(
    'rolls back %s creation when authorization is revoked at the %s fence',
    async (sourceType, revocationPoint) => {
      const projectId = `jtp_auth_${sourceType}_${revocationPoint}`;
      const prepareInitialWorkspace = vi.fn(async () => ({ projectId }));
      const applyPreparedInitialWorkspace = vi.fn(async () => ({ project: { id: projectId } }));
      const createProjectForCompositeUseCase = vi.fn(async (_input: unknown, ctx: { transaction?: Transaction }) => {
        await app.db.getRepository('jsTemplateProjects').create({
          values: {
            id: projectId,
            vscRepoId: `vscr_auth_${sourceType}_${revocationPoint}`,
            applicationName: 'main',
            name: `Authorization ${sourceType} ${revocationPoint}`,
            normalizedName: `authorization-${sourceType}-${revocationPoint}`,
            headCommitId: 'vscc_authorized',
          },
          transaction: ctx.transaction,
        });
        return { id: projectId, headCommitId: 'vscc_authorized' };
      });
      const projectService = {
        getCurrentApplicationName: vi.fn(() => 'main'),
        findInternalProjectById: vi.fn(async () => null),
        createProjectForCompositeUseCase,
      } as unknown as JsTemplateProjectService;
      const store = {
        assertCurrentClaim: vi.fn(async () => undefined),
        markFinalizePending: vi.fn(async () => undefined),
      } as unknown as JsTemplateCreateJobStore;
      const authorize = vi.fn(async () => {
        const revocationCall = revocationPoint === 'first-write' ? 1 : 2;
        if (authorize.mock.calls.length === revocationCall) {
          throw new Error(`authorization revoked at ${revocationPoint}`);
        }
      });
      const executor = new JsTemplateCreateJobExecutor(
        app.db,
        projectService,
        { prepareInitialWorkspace, applyPreparedInitialWorkspace } as unknown as JsTemplateCompileService,
        {} as JsTemplateCreateFromRemoteService,
        store,
        authorize,
      );
      const baseJob = createJob(
        `jtcj_auth_${sourceType}_${revocationPoint}`,
        projectId,
        `Authorization ${sourceType} ${revocationPoint}`,
      );
      const job: JsTemplateCreateJob = {
        ...baseJob,
        sourceType,
        payload:
          sourceType === 'zip'
            ? {
                sourceType: 'zip',
                message: 'Import ZIP source',
                files: [{ path: 'src/client/js-blocks/example/index.tsx', content: 'ctx.render(null);\n' }],
              }
            : { sourceType: 'starter', message: 'Initial JS Template source' },
      };

      await expect(executor.execute(job, job.claimToken || '')).rejects.toThrow(
        `authorization revoked at ${revocationPoint}`,
      );

      expect(prepareInitialWorkspace).toHaveBeenCalledOnce();
      if (revocationPoint === 'first-write') {
        expect(createProjectForCompositeUseCase).not.toHaveBeenCalled();
        expect(applyPreparedInitialWorkspace).not.toHaveBeenCalled();
        expect(store.assertCurrentClaim).toHaveBeenCalledOnce();
        expect(authorize).toHaveBeenCalledOnce();
      } else {
        expect(createProjectForCompositeUseCase).toHaveBeenCalledOnce();
        expect(applyPreparedInitialWorkspace).toHaveBeenCalledOnce();
        expect(store.assertCurrentClaim).toHaveBeenCalledTimes(2);
        expect(authorize).toHaveBeenCalledTimes(2);
      }
      expect(store.markFinalizePending).not.toHaveBeenCalled();
      expect(authorize.mock.calls.every(([, transaction]) => Boolean(transaction))).toBe(true);
      await expect(app.db.getRepository('jsTemplateProjects').findOne({ filterByTk: projectId })).resolves.toBeNull();
    },
  );

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
    await app.db.sequelize.transaction((transaction) =>
      currentStore.markFinalizePending(
        pending.id,
        'main',
        currentClaim.claimToken || '',
        pending.targetProjectId,
        transaction,
      ),
    );
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
        files: [{ path: 'src/client/js-blocks/support/index.tsx', content: 'ctx.render(null);\n' }],
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

  it('does not reclaim a finalize-pending job while its lease is live', async () => {
    const now = new Date('2026-07-27T00:00:00.000Z');
    const store = new JsTemplateCreateJobStore(
      app.db,
      () => now,
      () => 'claim-live',
    );
    const pending = await store.enqueue(createJobInput('finalize-live'));
    const claimed = await store.claim(pending.id, 'main', 'runner-live', 60_000);
    if (!claimed?.claimToken) {
      throw new Error('Expected live finalize claimant');
    }
    await app.db.sequelize.transaction((transaction) =>
      store.markFinalizePending(pending.id, 'main', claimed.claimToken || '', pending.targetProjectId, transaction),
    );

    await expect(store.findClaimableIds('main')).resolves.not.toContain(pending.id);
    await expect(store.claim(pending.id, 'main', 'runner-recovery', 60_000)).resolves.toBeNull();
  });

  it.each([
    ['expired', new Date('2026-07-27T00:00:02.000Z')],
    ['missing', null],
  ] as const)(
    'allows exactly one claimant to recover a finalize-pending job with a %s lease',
    async (_label, lease) => {
      let now = new Date('2026-07-27T00:00:00.000Z');
      const initialStore = new JsTemplateCreateJobStore(
        app.db,
        () => now,
        () => 'claim-initial',
      );
      const pending = await initialStore.enqueue(createJobInput(`finalize-${_label}`));
      const claimed = await initialStore.claim(pending.id, 'main', 'runner-initial', 1_000);
      if (!claimed?.claimToken) {
        throw new Error('Expected initial finalize claimant');
      }
      await app.db.sequelize.transaction((transaction) =>
        initialStore.markFinalizePending(
          pending.id,
          'main',
          claimed.claimToken || '',
          pending.targetProjectId,
          transaction,
        ),
      );
      now = new Date('2026-07-27T00:00:02.000Z');
      await app.db.getRepository('jsTemplateCreateJobs').update({
        filterByTk: pending.id,
        values: { leaseExpiresAt: lease },
      });
      const firstRecovery = new JsTemplateCreateJobStore(
        app.db,
        () => now,
        () => 'claim-recovery-one',
      );
      const secondRecovery = new JsTemplateCreateJobStore(
        app.db,
        () => now,
        () => 'claim-recovery-two',
      );

      const recovered = await Promise.all([
        firstRecovery.claim(pending.id, 'main', 'runner-recovery-one', 60_000),
        secondRecovery.claim(pending.id, 'main', 'runner-recovery-two', 60_000),
      ]);

      expect(recovered.filter(Boolean)).toHaveLength(1);
      expect(recovered.find(Boolean)).toMatchObject({
        status: 'finalize-pending',
        resultProjectId: pending.targetProjectId,
        attempt: 2,
      });
    },
  );

  it('retains succeeded and failed jobs until their owner explicitly dismisses them', async () => {
    const store = new JsTemplateCreateJobStore(app.db, () => new Date('2026-07-27T00:00:00.000Z'));
    const succeededPending = await store.enqueue({ ...createJobInput('visible-success'), actorUserId: '7' });
    const succeededClaim = await store.claim(succeededPending.id, 'main', 'runner', 60_000);
    if (!succeededClaim?.claimToken) {
      throw new Error('Expected succeeded job claim');
    }
    await app.db.sequelize.transaction((transaction) =>
      store.markFinalizePending(
        succeededClaim.id,
        'main',
        succeededClaim.claimToken || '',
        succeededClaim.targetProjectId,
        transaction,
      ),
    );
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

    await expect(store.listOwnVisibleJobs('main', '7', 'session-7')).resolves.toEqual(
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
    await expect(store.dismiss(activePending.id, 'main', '7', 'session-7')).rejects.toMatchObject({ status: 409 });
    await store.dismiss(succeededClaim.id, 'main', '7', 'session-7');
    await store.dismiss(failedClaim.id, 'main', '7', 'session-7');
    await expect(store.listOwnVisibleJobs('main', '7', 'session-7')).resolves.toEqual([
      expect.objectContaining({ id: activePending.id, status: 'pending' }),
    ]);
  });

  it('soft-prunes terminal history beyond 100 records without looping and revives an idempotent replay', async () => {
    const now = new Date('2026-07-27T00:00:00.000Z');
    const store = new JsTemplateCreateJobStore(
      app.db,
      () => now,
      () => 'claim-prune-trigger',
    );
    const terminalRecords = Array.from({ length: 101 }, (_, index) => ({
      id: `jtcj_prune_${String(index).padStart(3, '0')}`,
      applicationName: 'main',
      targetProjectId: `jtp_prune_${String(index).padStart(3, '0')}`,
      name: `Prune ${index}`,
      normalizedName: `prune-${index}`,
      sourceType: 'starter',
      idempotencyKey: `create-prune-${index}`,
      requestHash: `hash-prune-${index}`,
      status: 'failed',
      payload: null,
      errorCode: 'JS_TEMPLATE_CREATE_FAILED',
      errorMessage: 'Historical failure',
      actorUserId: '7',
      sessionId: 'session-7',
      authorizationRole: 'member',
      authorizationRoles: ['member'],
      dismissed: false,
      attempt: 1,
      finishedAt: now,
    }));
    await app.db.getRepository('jsTemplateCreateJobs').createMany({ records: terminalRecords });
    const trigger = await store.enqueue(createJobInput('prune-trigger'));
    const claim = await store.claim(trigger.id, 'main', 'runner-prune', 60_000);
    if (!claim?.claimToken) {
      throw new Error('Expected pruning trigger claim');
    }

    await expect(
      store.fail(claim.id, 'main', claim.claimToken, 'JS_TEMPLATE_CREATE_FAILED', 'Trigger terminal pruning'),
    ).resolves.toMatchObject({ status: 'failed' });

    const visibleTerminalCount = await app.db.getRepository('jsTemplateCreateJobs').count({
      filter: { actorUserId: '7', sessionId: 'session-7', status: 'failed', dismissed: false },
    });
    const dismissed = await app.db.getRepository('jsTemplateCreateJobs').find({
      filter: { actorUserId: '7', sessionId: 'session-7', status: 'failed', dismissed: true },
      sort: ['id'],
    });
    expect(visibleTerminalCount).toBe(100);
    expect(dismissed).toHaveLength(2);

    const replayedRecord = dismissed.find((record) => String(record.get('id')).startsWith('jtcj_prune_'));
    if (!replayedRecord) {
      throw new Error('Expected a pruned historical job');
    }
    const replayedId = String(replayedRecord.get('id'));
    const replayedIndex = Number(replayedId.slice('jtcj_prune_'.length));
    await expect(
      store.enqueue({
        ...createJobInput(`prune-${replayedIndex}`),
        targetProjectId: `jtp_prune_${String(replayedIndex).padStart(3, '0')}`,
        name: `Prune ${replayedIndex}`,
        normalizedName: `prune-${replayedIndex}`,
        idempotencyKey: `create-prune-${replayedIndex}`,
        requestHash: `hash-prune-${replayedIndex}`,
      }),
    ).resolves.toMatchObject({ id: replayedId, dismissed: false });
  });

  it('keeps list, get and dismiss non-enumerating across sessions of the same actor', async () => {
    const store = new JsTemplateCreateJobStore(app.db);
    const firstSession = await store.enqueue(createJobInput('session-one'));
    const secondSession = await store.enqueue({
      ...createJobInput('session-two'),
      sessionId: 'session-8',
    });

    await expect(store.listOwnVisibleJobs('main', '7', 'session-7')).resolves.toEqual([
      expect.objectContaining({ id: firstSession.id }),
    ]);
    await expect(store.getOwn(secondSession.id, 'main', '7', 'session-7')).rejects.toMatchObject({ status: 404 });
    await expect(store.dismiss(secondSession.id, 'main', '7', 'session-7')).rejects.toMatchObject({ status: 404 });
  });

  it('returns one durable job for concurrent SQLite enqueue calls with the same idempotency key', async () => {
    const store = new JsTemplateCreateJobStore(app.db);
    const input = createJobInput('concurrent-same-key');

    const [first, replay] = await Promise.all([store.enqueue(input), store.enqueue(input)]);

    expect(replay.id).toBe(first.id);
    await expect(app.db.getRepository('jsTemplateCreateJobs').count()).resolves.toBe(1);
  });

  it('lets only one concurrent SQLite enqueue reserve the same normalized name across different keys', async () => {
    const store = new JsTemplateCreateJobStore(app.db);
    const first = createJobInput('concurrent-name');
    const second = {
      ...first,
      targetProjectId: 'jtp_stale_concurrent-name-second',
      idempotencyKey: 'create-concurrent-name-second',
      requestHash: 'hash-concurrent-name-second',
    };

    const results = await Promise.allSettled([store.enqueue(first), store.enqueue(second)]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toEqual([
      expect.objectContaining({
        reason: expect.objectContaining({ code: 'JS_TEMPLATE_PROJECT_CONFLICT', status: 409 }),
      }),
    ]);
    await expect(app.db.getRepository('jsTemplateCreateJobs').count()).resolves.toBe(1);
  });

  it('keeps a caller SQLite transaction usable after a name-reservation conflict', async () => {
    const store = new JsTemplateCreateJobStore(app.db);

    await app.db.sequelize.transaction(async (transaction) => {
      const first = createJobInput('caller-transaction-first');
      await store.enqueue(first, transaction);
      await expect(
        store.enqueue(
          {
            ...first,
            targetProjectId: 'jtp_stale_caller-transaction-conflict',
            idempotencyKey: 'create-caller-transaction-conflict',
            requestHash: 'hash-caller-transaction-conflict',
          },
          transaction,
        ),
      ).rejects.toMatchObject({ code: 'JS_TEMPLATE_PROJECT_CONFLICT', status: 409 });

      await store.enqueue(createJobInput('caller-transaction-after-conflict'), transaction);
      await expect(app.db.getRepository('jsTemplateCreateJobs').count({ transaction })).resolves.toBe(2);
    });

    await expect(app.db.getRepository('jsTemplateCreateJobs').count()).resolves.toBe(2);
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
        getBearerToken: () => createUnsignedSessionToken('session-7'),
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
      getBearerToken: () => createUnsignedSessionToken('session-7'),
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
    idempotencyKey: `create-${name}`,
    requestHash: `hash-${name}`,
    actorUserId: '7',
    sessionId: 'session-7',
    authorizationRole: 'member',
    authorizationRoles: ['member'],
  };
}

async function createRoleAgent(app: MockServer, roleName: string, snippets: string[]) {
  await app.db.getRepository('roles').create({ values: { name: roleName, snippets } });
  const user = await app.db.getRepository('users').create({
    values: {
      nickname: roleName,
      roles: [roleName],
    },
  });
  return (await app.agent().login(user)).set('x-role', roleName);
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
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const record = await app.db.getRepository('jsTemplateCreateJobs').findOne({ filterByTk: jobId });
    if (record?.get('status') === 'failed') {
      return record.toJSON() as JsTemplateCreateJob;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Creation job ${jobId} did not fail`);
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
    idempotencyKey: 'create-missing-initial-commit',
    requestHash: 'hash-missing-initial-commit',
    status: 'running',
    resultProjectId: null,
    payload: { sourceType: 'starter', message: 'Initial JS Template source' },
    errorCode: null,
    errorMessage: null,
    reservationKey: 'sha256:missing',
    actorUserId: '7',
    sessionId: 'session-7',
    authorizationRole: 'member',
    authorizationRoles: ['member'],
    dismissed: false,
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
