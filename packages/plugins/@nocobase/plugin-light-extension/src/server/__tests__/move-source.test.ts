/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';
import type { RunJSSourceAdapterRegistry } from '../vsc-file';
import { describe, expect, it, vi } from 'vitest';

import type {
  LightExtensionEntryRecord,
  LightExtensionMoveSourceInput,
  LightExtensionRepoRecord,
} from '../../shared/types';
import { MoveSourceService, relocateRunJSWorkspace } from '../services/MoveSourceService';
import { buildApplicationDefaultLightExtensionIdentity } from '../services/LightExtensionRepoService';

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

describe('MoveSourceService', () => {
  it('derives one stable default repository identity per application', () => {
    expect(buildApplicationDefaultLightExtensionIdentity('sales-app')).toEqual(
      buildApplicationDefaultLightExtensionIdentity('sales-app'),
    );
    expect(buildApplicationDefaultLightExtensionIdentity('sales-app')).not.toEqual(
      buildApplicationDefaultLightExtensionIdentity('support-app'),
    );
  });

  it('relocates the current multi-file workspace and rewrites relative imports', () => {
    const files = relocateRunJSWorkspace({
      kind: 'js-block',
      entryName: 'sales-kpi',
      entryTitle: 'Sales KPI',
      entryPath: 'src/main.ts',
      files: [
        {
          path: '.nocobase/runjs-source.json',
          content: '{}',
        },
        {
          path: 'src/main.ts',
          content:
            "import { helper } from './helper';\nimport { value } from '../shared/value';\nreturn helper(value);\n",
        },
        {
          path: 'src/helper.ts',
          content: 'export const helper = (value: unknown) => value;\n',
        },
        {
          path: 'shared/value.ts',
          content: 'export const value = 1;\n',
        },
      ],
    });

    expect(files.map((file) => file.path).sort()).toEqual([
      'src/client/js-blocks/sales-kpi/__workspace/shared/value.ts',
      'src/client/js-blocks/sales-kpi/entry.json',
      'src/client/js-blocks/sales-kpi/helper.ts',
      'src/client/js-blocks/sales-kpi/index.ts',
    ]);
    expect(files.find((file) => file.path.endsWith('/index.ts'))?.content).toContain(
      "from './__workspace/shared/value'",
    );
    expect(JSON.parse(files.find((file) => file.path.endsWith('/entry.json'))?.content || '{}')).toEqual({
      schemaVersion: 1,
      key: 'sales-kpi',
      title: 'Sales KPI',
    });
    expect(files.some((file) => file.path.includes('.nocobase'))).toBe(false);
  });

  it.each([
    ['js-block', 'src/client/js-blocks', null],
    ['js-page', 'src/client/js-pages', null],
    ['js-field', 'src/client/js-fields', 'js-field'],
    ['js-action', 'src/client/js-actions', null],
    ['js-item', 'src/client/js-items', null],
  ] as const)('preserves entry.json configuration when relocating %s', (kind, root, category) => {
    const settings = {
      enabled: { type: 'boolean', default: false },
      retryCount: { type: 'integer', default: 0 },
      label: { type: 'string', default: '' },
      advanced: {
        type: 'object',
        properties: {
          hiddenValue: { type: 'string', default: 'kept' },
        },
      },
    };
    const files = relocateRunJSWorkspace({
      kind,
      entryName: 'normalize-order',
      entryTitle: 'Normalize order',
      category,
      entryPath: 'src/client/nested/index.ts',
      files: [
        { path: 'src/client/nested/index.ts', content: 'return input;' },
        {
          path: 'src/client/entry.json',
          content: JSON.stringify({
            schemaVersion: 99,
            key: 'old-key',
            title: 'Old title',
            description: 'Keep this description',
            category: 'old-category',
            icon: 'CodeOutlined',
            tags: ['inline', 'configuration'],
            sort: 20,
            settings,
            settingsSchema: { type: 'object', properties: { legacy: { type: 'string' } } },
            unknown: true,
          }),
        },
        { path: 'src/client/nested/meta.json', content: '{"key":"legacy"}' },
        { path: 'src/client/nested/settings.json', content: '{"type":"object"}' },
      ],
    });

    expect(files.map((file) => file.path).sort()).toEqual([
      `${root}/normalize-order/entry.json`,
      `${root}/normalize-order/index.ts`,
    ]);
    expect(JSON.parse(files.find((file) => file.path.endsWith('/entry.json'))?.content || '{}')).toEqual({
      schemaVersion: 1,
      key: 'old-key',
      title: 'Normalize order',
      description: 'Keep this description',
      category: category || 'old-category',
      icon: 'CodeOutlined',
      tags: ['inline', 'configuration'],
      sort: 20,
      settings,
    });
  });

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
    const createdRepo = { ...repo, id: 'ler_new', name: 'sales-tools', normalizedName: 'sales-tools' };
    const createdEntry = {
      ...entry,
      repoId: createdRepo.id,
      kind: 'js-page' as const,
      entryPath: 'src/client/js-pages/sales-kpi/index.tsx',
      descriptorPath: 'src/client/js-pages/sales-kpi/entry.json',
    };
    const createRepo = vi.fn(async () => createdRepo);
    const writeExternalBinding = vi.fn(async () => ({ ownerFingerprint: 'owner_after' }));
    const syncReferences = vi.fn(async () => undefined);
    let compiled = false;
    const compileCurrentRuntime = vi.fn(async () => {
      compiled = true;
      return {
        repo: createdRepo,
        status: 'success',
        entries: [createdEntry],
        diagnostics: [],
      };
    });
    const service = new MoveSourceService(
      {
        sequelize: {
          transaction: (run: (transaction: Transaction) => Promise<unknown>) =>
            run({ id: 'tx_create' } as unknown as Transaction),
        },
      } as unknown as Database,
      { createRepo } as never,
      {} as never,
      {
        listEntries: vi.fn(async () => {
          expect(compiled).toBe(true);
          return [createdEntry];
        }),
      } as never,
      { compileCurrentRuntime } as never,
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
    );

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
      { adapterContext: {} },
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
    expect(compileCurrentRuntime).toHaveBeenCalledWith(
      createdRepo.id,
      createdRepo.headCommitId,
      expect.objectContaining({ transaction: expect.anything() }),
    );
    expect(writeExternalBinding.mock.invocationCallOrder[0]).toBeGreaterThan(
      compileCurrentRuntime.mock.invocationCallOrder[0],
    );
    expect(syncReferences.mock.invocationCallOrder[0]).toBeGreaterThan(
      writeExternalBinding.mock.invocationCallOrder[0],
    );
    expect(result.binding).toMatchObject({
      repoId: createdRepo.id,
      entryId: createdEntry.id,
      entryPath: createdEntry.entryPath,
      kind: 'js-page',
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
      { lockInternalRepoForUpdate: vi.fn(async () => repo) } as never,
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

    expect(fixture.readLegacy).toHaveBeenCalledOnce();
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

    expect(fixture.readLegacy).toHaveBeenCalledOnce();
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

  it('resolves the default destination from the stable application identity', async () => {
    const getOrCreateApplicationDefaultRepo = vi.fn(async () => repo);
    const service = createFailureService({
      saveSource: vi.fn(async () => ({ repo, commit: {}, tree: {}, compile: {}, diagnostics: [] })),
      getOrCreateApplicationDefaultRepo,
      applicationName: 'sales-app',
    });

    await expect(
      service.moveSource(createMoveSourceInput({ destination: { type: 'default' } }), { adapterContext: {} }),
    ).resolves.toMatchObject({ repo: { id: repo.id }, entry: { id: entry.id } });
    expect(getOrCreateApplicationDefaultRepo).toHaveBeenCalledWith(
      'sales-app',
      expect.objectContaining({ adapterContext: {} }),
    );
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
  );
}

function createMoveOperationModel() {
  let values: Record<string, unknown> | undefined;
  const record = {
    get: (key: string) => values?.[key],
  } as Model;
  const model = {
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
    { createRepo } as never,
    { pull } as never,
    { getEntry, listEntries } as never,
    { prepareSaveSource, publishPreparedSave, compileCurrentRuntime } as never,
    { syncFlowModelReferencesForNodeTree } as never,
    () => ({ require: registryRequire }) as unknown as RunJSSourceAdapterRegistry,
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
