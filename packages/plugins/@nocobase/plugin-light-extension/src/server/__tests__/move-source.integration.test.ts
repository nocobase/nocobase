/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { Database, Model, Transaction } from '@nocobase/database';
import { createHash } from 'crypto';
import {
  buildRunJSFilesHash,
  type RunJSSourceAdapterRegistry,
  type VscFileChange,
  type VscFileService,
} from '../vsc-file';
import { describe, expect, it, vi } from 'vitest';

import { LightExtensionError } from '../../shared/errors';
import type {
  LightExtensionEntryRecord,
  LightExtensionMoveSourceInput,
  LightExtensionRepoRecord,
} from '../../shared/types';
import { MoveSourceService, PersistentMoveSourceSnapshotValidator } from '../services/MoveSourceService';
import { isMoveToInlineHostSupported, MoveToInlineService } from '../services/MoveToInlineService';
import { createLightExtensionsResource } from '../resources/lightExtensions';
import type { LightExtensionCompilePreviewService } from '../services/LightExtensionCompilePreviewService';
import { buildRunJSSourceRepositoryIdentity } from '../vsc-file/public-api';

const locator = {
  kind: 'flowModel.step',
  modelUid: 'fm_js_block',
  flowKey: 'jsSettings',
  stepKey: 'runJs',
  paramPath: ['code'],
} as const;

const repo: LightExtensionRepoRecord = {
  id: 'ler_existing',
  name: 'shared-tools',
  normalizedName: 'shared-tools',
  title: 'Shared tools',
  lifecycleStatus: 'enabled',
  healthStatus: 'ready',
  headCommitId: 'commit_2',
};

const entry: LightExtensionEntryRecord = {
  id: 'lee_entry',
  repoId: repo.id,
  target: 'client',
  kind: 'js-block',
  entryName: 'sales-kpi',
  entryPath: 'src/client/js-blocks/sales-kpi/index.ts',
  descriptorPath: 'src/client/js-blocks/sales-kpi/entry.json',
  title: 'Sales KPI',
  description: null,
  category: null,
  icon: null,
  tags: null,
  sort: null,
  settingsSchema: null,
  settingsSchemaHash: null,
  compiledCommitId: 'commit_2',
  compiledInputKey: 'compile_key',
  compilerBuildId: 'compiler_build',
  runtimeArtifact: { code: 'return 1;', version: 'v2', entryPath: 'src/client/js-blocks/sales-kpi/index.ts' },
  runtimeVersion: 'v2',
  surfaceStyle: 'render',
  runtimeCodeHash: 'runtime_hash',
  filesHash: 'files_hash',
  settingsDefaultsHash: null,
  compiledAt: '2026-07-11T00:00:00.000Z',
  healthStatus: 'ready',
  diagnostics: [],
};

describe('PersistentMoveSourceSnapshotValidator', () => {
  it('rejects a stale source head', async () => {
    const identity = buildRunJSSourceRepositoryIdentity(locator);
    const validator = new PersistentMoveSourceSnapshotValidator(
      createSnapshotDatabase({
        repository: {
          id: 'runjs_repo',
          ...identity,
          status: 'active',
          headCommitId: 'runjs_commit_current',
        },
      }),
    );

    await expect(
      validator.assertCurrent({
        locator,
        sourceRepoId: 'runjs_repo',
        sourceHeadCommitId: 'runjs_commit_stale',
        expectedOwnerFingerprint: 'owner_before',
      }),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_SOURCE_OUTDATED',
      details: {
        sourceRepoId: 'runjs_repo',
        expectedHeadCommitId: 'runjs_commit_stale',
        currentHeadCommitId: 'runjs_commit_current',
      },
    });
  });

  it('rejects a source repository owned by another host', async () => {
    const identity = buildRunJSSourceRepositoryIdentity(locator);
    const validator = new PersistentMoveSourceSnapshotValidator(
      createSnapshotDatabase({
        repository: {
          id: 'runjs_repo',
          ...identity,
          ownerId: 'runjs:flowModel.step:another-host:forged',
          status: 'active',
          headCommitId: 'runjs_commit',
        },
      }),
    );

    await expect(
      validator.assertCurrent({
        locator,
        sourceRepoId: 'runjs_repo',
        sourceHeadCommitId: 'runjs_commit',
        expectedOwnerFingerprint: 'owner_before',
      }),
    ).rejects.toMatchObject({ code: 'LIGHT_EXTENSION_PERMISSION_DENIED' });
  });
});

