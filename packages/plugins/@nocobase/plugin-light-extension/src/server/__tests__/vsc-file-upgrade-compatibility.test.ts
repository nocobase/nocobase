/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import { createMockDatabase } from '@nocobase/database';
import type { Application } from '@nocobase/server';
import path from 'path';
import { vi } from 'vitest';

import MergeVscFileIntoLightExtensionMigration from '../../../../../../presets/nocobase/src/server/migrations/20260720143000-merge-vsc-file-into-light-extension';
import type { VscRemoteNormalizedConfig } from '../../shared/vsc-file/remote-sync-types';
import { VscFileServerModule } from '../vsc-file/plugin';
import { ConflictStore } from '../vsc-file/remotes/ConflictStore';
import { ExternalCommitMapStore } from '../vsc-file/remotes/ExternalCommitMapStore';
import { RemoteStore } from '../vsc-file/remotes/RemoteStore';
import { SyncJobStore } from '../vsc-file/remotes/SyncJobStore';
import { remoteInternalResourceNames } from '../vsc-file/remotes/resource';
import { createRunJSSourcePermissionHook, VscPermissionHookRegistry } from '../vsc-file/permissions';
import { VscFileService } from '../vsc-file/services/VscFileService';

const locator = {
  kind: 'flowModel.step',
  modelUid: 'fm_upgrade',
  flowKey: 'jsSettings',
  stepKey: 'runJs',
  paramPath: ['runJs', 'code'],
} as const;

const remoteConfig: VscRemoteNormalizedConfig = {
  owner: 'nocobase',
  repository: 'legacy-vsc-upgrade',
  branch: 'main',
  subdirectory: null,
};

const vscCollectionNames = [
  'vscFileRepositories',
  'vscFileBlobs',
  'vscFileTrees',
  'vscFileTreeEntries',
  'vscFileCommits',
  'vscFileRefs',
  'vscFileRemotes',
  'vscFileSyncJobs',
  'vscFileExternalCommitMaps',
  'vscFileConflicts',
] as const;

