/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Transaction } from '@nocobase/database';
import type { RunJSSourceAdapterRegistry } from '@nocobase/plugin-vsc-file';
import { describe, expect, it, vi } from 'vitest';

import type { LightExtensionEntryRecord, LightExtensionRepoRecord } from '../../shared/types';
import { MoveSourceService, relocateRunJSWorkspace } from '../services/MoveSourceService';

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
    ['js-block', 'src/client/js-blocks'],
    ['js-field', 'src/client/js-fields'],
    ['js-action', 'src/client/js-actions'],
    ['js-item', 'src/client/js-items'],
  ] as const)('generates only a minimal entry.json descriptor for %s', (kind, root) => {
    const files = relocateRunJSWorkspace({
      kind,
      entryName: 'normalize-order',
      entryTitle: 'Normalize order',
      entryPath: 'src/main.ts',
      files: [
        { path: 'src/main.ts', content: 'return input;' },
        { path: 'src/entry.json', content: JSON.stringify({ settingsSchema: { type: 'object' }, unknown: true }) },
        { path: 'src/meta.json', content: '{"key":"legacy"}' },
        { path: 'src/settings.json', content: '{"type":"object"}' },
      ],
    });

    expect(files.map((file) => file.path).sort()).toEqual([
      `${root}/normalize-order/entry.json`,
      `${root}/normalize-order/index.ts`,
    ]);
    expect(JSON.parse(files.find((file) => file.path.endsWith('/entry.json'))?.content || '{}')).toEqual({
      schemaVersion: 1,
      key: 'normalize-order',
      title: 'Normalize order',
    });
  });

  it.each([
    ['JSBlockModel', 'js-block', 'src/client/js-blocks'],
    ['JSActionModel', 'js-action', 'src/client/js-actions'],
    ['JSFieldModel', 'js-field', 'src/client/js-fields'],
    ['JSColumnModel', 'js-field', 'src/client/js-fields'],
    ['JSItemModel', 'js-item', 'src/client/js-items'],
  ] as const)(
    'moves a %s source into an existing repository and writes the host binding in the same transaction',
    async (modelUse, kind, entryRoot) => {
      const transaction = { id: 'tx_move' } as unknown as Transaction;
      const writeExternalBinding = vi.fn(async () => ({ ownerFingerprint: 'owner_after' }));
      const movedEntry: LightExtensionEntryRecord = {
        ...entry,
        kind,
        entryPath: `${entryRoot}/sales-kpi/index.ts`,
        descriptorPath: `${entryRoot}/sales-kpi/entry.json`,
      };
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
      const saveSource = vi.fn(async () => ({ repo, commit: {}, tree: {}, compile: {}, diagnostics: [] }));
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
        { listEntries } as never,
        { saveSource } as never,
        { syncFlowModelReferencesForNodeTree: syncReferences } as never,
        () => ({ require: () => adapter }) as unknown as RunJSSourceAdapterRegistry,
      );

      const result = await service.moveSource(
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
          entryTitle: 'Sales KPI',
        },
        {
          actorUserId: '1',
          adapterContext: {},
        },
      );

      expect(saveSource).toHaveBeenCalledWith(
        expect.objectContaining({
          repoId: repo.id,
          expectedHeadCommitId: 'commit_2',
          files: expect.arrayContaining([expect.objectContaining({ path: `${entryRoot}/sales-kpi/index.ts` })]),
        }),
        expect.objectContaining({ transaction }),
      );
      const savedFiles = saveSource.mock.calls[0][0].files as Array<{ path: string; content: string }>;
      const descriptor = JSON.parse(
        savedFiles.find((file) => file.path === `${entryRoot}/sales-kpi/entry.json`)?.content || '{}',
      );
      if (kind === 'js-field') {
        expect(descriptor.category).toBe(modelUse === 'JSColumnModel' ? 'js-column' : 'js-field');
      } else {
        expect(descriptor).not.toHaveProperty('category');
      }
      expect(writeExternalBinding).toHaveBeenCalledWith(
        expect.objectContaining({
          baseOwnerFingerprint: 'owner_before',
          binding: expect.objectContaining({
            sourceMode: 'light-extension',
            sourceBinding: expect.objectContaining({ repoId: repo.id, entryId: movedEntry.id, kind }),
          }),
          ctx: expect.objectContaining({ transaction }),
        }),
      );
      expect(syncReferences).toHaveBeenCalledWith(
        expect.objectContaining({ rootUid: locator.modelUid }),
        expect.objectContaining({ transaction }),
      );
      expect(result.binding).toMatchObject({ repoId: repo.id, entryId: movedEntry.id, kind });
    },
  );

  it('creates a new repository with only base files and the moved entry', async () => {
    const createdRepo = { ...repo, id: 'ler_new', name: 'sales-tools', normalizedName: 'sales-tools' };
    const createdEntry = { ...entry, repoId: createdRepo.id };
    const createRepo = vi.fn(async () => createdRepo);
    const compileCurrentRuntime = vi.fn(async () => ({
      repo: createdRepo,
      status: 'success',
      entries: [],
      diagnostics: [],
    }));
    const service = new MoveSourceService(
      {
        sequelize: {
          transaction: (run: (transaction: Transaction) => Promise<unknown>) =>
            run({ id: 'tx_create' } as unknown as Transaction),
        },
      } as unknown as Database,
      { createRepo } as never,
      {} as never,
      { listEntries: vi.fn(async () => [createdEntry]) } as never,
      { compileCurrentRuntime } as never,
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
            writeExternalBinding: vi.fn(async () => ({ ownerFingerprint: 'owner_after' })),
            getFingerprint: vi.fn(async () => 'owner_after'),
          }),
        }) as unknown as RunJSSourceAdapterRegistry,
    );

    await service.moveSource(
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
        'src/client/js-blocks/sales-kpi/entry.json',
        'src/client/js-blocks/sales-kpi/index.tsx',
        'tsconfig.json',
      ].sort(),
    );
    expect(compileCurrentRuntime).toHaveBeenCalledWith(
      createdRepo.id,
      createdRepo.headCommitId,
      expect.objectContaining({ transaction: expect.anything() }),
    );
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
      { lockInternalRepoForUpdate: vi.fn() } as never,
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

  it('rejects action-style nested RunJS sources', async () => {
    const saveSource = vi.fn();
    const service = createFailureService({
      saveSource,
      surfaceStyle: 'action',
    });
    const nestedLocator = {
      kind: 'flowModel.nestedRunJS',
      modelUid: 'flow_action',
      containerFlowKey: 'eventFlow',
      containerStepKey: 'runJs',
      valuePath: ['code'],
      scene: 'eventFlow',
    } as const;

    await expect(
      service.moveSource(
        {
          locator: nestedLocator,
          expectedOwnerFingerprint: 'owner_before',
          sourceRepoId: 'runjs_repo',
          sourceHeadCommitId: null,
          entryPath: 'src/main.ts',
          version: 'v2',
          files: [{ path: 'src/main.ts', content: 'ctx.message.success("done");' }],
          destination: { type: 'existing', repoId: repo.id },
          entryName: 'action-script',
        },
        { adapterContext: {} },
      ),
    ).rejects.toMatchObject({ code: 'LIGHT_EXTENSION_INVALID_INPUT' });
    expect(saveSource).not.toHaveBeenCalled();
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

  it('keeps destination and host writes under one rejected transaction when binding fails', async () => {
    const transaction = { id: 'tx_rollback' } as unknown as Transaction;
    let committed = false;
    const saveSource = vi.fn(async () => ({ repo, commit: {}, tree: {}, compile: {}, diagnostics: [] }));
    const service = createFailureService({
      transaction,
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
  saveSource: ReturnType<typeof vi.fn>;
  writeExternalBinding?: ReturnType<typeof vi.fn>;
  assertCanWrite?: ReturnType<typeof vi.fn>;
  onTransactionSuccess?: () => void;
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
    } as unknown as Database,
    { lockInternalRepoForUpdate: vi.fn() } as never,
    {
      pull: vi.fn(async () => ({ repo, commit: null, tree: null, unchanged: false, files: [] })),
    } as never,
    { listEntries: vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([entry]) } as never,
    { saveSource: options.saveSource } as never,
    { syncFlowModelReferencesForNodeTree: vi.fn() } as never,
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
            metadata: { modelUse: 'JSBlockModel' },
          })),
          writeExternalBinding:
            options.writeExternalBinding || vi.fn(async () => ({ ownerFingerprint: 'owner_after' })),
          getFingerprint: vi.fn(async () => 'owner_after'),
        }),
      }) as unknown as RunJSSourceAdapterRegistry,
  );
}