describe('MoveSourceService', () => {
  it.each([
    ['JSBlockModel', 'js-block', 'src/client/js-blocks'],
    ['JSPageModel', 'js-page', 'src/client/js-pages'],
    ['JSActionModel', 'js-action', 'src/client/js-actions'],
    ['JSFieldModel', 'js-field', 'src/client/js-fields'],
    ['JSColumnModel', 'js-field', 'src/client/js-fields'],
    ['JSItemModel', 'js-item', 'src/client/js-items'],
  ] as const)(
    'moves a %s source into an existing repository and writes the host binding in the same transaction',
    async (modelUse, kind, entryRoot) => {
      const sourceLocator = {
        ...locator,
        flowKey: kind === 'js-action' ? 'clickSettings' : 'jsSettings',
      } as const;
      const transaction = { id: 'tx_move' } as unknown as Transaction;
      const writeExternalBinding = vi.fn(async () => ({ ownerFingerprint: 'owner_after' }));
      const movedEntry: LightExtensionEntryRecord = {
        ...entry,
        kind,
        entryPath: `${entryRoot}/sales-kpi/index.ts`,
        descriptorPath: `${entryRoot}/sales-kpi/entry.json`,
      };
      const originSettingsSchema = {
        type: 'object',
        properties: {
          title: { type: 'string', default: 'Welcome' },
          showTimestamp: { type: 'boolean', default: true },
        },
      };
      const getEntry = vi.fn(async () => ({
        ...entry,
        id: 'lee_origin',
        repoId: 'ler_origin',
        kind,
        settingsSchema: originSettingsSchema,
      }));
      const adapter = {
        kind: 'flowModel.step',
        assertCanRead: vi.fn(),
        assertCanWrite: vi.fn(),
        readLegacy: vi.fn(async () => ({
          code: 'return 1;',
          version: 'v2',
          label: 'JS block',
          surfaceStyle: 'render',
          language: 'typescript',
          ownerFingerprint: 'owner_before',
          metadata: { modelUse },
        })),
        writeRuntime: vi.fn(),
        writeExternalBinding,
        getFingerprint: vi.fn(async () => 'owner_after'),
      };
      const preparedSave = { candidate: { repoId: repo.id } };
      const prepareSaveSource = vi.fn(async () => preparedSave);
      const publishPreparedSave = vi.fn(async () => ({ repo, commit: {}, tree: {}, compile: {}, diagnostics: [] }));
      const syncReferences = vi.fn(async () => undefined);
      const listEntries = vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([movedEntry]);
      const service = new MoveSourceService(
        {
          sequelize: {
            transaction: (run: (transaction: Transaction) => Promise<unknown>) => run(transaction),
          },
        } as unknown as Database,
        {
          lockInternalRepoForUpdate: vi.fn(async () => ({ ...repo, vscRepoId: 'vsc_repo' })),
          assertApplicationOwnership: vi.fn(),
        } as never,
        {
          pull: vi.fn(async () => ({
            repo,
            commit: { id: 'commit_2' },
            tree: null,
            unchanged: false,
            files: [],
          })),
        } as never,
        { getEntry, listEntries } as never,
        { prepareSaveSource, publishPreparedSave } as never,
        { syncFlowModelReferencesForNodeTree: syncReferences } as never,
        () => ({ require: () => adapter }) as unknown as RunJSSourceAdapterRegistry,
        'main',
        { assertCurrent: vi.fn() },
      );

      const result = await service.moveSource(
        {
          locator: sourceLocator,
          expectedOwnerFingerprint: 'owner_before',
          sourceRepoId: 'runjs_repo',
          sourceHeadCommitId: 'runjs_commit',
          entryPath: 'src/main.ts',
          version: 'v2',
          files: [{ path: 'src/main.ts', content: 'return 1;' }],
          originBinding: {
            type: 'light-extension-entry',
            repoId: 'ler_origin',
            entryId: 'lee_origin',
            kind,
          },
          destination: { type: 'existing', repoId: repo.id },
          entryName: 'sales-kpi',
          entryTitle: 'Sales KPI',
        },
        {
          actorUserId: '1',
          adapterContext: {},
        },
      );

      expect(prepareSaveSource).toHaveBeenCalledWith(
        expect.objectContaining({
          repoId: repo.id,
          expectedHeadCommitId: 'commit_2',
          files: expect.arrayContaining([expect.objectContaining({ path: `${entryRoot}/sales-kpi/index.ts` })]),
        }),
        expect.not.objectContaining({ transaction: expect.anything() }),
      );
      expect(publishPreparedSave).toHaveBeenCalledWith(preparedSave, expect.objectContaining({ transaction }));
      const savedFiles = prepareSaveSource.mock.calls[0][0].files as Array<{ path: string; content: string }>;
      const descriptor = JSON.parse(
        savedFiles.find((file) => file.path === `${entryRoot}/sales-kpi/entry.json`)?.content || '{}',
      );
      if (kind === 'js-field') {
        expect(descriptor.category).toBe(modelUse === 'JSColumnModel' ? 'js-column' : 'js-field');
      } else {
        expect(descriptor).not.toHaveProperty('category');
      }
      expect(descriptor.settingsSchema).toEqual(originSettingsSchema);
      expect(getEntry).toHaveBeenCalledWith('lee_origin', expect.anything());
      expect(writeExternalBinding).toHaveBeenCalledWith({
        locator: sourceLocator,
        baseOwnerFingerprint: 'owner_before',
        binding: {
          sourceMode: 'light-extension',
          sourceBinding: expect.objectContaining({ repoId: repo.id, entryId: movedEntry.id, kind }),
        },
        ctx: expect.objectContaining({ transaction }),
      });
      expect(syncReferences).toHaveBeenCalledWith(
        expect.objectContaining({ rootUid: sourceLocator.modelUid }),
        expect.objectContaining({ transaction }),
      );
      expect(result.binding).toMatchObject({ repoId: repo.id, entryId: movedEntry.id, kind });
    },
  );

  it('creates a new repository with a compiled JS Page entry before binding it', async () => {
    const transaction = { id: 'tx_create' } as unknown as Transaction;
    const recordLifecycleEvent = vi.fn(async () => undefined);
    let reservedRepoId = '';
    const createdRepo = { ...repo, name: 'sales-tools', normalizedName: 'sales-tools' };
    const createdEntry = {
      ...entry,
      kind: 'js-page' as const,
      entryPath: 'src/client/js-pages/sales-kpi/index.tsx',
      descriptorPath: 'src/client/js-pages/sales-kpi/entry.json',
    };
    const createRepo = vi.fn(async (_input: unknown, _ctx: unknown, options: { repoId: string }) => ({
      ...createdRepo,
      id: options.repoId,
    }));
    const writeExternalBinding = vi.fn(async () => ({ ownerFingerprint: 'owner_after' }));
    const syncReferences = vi.fn(async () => undefined);
    let compiled = false;
    const prepared = {};
    const prepareInitialWorkspace = vi.fn(async (input: { repoId: string }) => {
      reservedRepoId = input.repoId;
      return prepared;
    });
    const publishPreparedInitialWorkspace = vi.fn(async () => {
      compiled = true;
      return {
        repo: { ...createdRepo, id: reservedRepoId },
        status: 'success',
        entries: [{ ...createdEntry, repoId: reservedRepoId }],
        diagnostics: [],
      };
    });
    const service = new MoveSourceService(
      {
        sequelize: {
          transaction: (run: (transaction: Transaction) => Promise<unknown>) => run(transaction),
        },
      } as unknown as Database,
      { createRepoForCompositeUseCase: createRepo, assertApplicationOwnership: vi.fn() } as never,
      {} as never,
      {
        listEntries: vi.fn(async () => {
          expect(compiled).toBe(true);
          return [{ ...createdEntry, repoId: reservedRepoId }];
        }),
      } as never,
      { prepareInitialWorkspace, publishPreparedInitialWorkspace } as never,
      { syncFlowModelReferencesForNodeTree: syncReferences } as never,
      () =>
        ({
          require: () => ({
            kind: 'flowModel.step',
            assertCanWrite: vi.fn(),
            readLegacy: vi.fn(async () => ({
              code: 'return 1;',
              version: 'v2',
              label: 'JavaScript page',
              surfaceStyle: 'render',
              language: 'typescript',
              ownerFingerprint: 'owner_before',
              metadata: { modelUse: 'JSPageModel' },
            })),
            writeExternalBinding,
            getFingerprint: vi.fn(async () => 'owner_after'),
          }),
        }) as unknown as RunJSSourceAdapterRegistry,
      'main',
      { assertCurrent: vi.fn() },
    );
    service.useAuditService({ recordLifecycleEvent } as never);

    const result = await service.moveSource(
      {
        locator,
        expectedOwnerFingerprint: 'owner_before',
        sourceRepoId: 'runjs_repo',
        sourceHeadCommitId: null,
        entryPath: 'src/main.tsx',
        version: 'v2',
        files: [{ path: 'src/main.tsx', content: 'ctx.render(<div>Moved</div>);' }],
        destination: { type: 'new', name: 'sales-tools', title: 'Sales tools' },
        entryName: 'sales-kpi',
      },
      { adapterContext: {}, requestId: 'req_move_source' },
    );

    const createInput = createRepo.mock.calls[0][0];
    const initialPaths = createInput.initialFiles.map((file: { path: string }) => file.path);
    expect(initialPaths.sort()).toEqual(
      [
        'README.md',
        'src/client/js-pages/sales-kpi/entry.json',
        'src/client/js-pages/sales-kpi/index.tsx',
        'tsconfig.json',
      ].sort(),
    );
    expect(prepareInitialWorkspace).toHaveBeenCalledWith(
      expect.objectContaining({ repoId: reservedRepoId, files: expect.any(Array) }),
      expect.not.objectContaining({ transaction: expect.anything() }),
    );
    expect(publishPreparedInitialWorkspace).toHaveBeenCalledWith(
      prepared,
      createdRepo.headCommitId,
      expect.objectContaining({ transaction: expect.anything() }),
    );
    expect(writeExternalBinding.mock.invocationCallOrder[0]).toBeGreaterThan(
      publishPreparedInitialWorkspace.mock.invocationCallOrder[0],
    );
    expect(syncReferences.mock.invocationCallOrder[0]).toBeGreaterThan(
      writeExternalBinding.mock.invocationCallOrder[0],
    );
    expect(result.binding).toMatchObject({
      repoId: reservedRepoId,
      entryId: createdEntry.id,
      entryPath: createdEntry.entryPath,
      kind: 'js-page',
    });
    expect(recordLifecycleEvent).toHaveBeenCalledTimes(1);
    expect(recordLifecycleEvent).toHaveBeenCalledWith({
      repoId: reservedRepoId,
      action: 'moveSource',
      result: 'success',
      requestId: 'req_move_source',
      actorUserId: undefined,
      message: 'RunJS source moved to a light extension',
      details: {
        destinationType: 'new',
        entryId: createdEntry.id,
        kind: 'js-page',
      },
      transaction,
    });
  });

  it('rejects an existing entry instead of overwriting it', async () => {
    const saveSource = vi.fn();
    const service = new MoveSourceService(
      {
        sequelize: {
          transaction: (run: (transaction: Transaction) => Promise<unknown>) =>
            run({ id: 'tx_conflict' } as unknown as Transaction),
        },
      } as unknown as Database,
      { lockInternalRepoForUpdate: vi.fn(async () => repo), assertApplicationOwnership: vi.fn() } as never,
      {
        pull: vi.fn(async () => ({
          repo,
          commit: null,
          tree: null,
          unchanged: false,
          files: [{ path: 'src/client/js-blocks/sales-kpi/index.ts' }],
        })),
      } as never,
      { listEntries: vi.fn(async () => []) } as never,
      { saveSource } as never,
      { syncFlowModelReferencesForNodeTree: vi.fn() } as never,
      () =>
        ({
          require: () => ({
            kind: 'flowModel.step',
            assertCanWrite: vi.fn(),
            readLegacy: vi.fn(async () => ({
              code: 'return 1;',
              version: 'v2',
              label: 'JS block',
              surfaceStyle: 'render',
              language: 'typescript',
              ownerFingerprint: 'owner_before',
              metadata: { modelUse: 'JSBlockModel' },
            })),
            writeExternalBinding: vi.fn(),
          }),
        }) as unknown as RunJSSourceAdapterRegistry,
      'main',
      { assertCurrent: vi.fn() },
    );

    await expect(
      service.moveSource(
        {
          locator,
          expectedOwnerFingerprint: 'owner_before',
          sourceRepoId: 'runjs_repo',
          sourceHeadCommitId: null,
          entryPath: 'src/main.ts',
          version: 'v2',
          files: [{ path: 'src/main.ts', content: 'return 1;' }],
          destination: { type: 'existing', repoId: repo.id },
          entryName: 'sales-kpi',
        },
        { adapterContext: {} },
      ),
    ).rejects.toMatchObject({ code: 'LIGHT_EXTENSION_ENTRY_CONFLICT' });
    expect(saveSource).not.toHaveBeenCalled();
  });

  it('rejects a stale owner fingerprint before changing the destination', async () => {
    const saveSource = vi.fn();
    const service = createFailureService({
      ownerFingerprint: 'owner_current',
      saveSource,
    });

    await expect(
      service.moveSource(
        {
          locator,
          expectedOwnerFingerprint: 'owner_stale',
          sourceRepoId: 'runjs_repo',
          sourceHeadCommitId: 'runjs_commit',
          entryPath: 'src/main.ts',
          version: 'v2',
          files: [{ path: 'src/main.ts', content: 'return 1;' }],
          destination: { type: 'existing', repoId: repo.id },
          entryName: 'sales-kpi',
        },
        { adapterContext: {} },
      ),
    ).rejects.toMatchObject({ code: 'LIGHT_EXTENSION_BINDING_OUTDATED' });
    expect(saveSource).not.toHaveBeenCalled();
  });

  it('rejects nested RunJS locators before any repository, VSC, host, or reference write', async () => {
    const fixture = createFailFastService();
    const nestedLocator = {
      kind: 'flowModel.nestedRunJS',
      modelUid: 'flow_action',
      containerFlowKey: 'eventFlow',
      containerStepKey: 'runJs',
      valuePath: ['code'],
      scene: 'eventFlow',
    } as const;

    await expect(
      fixture.service.moveSource(
        {
          locator: nestedLocator,
          expectedOwnerFingerprint: 'owner_before',
          sourceRepoId: 'runjs_repo',
          sourceHeadCommitId: null,
          entryPath: 'src/main.ts',
          version: 'v2',
          files: [{ path: 'src/main.ts', content: 'ctx.message.success("done");' }],
          destination: { type: 'new', name: 'forbidden-runjs' },
          entryName: 'action-script',
        },
        { adapterContext: {} },
      ),
    ).rejects.toMatchObject({ code: 'LIGHT_EXTENSION_INVALID_INPUT' });
    expect(fixture.registryRequire).not.toHaveBeenCalled();
    expectFailFastWritesNotCalled(fixture);
  });

  it('rejects unsupported FlowModel uses before any repository, VSC, host, or reference write', async () => {
    const fixture = createFailFastService('FormBlockModel');

    await expect(fixture.service.moveSource(createMoveSourceInput(), { adapterContext: {} })).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_INVALID_INPUT',
    });

    expect(fixture.readLegacy).toHaveBeenCalledTimes(2);
    expectFailFastWritesNotCalled(fixture);
  });

  it('rejects a forged step locator that targets a nested generic value', async () => {
    const fixture = createFailFastService('JSBlockModel');

    await expect(
      fixture.service.moveSource(
        createMoveSourceInput({
          locator: {
            ...locator,
            flowKey: 'formSettings',
            stepKey: 'defaultValue',
            paramPath: ['value', 'code'],
          },
        }),
        { adapterContext: {} },
      ),
    ).rejects.toMatchObject({ code: 'LIGHT_EXTENSION_INVALID_INPUT' });

    expect(fixture.readLegacy).toHaveBeenCalledTimes(2);
    expectFailFastWritesNotCalled(fixture);
  });

  it('rejects a forged runjs origin binding before any repository, VSC, host, or reference write', async () => {
    const fixture = createFailFastService();

    await expect(
      fixture.service.moveSource(
        createMoveSourceInput({
          originBinding: {
            type: 'light-extension-entry',
            repoId: 'ler_legacy_runjs',
            entryId: 'lee_legacy_runjs',
            kind: 'runjs',
          },
        }),
        { adapterContext: {} },
      ),
    ).rejects.toMatchObject({ code: 'LIGHT_EXTENSION_INVALID_INPUT' });

    expect(fixture.registryRequire).not.toHaveBeenCalled();
    expectFailFastWritesNotCalled(fixture);
  });

  it('requires host write permission before changing the destination', async () => {
    const saveSource = vi.fn();
    const service = createFailureService({
      saveSource,
      assertCanWrite: vi.fn(async () => {
        throw new Error('permission denied');
      }),
    });

    await expect(
      service.moveSource(
        {
          locator,
          expectedOwnerFingerprint: 'owner_before',
          sourceRepoId: 'runjs_repo',
          sourceHeadCommitId: null,
          entryPath: 'src/main.ts',
          version: 'v2',
          files: [{ path: 'src/main.ts', content: 'return 1;' }],
          destination: { type: 'existing', repoId: repo.id },
          entryName: 'sales-kpi',
        },
        { adapterContext: {} },
      ),
    ).rejects.toThrow('permission denied');
    expect(saveSource).not.toHaveBeenCalled();
  });

  it('returns the persisted result when a completed move operation is replayed', async () => {
    const operationModel = createMoveOperationModel();
    const saveSource = vi.fn(async () => ({ repo, commit: {}, tree: {}, compile: {}, diagnostics: [] }));
    const writeExternalBinding = vi.fn(async () => ({ ownerFingerprint: 'owner_after' }));
    const service = createFailureService({ saveSource, writeExternalBinding, operationModel });
    const input = createMoveSourceInput({ idempotencyKey: 'move-sales-kpi-v1' });

    const first = await service.moveSource(input, { adapterContext: {} });
    const replay = await service.moveSource(input, { adapterContext: {} });

    expect(replay).toEqual(first);
    expect(saveSource).toHaveBeenCalledTimes(1);
    expect(writeExternalBinding).toHaveBeenCalledTimes(1);
    expect(operationModel.getValues()).toMatchObject({
      idempotencyKey: 'move-sales-kpi-v1',
      status: 'completed',
      result: first,
    });
  });

  it('rejects reuse of a move operation key with a different request', async () => {
    const operationModel = createMoveOperationModel();
    const saveSource = vi.fn(async () => ({ repo, commit: {}, tree: {}, compile: {}, diagnostics: [] }));
    const service = createFailureService({ saveSource, operationModel });
    const input = createMoveSourceInput({ idempotencyKey: 'move-sales-kpi-v1' });

    await service.moveSource(input, { adapterContext: {} });
    await expect(
      service.moveSource({ ...input, entryName: 'different-entry' }, { adapterContext: {} }),
    ).rejects.toMatchObject({ code: 'LIGHT_EXTENSION_IDEMPOTENCY_CONFLICT' });
    expect(saveSource).toHaveBeenCalledTimes(1);
  });

  it('reclaims a failed move operation for the same request', async () => {
    const operationModel = createMoveOperationModel();
    const saveSource = vi
      .fn()
      .mockRejectedValueOnce(new Error('compile failed'))
      .mockResolvedValueOnce({ repo, commit: {}, tree: {}, compile: {}, diagnostics: [] });
    const listEntries = vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([entry]);
    const service = createFailureService({ saveSource, operationModel, listEntries });
    const input = createMoveSourceInput({ idempotencyKey: 'move-sales-kpi-retry' });

    await expect(service.moveSource(input, { adapterContext: {} })).rejects.toThrow('compile failed');
    await expect(service.moveSource(input, { adapterContext: {} })).resolves.toMatchObject({
      ownerFingerprint: 'owner_after',
    });

    expect(saveSource).toHaveBeenCalledTimes(2);
    expect(operationModel.getValues()).toMatchObject({ status: 'completed' });
  });

  it.each([
    ['disabled', 'LIGHT_EXTENSION_REPO_DISABLED'],
    ['archived', 'LIGHT_EXTENSION_REPO_ARCHIVED'],
  ] as const)('rejects a %s destination before writing JS Page state', async (lifecycleStatus, code) => {
    const saveSource = vi.fn();
    const writeExternalBinding = vi.fn();
    const syncReferences = vi.fn();
    const service = createFailureService({
      destinationRepo: { ...repo, lifecycleStatus },
      modelUse: 'JSPageModel',
      saveSource,
      writeExternalBinding,
      syncReferences,
    });

    await expect(
      service.moveSource(
        {
          locator,
          expectedOwnerFingerprint: 'owner_before',
          sourceRepoId: 'runjs_repo',
          sourceHeadCommitId: 'runjs_commit',
          entryPath: 'src/main.tsx',
          version: 'v2',
          files: [{ path: 'src/main.tsx', content: 'ctx.render(<div>Page</div>);' }],
          destination: { type: 'existing', repoId: repo.id },
          entryName: 'sales-page',
        },
        { adapterContext: {} },
      ),
    ).rejects.toMatchObject({ code });
    expect(saveSource).not.toHaveBeenCalled();
    expect(writeExternalBinding).not.toHaveBeenCalled();
    expect(syncReferences).not.toHaveBeenCalled();
  });

  it('does not bind or sync references when JS Page compilation fails', async () => {
    const saveSource = vi.fn(async () => {
      throw new Error('compile failed');
    });
    const writeExternalBinding = vi.fn();
    const syncReferences = vi.fn();
    const service = createFailureService({
      modelUse: 'JSPageModel',
      saveSource,
      writeExternalBinding,
      syncReferences,
    });

    await expect(
      service.moveSource(
        {
          locator,
          expectedOwnerFingerprint: 'owner_before',
          sourceRepoId: 'runjs_repo',
          sourceHeadCommitId: 'runjs_commit',
          entryPath: 'src/main.tsx',
          version: 'v2',
          files: [{ path: 'src/main.tsx', content: 'ctx.render(<div>Page</div>);' }],
          destination: { type: 'existing', repoId: repo.id },
          entryName: 'sales-page',
        },
        { adapterContext: {} },
      ),
    ).rejects.toThrow('compile failed');
    expect(writeExternalBinding).not.toHaveBeenCalled();
    expect(syncReferences).not.toHaveBeenCalled();
  });

  it('keeps destination and host writes under one rejected transaction when binding fails', async () => {
    const transaction = { id: 'tx_rollback' } as unknown as Transaction;
    let committed = false;
    const saveSource = vi.fn(async () => ({ repo, commit: {}, tree: {}, compile: {}, diagnostics: [] }));
    const movedPageEntry = {
      ...entry,
      kind: 'js-page' as const,
      entryPath: 'src/client/js-pages/sales-kpi/index.ts',
      descriptorPath: 'src/client/js-pages/sales-kpi/entry.json',
    };
    const service = createFailureService({
      transaction,
      modelUse: 'JSPageModel',
      movedEntry: movedPageEntry,
      saveSource,
      writeExternalBinding: vi.fn(async () => {
        throw new Error('host binding failed');
      }),
      onTransactionSuccess: () => {
        committed = true;
      },
    });

    await expect(
      service.moveSource(
        {
          locator,
          expectedOwnerFingerprint: 'owner_before',
          sourceRepoId: 'runjs_repo',
          sourceHeadCommitId: 'runjs_commit',
          entryPath: 'src/main.ts',
          version: 'v2',
          files: [{ path: 'src/main.ts', content: 'return 1;' }],
          destination: { type: 'existing', repoId: repo.id },
          entryName: 'sales-kpi',
        },
        { adapterContext: {} },
      ),
    ).rejects.toThrow('host binding failed');
    expect(saveSource).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ transaction }));
    expect(committed).toBe(false);
  });
});

