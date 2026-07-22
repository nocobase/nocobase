/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, type Database, type Model } from '@nocobase/database';
import { buildRunJSArtifactHash, buildRunJSRuntimeCodeHash } from '@nocobase/runjs';
import type { Application } from '@nocobase/server';
import path from 'path';
import { vi } from 'vitest';

import { LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT, NAMESPACE } from '../../../constants';
import PluginLightExtensionServer from '../../plugin';
import Migration from '../../migrations/20260722000000-remove-generic-runjs';
import { GenericRunJSHardDeleteMigrationService } from '../../services/GenericRunJSHardDeleteMigrationService';
import { VscFileService, VscPermissionHookRegistry } from '../../vsc-file/public-api';

const genericCode = 'return Number(ctx.settings.quantity) * Number(ctx.settings.price);';
const genericEntryPath = 'src/client/runjs/calculate-total/index.ts';

describe('remove generic RunJS migration', () => {
  let db: Database;
  let vsc: VscFileService;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
    await db.import({ directory: path.resolve(__dirname, '../../collections') });
    await db.import({ directory: path.resolve(__dirname, '../../vsc-file/collections') });
    db.collection({
      name: 'flowModels',
      autoGenId: false,
      timestamps: false,
      fields: [
        { type: 'string', name: 'uid', primaryKey: true },
        { type: 'json', name: 'options', defaultValue: {} },
      ],
    });
    await db.sync();
    vsc = createMigrationVsc(db);
  });

  afterEach(async () => {
    await db?.close();
  });

  it('materializes authoritative nested bindings, deletes generic-only state, and is idempotent', async () => {
    const fixture = await seedGenericRepo(db, vsc, { repoId: 'ler_generic', entryId: 'lee_generic' });
    await db.getRepository('flowModels').create({
      values: {
        uid: 'fm_generic',
        options: {
          stepParams: {
            formSettings: {
              assign: {
                values: [
                  {
                    key: 'total',
                    value: {
                      code: 'return "stale fallback";',
                      version: 'v1',
                      sourceMode: 'light-extension',
                      sourceBinding: genericBinding(fixture),
                      sourceRef: { type: 'vsc-file', repoId: fixture.vscRepoId },
                      settings: {
                        quantity: null,
                        nested: { label: 'override' },
                        items: [{ amount: 3 }],
                      },
                      keep: 'business-field',
                    },
                  },
                ],
              },
            },
          },
          flowRegistry: {
            custom: {
              defaultParams: {
                handler: {
                  code: 'return "another stale fallback";',
                  version: 'v1',
                  sourceMode: 'light-extension',
                  sourceBinding: genericBinding(fixture),
                  settings: { price: 9 },
                },
              },
            },
          },
        },
      },
    });
    await db.getRepository('lightExtensionLogs').create({
      values: {
        repoId: fixture.repoId,
        level: 'info',
        action: 'runtimeCompile',
        result: 'success',
        requestId: 'audit-before-migration',
        message: 'must remain',
      },
    });
    const commitsBefore = await db.getRepository('vscFileCommits').count({ filter: { repoId: fixture.vscRepoId } });

    const service = new GenericRunJSHardDeleteMigrationService(db);
    const first = await service.migrate();
    const flowModel = await db.getRepository('flowModels').findOne({ filterByTk: 'fm_generic' });
    const options = flowModel?.get('options') as {
      stepParams: { formSettings: { assign: { values: Array<{ value: Record<string, unknown> }> } } };
      flowRegistry: { custom: { defaultParams: { handler: Record<string, unknown> } } };
    };
    const firstHost = options.stepParams.formSettings.assign.values[0].value;
    const secondHost = options.flowRegistry.custom.defaultParams.handler;

    expect(first).toMatchObject({ bindingCount: 2, entryCount: 1, changed: true });
    expect(firstHost).toMatchObject({
      code: genericCode,
      version: 'v2',
      sourceMode: 'inline',
      settings: {
        quantity: null,
        price: 2,
        nested: { label: 'override', enabled: true },
        items: [{ amount: 3 }],
      },
      keep: 'business-field',
    });
    expect(firstHost).not.toHaveProperty('sourceBinding');
    expect(firstHost).not.toHaveProperty('sourceRef');
    expect(secondHost).toMatchObject({
      code: genericCode,
      version: 'v2',
      sourceMode: 'inline',
      settings: {
        quantity: 1,
        price: 9,
        nested: { label: 'default', enabled: true },
        items: [{ amount: 1 }],
      },
    });
    await expect(db.getRepository('lightExtensionRepos').findOne({ filterByTk: fixture.repoId })).resolves.toBeNull();
    await expect(
      db.getRepository('lightExtensionEntries').findOne({ filterByTk: fixture.entryId }),
    ).resolves.toBeNull();
    await expect(
      db.getRepository('lightExtensionRuntimeArtifacts').findOne({ filterByTk: fixture.artifactHash }),
    ).resolves.toBeNull();
    await expect(
      db.getRepository('vscFileRepositories').findOne({ filterByTk: fixture.vscRepoId }),
    ).resolves.toMatchObject({ status: 'archived' });
    await expect(db.getRepository('lightExtensionLogs').count()).resolves.toBe(1);
    await expect(db.getRepository('vscFileCommits').count({ filter: { repoId: fixture.vscRepoId } })).resolves.toBe(
      commitsBefore,
    );

    await expect(service.migrate()).resolves.toEqual({
      bindingCount: 0,
      repoCount: 0,
      entryCount: 0,
      referenceCount: 0,
      artifactCount: 0,
      changed: false,
    });
  });

  it('fails preflight with zero writes when an artifact is missing', async () => {
    const fixture = await seedGenericRepo(db, vsc, { repoId: 'ler_missing', entryId: 'lee_missing' });
    await seedFlowModel(db, fixture, 'fm_missing');
    await db.getRepository('lightExtensionRuntimeArtifacts').destroy({ filterByTk: fixture.artifactHash });
    const before = await snapshot(db, fixture);

    await expect(new GenericRunJSHardDeleteMigrationService(db).migrate()).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_SOURCE_ERROR',
      details: expect.objectContaining({ reasonCode: 'artifact-missing', modelUid: 'fm_missing' }),
    });
    expect(await snapshot(db, fixture)).toEqual(before);
  });

  it('cleans a mixed repo through a validated VSC commit and preserves surviving entries', async () => {
    const fixture = await seedGenericRepo(db, vsc, {
      repoId: 'ler_mixed',
      entryId: 'lee_mixed_runjs',
      extraFiles: validActionFiles(),
    });
    await seedFlowModel(db, fixture, 'fm_mixed');
    await seedSurvivingActionEntry(db, fixture.repoId, fixture.commitId, 'lee_mixed_action');

    const result = await new GenericRunJSHardDeleteMigrationService(db).migrate();
    const repo = await db.getRepository('lightExtensionRepos').findOne({ filterByTk: fixture.repoId });
    const vscRepo = await db.getRepository('vscFileRepositories').findOne({ filterByTk: fixture.vscRepoId });
    const action = await db.getRepository('lightExtensionEntries').findOne({ filterByTk: 'lee_mixed_action' });
    const pulled = await vsc.pull({ repoId: fixture.vscRepoId, includeContent: 'all' });

    expect(result).toMatchObject({ bindingCount: 1, repoCount: 1, entryCount: 1, changed: true });
    expect(repo?.get('headCommitId')).toBe(vscRepo?.get('headCommitId'));
    expect(repo?.get('headCommitId')).not.toBe(fixture.commitId);
    expect(action?.get('compiledCommitId')).toBe(repo?.get('headCommitId'));
    expect(action?.get('healthStatus')).toBe('ready');
    expect(pulled.files?.some((file) => file.path.startsWith('src/client/runjs/'))).toBe(false);
    expect(pulled.files).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: 'src/client/js-actions/keep/index.ts' })]),
    );
  });

  it('fails closed when retained source exists without matching entry metadata', async () => {
    const fixture = await seedGenericRepo(db, vsc, {
      repoId: 'ler_unindexed_retained',
      entryId: 'lee_unindexed_retained_runjs',
      extraFiles: validActionFiles(),
    });
    await seedFlowModel(db, fixture, 'fm_unindexed_retained');
    const before = await snapshot(db, fixture);

    await expect(new GenericRunJSHardDeleteMigrationService(db).migrate()).rejects.toMatchObject({
      details: expect.objectContaining({ reasonCode: 'surviving-entry-set-mismatch', repoId: fixture.repoId }),
    });
    expect(await snapshot(db, fixture)).toEqual(before);
  });

  it('blocks mixed repositories with active remotes and leaves all state unchanged', async () => {
    const fixture = await seedGenericRepo(db, vsc, {
      repoId: 'ler_remote',
      entryId: 'lee_remote_runjs',
      extraFiles: validActionFiles(),
    });
    await seedFlowModel(db, fixture, 'fm_remote');
    await seedSurvivingActionEntry(db, fixture.repoId, fixture.commitId, 'lee_remote_action');
    await db.getRepository('vscFileRemotes').create({
      values: {
        id: 'vscrmt_active',
        repoId: fixture.vscRepoId,
        name: 'origin',
        provider: 'github',
        config: { owner: 'noco', repository: 'mixed' },
        status: 'active',
      },
    });
    const before = await snapshot(db, fixture);

    await expect(new GenericRunJSHardDeleteMigrationService(db).migrate()).rejects.toMatchObject({
      details: expect.objectContaining({ reasonCode: 'mixed-repo-active-remote', repoId: fixture.repoId }),
    });
    expect(await snapshot(db, fixture)).toEqual(before);
  });

  it('does not persist a prepared mixed-repo candidate when validation or compile preflight fails', async () => {
    const fixture = await seedGenericRepo(db, vsc, {
      repoId: 'ler_invalid_candidate',
      entryId: 'lee_invalid_candidate_runjs',
      extraFiles: [
        {
          path: 'src/client/js-actions/keep/index.ts',
          content: 'import fs from "fs"; fs.readFileSync("/tmp/nope");',
          language: 'typescript',
        },
        validActionFiles()[1],
      ],
    });
    await seedFlowModel(db, fixture, 'fm_invalid_candidate');
    await seedSurvivingActionEntry(db, fixture.repoId, fixture.commitId, 'lee_invalid_candidate_action');
    const before = await snapshot(db, fixture);

    await expect(new GenericRunJSHardDeleteMigrationService(db).migrate()).rejects.toMatchObject({
      details: expect.objectContaining({
        reasonCode: expect.stringMatching(/mixed-repo-validation-failed|surviving-entry-compile-failed/),
      }),
    });
    expect(await snapshot(db, fixture)).toEqual(before);
  });

  it('rolls back FlowModel, VSC, and metadata if transactional VSC publish fails', async () => {
    const fixture = await seedGenericRepo(db, vsc, {
      repoId: 'ler_publish_rollback',
      entryId: 'lee_publish_rollback_runjs',
      extraFiles: validActionFiles(),
    });
    await seedFlowModel(db, fixture, 'fm_publish_rollback');
    await seedSurvivingActionEntry(db, fixture.repoId, fixture.commitId, 'lee_publish_rollback_action');
    const before = await snapshot(db, fixture);
    const publish = vi
      .spyOn(VscFileService.prototype, 'publishPreparedPush')
      .mockRejectedValueOnce(new Error('forced transactional publish failure'));

    await expect(new GenericRunJSHardDeleteMigrationService(db).migrate()).rejects.toThrow(
      'forced transactional publish failure',
    );
    publish.mockRestore();
    expect(await snapshot(db, fixture)).toEqual(before);
  });

  it('blocks unknown generic reference combinations and non-idle sync jobs', async () => {
    const fixture = await seedGenericRepo(db, vsc, { repoId: 'ler_blocked', entryId: 'lee_blocked' });
    await seedFlowModel(db, fixture, 'fm_blocked');
    await db.getRepository('lightExtensionReferences').create({
      values: {
        id: 'lef_unknown',
        repoId: fixture.repoId,
        entryId: fixture.entryId,
        kind: 'runjs',
        ownerKind: 'flowModel.step',
        ownerLocator: { modelUid: 'fm_blocked' },
        ownerLocatorHash: 'unknown-combo',
      },
    });
    await expect(new GenericRunJSHardDeleteMigrationService(db).migrate()).rejects.toMatchObject({
      details: expect.objectContaining({ reasonCode: 'unknown-reference-combination' }),
    });

    await db.getRepository('lightExtensionReferences').destroy({ filterByTk: 'lef_unknown' });
    await db.getRepository('vscFileRemotes').create({
      values: {
        id: 'vscrmt_job',
        repoId: fixture.vscRepoId,
        name: 'origin',
        provider: 'github',
        config: { owner: 'noco', repository: 'generic' },
        status: 'disabled',
      },
    });
    await db.getRepository('vscFileSyncJobs').create({
      values: {
        id: 'vscjob_pending',
        remoteId: 'vscrmt_job',
        remoteTargetVersion: 1,
        operation: 'push',
        status: 'pending',
        phase: 'prepared',
        idempotencyKey: 'pending-job',
      },
    });
    await expect(new GenericRunJSHardDeleteMigrationService(db).migrate()).rejects.toMatchObject({
      details: expect.objectContaining({ reasonCode: 'active-sync-job' }),
    });
  });

  it('keeps an artifact hash referenced by a surviving entry and cleans stale or missing references', async () => {
    const fixture = await seedGenericRepo(db, vsc, { repoId: 'ler_shared', entryId: 'lee_shared_runjs' });
    await seedFlowModel(db, fixture, 'fm_shared');
    const survivingRepo = await vsc.createRepository({
      ownerType: 'light-extension',
      ownerId: 'ler_surviving_shared_hash',
      name: 'source',
      initialFiles: validActionFiles(),
      message: 'unaffected surviving repo',
    });
    const survivingCommitId = requireString(survivingRepo.initialCommit?.id, 'surviving initial commit id');
    await db.getRepository('lightExtensionRepos').create({
      values: {
        id: 'ler_surviving_shared_hash',
        vscRepoId: survivingRepo.repository.id,
        name: 'surviving-shared-hash',
        normalizedName: 'surviving-shared-hash',
        lifecycleStatus: 'enabled',
        healthStatus: 'ready',
        headCommitId: survivingCommitId,
      },
    });
    await db.getRepository('lightExtensionEntries').create({
      values: {
        id: 'lee_surviving_shared_hash',
        repoId: 'ler_surviving_shared_hash',
        kind: 'js-action',
        entryName: 'keep',
        entryPath: 'src/client/js-actions/keep/index.ts',
        descriptorPath: 'src/client/js-actions/keep/entry.json',
        compiledCommitId: survivingCommitId,
        artifactHash: fixture.artifactHash,
        healthStatus: 'ready',
      },
    });
    await db.getRepository('lightExtensionReferences').create({
      values: {
        id: 'lef_stale_generic',
        repoId: fixture.repoId,
        entryId: 'lee_missing_reference_target',
        kind: 'runjs',
        ownerKind: 'flowModel.runjsHost',
        ownerLocator: { modelUid: 'missing-model', path: ['missing'] },
        ownerLocatorHash: 'stale-generic-reference',
      },
    });

    await new GenericRunJSHardDeleteMigrationService(db).migrate();

    await expect(
      db.getRepository('lightExtensionRuntimeArtifacts').findOne({ filterByTk: fixture.artifactHash }),
    ).resolves.not.toBeNull();
    await expect(
      db.getRepository('lightExtensionReferences').findOne({ filterByTk: 'lef_stale_generic' }),
    ).resolves.toBeNull();
  });

  it('uses the same service for afterSync migration and disabled-at-upgrade beforeEnable', async () => {
    const migrationFixture = await seedGenericRepo(db, vsc, { repoId: 'ler_upgrade', entryId: 'lee_upgrade' });
    await seedFlowModel(db, migrationFixture, 'fm_upgrade');
    const migration = new Migration({ db, app: {} } as never);
    await migration.up();
    await expect(new GenericRunJSHardDeleteMigrationService(db).assertNoLegacyData()).resolves.toBeUndefined();

    const enableFixture = await seedGenericRepo(db, vsc, { repoId: 'ler_enable', entryId: 'lee_enable' });
    await seedFlowModel(db, enableFixture, 'fm_enable');
    const plugin = new PluginLightExtensionServer({ db } as Application, {
      name: 'light-extension',
      packageName: NAMESPACE,
    });
    await plugin.beforeEnable();
    await expect(new GenericRunJSHardDeleteMigrationService(db).assertNoLegacyData()).resolves.toBeUndefined();
  });

  it('fails the direct-start invariant until upgrade cleanup runs', async () => {
    const fixture = await seedGenericRepo(db, vsc, { repoId: 'ler_direct_start', entryId: 'lee_direct_start' });
    await seedFlowModel(db, fixture, 'fm_direct_start');
    const service = new GenericRunJSHardDeleteMigrationService(db);

    await expect(service.assertNoLegacyData()).rejects.toMatchObject({
      details: expect.objectContaining({ reasonCode: 'legacy-data-remains', bindingCount: 1 }),
    });
    await service.migrate();
    await expect(service.assertNoLegacyData()).resolves.toBeUndefined();
  });
});

