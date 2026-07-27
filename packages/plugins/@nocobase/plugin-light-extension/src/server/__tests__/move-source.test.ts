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
import { MockServer, createMockServer } from '@nocobase/test';
import { describe, expect, it, vi } from 'vitest';

import type {
  LightExtensionEntryRecord,
  LightExtensionMoveSourceInput,
  LightExtensionRepoRecord,
} from '../../shared/types';
import { LightExtensionError } from '../../shared/errors';
import PluginLightExtensionServer from '../plugin';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LightExtensionEntryService } from '../services/LightExtensionEntryService';
import { LightExtensionFileService } from '../services/LightExtensionFileService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import {
  MoveSourceService,
  PersistentMoveSourceSnapshotValidator,
  relocateRunJSWorkspace,
} from '../services/MoveSourceService';
import { buildApplicationDefaultLightExtensionIdentity } from '../services/LightExtensionRepoService';
import { LightExtensionRepoService } from '../services/LightExtensionRepoService';
import { LightExtensionRuntimeCompileService } from '../services/LightExtensionRuntimeCompileService';
import { LightExtensionValidator } from '../services/LightExtensionValidator';
import { LightExtensionWorkspaceCompilerBridge } from '../services/LightExtensionWorkspaceCompilerBridge';
import { buildRunJSSourceRepositoryIdentity } from '../vsc-file/public-api';