describe('VSC file upgrade compatibility', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db?.close();
  });

  it('preserves legacy VSC, RunJS, Light binding, and remote state while keeping the repository writable', async () => {
    await importLegacyDualPluginCollections(db);
    await db.sync();
    const fixture = await seedLegacyDualPluginFixture(db);
    const pluginRepository = db.getRepository('applicationPlugins');
    await expect(pluginRepository.findOne({ filter: { name: 'vsc-file' } })).resolves.toMatchObject({
      enabled: true,
      builtIn: true,
    });
    await expect(pluginRepository.findOne({ filter: { name: 'light-extension' } })).resolves.toMatchObject({
      enabled: true,
      builtIn: true,
    });

    const migration = new MergeVscFileIntoLightExtensionMigration({
      db,
      app: { pm: { repository: pluginRepository } },
    } as never);
    await migration.up();
    await expect(pluginRepository.findOne({ filter: { name: 'vsc-file' } })).resolves.toMatchObject({
      enabled: false,
      builtIn: false,
    });
    await expect(pluginRepository.findOne({ filter: { name: 'light-extension' } })).resolves.toMatchObject({
      enabled: true,
      builtIn: false,
    });
    const before = await readUpgradeSnapshot(db, fixture);

    const module = new VscFileServerModule(createModuleApplication(db).app, db);
    await module.beforeLoad();
    await module.beforeLoad();
    await db.sync();

    expect(await readUpgradeSnapshot(db, fixture)).toEqual(before);
    expect(Object.keys(before.vscCollections).sort()).toEqual([...vscCollectionNames].sort());
    expect(Object.values(before.vscCollections).every((records) => records.length > 0)).toBe(true);
    expect(before.flowModel.options).toMatchObject({
      locator,
      runJs: {
        sourceRef: {
          type: 'vsc-file',
          repoId: fixture.repoId,
          commitId: fixture.commitId,
        },
        sourceMode: 'light-extension',
        sourceBinding: {
          type: 'light-extension-entry',
          repoId: 'ler_upgrade',
          entryId: 'lee_upgrade',
          kind: 'js-block',
        },
        code: 'ctx.render("last known good");',
      },
    });
    expect(before.repository).toMatchObject({
      id: fixture.repoId,
      headCommitId: fixture.commitId,
      headSeq: 1,
      defaultRef: 'head',
    });
    expect(before.ref).toMatchObject({ repoId: fixture.repoId, name: 'head', commitId: fixture.commitId });
    expect(before.commit.metadata).toMatchObject({ locator, ownerFingerprint: 'owner:fm_upgrade:v1' });
    expect(before.commit).toMatchObject({
      id: fixture.commitId,
      hash: expect.stringMatching(/^[a-f0-9]{64}$/),
      treeHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      seq: 1,
    });
    expect(before.vscCollections.vscFileTrees[0]).toMatchObject({
      hash: before.commit.treeHash,
      entryCount: 1,
    });
    expect(before.vscCollections.vscFileTreeEntries[0]).toMatchObject({
      treeHash: before.commit.treeHash,
      blobHash: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(before.vscCollections.vscFileBlobs[0]).toMatchObject({
      hash: before.vscCollections.vscFileTreeEntries[0].blobHash,
    });
    expect(before.lightRepo).toMatchObject({
      id: 'ler_upgrade',
      vscRepoId: fixture.repoId,
      headCommitId: fixture.commitId,
    });
    expect(before.lightEntry).toMatchObject({
      id: 'lee_upgrade',
      repoId: 'ler_upgrade',
      compiledCommitId: fixture.commitId,
      runtimeCodeHash: 'runtime-code-hash-upgrade',
    });
    expect(before.lightReference).toMatchObject({
      id: 'lef_upgrade',
      repoId: 'ler_upgrade',
      entryId: 'lee_upgrade',
      ownerLocator: locator,
    });
    expect(before.remote).toMatchObject({
      id: fixture.remoteId,
      version: 1,
      config: remoteConfig,
    });
    expect(before.mapping).toMatchObject({
      remoteTargetVersion: 1,
      localCommitId: fixture.commitId,
      remoteRevision: 'remote-revision-1',
    });
    expect(before.job).toMatchObject({
      status: 'finalize-pending',
      phase: 'finalize-pending',
      expectedLocalCommitId: fixture.commitId,
      resultRemoteRevision: 'remote-revision-2',
    });
    expect(before.conflict).toMatchObject({
      status: 'open',
      currentLocalCommitId: fixture.commitId,
      currentRemoteRevision: 'remote-revision-2',
      reasonCode: 'diverged',
    });

    const service = createRunJSSourceService(db);
    const pulled = await service.pull({ repoId: fixture.repoId, includeContent: 'all' }, runJSSourceContext('open'));
    expect(pulled).toMatchObject({
      repository: { id: fixture.repoId, headCommitId: fixture.commitId },
      commit: { id: fixture.commitId },
    });
    expect(pulled.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'src/client/index.tsx',
          content: 'ctx.render("legacy vsc");\n',
        }),
      ]),
    );

    const pushed = await service.push(
      {
        repoId: fixture.repoId,
        baseCommitId: fixture.commitId,
        message: 'Continue after VSC host upgrade',
        files: [{ path: 'src/client/index.tsx', content: 'ctx.render("after upgrade");\n' }],
        metadata: { locator, ownerFingerprint: 'owner:fm_upgrade:v2' },
      },
      runJSSourceContext('save'),
    );
    const restored = await service.restoreCommit(
      {
        repoId: fixture.repoId,
        sourceCommitId: fixture.commitId,
        message: 'Restore legacy version after upgrade',
      },
      runJSSourceContext('restore'),
    );

    expect(pushed.commit).toMatchObject({ seq: 2, parentCommitId: fixture.commitId });
    expect(restored.commit).toMatchObject({ seq: 3, parentCommitId: pushed.commit.id });
    await expect(
      service.pull({ repoId: fixture.repoId, includeContent: 'all' }, runJSSourceContext('open')),
    ).resolves.toMatchObject({
      repository: { headCommitId: restored.commit.id, headSeq: 3 },
      commit: { id: restored.commit.id },
      files: expect.arrayContaining([
        expect.objectContaining({ path: 'src/client/index.tsx', content: 'ctx.render("legacy vsc");\n' }),
      ]),
    });
  });

  it('has no disabled-mode side effects and reloads server registrations identity-safely', async () => {
    const { app, resources, auditActions, aclActions } = createModuleApplication(db);
    const module = new VscFileServerModule(app, db);

    expect(vscCollectionNames.every((name) => !db.hasCollection(name))).toBe(true);
    expect(resources.size).toBe(0);
    expect(auditActions.size).toBe(0);
    expect(aclActions.size).toBe(0);
    expect(() => module.getRemoteSyncRuntime()).toThrow('Remote sync runtime is not loaded');

    await module.beforeLoad();
    await db.sync();
    await module.load();
    const firstRuntime = module.getRemoteSyncRuntime();
    const firstRecovery = vi.spyOn(firstRuntime, 'recoverPushJobs').mockResolvedValue(undefined);
    await module.afterEnable();

    expect(firstRecovery).toHaveBeenCalledTimes(1);
    expect(vscCollectionNames.every((name) => db.hasCollection(name))).toBe(true);
    expect([...resources.keys()].sort()).toEqual(['runJSSources', 'vscFile', ...remoteInternalResourceNames].sort());
    expect(aclActions).toEqual(new Set(['runJSSources', 'vscFile']));

    await module.afterDisable();
    expect(() => module.getRemoteSyncRuntime()).toThrow('Remote sync runtime is not loaded');

    await module.load();
    const secondRuntime = module.getRemoteSyncRuntime();
    const secondRecovery = vi.spyOn(secondRuntime, 'recoverPushJobs').mockResolvedValue(undefined);
    await module.afterEnable();

    expect(secondRuntime).not.toBe(firstRuntime);
    expect(secondRecovery).toHaveBeenCalledTimes(1);
    expect([...resources.keys()].sort()).toEqual(['runJSSources', 'vscFile', ...remoteInternalResourceNames].sort());
    expect(auditActions.size).toBeGreaterThan(0);
    expect(aclActions).toEqual(new Set(['runJSSources', 'vscFile']));
    await module.afterDisable();
  });

  it('keeps raw remote CRUD denied and protected-owner access fail-closed after reload', async () => {
    const { app, resources } = createModuleApplication(db);
    const module = new VscFileServerModule(app, db);
    await module.beforeLoad();
    await db.sync();
    await module.load();

    for (const resourceName of remoteInternalResourceNames) {
      const resource = resources.get(resourceName);
      expect(resource).toBeDefined();
      for (const actionName of ['list', 'get', 'create', 'update', 'destroy', 'firstOrCreate', 'updateOrCreate']) {
        const ctx: Record<string, unknown> = {};
        await resource?.actions?.[actionName]?.(ctx as never, async () => undefined);
        expect(ctx).toMatchObject({
          status: 403,
          body: {
            errors: [
              {
                code: 'PERMISSION_DENIED',
                details: { reasonCode: 'remote-internal-resource' },
              },
            ],
          },
        });
      }
    }

    await db.getRepository('vscFileRepositories').create({
      values: {
        id: 'vscr_protected_upgrade',
        ownerType: 'light-extension',
        ownerId: 'ler_protected_upgrade',
        name: 'source',
      },
    });
    await expect(new VscFileService(db).getRepository({ repoId: 'vscr_protected_upgrade' })).rejects.toMatchObject({
      code: 'PERMISSION_DENIED',
      status: 403,
      details: {
        ownerType: 'light-extension',
        denyReason: 'protected_owner_requires_permission_hook',
      },
    });

    await module.afterDisable();
    await module.load();
    expect([...resources.keys()].sort()).toEqual(['runJSSources', 'vscFile', ...remoteInternalResourceNames].sort());
    await module.afterDisable();
  });
});