interface GenericFixture {
  repoId: string;
  vscRepoId: string;
  entryId: string;
  entryPath: string;
  commitId: string;
  artifactHash: string;
}

async function seedGenericRepo(
  db: Database,
  vsc: VscFileService,
  input: { repoId: string; entryId: string; extraFiles?: Array<{ path: string; content: string; language?: string }> },
): Promise<GenericFixture> {
  const initial = await vsc.createRepository({
    ownerType: 'light-extension',
    ownerId: input.repoId,
    name: 'source',
    initialFiles: [
      {
        path: genericEntryPath,
        content: genericCode,
        language: 'typescript',
      },
      {
        path: 'src/client/runjs/calculate-total/entry.json',
        content: '{"schemaVersion":1,"key":"calculate-total"}',
        language: 'json',
      },
      ...(input.extraFiles || []),
    ],
    message: 'legacy generic RunJS source',
  });
  const commitId = requireString(initial.initialCommit?.id, 'initial commit id');
  const vscRepoId = initial.repository.id;
  const runtimeCodeHash = buildRunJSRuntimeCodeHash(genericCode);
  const artifactHash = buildRunJSArtifactHash({
    code: genericCode,
    version: 'v2',
    entryPath: genericEntryPath,
    runtimeContract: LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT,
  });
  await db.getRepository('lightExtensionRepos').create({
    values: {
      id: input.repoId,
      vscRepoId,
      name: input.repoId,
      normalizedName: input.repoId,
      lifecycleStatus: 'enabled',
      healthStatus: 'ready',
      headCommitId: commitId,
    },
  });
  const settingsSchema = {
    type: 'object',
    properties: {
      quantity: { type: ['number', 'null'], default: 1 },
      price: { type: 'number', default: 2 },
      nested: {
        type: 'object',
        properties: {
          label: { type: 'string', default: 'default' },
          enabled: { type: 'boolean', default: true },
        },
      },
      items: {
        type: 'array',
        default: [{ amount: 1 }],
        items: {
          type: 'object',
          properties: { amount: { type: 'number' } },
        },
      },
    },
  };
  await db.getRepository('lightExtensionRuntimeArtifacts').create({
    values: {
      artifactHash,
      runtimeCodeHash,
      code: genericCode,
      version: 'v2',
      entryPath: genericEntryPath,
      runtimeContract: LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT,
      byteSize: Buffer.byteLength(genericCode, 'utf8'),
    },
  });
  await db.getRepository('lightExtensionEntries').create({
    values: {
      id: input.entryId,
      repoId: input.repoId,
      kind: 'runjs',
      entryName: 'calculate-total',
      entryPath: genericEntryPath,
      descriptorPath: 'src/client/runjs/calculate-total/entry.json',
      settingsSchema,
      compiledCommitId: commitId,
      runtimeArtifact: {
        code: genericCode,
        version: 'v2',
        entryPath: genericEntryPath,
        diagnostics: [],
        metadata: {
          repoId: input.repoId,
          entryId: input.entryId,
          kind: 'runjs',
        },
      },
      runtimeVersion: 'v2',
      surfaceStyle: 'value',
      runtimeCodeHash,
      artifactHash,
      filesHash: 'legacy-files-hash',
      settingsDefaultsHash: 'legacy-defaults-hash',
      healthStatus: 'ready',
      diagnostics: [],
    },
  });
  return {
    repoId: input.repoId,
    vscRepoId,
    entryId: input.entryId,
    entryPath: genericEntryPath,
    commitId,
    artifactHash,
  };
}