import './move-source-to-inline.cases';

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
          transaction: (run: (transaction: Transaction) => Promise<unknown>) =>
            run({ id: 'tx_create' } as unknown as Transaction),
        },
      } as unknown as Database,
      { createRepo, assertApplicationOwnership: vi.fn() } as never,
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

  it('authorizes before reserving an operation or resolving the default repo', async () => {
    const operationModel = createMoveOperationModel();
    const getRepo = vi.fn();
    const service = createFailureService({
      saveSource: vi.fn(),
      operationModel,
      getRepo,
      assertCanWrite: vi.fn(async () => {
        throw new Error('permission denied');
      }),
    });

    await expect(
      service.moveSource(
        createMoveSourceInput({
          destination: { type: 'default' },
          idempotencyKey: 'move-default-sales-kpi',
        }),
        { adapterContext: {} },
      ),
    ).rejects.toThrow('permission denied');

    expect(operationModel.model.findOne).toHaveBeenCalledOnce();
    expect(operationModel.model.findOrCreate).not.toHaveBeenCalled();
    expect(getRepo).not.toHaveBeenCalled();
  });

  it('validates the source snapshot before reserving an operation or resolving the default repo', async () => {
    const operationModel = createMoveOperationModel();
    const getRepo = vi.fn();
    const sourceSnapshotValidator = {
      assertCurrent: vi.fn(async () => {
        throw new LightExtensionError('LIGHT_EXTENSION_SOURCE_OUTDATED', 'source changed');
      }),
    };
    const service = createFailureService({
      saveSource: vi.fn(),
      operationModel,
      getRepo,
      sourceSnapshotValidator,
    });

    await expect(
      service.moveSource(
        createMoveSourceInput({
          destination: { type: 'default' },
          idempotencyKey: 'move-stale-default-sales-kpi',
        }),
        { adapterContext: {} },
      ),
    ).rejects.toMatchObject({ code: 'LIGHT_EXTENSION_SOURCE_OUTDATED' });

    expect(sourceSnapshotValidator.assertCurrent).toHaveBeenCalledOnce();
    expect(operationModel.model.findOrCreate).not.toHaveBeenCalled();
    expect(getRepo).not.toHaveBeenCalled();
  });

  it('reuses the stable application default repo through the existing publish path', async () => {
    const identity = buildApplicationDefaultLightExtensionIdentity('sales-app');
    const defaultRepo = { ...repo, id: identity.repoId, name: identity.name, normalizedName: identity.name };
    const defaultEntry = { ...entry, repoId: identity.repoId };
    const getRepo = vi.fn(async () => defaultRepo);
    const saveSource = vi.fn(async () => ({ repo: defaultRepo, commit: {}, tree: {}, compile: {}, diagnostics: [] }));
    const service = createFailureService({
      destinationRepo: defaultRepo,
      movedEntry: defaultEntry,
      saveSource,
      getRepo,
      applicationName: 'sales-app',
    });

    await expect(
      service.moveSource(createMoveSourceInput({ destination: { type: 'default' } }), { adapterContext: {} }),
    ).resolves.toMatchObject({
      repo: { id: identity.repoId },
      entry: { id: defaultEntry.id, repoId: identity.repoId },
    });

    expect(getRepo).toHaveBeenCalledWith(identity.repoId, expect.objectContaining({ adapterContext: {} }));
    expect(saveSource).toHaveBeenCalledOnce();
  });

  it('atomically creates the first application default repo and replays its persisted result', async () => {
    const identity = buildApplicationDefaultLightExtensionIdentity('sales-app');
    const transaction = { id: 'tx_default_create' } as unknown as Transaction;
    const operationModel = createMoveOperationModel();
    const defaultRepo = {
      ...repo,
      id: identity.repoId,
      name: identity.name,
      normalizedName: identity.name,
      title: identity.title,
    };
    const defaultEntry = { ...entry, repoId: identity.repoId };
    const createRepo = vi.fn(async () => defaultRepo);
    const prepared = {};
    const prepareInitialWorkspace = vi.fn(async () => prepared);
    const publishPreparedInitialWorkspace = vi.fn(async () => ({
      repo: defaultRepo,
      status: 'success',
      entries: [defaultEntry],
      diagnostics: [],
    }));
    const writeExternalBinding = vi.fn(async () => ({ ownerFingerprint: 'owner_after' }));
    const syncReferences = vi.fn(async () => undefined);
    const service = new MoveSourceService(
      {
        sequelize: {
          transaction: (run: (transaction: Transaction) => Promise<unknown>) => run(transaction),
        },
        getRepository: (name: string) => {
          if (name !== 'lightExtensionMoveOperations') {
            throw new Error(`Unexpected repository: ${name}`);
          }
          return { model: operationModel.model };
        },
      } as unknown as Database,
      {
        getRepo: vi.fn(async () => {
          throw new LightExtensionError('LIGHT_EXTENSION_REPO_NOT_FOUND', 'not found');
        }),
        createRepo,
      } as never,
      {} as never,
      { listEntries: vi.fn(async () => [defaultEntry]) } as never,
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
              label: 'JS block',
              surfaceStyle: 'render',
              language: 'typescript',
              ownerFingerprint: 'owner_before',
              metadata: { modelUse: 'JSBlockModel' },
            })),
            writeExternalBinding,
            getFingerprint: vi.fn(async () => 'owner_after'),
          }),
        }) as unknown as RunJSSourceAdapterRegistry,
      'sales-app',
      { assertCurrent: vi.fn() },
    );

    const input = createMoveSourceInput({
      destination: { type: 'default' },
      idempotencyKey: 'move-first-default-sales-kpi',
    });
    const first = await service.moveSource(input, { adapterContext: {} });
    const replay = await service.moveSource(input, { adapterContext: {} });

    expect(first).toMatchObject({ repo: { id: identity.repoId }, entry: { repoId: identity.repoId } });
    expect(replay).toEqual(first);

    expect(prepareInitialWorkspace).toHaveBeenCalledWith(
      expect.objectContaining({ repoId: identity.repoId }),
      expect.not.objectContaining({ transaction: expect.anything() }),
    );
    expect(createRepo).toHaveBeenCalledWith(
      expect.objectContaining({ name: identity.name, title: identity.title }),
      expect.objectContaining({ transaction }),
      { repoId: identity.repoId },
    );
    expect(publishPreparedInitialWorkspace).toHaveBeenCalledWith(
      prepared,
      defaultRepo.headCommitId,
      expect.objectContaining({ transaction }),
    );
    expect(writeExternalBinding).toHaveBeenCalledWith(
      expect.objectContaining({ ctx: expect.objectContaining({ transaction }) }),
    );
    expect(syncReferences).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ transaction }));
    expect(createRepo).toHaveBeenCalledOnce();
    expect(prepareInitialWorkspace).toHaveBeenCalledOnce();
    expect(writeExternalBinding).toHaveBeenCalledOnce();
    expect(syncReferences).toHaveBeenCalledOnce();
    expect(operationModel.getValues()).toMatchObject({ status: 'completed', result: first });
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