async function importLegacyDualPluginCollections(db: Database) {
  await db.import({ directory: path.resolve(__dirname, '../vsc-file/collections') });
  await db.import({ directory: path.resolve(__dirname, '../collections') });
  db.collection({
    name: 'flowModels',
    autoGenId: false,
    timestamps: false,
    fields: [
      { type: 'string', name: 'uid', primaryKey: true },
      { type: 'json', name: 'options', defaultValue: {} },
    ],
  });
  db.collection({
    name: 'applicationPlugins',
    fields: [
      { type: 'string', name: 'name', unique: true },
      { type: 'string', name: 'packageName', unique: true },
      { type: 'boolean', name: 'enabled' },
      { type: 'boolean', name: 'installed' },
      { type: 'boolean', name: 'builtIn' },
    ],
  });
}

async function seedLegacyDualPluginFixture(db: Database) {
  const service = createRunJSSourceService(db);
  const created = await service.createRepository(
    {
      ownerType: 'runjs-source',
      ownerId: 'flowModel.step:fm_upgrade',
      name: 'main',
      initialFiles: [{ path: 'src/client/index.tsx', content: 'ctx.render("legacy vsc");\n' }],
      metadata: { locator, ownerFingerprint: 'owner:fm_upgrade:v1' },
    },
    runJSSourceContext('open'),
  );
  const repoId = created.repository.id;
  const commitId = created.initialCommit?.id;
  if (!commitId) {
    throw new Error('Expected the legacy fixture to create an initial commit');
  }

  const remote = await new RemoteStore(db).create({
    repoId,
    name: 'origin',
    provider: 'github',
    config: remoteConfig,
    authRef: null,
  });
  await new ExternalCommitMapStore(db).record({
    remoteId: remote.id,
    remoteTargetVersion: remote.version,
    localCommitId: commitId,
    remoteRevision: 'remote-revision-1',
    contentHash: 'sha256:legacy-content',
  });
  const jobStore = new SyncJobStore(
    db,
    () => new Date('2026-07-20T00:00:00.000Z'),
    () => 'claim-upgrade',
  );
  const job = (
    await jobStore.createOrGet({
      remoteId: remote.id,
      remoteTargetVersion: remote.version,
      operation: 'push',
      idempotencyKey: 'upgrade-push',
      planFingerprint: 'sha256:upgrade-plan',
      expectedLocalCommitId: commitId,
      expectedRemoteRevision: 'remote-revision-1',
    })
  ).job;
  await jobStore.claim(job.id, { leaseOwner: 'legacy-worker', leaseDurationMs: 1_000 });
  await jobStore.markFinalizePending(job.id, 'claim-upgrade', {
    resultLocalCommitId: commitId,
    resultRemoteRevision: 'remote-revision-2',
    contentHash: 'sha256:legacy-content',
  });
  await new ConflictStore(db).upsert({
    remoteId: remote.id,
    remoteTargetVersion: remote.version,
    baseLocalCommitId: commitId,
    baseRemoteRevision: 'remote-revision-1',
    currentLocalCommitId: commitId,
    currentRemoteRevision: 'remote-revision-2',
    localContentHash: 'sha256:legacy-content',
    remoteContentHash: 'sha256:remote-content',
    reasonCode: 'diverged',
  });

  await db.getRepository('lightExtensionRepos').create({
    values: {
      id: 'ler_upgrade',
      vscRepoId: repoId,
      name: 'upgrade',
      normalizedName: 'upgrade',
      lifecycleStatus: 'enabled',
      healthStatus: 'ready',
      headCommitId: commitId,
    },
  });
  await db.getRepository('lightExtensionEntries').create({
    values: {
      id: 'lee_upgrade',
      repoId: 'ler_upgrade',
      target: 'client',
      kind: 'js-block',
      entryName: 'upgrade',
      entryPath: 'src/client/index.tsx',
      descriptorPath: 'src/client/entry.json',
      compiledCommitId: commitId,
      runtimeArtifact: {
        code: 'ctx.render("legacy vsc");\n',
        version: 'v2',
        entryPath: 'src/client/index.tsx',
        metadata: { runtimeContract: 'light-extension.current-runtime.v1' },
      },
      runtimeVersion: 'v2',
      surfaceStyle: 'render',
      runtimeCodeHash: 'runtime-code-hash-upgrade',
      artifactHash: 'artifact-hash-upgrade',
      filesHash: 'files-hash-upgrade',
      healthStatus: 'ready',
      diagnostics: [],
    },
  });
  await db.getRepository('lightExtensionReferences').create({
    values: {
      id: 'lef_upgrade',
      repoId: 'ler_upgrade',
      entryId: 'lee_upgrade',
      kind: 'js-block',
      ownerKind: locator.kind,
      ownerLocator: locator,
      ownerLocatorHash: 'owner-locator-hash-upgrade',
      settingsHash: 'settings-hash-upgrade',
      resolvedStatus: 'ready',
    },
  });
  await db.getRepository('flowModels').create({
    values: {
      uid: locator.modelUid,
      options: {
        locator,
        runJs: {
          code: 'ctx.render("last known good");',
          version: 'v2',
          sourceRef: {
            type: 'vsc-file',
            repoId,
            commitId,
            entry: 'src/client/index.tsx',
          },
          sourceMode: 'light-extension',
          sourceBinding: {
            type: 'light-extension-entry',
            repoId: 'ler_upgrade',
            entryId: 'lee_upgrade',
            kind: 'js-block',
          },
          settings: { title: 'Upgrade' },
        },
      },
    },
  });
  await db.getRepository('applicationPlugins').create({
    values: {
      name: 'vsc-file',
      packageName: '@nocobase/plugin-vsc-file',
      enabled: true,
      installed: true,
      builtIn: true,
    },
  });
  await db.getRepository('applicationPlugins').create({
    values: {
      name: 'light-extension',
      packageName: '@nocobase/plugin-light-extension',
      enabled: true,
      installed: true,
      builtIn: true,
    },
  });

  return { repoId, commitId, remoteId: remote.id, jobId: job.id };
}