function createFailureService(options: {
  ownerFingerprint?: string;
  surfaceStyle?: 'render' | 'action' | 'value';
  transaction?: Transaction;
  destinationRepo?: LightExtensionRepoRecord;
  modelUse?: string;
  movedEntry?: LightExtensionEntryRecord;
  saveSource: ReturnType<typeof vi.fn>;
  writeExternalBinding?: ReturnType<typeof vi.fn>;
  assertCanWrite?: ReturnType<typeof vi.fn>;
  syncReferences?: ReturnType<typeof vi.fn>;
  getOrCreateApplicationDefaultRepo?: ReturnType<typeof vi.fn>;
  applicationName?: string;
  onTransactionSuccess?: () => void;
  operationModel?: ReturnType<typeof createMoveOperationModel>;
  listEntries?: ReturnType<typeof vi.fn>;
}): MoveSourceService {
  const transaction = options.transaction || ({ id: 'tx_failure' } as unknown as Transaction);
  return new MoveSourceService(
    {
      sequelize: {
        transaction: async (run: (transaction: Transaction) => Promise<unknown>) => {
          const result = await run(transaction);
          options.onTransactionSuccess?.();
          return result;
        },
      },
      getRepository: (name: string) => {
        if (name !== 'lightExtensionMoveOperations' || !options.operationModel) {
          throw new Error(`Unexpected repository: ${name}`);
        }
        return { model: options.operationModel.model };
      },
    } as unknown as Database,
    {
      lockInternalRepoForUpdate: vi.fn(async () => options.destinationRepo || repo),
      assertApplicationOwnership: vi.fn(),
      getOrCreateApplicationDefaultRepo:
        options.getOrCreateApplicationDefaultRepo || vi.fn(async () => options.destinationRepo || repo),
    } as never,
    {
      pull: vi.fn(async () => ({
        repo: options.destinationRepo || repo,
        commit: null,
        tree: null,
        unchanged: false,
        files: [],
      })),
    } as never,
    {
      listEntries:
        options.listEntries ||
        vi
          .fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([options.movedEntry || entry]),
    } as never,
    {
      prepareSaveSource: vi.fn(async () => ({ candidate: { repoId: repo.id } })),
      publishPreparedSave: options.saveSource,
    } as never,
    { syncFlowModelReferencesForNodeTree: options.syncReferences || vi.fn() } as never,
    () =>
      ({
        require: () => ({
          kind: 'flowModel.step',
          assertCanWrite: options.assertCanWrite || vi.fn(),
          readLegacy: vi.fn(async () => ({
            code: 'return 1;',
            version: 'v2',
            label: 'JS block',
            surfaceStyle: options.surfaceStyle || 'render',
            language: 'typescript',
            ownerFingerprint: options.ownerFingerprint || 'owner_before',
            metadata: { modelUse: options.modelUse || 'JSBlockModel' },
          })),
          writeExternalBinding:
            options.writeExternalBinding || vi.fn(async () => ({ ownerFingerprint: 'owner_after' })),
          getFingerprint: vi.fn(async () => 'owner_after'),
        }),
      }) as unknown as RunJSSourceAdapterRegistry,
    options.applicationName || 'main',
    { assertCurrent: vi.fn() },
  );
}

