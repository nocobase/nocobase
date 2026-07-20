/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import type { Application } from '@nocobase/server';
import { createMockServer } from '@nocobase/test';
import { vi } from 'vitest';

import type { VscFileSyncJobRecord } from '../../../shared/vsc-file/remote-sync-types';
import type { VscRemotePullDiscoveryResult } from '../remotes/VscRemotePullDiscoveryService';
import { RemoteReconcileService } from '../remotes/RemoteReconcileService';
import { RemoteSyncError } from '../remotes/RemoteSyncAdapter';
import { RemoteSyncAdapterRegistry } from '../remotes/RemoteSyncAdapterRegistry';
import { RemoteSyncRuntimeService } from '../remotes/RemoteSyncRuntimeService';
import { SyncJobStore } from '../remotes/SyncJobStore';
import { lightExtensionSyncAuditActionNames, remoteSyncAuditActionNames } from '../remotes/audit';
import { DeterministicRemoteAdapter } from '../remotes/testing/DeterministicRemoteAdapter';
import { VscPermissionHookRegistry } from '../permissions';
import { VscFileService } from '../services/VscFileService';
import { VscFileServerModule } from '../plugin';
import PluginLightExtensionServer from '../../plugin';

describe('vsc-file remote runtime bootstrap', () => {
  it('reloads the GitHub adapter identity-safely and unregisters the runtime on disable', async () => {
    const registeredAuditActions: Array<{ name: string }> = [];
    const app = {
      db: {} as Database,
      environment: { getVariables: vi.fn(() => ({})) },
      resourceManager: { define: vi.fn() },
      acl: { allow: vi.fn() },
      auditManager: {
        registerActions: vi.fn((actions: Array<{ name: string }>) => registeredAuditActions.push(...actions)),
      },
    } as unknown as Application;
    const module = new VscFileServerModule(app, app.db);

    await module.load();
    const firstRuntime = module.getRemoteSyncRuntime();
    expect(
      firstRuntime.normalizeConfig('github', {
        owner: 'nocobase',
        repository: 'demo',
        branch: 'main',
        subdirectory: null,
      }),
    ).toEqual({ owner: 'nocobase', repository: 'demo', branch: 'main', subdirectory: null });
    await module.load();
    expect(module.getRemoteSyncRuntime()).not.toBe(firstRuntime);
    for (const actionName of remoteSyncAuditActionNames) {
      expect(registeredAuditActions).toContainEqual(expect.objectContaining({ name: `vscRemote:${actionName}` }));
    }
    for (const actionName of lightExtensionSyncAuditActionNames) {
      expect(registeredAuditActions).toContainEqual(
        expect.objectContaining({ name: `lightExtensionSync:${actionName}` }),
      );
    }

    await module.afterDisable();
    expect(() => module.getRemoteSyncRuntime()).toThrow('Remote sync runtime is not loaded');

    await module.load();
    expect(module.getRemoteSyncRuntime()).toBeDefined();
  });

  it('keeps the Push reconciler from consuming recoverable Pull jobs', async () => {
    const jobStore = {
      listRecoverable: vi.fn(async () => [
        {
          id: 'job_pull',
          operation: 'pull',
          status: 'finalize-pending',
        },
      ]),
    };
    const reconciler = new RemoteReconcileService({} as Database, {
      adapterRegistry: new RemoteSyncAdapterRegistry(),
      jobStore: jobStore as never,
    });

    await expect(reconciler.reconcileRecoverable()).resolves.toEqual([]);
    expect(jobStore.listRecoverable).toHaveBeenCalledTimes(1);
  });

  it('emits sanitized recovery, job, and conflict audit events for recovered Push jobs', async () => {
    const audit = vi.fn(async () => undefined);
    const runtime = new RemoteSyncRuntimeService({} as Database, {
      adapterRegistry: new RemoteSyncAdapterRegistry(),
      credentialResolver: { validate: vi.fn() },
      permissionHooks: new VscPermissionHookRegistry(),
      audit,
    });
    const job = {
      id: 'job_recovered',
      remoteId: 'remote_recovered',
      remoteTargetVersion: 3,
      operation: 'push',
      status: 'failed',
      expectedRemoteRevision: 'rev_before',
      resultRemoteRevision: 'rev_after',
      resultLocalCommitId: 'commit_after',
    } as unknown as VscFileSyncJobRecord;
    const runtimeInternals = runtime as unknown as {
      reconcileService: {
        reconcileRecoverable: (ctx?: {
          onRecoveryResult?: (event: {
            job: VscFileSyncJobRecord;
            result: { job: VscFileSyncJobRecord; decision: 'conflict'; published: boolean };
          }) => Promise<void>;
        }) => Promise<Array<{ job: VscFileSyncJobRecord; decision: 'conflict'; published: boolean }>>;
      };
    };
    runtimeInternals.reconcileService = {
      reconcileRecoverable: vi.fn(async (ctx) => {
        const result = { job, decision: 'conflict' as const, published: false };
        await ctx?.onRecoveryResult?.({ job, result });
        return [result];
      }),
    };

    await runtime.recoverPushJobs();

    expect(audit.mock.calls.map(([actionName]) => actionName)).toEqual(['reconcile', 'job', 'conflict']);
    expect(audit).toHaveBeenCalledWith(
      'reconcile',
      expect.objectContaining({
        remoteId: 'remote_recovered',
        jobId: 'job_recovered',
        decision: 'conflict',
        status: 'failed',
      }),
    );
  });

  it('emits Pull job and reconcile audit events for successful owner recovery discovery', async () => {
    const audit = vi.fn(async () => undefined);
    const runtime = new RemoteSyncRuntimeService({} as Database, {
      adapterRegistry: new RemoteSyncAdapterRegistry(),
      credentialResolver: { validate: vi.fn() },
      permissionHooks: new VscPermissionHookRegistry(),
      audit,
    });
    const discovery = {
      remote: { id: 'remote_pull' },
      job: {
        id: 'job_pull',
        remoteId: 'remote_pull',
        operation: 'pull',
        status: 'succeeded',
        remoteTargetVersion: 2,
        lastErrorCode: null,
      },
      snapshot: { revision: 'rev_pull' },
      plan: { action: 'pull', reasonCode: null },
      applyRequired: false,
      handle: null,
    } as unknown as VscRemotePullDiscoveryResult;
    const runtimeInternals = runtime as unknown as {
      pullService: {
        discover: () => Promise<VscRemotePullDiscoveryResult>;
      };
    };
    runtimeInternals.pullService = {
      discover: vi.fn(async () => discovery),
    };

    await runtime.getPullCoordinator().discover(
      {
        remoteId: 'remote_pull',
        expectedRepoId: 'repo_pull',
        expectedLocalCommitId: 'commit_pull',
        expectedRemoteRevision: 'rev_pull',
        expectedRemoteTargetVersion: 2,
        planFingerprint: 'sha256:pull',
      },
      { request: { requestSource: 'light-extension-pull-recovery' } },
    );

    expect(audit.mock.calls.map(([actionName]) => actionName)).toEqual(['pull', 'job', 'reconcile']);
  });

  it('emits failed Pull recovery and persisted conflict audit events when discovery fails', async () => {
    const audit = vi.fn(async () => undefined);
    const db = {
      getRepository: vi.fn(() => ({ findOne: vi.fn(async () => ({ id: 'conflict_pull' })) })),
    } as unknown as Database;
    const runtime = new RemoteSyncRuntimeService(db, {
      adapterRegistry: new RemoteSyncAdapterRegistry(),
      credentialResolver: { validate: vi.fn() },
      permissionHooks: new VscPermissionHookRegistry(),
      audit,
    });
    const runtimeInternals = runtime as unknown as {
      pullService: {
        discover: () => Promise<VscRemotePullDiscoveryResult>;
      };
    };
    runtimeInternals.pullService = {
      discover: vi.fn(async () => {
        throw new RemoteSyncError('DIVERGED', 'Conflict', { details: { reasonCode: 'remote-diverged' } });
      }),
    };

    await expect(
      runtime.getPullCoordinator().discover(
        {
          remoteId: 'remote_pull',
          expectedRepoId: 'repo_pull',
          expectedLocalCommitId: 'commit_pull',
          expectedRemoteRevision: 'rev_pull',
          expectedRemoteTargetVersion: 2,
          planFingerprint: 'sha256:pull',
        },
        { request: { requestId: 'recover:job_pull', requestSource: 'light-extension-pull-recovery' } },
      ),
    ).rejects.toMatchObject({ code: 'DIVERGED' });

    expect(audit.mock.calls.map(([actionName]) => actionName)).toEqual(['pull', 'job', 'reconcile', 'conflict']);
    expect(audit).toHaveBeenCalledWith(
      'reconcile',
      expect.objectContaining({ jobId: 'job_pull', reasonCode: 'remote-diverged', status: 'failed' }),
    );
  });

  it('emits a reconcile audit when recovered Pull owner apply is failed', async () => {
    const audit = vi.fn(async () => undefined);
    const runtime = new RemoteSyncRuntimeService({} as Database, {
      adapterRegistry: new RemoteSyncAdapterRegistry(),
      credentialResolver: { validate: vi.fn() },
      permissionHooks: new VscPermissionHookRegistry(),
      audit,
    });
    const handle = {
      remote: { id: 'remote_pull' },
      jobId: 'job_pull',
      claimToken: 'claim_pull',
      expectedLocalCommitId: 'commit_pull',
      expectedRemoteRevision: 'rev_pull',
      expectedRemoteTargetVersion: 2,
      planFingerprint: 'sha256:pull',
      snapshot: { revision: 'rev_pull' },
    };
    const discovery = {
      remote: handle.remote,
      job: {
        id: 'job_pull',
        remoteId: 'remote_pull',
        operation: 'pull',
        status: 'running',
        remoteTargetVersion: 2,
        lastErrorCode: null,
      },
      snapshot: handle.snapshot,
      plan: { action: 'pull', reasonCode: null },
      applyRequired: true,
      handle,
    } as unknown as VscRemotePullDiscoveryResult;
    const runtimeInternals = runtime as unknown as {
      pullService: {
        discover: () => Promise<VscRemotePullDiscoveryResult>;
        failApply: () => Promise<void>;
      };
    };
    runtimeInternals.pullService = {
      discover: vi.fn(async () => discovery),
      failApply: vi.fn(async () => undefined),
    };

    const coordinator = runtime.getPullCoordinator();
    const result = await coordinator.discover(
      {
        remoteId: 'remote_pull',
        expectedRepoId: 'repo_pull',
        expectedLocalCommitId: 'commit_pull',
        expectedRemoteRevision: 'rev_pull',
        expectedRemoteTargetVersion: 2,
        planFingerprint: 'sha256:pull',
      },
      { request: { requestSource: 'light-extension-pull-recovery' } },
    );
    if (!result.handle) {
      throw new Error('Expected a Pull apply handle');
    }
    await coordinator.failApply(result.handle, 'UNSAFE_CONTENT');

    expect(audit.mock.calls.map(([actionName]) => actionName)).toEqual(['pull', 'job', 'job', 'reconcile']);
  });

  it('pins a provider default branch before persisting an empty-branch configuration', async () => {
    const app = await createMockServer({ plugins: [PluginLightExtensionServer] });
    try {
      const repository = await new VscFileService(app.db, new VscPermissionHookRegistry()).createRepository({
        ownerType: 'plugin',
        ownerId: 'runtime-test',
        name: 'source',
      });
      const adapterRegistry = new RemoteSyncAdapterRegistry();
      adapterRegistry.register(
        new DeterministicRemoteAdapter({
          initialMetadata: { branch: 'main' },
        }),
      );
      const runtime = new RemoteSyncRuntimeService(app.db, {
        adapterRegistry,
        credentialResolver: { validate: vi.fn() },
        permissionHooks: new VscPermissionHookRegistry(),
      });

      const configured = await runtime.configureRemote({
        repoId: repository.repository.id,
        name: 'origin',
        provider: 'github',
        config: { owner: 'nocobase', repository: 'demo', branch: '', subdirectory: null },
        authRef: null,
      });

      expect(configured.config.branch).toBe('main');
      expect(Object.isFrozen(configured)).toBe(true);
      expect((await runtime.getRemote(repository.repository.id, 'origin'))?.config.branch).toBe('main');

      await new SyncJobStore(app.db).createOrGet({
        remoteId: configured.id,
        remoteTargetVersion: configured.version,
        operation: 'pull',
        idempotencyKey: 'active-configure-gate',
      });
      await expect(
        runtime.configureRemote({
          repoId: repository.repository.id,
          name: 'origin',
          provider: 'github',
          config: configured.config,
          authRef: null,
        }),
      ).rejects.toMatchObject({ code: 'BUSY', details: { reasonCode: 'active-sync-job' } });
    } finally {
      await app.destroy();
    }
  });

  it('fetches a candidate target and establishes its initial baseline in the caller transaction', async () => {
    const app = await createMockServer({ plugins: [PluginLightExtensionServer] });
    try {
      const initialFiles = [{ path: 'index.ts', content: 'export default 1;\n', language: 'typescript' }];
      const repository = await new VscFileService(app.db, new VscPermissionHookRegistry()).createRepository({
        ownerType: 'plugin',
        ownerId: 'runtime-initial-baseline',
        name: 'source',
        initialFiles,
      });
      const adapterRegistry = new RemoteSyncAdapterRegistry();
      adapterRegistry.register(
        new DeterministicRemoteAdapter({
          initialFiles,
          initialRevision: 'remote-initial',
          initialMetadata: { branch: 'main' },
        }),
      );
      const runtime = new RemoteSyncRuntimeService(app.db, {
        adapterRegistry,
        credentialResolver: { validate: vi.fn() },
        permissionHooks: new VscPermissionHookRegistry(),
      });
      const fetched = await runtime.fetchTarget({
        provider: 'github',
        config: { owner: 'nocobase', repository: 'demo', branch: '', subdirectory: null },
        authRef: null,
      });

      const established = await app.db.sequelize.transaction((transaction) =>
        runtime.establishInitialBaseline(
          {
            repoId: repository.repository.id,
            name: 'origin',
            provider: fetched.provider,
            config: fetched.config,
            authRef: null,
            localCommitId: repository.repository.headCommitId as string,
            snapshot: fetched.snapshot,
          },
          transaction,
        ),
      );

      expect(fetched).toMatchObject({
        config: { branch: 'main' },
        snapshot: { revision: 'remote-initial', files: initialFiles },
      });
      expect(established).toMatchObject({
        remote: { repoId: repository.repository.id, lastSyncedAt: expect.any(String) },
        job: {
          operation: 'pull',
          status: 'succeeded',
          resultLocalCommitId: repository.repository.headCommitId,
          resultRemoteRevision: 'remote-initial',
        },
        plan: { state: 'in-sync', action: 'noop' },
      });
      expect(Object.isFrozen(established)).toBe(true);
      await expect(app.db.getRepository('vscFileExternalCommitMaps').count()).resolves.toBe(1);
      await expect(app.db.getRepository('vscFileSyncJobs').count()).resolves.toBe(1);

      await expect(
        app.db.sequelize.transaction(async (transaction) => {
          const secondRepository = await new VscFileService(app.db, new VscPermissionHookRegistry()).createRepository(
            {
              ownerType: 'plugin',
              ownerId: 'runtime-initial-baseline-rollback',
              name: 'source',
              initialFiles,
            },
            { transaction },
          );
          await runtime.establishInitialBaseline(
            {
              repoId: secondRepository.repository.id,
              name: 'origin',
              provider: fetched.provider,
              config: fetched.config,
              authRef: null,
              localCommitId: secondRepository.repository.headCommitId as string,
              snapshot: fetched.snapshot,
            },
            transaction,
          );
          throw new Error('rollback initial baseline');
        }),
      ).rejects.toThrow('rollback initial baseline');
      await expect(app.db.getRepository('vscFileRemotes').count()).resolves.toBe(1);
      await expect(app.db.getRepository('vscFileExternalCommitMaps').count()).resolves.toBe(1);
      await expect(app.db.getRepository('vscFileSyncJobs').count()).resolves.toBe(1);
    } finally {
      await app.destroy();
    }
  });
});