async function readUpgradeSnapshot(
  db: Database,
  fixture: { repoId: string; commitId: string; remoteId: string; jobId: string },
) {
  const vscCollections = Object.fromEntries(
    await Promise.all(
      vscCollectionNames.map(async (name) => [
        name,
        (await db.getRepository(name).find()).map((record) => record.toJSON()),
      ]),
    ),
  );
  const flowModel = await db.getRepository('flowModels').findOne({ filterByTk: locator.modelUid });
  const repository = await db.getRepository('vscFileRepositories').findOne({ filterByTk: fixture.repoId });
  const ref = await db.getRepository('vscFileRefs').findOne({ filter: { repoId: fixture.repoId, name: 'head' } });
  const commit = await db.getRepository('vscFileCommits').findOne({ filterByTk: fixture.commitId });
  const remote = await db.getRepository('vscFileRemotes').findOne({ filterByTk: fixture.remoteId });
  const mapping = await db.getRepository('vscFileExternalCommitMaps').findOne({
    filter: { remoteId: fixture.remoteId },
  });
  const job = await db.getRepository('vscFileSyncJobs').findOne({ filterByTk: fixture.jobId });
  const conflict = await db.getRepository('vscFileConflicts').findOne({ filter: { remoteId: fixture.remoteId } });
  const lightRepo = await db.getRepository('lightExtensionRepos').findOne({ filterByTk: 'ler_upgrade' });
  const lightEntry = await db.getRepository('lightExtensionEntries').findOne({ filterByTk: 'lee_upgrade' });
  const lightReference = await db.getRepository('lightExtensionReferences').findOne({ filterByTk: 'lef_upgrade' });
  const plugins = await db.getRepository('applicationPlugins').find({ sort: ['name'] });

  if (
    !flowModel ||
    !repository ||
    !ref ||
    !commit ||
    !remote ||
    !mapping ||
    !job ||
    !conflict ||
    !lightRepo ||
    !lightEntry ||
    !lightReference
  ) {
    throw new Error(`Incomplete upgrade fixture for repository ${fixture.repoId}`);
  }

  return {
    vscCollections,
    flowModel: flowModel.toJSON(),
    repository: repository.toJSON(),
    ref: ref.toJSON(),
    commit: commit.toJSON(),
    remote: remote.toJSON(),
    mapping: mapping.toJSON(),
    job: job.toJSON(),
    conflict: conflict.toJSON(),
    lightRepo: lightRepo.toJSON(),
    lightEntry: lightEntry.toJSON(),
    lightReference: lightReference.toJSON(),
    plugins: plugins.map((record) => record.toJSON()),
  };
}

function createModuleApplication(db: Database) {
  type ResourceOptions = {
    name: string;
    actions?: Record<string, (ctx: never, next: () => Promise<void>) => Promise<void>>;
  };

  const resources = new Map<string, ResourceOptions>();
  const auditActions = new Set<string>();
  const aclActions = new Set<string>();
  const app = {
    db,
    environment: { getVariables: vi.fn(() => ({})) },
    resourceManager: {
      define: vi.fn((resource: ResourceOptions) => resources.set(resource.name, resource)),
    },
    acl: {
      allow: vi.fn((resourceName: string) => aclActions.add(resourceName)),
    },
    auditManager: {
      registerActions: vi.fn((actions: Array<{ name: string }>) => {
        for (const action of actions) {
          auditActions.add(action.name);
        }
      }),
      log: vi.fn(),
    },
  } as unknown as Application;

  return { app, resources, auditActions, aclActions };
}

function createRunJSSourceService(db: Database) {
  const permissionHooks = new VscPermissionHookRegistry();
  permissionHooks.register(createRunJSSourcePermissionHook());
  return new VscFileService(db, permissionHooks);
}

function runJSSourceContext(actionName: string) {
  return { request: { resourceName: 'runJSSources', actionName } };
}