function createMoveOperationModel() {
  let values: Record<string, unknown> | undefined;
  const record = {
    get: (key: string) => values?.[key],
  } as Model;
  const model = {
    findOne: vi.fn(async (options: { where: Record<string, unknown> }) => {
      if (!values) {
        return null;
      }
      return Object.entries(options.where).every(([key, value]) => values?.[key] === value) ? record : null;
    }),
    findOrCreate: vi.fn(async (options: { defaults: Record<string, unknown> }) => {
      if (values) {
        return [record, false] as const;
      }
      values = { ...options.defaults, updatedAt: new Date() };
      return [record, true] as const;
    }),
    update: vi.fn(
      async (nextValues: Record<string, unknown>, options: { where: Record<string, unknown> }): Promise<[number]> => {
        if (!values) {
          return [0];
        }
        const matches = Object.entries(options.where).every(([key, value]) => values?.[key] === value);
        if (!matches) {
          return [0];
        }
        values = { ...values, ...nextValues, updatedAt: new Date() };
        return [1];
      },
    ),
  };
  return {
    model,
    getValues: () => values,
  };
}

function createSnapshotDatabase(input: {
  repository?: Record<string, unknown>;
  commit?: Record<string, unknown>;
}): Database {
  const toModel = (values: Record<string, unknown> | undefined): Model | null =>
    values ? ({ get: (key: string) => values[key] } as Model) : null;
  return {
    getRepository: (name: string) => {
      if (name === 'vscFileRepositories') {
        return { findOne: vi.fn(async () => toModel(input.repository)) };
      }
      if (name === 'vscFileCommits') {
        return { findOne: vi.fn(async () => toModel(input.commit)) };
      }
      throw new Error(`Unexpected repository: ${name}`);
    },
  } as unknown as Database;
}

function createMoveSourceInput(overrides: Partial<LightExtensionMoveSourceInput> = {}): LightExtensionMoveSourceInput {
  return {
    locator,
    expectedOwnerFingerprint: 'owner_before',
    sourceRepoId: 'runjs_repo',
    sourceHeadCommitId: 'runjs_commit',
    entryPath: 'src/main.ts',
    version: 'v2',
    files: [{ path: 'src/main.ts', content: 'return 1;' }],
    destination: { type: 'existing', repoId: repo.id },
    entryName: 'sales-kpi',
    ...overrides,
  };
}