describe('MoveSourceService default repository sqlite integration', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({ plugins: [PluginLightExtensionServer] });
    const hosts = app.db.collection({
      name: 'moveSourceTestHosts',
      autoGenId: false,
      timestamps: false,
      fields: [
        { type: 'string', name: 'id', primaryKey: true },
        { type: 'string', name: 'ownerFingerprint', allowNull: false },
        { type: 'json', name: 'binding' },
      ],
    });
    await hosts.sync();
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('rolls back the first default repo, source, artifact, entry, host, reference, and completed operation', async () => {
    const identity = buildApplicationDefaultLightExtensionIdentity('main');
    const fixture = createSqliteMoveSourceFixture(app);
    await createMoveSourceTestHost(app, 'host_rollback');
    const baseline = await readMovePersistenceCounts(app);
    const forcedRollback = new Error('forced transaction rollback after move publication');
    const transaction = app.db.sequelize.transaction.bind(app.db.sequelize);
    let observedPublishedState = false;

    vi.spyOn(app.db.sequelize, 'transaction').mockImplementation(((...args: unknown[]) => {
      const run = args.at(-1);
      if (typeof run !== 'function') {
        return Reflect.apply(transaction, undefined, args);
      }
      const transactionArgs = args.slice(0, -1);
      return Reflect.apply(transaction, undefined, [
        ...transactionArgs,
        async (currentTransaction: Transaction) => {
          const result = await run(currentTransaction);
          const operation = await app.db.getRepository('lightExtensionMoveOperations').findOne({
            filter: { idempotencyKey: 'rollback-first-default', status: 'completed' },
            transaction: currentTransaction,
          });
          if (!operation) {
            return result;
          }
          const persisted = await readMovePersistenceCounts(app, currentTransaction);
          const host = await app.db.getRepository('moveSourceTestHosts').findOne({
            filterByTk: 'host_rollback',
            transaction: currentTransaction,
          });

          expect(persisted.repos).toBe(baseline.repos + 1);
          expect(persisted.vscRepos).toBe(baseline.vscRepos + 1);
          expect(persisted.commits).toBeGreaterThan(baseline.commits);
          expect(persisted.entries).toBe(baseline.entries + 1);
          expect(persisted.artifacts).toBe(baseline.artifacts + 1);
          expect(persisted.references).toBe(baseline.references + 1);
          expect(host?.get('binding')).toMatchObject({ repoId: identity.repoId, entryId: expect.any(String) });
          expect(operation?.get('status')).toBe('completed');
          expect(operation?.get('result')).toBeTruthy();
          observedPublishedState = true;
          throw forcedRollback;
        },
      ]);
    }) as never);

    await expect(
      fixture.service.moveSource(createDefaultMoveInput('host_rollback', 'rollback-entry', 'rollback-first-default'), {
        adapterContext: {},
      }),
    ).rejects.toThrow(forcedRollback.message);

    expect(observedPublishedState).toBe(true);
    await expect(readMovePersistenceCounts(app)).resolves.toEqual(baseline);
    const host = await app.db.getRepository('moveSourceTestHosts').findOne({ filterByTk: 'host_rollback' });
    expect(host?.get('ownerFingerprint')).toBe('owner_before');
    expect(host?.get('binding')).toBeNull();
    await expect(app.db.getRepository('lightExtensionRepos').count({ filter: { id: identity.repoId } })).resolves.toBe(
      0,
    );
    const operation = await app.db.getRepository('lightExtensionMoveOperations').findOne({
      filter: { idempotencyKey: 'rollback-first-default' },
    });
    expect(operation?.get('status')).toBe('failed');
    expect(operation?.get('result')).toBeNull();
  });

  it('creates at most one stable default repo under two concurrent first moves', async () => {
    const identity = buildApplicationDefaultLightExtensionIdentity('main');
    const fixture = createSqliteMoveSourceFixture(app);
    await Promise.all([
      createMoveSourceTestHost(app, 'host_concurrent_a'),
      createMoveSourceTestHost(app, 'host_concurrent_b'),
    ]);

    const settled = await Promise.allSettled([
      fixture.service.moveSource(createDefaultMoveInput('host_concurrent_a', 'entry-a'), { adapterContext: {} }),
      fixture.service.moveSource(createDefaultMoveInput('host_concurrent_b', 'entry-b'), { adapterContext: {} }),
    ]);
    const successes = settled.filter(
      (result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof fixture.service.moveSource>>> =>
        result.status === 'fulfilled',
    );
    const failures = settled.filter((result): result is PromiseRejectedResult => result.status === 'rejected');

    expect(successes.length).toBeGreaterThanOrEqual(1);
    expect(failures.every(({ reason }) => isRetryableDefaultMoveConflict(reason))).toBe(true);
    expect(successes.every(({ value }) => value.repo.id === identity.repoId)).toBe(true);
    await expect(
      app.db.getRepository('lightExtensionRepos').count({ filter: { id: identity.repoId, applicationName: 'main' } }),
    ).resolves.toBe(1);
    await expect(
      app.db.getRepository('vscFileRepositories').count({
        filter: { ownerType: 'light-extension', ownerId: identity.repoId, name: 'source' },
      }),
    ).resolves.toBe(1);
    await expect(app.db.getRepository('lightExtensionRepos').count()).resolves.toBe(1);
  });
});