async function seedFlowModel(db: Database, fixture: GenericFixture, uid: string): Promise<void> {
  await db.getRepository('flowModels').create({
    values: {
      uid,
      options: {
        stepParams: {
          fieldSettings: {
            defaultValue: {
              code: 'return "stale";',
              version: 'v1',
              sourceMode: 'light-extension',
              sourceBinding: genericBinding(fixture),
              settings: {},
            },
          },
        },
      },
    },
  });
}

function genericBinding(fixture: GenericFixture) {
  return {
    type: 'light-extension-entry',
    repoId: fixture.repoId,
    entryId: fixture.entryId,
    entryPath: fixture.entryPath,
    kind: 'runjs',
  };
}

function validActionFiles() {
  return [
    {
      path: 'src/client/js-actions/keep/index.ts',
      content: 'ctx.message.success("kept");',
      language: 'typescript',
    },
    {
      path: 'src/client/js-actions/keep/entry.json',
      content: '{"schemaVersion":1,"key":"keep","title":"Keep"}',
      language: 'json',
    },
  ];
}

async function seedSurvivingActionEntry(
  db: Database,
  repoId: string,
  commitId: string,
  entryId: string,
): Promise<void> {
  await db.getRepository('lightExtensionEntries').create({
    values: {
      id: entryId,
      repoId,
      kind: 'js-action',
      entryName: 'keep',
      entryPath: 'src/client/js-actions/keep/index.ts',
      descriptorPath: 'src/client/js-actions/keep/entry.json',
      settingsSchema: null,
      compiledCommitId: commitId,
      runtimeVersion: 'v2',
      healthStatus: 'ready',
      diagnostics: [],
    },
  });
}

function createMigrationVsc(db: Database): VscFileService {
  const hooks = new VscPermissionHookRegistry();
  hooks.register((input) => {
    const ownerType = input.repository?.ownerType || input.ownerType;
    return ownerType === 'light-extension' ? { allowed: true, ownerType } : undefined;
  });
  return new VscFileService(db, hooks);
}

async function snapshot(db: Database, fixture: GenericFixture) {
  const names = [
    'flowModels',
    'lightExtensionRepos',
    'lightExtensionEntries',
    'lightExtensionReferences',
    'lightExtensionRuntimeArtifacts',
    'vscFileRepositories',
    'vscFileCommits',
    'vscFileRefs',
    'vscFileTrees',
    'vscFileTreeEntries',
    'vscFileBlobs',
  ];
  const rows: Record<string, unknown[]> = {};
  for (const name of names) {
    const records = await db.getRepository(name).find();
    rows[name] = records
      .map((record: Model) => record.toJSON())
      .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  }
  return { fixture, rows };
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value) {
    throw new Error(`${label} is required`);
  }
  return value;
}