function createFailFastService(modelUse = 'JSBlockModel') {
  const transaction = vi.fn();
  const createRepo = vi.fn();
  const pull = vi.fn();
  const getEntry = vi.fn();
  const listEntries = vi.fn();
  const prepareSaveSource = vi.fn();
  const publishPreparedSave = vi.fn();
  const compileCurrentRuntime = vi.fn();
  const syncFlowModelReferencesForNodeTree = vi.fn();
  const assertCanWrite = vi.fn();
  const readLegacy = vi.fn(async () => ({
    code: 'return 1;',
    version: 'v2',
    label: 'RunJS',
    surfaceStyle: 'render' as const,
    language: 'typescript',
    ownerFingerprint: 'owner_before',
    metadata: { modelUse },
  }));
  const writeExternalBinding = vi.fn();
  const registryRequire = vi.fn(() => ({
    kind: 'flowModel.step',
    assertCanWrite,
    readLegacy,
    writeExternalBinding,
    getFingerprint: vi.fn(),
  }));
  const service = new MoveSourceService(
    { sequelize: { transaction } } as unknown as Database,
    { createRepoForCompositeUseCase: createRepo, assertApplicationOwnership: vi.fn() } as never,
    { pull } as never,
    { getEntry, listEntries } as never,
    { prepareSaveSource, publishPreparedSave, compileCurrentRuntime } as never,
    { syncFlowModelReferencesForNodeTree } as never,
    () => ({ require: registryRequire }) as unknown as RunJSSourceAdapterRegistry,
    'main',
    { assertCurrent: vi.fn() },
  );

  return {
    service,
    transaction,
    createRepo,
    pull,
    getEntry,
    listEntries,
    prepareSaveSource,
    publishPreparedSave,
    compileCurrentRuntime,
    syncFlowModelReferencesForNodeTree,
    assertCanWrite,
    readLegacy,
    writeExternalBinding,
    registryRequire,
  };
}

function expectFailFastWritesNotCalled(fixture: ReturnType<typeof createFailFastService>): void {
  expect(fixture.transaction).not.toHaveBeenCalled();
  expect(fixture.createRepo).not.toHaveBeenCalled();
  expect(fixture.pull).not.toHaveBeenCalled();
  expect(fixture.getEntry).not.toHaveBeenCalled();
  expect(fixture.listEntries).not.toHaveBeenCalled();
  expect(fixture.prepareSaveSource).not.toHaveBeenCalled();
  expect(fixture.publishPreparedSave).not.toHaveBeenCalled();
  expect(fixture.compileCurrentRuntime).not.toHaveBeenCalled();
  expect(fixture.writeExternalBinding).not.toHaveBeenCalled();
  expect(fixture.syncFlowModelReferencesForNodeTree).not.toHaveBeenCalled();
}