function createSqliteMoveSourceFixture(app: MockServer) {
  const auditService = new LightExtensionAuditService(app.db);
  const permissionService = new LightExtensionPermissionService(auditService);
  const validator = new LightExtensionValidator();
  const repoService = new LightExtensionRepoService(
    app.db,
    auditService,
    permissionService,
    undefined,
    validator,
    'main',
  );
  const fileService = new LightExtensionFileService(
    app.db,
    auditService,
    permissionService,
    repoService,
    undefined,
    validator,
  );
  const entryService = new LightExtensionEntryService(app.db, fileService, repoService, validator);
  const compilerBridge = new LightExtensionWorkspaceCompilerBridge(auditService, permissionService);
  const runtimeCompileService = new LightExtensionRuntimeCompileService(
    app.db,
    fileService,
    entryService,
    compilerBridge,
    { validator },
  );
  const referenceService = {
    syncFlowModelReferencesForNodeTree: vi.fn(
      async (input: { rootUid: string }, ctx: { transaction?: Transaction }) => {
        const host = await app.db.getRepository('moveSourceTestHosts').findOne({
          filterByTk: input.rootUid,
          transaction: ctx.transaction,
        });
        const binding = host?.get('binding');
        if (!isTestSourceBinding(binding)) {
          throw new Error('Host binding was not persisted before reference synchronization');
        }
        await app.db.getRepository('lightExtensionReferences').create({
          values: {
            repoId: binding.repoId,
            entryId: binding.entryId,
            kind: binding.kind,
            ownerKind: 'flowModel.step',
            ownerLocator: { kind: 'flowModel.step', modelUid: input.rootUid },
            ownerLocatorHash: `owner_${input.rootUid}`,
            resolvedStatus: 'active',
          },
          transaction: ctx.transaction,
        });
      },
    ),
  };
  const adapter = {
    kind: 'flowModel.step',
    assertCanWrite: vi.fn(),
    readLegacy: async (input: { locator: { modelUid: string }; ctx: { transaction?: Transaction } }) => {
      const host = await app.db.getRepository('moveSourceTestHosts').findOne({
        filterByTk: input.locator.modelUid,
        transaction: input.ctx.transaction,
      });
      return {
        code: 'ctx.render(<div>Inline</div>);',
        version: 'v2',
        surfaceStyle: 'render' as const,
        language: 'typescript',
        ownerFingerprint: String(host?.get('ownerFingerprint')),
        metadata: { modelUse: 'JSBlockModel' },
      };
    },
    writeExternalBinding: async (input: {
      locator: { modelUid: string };
      binding: { sourceBinding: unknown };
      baseOwnerFingerprint: string;
      ctx: { transaction?: Transaction };
    }) => {
      const host = await app.db.getRepository('moveSourceTestHosts').findOne({
        filterByTk: input.locator.modelUid,
        transaction: input.ctx.transaction,
      });
      expect(host?.get('ownerFingerprint')).toBe(input.baseOwnerFingerprint);
      await app.db.getRepository('moveSourceTestHosts').update({
        filterByTk: input.locator.modelUid,
        values: { binding: input.binding.sourceBinding, ownerFingerprint: 'owner_after' },
        transaction: input.ctx.transaction,
      });
      return { ownerFingerprint: 'owner_after' };
    },
    getFingerprint: async (input: { locator: { modelUid: string }; ctx: { transaction?: Transaction } }) => {
      const host = await app.db.getRepository('moveSourceTestHosts').findOne({
        filterByTk: input.locator.modelUid,
        transaction: input.ctx.transaction,
      });
      return String(host?.get('ownerFingerprint'));
    },
  };
  const service = new MoveSourceService(
    app.db,
    repoService,
    fileService,
    entryService,
    runtimeCompileService,
    referenceService as never,
    () => ({ require: () => adapter }) as unknown as RunJSSourceAdapterRegistry,
    'main',
    { assertCurrent: vi.fn() },
  );

  return { service, referenceService };
}

async function createMoveSourceTestHost(app: MockServer, id: string): Promise<void> {
  await app.db.getRepository('moveSourceTestHosts').create({
    values: { id, ownerFingerprint: 'owner_before', binding: null },
  });
}

function createDefaultMoveInput(
  hostId: string,
  entryName: string,
  idempotencyKey?: string,
): LightExtensionMoveSourceInput {
  return {
    idempotencyKey,
    locator: {
      ...locator,
      modelUid: hostId,
    },
    expectedOwnerFingerprint: 'owner_before',
    sourceRepoId: `runjs_${hostId}`,
    sourceHeadCommitId: null,
    entryPath: 'src/main.tsx',
    version: 'v2',
    files: [{ path: 'src/main.tsx', content: `ctx.render(<div>${entryName}</div>);\n` }],
    destination: { type: 'default' },
    entryName,
  };
}

async function readMovePersistenceCounts(app: MockServer, transaction?: Transaction) {
  const options = transaction ? { transaction } : undefined;
  const [repos, vscRepos, commits, entries, artifacts, references] = await Promise.all([
    app.db.getRepository('lightExtensionRepos').count(options),
    app.db.getRepository('vscFileRepositories').count(options),
    app.db.getRepository('vscFileCommits').count(options),
    app.db.getRepository('lightExtensionEntries').count(options),
    app.db.getRepository('lightExtensionRuntimeArtifacts').count(options),
    app.db.getRepository('lightExtensionReferences').count(options),
  ]);
  return { repos, vscRepos, commits, entries, artifacts, references };
}

function isTestSourceBinding(value: unknown): value is { repoId: string; entryId: string; kind: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const binding = value as Record<string, unknown>;
  return typeof binding.repoId === 'string' && typeof binding.entryId === 'string' && typeof binding.kind === 'string';
}

function isRetryableDefaultMoveConflict(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const code = (error as { code?: unknown }).code;
  return code === 'LIGHT_EXTENSION_SOURCE_OUTDATED' || code === 'LIGHT_EXTENSION_ENTRY_CONFLICT';
}

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
  getRepo?: ReturnType<typeof vi.fn>;
  applicationName?: string;
  onTransactionSuccess?: () => void;
  operationModel?: ReturnType<typeof createMoveOperationModel>;
  listEntries?: ReturnType<typeof vi.fn>;
  sourceSnapshotValidator?: { assertCurrent: ReturnType<typeof vi.fn> };
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
      getRepo: options.getRepo || vi.fn(async () => options.destinationRepo || repo),
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
    options.sourceSnapshotValidator || { assertCurrent: vi.fn() },
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
    { createRepo, assertApplicationOwnership: vi.fn() } as never,
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