describe('move to inline integration', () => {
  // Old case -> new owner:
  // move-to-inline / js-block + JSBlockModel -> host-kind support matrix below.
  // move-to-inline / js-field + JSFieldModel -> host-kind support matrix below.
  // move-to-inline / js-field + JSEditableFieldModel -> host-kind support matrix below.
  // move-to-inline / js-field + JSColumnModel -> host-kind support matrix below.
  // move-to-inline / js-action + JSActionModel -> host-kind support matrix below.
  // move-to-inline / js-item + JSItemModel -> host-kind support matrix below.
  // move-to-inline / js-page + JSPageModel -> host-kind support matrix below.
  // move-to-inline / js-page + JSBlockModel -> host-kind support matrix below.
  // move-to-inline / js-block + JSColumnModel -> host-kind support matrix below.
  // move-to-inline / runjs + JSColumnModel -> host-kind support matrix below.
  // move-to-inline / reserves the RunJS manifest file slot before opening a database transaction -> file-limit matrix below.
  // move-to-inline / allows a 200-file workspace when the relocated dependency closure fits with the manifest -> file-limit matrix below.
  // move-to-inline / moves a JS Page inline with its snapshot and settings while removing the active reference -> this suite.
  // move-to-inline / rejects a host that no longer points to the selected light extension entry -> this suite.
  // New owner: reverse-move late failure rolls back the external binding, RunJS repository Head, and reference index.

  const locator = {
    kind: 'flowModel.step',
    modelUid: 'fm_js_block',
    flowKey: 'jsSettings',
    stepKey: 'runJs',
    paramPath: ['code'],
  } as const;

  const binding = {
    type: 'light-extension-entry',
    repoId: 'ler_sales',
    entryId: 'lee_sales',
    kind: 'js-block',
  } as const;

  const entry: LightExtensionEntryRecord = {
    id: binding.entryId,
    repoId: binding.repoId,
    target: 'client',
    kind: 'js-block',
    entryName: 'sales',
    entryPath: 'src/client/js-blocks/sales/index.tsx',
    descriptorPath: 'src/client/js-blocks/sales/entry.json',
    title: 'Sales',
    description: null,
    category: null,
    icon: null,
    tags: null,
    sort: null,
    settingsSchema: null,
    settingsSchemaHash: null,
    compiledCommitId: 'commit_light',
    compiledInputKey: 'compile_key',
    compilerBuildId: 'compiler_build',
    runtimeArtifact: null,
    runtimeVersion: 'v2',
    surfaceStyle: 'render',
    runtimeCodeHash: null,
    artifactHash: null,
    filesHash: null,
    settingsDefaultsHash: null,
    compiledAt: null,
    healthStatus: 'ready',
    diagnostics: [],
  };

  describe('MoveToInlineService', () => {
    it.each([
      ['js-block', 'JSBlockModel', true],
      ['js-field', 'JSFieldModel', true],
      ['js-field', 'JSEditableFieldModel', true],
      ['js-field', 'JSColumnModel', true],
      ['js-action', 'JSActionModel', true],
      ['js-item', 'JSItemModel', true],
      ['js-page', 'JSPageModel', true],
      ['js-page', 'JSBlockModel', false],
      ['js-block', 'JSColumnModel', false],
      ['runjs', 'JSColumnModel', false],
    ])('checks whether %s can move from %s back to inline code', (kind, modelUse, expected) => {
      expect(isMoveToInlineHostSupported(kind, modelUse)).toBe(expected);
    });

    it.each([
      {
        label: 'reserves the RunJS manifest file slot for a full 200-file dependency closure',
        files: [
          {
            path: entry.entryPath,
            content: Array.from({ length: 199 }, (_, index) => `import '../../../shared/file-${index + 1}';`).join(
              '\n',
            ),
          },
          ...Array.from({ length: 199 }, (_, index) => ({
            path: `src/shared/file-${index + 1}.ts`,
            content: 'export const value = true;\n',
          })),
        ],
        expected: {
          code: 'LIGHT_EXTENSION_SOURCE_ERROR',
          details: expect.objectContaining({ sourceCode: 'REPO_LIMIT_EXCEEDED' }),
        },
      },
      {
        label: 'allows a 200-file workspace when the relocated dependency closure fits with the manifest',
        files: [
          { path: entry.entryPath, content: 'ctx.render(<div />);' },
          ...Array.from({ length: 199 }, (_, index) => ({
            path: `src/shared/unused-${index + 1}.ts`,
            content: 'export const unused = true;\n',
          })),
        ],
        expected: { code: 'LIGHT_EXTENSION_RUNTIME_UNAVAILABLE' },
      },
    ])('$label before opening a database transaction', async ({ files, expected }) => {
      const transaction = vi.fn();
      const service = new MoveToInlineService(
        { sequelize: { transaction } } as unknown as Database,
        {} as never,
        {} as never,
        {} as never,
        () => null,
        () => null,
      );

      await expect(
        service.moveToInline(
          {
            locator,
            repoId: binding.repoId,
            entryId: binding.entryId,
            entryPath: entry.entryPath,
            kind: 'js-block',
            version: 'v2',
            files,
          },
          { adapterContext: {} },
        ),
      ).rejects.toMatchObject(expected);
      expect(transaction).not.toHaveBeenCalled();
    });

    it('moves a JS Page inline with its snapshot and settings while removing the active reference', async () => {
      const transaction = { LOCK: { UPDATE: 'UPDATE' } } as unknown as Transaction;
      const pageLocator = { ...locator, modelUid: 'fm_js_page' };
      const pageBinding = { ...binding, repoId: 'ler_pages', entryId: 'lee_page', kind: 'js-page' as const };
      const pageEntry = {
        ...entry,
        id: pageBinding.entryId,
        repoId: pageBinding.repoId,
        kind: 'js-page' as const,
        entryName: 'page',
        entryPath: 'src/client/js-pages/page/index.tsx',
        descriptorPath: 'src/client/js-pages/page/entry.json',
        title: 'Page',
      };
      const currentSettings = {
        enabled: false,
        nested: { visibleValue: 'kept' },
        items: [{ key: 'first', active: false }],
      };
      const canonicalDescriptorContent = `${JSON.stringify(
        {
          schemaVersion: 1,
          key: 'sales',
          title: 'Sales',
          settings: { enabled: { type: 'boolean', default: true } },
        },
        null,
        2,
      )}\n`;
      const descriptorContent = `\ufeff${canonicalDescriptorContent.replace(/\n/gu, '\r\n')}`;
      const flowModel = {
        uid: pageLocator.modelUid,
        use: 'JSPageModel',
        stepParams: {
          jsSettings: {
            runJs: {
              code: 'ctx.render("old");',
              version: 'v2',
              sourceMode: 'light-extension',
              sourceBinding: { ...pageBinding },
              settings: currentSettings,
              sourceRef: {
                type: 'vsc-file',
                repoId: 'old_inline_repo',
                commitId: 'old_inline_commit',
                entry: 'src/client/index.tsx',
              },
            },
          },
        },
      };
      const patch = vi.fn(async (values: Record<string, unknown>) => {
        flowModel.stepParams = values.stepParams as typeof flowModel.stepParams;
      });
      const lockFlowModelRecord = vi.fn(async () => flowModel);
      const updateCommit = vi.fn(async () => undefined);
      const db = {
        sequelize: {
          transaction: (run: (current: Transaction) => Promise<unknown>) => run(transaction),
        },
        getCollection: () => ({
          model: { findByPk: lockFlowModelRecord },
          repository: { findModelById: vi.fn(async () => JSON.parse(JSON.stringify(flowModel))), patch },
        }),
        getRepository: () => ({ update: updateCommit }),
      } as unknown as Database;
      const compileEntry = vi.fn(async () => ({
        accepted: true,
        diagnostics: [],
        surface: {
          surface: 'js-page',
          surfaceStyle: 'render',
          compilerSurfaceStyle: 'render',
          modelUse: 'JSPageModel',
        },
        artifact: {
          code: 'ctx.render("inline");',
          version: 'v2',
          entryPath: 'src/client/index.tsx',
          filesHash: 'compiled_files_hash',
          diagnostics: [],
          metadata: {},
        },
      }));
      const syncReferences = vi.fn(async () => undefined);
      const writeRuntime = vi.fn(
        async (input: {
          artifact: { code: string; version: string; entryPath?: string; metadata?: Record<string, unknown> };
          commitId: string;
        }) => {
          flowModel.stepParams.jsSettings.runJs.code = input.artifact.code;
          flowModel.stepParams.jsSettings.runJs.version = input.artifact.version;
          flowModel.stepParams.jsSettings.runJs.sourceRef = {
            type: 'vsc-file',
            repoId: String(input.artifact.metadata?.repoId || ''),
            commitId: input.commitId,
            entry: String(input.artifact.entryPath || 'src/client/index.tsx'),
          };
          return { ownerFingerprint: 'owner_runtime' };
        },
      );
      const assertCanWrite = vi.fn(async () => undefined);
      const readLegacy = vi.fn(async () => ({
        code: 'ctx.render("old");',
        version: 'v2',
        label: 'JS page',
        surfaceStyle: 'render' as const,
        language: 'typescript' as const,
        ownerFingerprint: 'owner_before',
        metadata: { modelUse: 'JSPageModel' },
      }));
      const adapter = {
        kind: 'flowModel.step',
        assertCanWrite,
        readLegacy,
        writeRuntime,
        getFingerprint: vi.fn(async () => 'owner_after'),
      };
      const runJSRepo = {
        id: 'runjs_repo',
        ownerType: 'runjs-source',
        ownerId: 'runjs:flowModel.step:fm_js_block:expected',
        name: 'source',
        status: 'active',
        defaultRef: 'head',
        headCommitId: 'runjs_old_commit',
        headSeq: 1,
      };
      const ensureRepository = vi.fn(async (input: { ownerId: string }) => ({
        repository: { ...runJSRepo, ownerId: input.ownerId },
        initialCommit: null,
      }));
      const preparedPush = {};
      const preparePush = vi.fn(async () => preparedPush);
      const publishPreparedPush = vi.fn(async () => ({
        repository: runJSRepo,
        commit: {
          id: 'runjs_new_commit',
          repoId: runJSRepo.id,
          seq: 2,
          parentCommitId: runJSRepo.headCommitId,
          treeHash: 'tree_hash',
          hash: 'commit_hash',
          message: 'Move to inline',
          authorId: '1',
          metadata: {},
        },
        tree: { hash: 'tree_hash', entryCount: 2, byteSize: 100 },
      }));
      const vscFileService = {
        ensureRepository,
        pull: vi.fn(async () => ({
          repository: runJSRepo,
          commit: null,
          tree: null,
          unchanged: false,
          files: [
            { path: 'src/client/entry.json', language: 'json', mode: '100644' },
            { path: 'src/client/index.tsx', language: 'tsx', mode: '100755' },
            { path: 'src/client/old.ts', language: 'typescript', mode: '100644' },
          ],
        })),
        preparePush,
        publishPreparedPush,
      } as unknown as VscFileService;
      const getVscFileService = vi.fn(() => vscFileService);
      const service = new MoveToInlineService(
        db,
        { getEntry: vi.fn(async () => pageEntry) } as never,
        { compileEntry } as never,
        { syncFlowModelReferencesForNodeTree: syncReferences } as never,
        getVscFileService,
        () => ({ require: () => adapter }) as unknown as RunJSSourceAdapterRegistry,
      );

      const result = await service.moveToInline(
        {
          locator: pageLocator,
          repoId: pageBinding.repoId,
          entryId: pageBinding.entryId,
          entryPath: pageEntry.entryPath,
          kind: 'js-page',
          version: 'v2',
          files: [
            {
              path: pageEntry.entryPath,
              content: "import { used } from '../../../shared/used';\nctx.render(String(used));\n",
            },
            { path: pageEntry.descriptorPath, content: descriptorContent, language: 'json' },
            { path: 'src/shared/used.ts', content: 'export const used = true;\n' },
            { path: 'src/shared/unused.ts', content: 'export const unused = true;\n' },
          ],
        },
        {
          actorUserId: '1',
          adapterContext: {},
        },
      );

      expect(compileEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          entryPath: 'src/client/index.tsx',
          files: expect.arrayContaining([
            expect.objectContaining({ path: 'src/client/entry.json', content: descriptorContent }),
            expect.objectContaining({ path: 'src/client/index.tsx' }),
            expect.objectContaining({ path: 'src/shared/used.ts' }),
          ]),
        }),
      );
      expect(JSON.stringify(compileEntry.mock.calls)).not.toContain('src/shared/unused.ts');
      expect(preparePush).toHaveBeenCalledWith(
        expect.objectContaining({
          allowEmptyCommit: true,
          files: expect.arrayContaining([
            expect.objectContaining({ path: '.nocobase/runjs-source.json', operation: 'upsert' }),
            expect.objectContaining({
              path: 'src/client/entry.json',
              content: canonicalDescriptorContent,
              language: 'json',
              mode: '100644',
              operation: 'upsert',
            }),
            expect.objectContaining({
              path: 'src/client/index.tsx',
              language: 'tsx',
              mode: '100755',
              operation: 'upsert',
            }),
            expect.objectContaining({ path: 'src/client/old.ts', operation: 'delete' }),
          ]),
        }),
        expect.any(Object),
      );
      const pushedFiles = preparePush.mock.calls[0][0].files as VscFileChange[];
      const canonicalFiles = pushedFiles.filter((file) => file.operation === 'upsert');
      expect(result.filesHash).toBe(buildRunJSFilesHash(canonicalFiles));
      const sourceId = createHash('sha256').update(result.filesHash).digest('hex').slice(0, 16);
      expect(result.code).toContain(`nocobase-runjs://bundle/${sourceId}.js`);
      expect(ensureRepository).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          request: expect.objectContaining({
            resourceName: 'runJSSources',
            actionName: 'save',
          }),
        }),
      );
      expect(preparePush.mock.invocationCallOrder[0]).toBeLessThan(lockFlowModelRecord.mock.invocationCallOrder[0]);
      expect(getVscFileService).toHaveBeenCalledTimes(1);
      expect(publishPreparedPush).toHaveBeenCalledWith(preparedPush, expect.objectContaining({ transaction }));
      expect(compileEntry.mock.calls[0][1]?.transaction).toBeUndefined();
      expect(preparePush.mock.calls[0][1]?.transaction).toBeUndefined();
      expect(assertCanWrite).toHaveBeenCalledTimes(2);
      expect(assertCanWrite.mock.calls[0][0].ctx.transaction).toBeUndefined();
      expect(readLegacy).toHaveBeenCalledTimes(2);
      expect(readLegacy.mock.calls[0][0].ctx.transaction).toBeUndefined();
      expect(assertCanWrite).toHaveBeenCalledWith({
        locator: pageLocator,
        ctx: expect.objectContaining({
          transaction,
          sourceTransition: 'external-to-inline',
        }),
      });
      expect(readLegacy).toHaveBeenCalledWith({
        locator: pageLocator,
        ctx: expect.objectContaining({
          transaction,
          sourceTransition: 'external-to-inline',
        }),
      });
      expect(writeRuntime).toHaveBeenCalledWith(
        expect.objectContaining({
          baseOwnerFingerprint: 'owner_before',
          commitId: 'runjs_new_commit',
          ctx: expect.objectContaining({
            transaction,
            sourceTransition: 'external-to-inline',
          }),
          artifact: expect.objectContaining({
            filesHash: result.filesHash,
            code: expect.stringContaining(`nocobase-runjs://bundle/${sourceId}.js`),
            metadata: expect.objectContaining({ repoId: 'runjs_repo' }),
          }),
        }),
      );
      expect(flowModel.stepParams.jsSettings.runJs).toMatchObject({
        code: result.code,
        version: result.version,
        sourceMode: 'inline',
        sourceRef: result.sourceRef,
      });
      expect(flowModel.stepParams.jsSettings.runJs.settings).toEqual(currentSettings);
      expect(flowModel.stepParams.jsSettings.runJs).not.toHaveProperty('sourceBinding');
      expect(syncReferences).toHaveBeenCalledWith(
        { rootUid: pageLocator.modelUid, action: 'lightExtensions.moveToInline' },
        expect.objectContaining({ transaction }),
      );
      expect(updateCommit).toHaveBeenCalledWith(expect.objectContaining({ filterByTk: 'runjs_new_commit' }));
      expect(result).toMatchObject({
        runJSRepoId: 'runjs_repo',
        commitId: 'runjs_new_commit',
        ownerFingerprint: 'owner_after',
        code: expect.stringContaining(`nocobase-runjs://bundle/${sourceId}.js`),
        sourceRef: {
          type: 'vsc-file',
          repoId: 'runjs_repo',
          commitId: 'runjs_new_commit',
          entry: 'src/client/index.tsx',
        },
      });
    });

    it('rolls back the external binding, repository Head, and reference index after a late failure', async () => {
      const transaction = { LOCK: { UPDATE: 'UPDATE' } } as unknown as Transaction;
      const identity = buildRunJSSourceRepositoryIdentity(locator);
      const initialRunJS = {
        code: 'ctx.render("preserved inline");',
        version: 'v1',
        sourceMode: 'light-extension',
        sourceBinding: { ...binding },
        settings: { title: 'Revenue' },
        sourceRef: {
          type: 'vsc-file',
          repoId: 'runjs_repo',
          commitId: 'runjs_head_before',
          entry: 'src/client/index.tsx',
        },
      };
      let flowModel = {
        uid: locator.modelUid,
        use: 'JSBlockModel',
        stepParams: { jsSettings: { runJs: clone(initialRunJS) } },
      };
      let repository = {
        id: 'runjs_repo',
        ownerType: identity.ownerType,
        ownerId: identity.ownerId,
        name: identity.name,
        status: 'active',
        defaultRef: 'head',
        headCommitId: 'runjs_head_before',
        headSeq: 1,
      };
      let commits = [{ id: 'runjs_head_before', repoId: repository.id, seq: 1 }];
      let references = [{ id: 'reference_sales', repoId: binding.repoId, entryId: binding.entryId }];
      const initialFlowModel = clone(flowModel);
      const initialRepository = clone(repository);
      const initialCommits = clone(commits);
      const initialReferences = clone(references);
      const observedBeforeFailure = {
        inlineHost: false,
        advancedHead: false,
        removedReference: false,
      };

      const db = {
        sequelize: {
          transaction: async (run: (current: Transaction) => Promise<unknown>) => {
            try {
              return await run(transaction);
            } catch (error) {
              flowModel = clone(initialFlowModel);
              repository = clone(initialRepository);
              commits = clone(initialCommits);
              references = clone(initialReferences);
              throw error;
            }
          },
        },
        getCollection: () => ({
          model: { findByPk: vi.fn(async () => clone(flowModel)) },
          repository: {
            findModelById: vi.fn(async () => clone(flowModel)),
            patch: vi.fn(async (values: { stepParams: typeof flowModel.stepParams }) => {
              flowModel = { ...flowModel, stepParams: clone(values.stepParams) };
            }),
          },
        }),
        getRepository: () => ({ update: vi.fn() }),
      } as unknown as Database;
      const adapter = {
        kind: 'flowModel.step',
        assertCanWrite: vi.fn(),
        readLegacy: vi.fn(async () => ({
          code: initialRunJS.code,
          version: initialRunJS.version,
          label: 'JS block',
          surfaceStyle: 'render' as const,
          language: 'typescript' as const,
          ownerFingerprint: 'owner_before',
          metadata: { modelUse: 'JSBlockModel' },
        })),
        writeRuntime: vi.fn(
          async (input: {
            artifact: { code: string; version: string; entryPath?: string; metadata?: Record<string, unknown> };
            commitId: string;
          }) => {
            flowModel.stepParams.jsSettings.runJs.code = input.artifact.code;
            flowModel.stepParams.jsSettings.runJs.version = input.artifact.version;
            flowModel.stepParams.jsSettings.runJs.sourceRef = {
              type: 'vsc-file',
              repoId: String(input.artifact.metadata?.repoId || ''),
              commitId: input.commitId,
              entry: String(input.artifact.entryPath || 'src/client/index.tsx'),
            };
          },
        ),
        getFingerprint: vi.fn(async () => 'owner_after'),
      };
      const pushedCommit = {
        id: 'runjs_head_after',
        repoId: repository.id,
        seq: 2,
        parentCommitId: repository.headCommitId,
        treeHash: 'tree_hash_after',
        hash: 'commit_hash_after',
        message: 'Move to inline',
        authorId: '1',
        metadata: {},
      };
      const preparedPush = {};
      const vscFileService = {
        ensureRepository: vi.fn(async () => ({ repository: clone(repository), initialCommit: null })),
        pull: vi.fn(async () => ({
          repository: clone(repository),
          commit: null,
          tree: null,
          unchanged: false,
          files: [],
        })),
        preparePush: vi.fn(async () => preparedPush),
        publishPreparedPush: vi.fn(async () => {
          repository = { ...repository, headCommitId: pushedCommit.id, headSeq: pushedCommit.seq };
          commits.push({ id: pushedCommit.id, repoId: repository.id, seq: pushedCommit.seq });
          return {
            repository: clone(repository),
            commit: pushedCommit,
            tree: { hash: pushedCommit.treeHash, entryCount: 2, byteSize: 100 },
          };
        }),
      } as unknown as VscFileService;
      const syncReferences = vi.fn(async () => {
        references = [];
        const runJS = flowModel.stepParams.jsSettings.runJs;
        observedBeforeFailure.inlineHost = runJS.sourceMode === 'inline' && !('sourceBinding' in runJS);
        observedBeforeFailure.advancedHead = repository.headCommitId === pushedCommit.id && commits.length === 2;
        observedBeforeFailure.removedReference = references.length === 0;
        throw new Error('forced move-to-inline reference rollback');
      });
      const service = new MoveToInlineService(
        db,
        { getEntry: vi.fn(async () => entry) } as never,
        {
          compileEntry: vi.fn(async () => ({
            accepted: true,
            diagnostics: [],
            surface: {
              surface: 'js-block',
              surfaceStyle: 'render',
              compilerSurfaceStyle: 'render',
              modelUse: 'JSBlockModel',
            },
            artifact: {
              code: 'ctx.render("inline after move");',
              version: 'v2',
              entryPath: 'src/client/index.tsx',
              filesHash: 'compiled_files_hash',
              diagnostics: [],
              metadata: {},
            },
          })),
        } as never,
        { syncFlowModelReferencesForNodeTree: syncReferences } as never,
        () => vscFileService,
        () => ({ require: () => adapter }) as unknown as RunJSSourceAdapterRegistry,
      );

      await expect(
        service.moveToInline(
          {
            locator,
            repoId: binding.repoId,
            entryId: binding.entryId,
            entryPath: entry.entryPath,
            kind: 'js-block',
            version: 'v2',
            files: [{ path: entry.entryPath, content: 'ctx.render("inline after move");' }],
          },
          { actorUserId: '1', adapterContext: {} },
        ),
      ).rejects.toThrow('forced move-to-inline reference rollback');

      expect(observedBeforeFailure).toEqual({
        inlineHost: true,
        advancedHead: true,
        removedReference: true,
      });
      expect(flowModel).toEqual(initialFlowModel);
      expect(flowModel.stepParams.jsSettings.runJs).toMatchObject({
        sourceMode: 'light-extension',
        sourceBinding: binding,
        code: initialRunJS.code,
        version: initialRunJS.version,
        settings: initialRunJS.settings,
        sourceRef: initialRunJS.sourceRef,
      });
      expect(repository).toEqual(initialRepository);
      expect(commits).toEqual(initialCommits);
      expect(references).toEqual(initialReferences);
    });

    it('rejects a host that no longer points to the selected light extension entry', async () => {
      const transaction = { LOCK: { UPDATE: 'UPDATE' } } as unknown as Transaction;
      const flowModel = {
        uid: locator.modelUid,
        use: 'JSBlockModel',
        stepParams: {
          jsSettings: {
            runJs: {
              code: '',
              version: 'v2',
              sourceMode: 'light-extension',
              sourceBinding: { ...binding, entryId: 'lee_other' },
            },
          },
        },
      };
      const db = {
        sequelize: {
          transaction: (run: (current: Transaction) => Promise<unknown>) => run(transaction),
        },
        getCollection: () => ({
          model: { findByPk: vi.fn(async () => flowModel) },
          repository: { findModelById: vi.fn(async () => flowModel), patch: vi.fn() },
        }),
      } as unknown as Database;
      const service = new MoveToInlineService(
        db,
        { getEntry: vi.fn() } as never,
        { compileEntry: vi.fn() } as never,
        { syncFlowModelReferencesForNodeTree: vi.fn() } as never,
        () => ({}) as VscFileService,
        () =>
          ({
            require: () => ({
              kind: 'flowModel.step',
              assertCanWrite: vi.fn(),
            }),
          }) as unknown as RunJSSourceAdapterRegistry,
      );

      await expect(
        service.moveToInline(
          {
            locator,
            repoId: binding.repoId,
            entryId: binding.entryId,
            entryPath: entry.entryPath,
            kind: 'js-block',
            version: 'v2',
            files: [{ path: entry.entryPath, content: 'ctx.render(<div />);' }],
          },
          { adapterContext: {} },
        ),
      ).rejects.toMatchObject({ code: 'LIGHT_EXTENSION_BINDING_OUTDATED' });
    });
  });

  function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }
});

describe('move resource integration', () => {
  // Old case -> new owner:
  // move-to-inline / normalizes the moveToInline resource input and request context -> this suite.
  // New owner: service errors are mapped to the stable HTTP response contract by the public resource.

  const locator = {
    kind: 'flowModel.step',
    modelUid: 'fm_js_block',
    flowKey: 'jsSettings',
    stepKey: 'runJs',
    paramPath: ['code'],
  } as const;

  const binding = {
    type: 'light-extension-entry',
    repoId: 'ler_sales',
    entryId: 'lee_sales',
    kind: 'js-block',
  } as const;

  const entryPath = 'src/client/js-blocks/sales/index.tsx';

  describe('move-to-inline resource', () => {
    it('normalizes moveSource input and request context', async () => {
      const moveSource = vi.fn(async () => ({ repo: { id: 'ler_default' }, ownerFingerprint: 'owner_after' }));
      const resource = createLightExtensionsResource(
        {} as LightExtensionCompilePreviewService,
        { moveSource } as unknown as MoveSourceService,
      );
      const can = vi.fn().mockReturnValue({});
      const ctx = {
        action: {
          params: {
            values: {
              idempotencyKey: 'externalize-sales-page-v1',
              locator,
              expectedOwnerFingerprint: 'owner_before',
              sourceRepoId: 'runjs_sales_page',
              sourceHeadCommitId: 'commit_inline',
              entryPath: 'src/client/index.tsx',
              version: 'v2',
              files: [{ path: 'src/client/index.tsx', content: 'ctx.render(null);' }],
              destination: { type: 'existing', repoId: 'ler_default' },
              entryName: 'sales-page',
            },
          },
        },
        auth: { user: { id: 9 } },
        can,
        request: { headers: { 'x-request-id': 'req_externalize', 'x-request-source': 'resource-contract' } },
      } as unknown as Context;

      await resource.actions?.moveSource?.(ctx, async () => undefined);

      expect(moveSource).toHaveBeenCalledWith(
        expect.objectContaining({
          idempotencyKey: 'externalize-sales-page-v1',
          destination: { type: 'existing', repoId: 'ler_default' },
          entryName: 'sales-page',
          files: [expect.objectContaining({ path: 'src/client/index.tsx', content: 'ctx.render(null);' })],
        }),
        expect.objectContaining({
          actorUserId: '9',
          requestId: 'req_externalize',
          requestSource: 'resource-contract',
          can,
        }),
      );
      expect((ctx as { body?: unknown }).body).toEqual({
        repo: { id: 'ler_default' },
        ownerFingerprint: 'owner_after',
      });
    });

    it('normalizes the moveToInline resource input and request context', async () => {
      const moveToInline = vi.fn(async () => ({ code: 'ctx.render(<div />);', version: 'v2' }));
      const resource = createLightExtensionsResource({} as LightExtensionCompilePreviewService, undefined, {
        moveToInline,
      } as unknown as MoveToInlineService);
      const can = vi.fn().mockReturnValue({});
      const ctx = {
        action: {
          params: {
            values: {
              locator,
              repoId: binding.repoId,
              entryId: binding.entryId,
              entryPath,
              kind: 'js-block',
              version: 'v2',
              files: [{ path: entryPath, content: 'ctx.render(<div />);' }],
            },
          },
        },
        auth: { user: { id: 9 } },
        can,
        request: {
          headers: {
            'x-request-id': 'req_move_inline',
            'x-request-source': 'unit-resource',
          },
        },
      } as unknown as Context;

      await resource.actions?.moveToInline?.(ctx, async () => undefined);

      expect(moveToInline).toHaveBeenCalledWith(
        {
          locator,
          repoId: binding.repoId,
          entryId: binding.entryId,
          entryPath,
          kind: 'js-block',
          version: 'v2',
          files: [
            {
              path: entryPath,
              content: 'ctx.render(<div />);',
              language: undefined,
              mode: undefined,
            },
          ],
        },
        expect.objectContaining({
          actorUserId: '9',
          requestId: 'req_move_inline',
          requestSource: 'unit-resource',
          can,
          adapterContext: expect.objectContaining({ currentUser: { id: 9 } }),
        }),
      );
      expect((ctx as { body?: unknown }).body).toEqual({ code: 'ctx.render(<div />);', version: 'v2' });
    });

    it('maps move-to-inline service errors to the public HTTP response contract', async () => {
      const error = new LightExtensionError(
        'LIGHT_EXTENSION_BINDING_OUTDATED',
        'The binding changed before the move completed',
        {
          details: { repoId: binding.repoId, entryId: binding.entryId },
        },
      );
      const moveToInline = vi.fn(async () => {
        throw error;
      });
      const resource = createLightExtensionsResource({} as LightExtensionCompilePreviewService, undefined, {
        moveToInline,
      } as unknown as MoveToInlineService);
      const ctx = {
        action: {
          params: {
            values: {
              locator,
              repoId: binding.repoId,
              entryId: binding.entryId,
              entryPath,
              kind: 'js-block',
              version: 'v2',
              files: [{ path: entryPath, content: 'ctx.render(<div />);' }],
            },
          },
        },
        auth: { user: { id: 9 } },
        request: { headers: {} },
      } as unknown as Context;

      await resource.actions?.moveToInline?.(ctx, async () => undefined);

      expect((ctx as { withoutDataWrapping?: boolean }).withoutDataWrapping).toBe(true);
      expect((ctx as { type?: string }).type).toBe('application/json');
      expect((ctx as { status?: number }).status).toBe(409);
      expect((ctx as { body?: unknown }).body).toEqual(error.toResponseBody());
    });
  });
});
