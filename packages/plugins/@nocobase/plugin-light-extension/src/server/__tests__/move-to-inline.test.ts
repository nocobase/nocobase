/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { Database, Transaction } from '@nocobase/database';
import {
  buildRunJSFilesHash,
  type RunJSSourceAdapterRegistry,
  type VscFileChange,
  type VscFileService,
} from '../vsc-file';
import { createHash } from 'crypto';
import { describe, expect, it, vi } from 'vitest';

import type { LightExtensionEntryRecord } from '../../shared/types';
import { createLightExtensionsResource } from '../resources/lightExtensions';
import type { LightExtensionCompilePreviewService } from '../services/LightExtensionCompilePreviewService';
import {
  collectAndRelocateInlineFiles,
  isMoveToInlineHostSupported,
  MoveToInlineService,
} from '../services/MoveToInlineService';

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

  it('copies the entry descriptor together with runtime-reachable entry and shared modules', () => {
    const canonicalDescriptorContent = `${JSON.stringify(
      {
        schemaVersion: 1,
        key: 'sales',
        title: 'Sales',
        settings: {
          showCard: { type: 'boolean', default: false },
        },
      },
      null,
      2,
    )}\n`;
    const descriptorContent = `\ufeff${canonicalDescriptorContent.replace(/\n/gu, '\r\n')}`;
    const files = collectAndRelocateInlineFiles({
      entryPath: entry.entryPath,
      files: [
        {
          path: entry.entryPath,
          content: [
            "import './local';",
            "import type { TypeOnly } from '../../../shared/type-only';",
            "export type { ExportTypeOnly } from '../../../shared/export-type-only';",
            "export { reexported } from '../../../shared/reexported';",
            'ctx.render(<div />);',
          ].join('\n'),
        },
        {
          path: entry.descriptorPath,
          content: descriptorContent,
          language: 'json',
        },
        {
          path: 'src/client/js-blocks/sales/local.ts',
          content: "import { used } from '../../../shared/used';\nvoid used;\n",
        },
        {
          path: 'src/shared/used.ts',
          content: "import './transitive';\nexport const used = true;\n",
        },
        { path: 'src/shared/transitive.ts', content: 'export const transitive = true;\n' },
        { path: 'src/shared/reexported.ts', content: 'export const reexported = true;\n' },
        { path: 'src/shared/type-only.ts', content: 'export type TypeOnly = string;\n' },
        { path: 'src/shared/export-type-only.ts', content: 'export type ExportTypeOnly = string;\n' },
        { path: 'src/shared/unused.ts', content: 'export const unused = true;\n' },
        { path: 'src/client/js-blocks/other/index.tsx', content: 'ctx.render(<div>Other</div>);\n' },
      ],
    });

    expect(files.map((file) => file.path)).toEqual([
      'src/client/entry.json',
      'src/client/index.tsx',
      'src/client/local.ts',
      'src/shared/export-type-only.ts',
      'src/shared/reexported.ts',
      'src/shared/transitive.ts',
      'src/shared/type-only.ts',
      'src/shared/used.ts',
    ]);
    expect(files.find((file) => file.path === 'src/client/entry.json')).toEqual({
      path: 'src/client/entry.json',
      content: descriptorContent,
      language: 'json',
    });
    expect(files.find((file) => file.path === 'src/client/index.tsx')?.content).toContain(
      "export { reexported } from '../shared/reexported'",
    );
    expect(files.find((file) => file.path === 'src/client/index.tsx')?.content).toContain(
      "import type { TypeOnly } from '../shared/type-only'",
    );
    expect(files.find((file) => file.path === 'src/client/index.tsx')?.content).toContain(
      "export type { ExportTypeOnly } from '../shared/export-type-only'",
    );
    expect(files.some((file) => file.path.endsWith('/unused.ts'))).toBe(false);
    expect(files.some((file) => file.path.includes('/other/'))).toBe(false);
  });

  it('rewrites JS Page SDK and settings types without touching other kind imports or source text', () => {
    const pageEntryPath = 'src/client/js-pages/orders/index.tsx';
    const files = collectAndRelocateInlineFiles({
      entryPath: pageEntryPath,
      kind: 'js-page',
      files: [
        {
          path: pageEntryPath,
          content:
            'import { type JSPageContext, defineSettings } from "@nocobase/light-extension-sdk/client";\n' +
            'import type * as SDK from "@nocobase/light-extension-sdk/shared";\n' +
            'import type { Settings } from "light-extension:settings/client/js-page/orders";\n' +
            'import type { Settings as BlockSettings } from "light-extension:settings/client/js-block/sales";\n' +
            'type ImportedSettings = import("light-extension:settings/client/js-page/orders").Settings;\n' +
            'type ImportedContext = import("@nocobase/light-extension-sdk/client").JSPageContext<ImportedSettings>;\n' +
            'const untouched = "light-extension:settings/client/js-page/orders";\n' +
            '// light-extension:settings/client/js-page/orders\n' +
            'const settings = defineSettings({ enabled: true });\n' +
            'export default function render(context: JSPageContext<Settings>, shared: SDK.JSPageContext<ImportedSettings>, imported: ImportedContext, block: BlockSettings) { ctx.render([context.page, shared.page, imported.page, block, untouched]); }\n',
        },
      ],
    });

    const code = files[0]?.content || '';
    expect(code).toContain('function defineSettings(value) { return value; }');
    expect(code).not.toContain('import { defineSettings }');
    expect(code).not.toContain('@nocobase/light-extension-sdk/');
    expect(code).toContain('light-extension:settings/client/js-block/sales');
    expect(code.match(/light-extension:settings\/client\/js-page\/orders/gu)).toHaveLength(2);
    expect(code).toContain('type JSPageContext<TSettings = Record<string, unknown>>');
    expect(code).toContain('type Settings = Record<string, unknown>;');
    expect(code).toContain('declare namespace SDK');
    expect(code).toContain('export type JSPageContext<TSettings = Record<string, unknown>>');
    expect(code).toContain('type ImportedSettings = Record<string, unknown>;');
    expect(code).toContain('type ImportedContext = (typeof ctx & { settings: ImportedSettings });');
  });

  it('reserves the RunJS manifest file slot before opening a database transaction', async () => {
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
        },
        { adapterContext: {} },
      ),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_SOURCE_ERROR',
      details: expect.objectContaining({ sourceCode: 'REPO_LIMIT_EXCEEDED' }),
    });
    expect(transaction).not.toHaveBeenCalled();
  });

  it('allows a 200-file workspace when the relocated dependency closure fits with the manifest', async () => {
    const enteredTransaction = new Error('entered transaction');
    const transaction = vi.fn(async () => {
      throw enteredTransaction;
    });
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
          files: [
            { path: entry.entryPath, content: 'ctx.render(<div />);' },
            ...Array.from({ length: 199 }, (_, index) => ({
              path: `src/shared/unused-${index + 1}.ts`,
              content: 'export const unused = true;\n',
            })),
          ],
        },
        { adapterContext: {} },
      ),
    ).rejects.toBe(enteredTransaction);
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it('moves a JS Page inline with its snapshot and settings while removing the active reference', async () => {
    const transaction = { LOCK: { UPDATE: 'UPDATE' } } as unknown as Transaction;
    const pageLocator = { ...locator, modelUid: 'fm_js_page' };
    const pageBinding = {
      ...binding,
      repoId: 'ler_pages',
      entryId: 'lee_page',
      kind: 'js-page' as const,
    };
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
      retryCount: 0,
      label: '',
      nested: {
        visibleValue: 'kept',
        hiddenBranch: {
          enabled: false,
          threshold: 0,
          note: '',
        },
      },
      items: [{ key: 'first', active: false }],
    };
    const canonicalDescriptorContent = `${JSON.stringify(
      {
        schemaVersion: 1,
        key: 'sales',
        title: 'Sales',
        settings: {
          enabled: { type: 'boolean', default: true },
          retryCount: { type: 'integer', default: 1 },
          label: { type: 'string', default: 'Sales' },
        },
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
      getCollection: (name: string) => {
        if (name !== 'flowModels') {
          throw new Error(`Unexpected collection: ${name}`);
        }
        return {
          model: {
            findByPk: lockFlowModelRecord,
          },
          repository: {
            findModelById: vi.fn(async () => JSON.parse(JSON.stringify(flowModel))),
            patch,
          },
        };
      },
      getRepository: (name: string) => {
        if (name !== 'vscFileCommits') {
          throw new Error(`Unexpected repository: ${name}`);
        }
        return { update: updateCommit };
      },
    } as unknown as Database;
    const compileEntry = vi.fn(async (input: { files: Array<{ path: string; content?: string }> }) => ({
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
    let ensuredRepository = runJSRepo;
    const ensureRepository = vi.fn(async (input: { ownerId: string }) => {
      ensuredRepository = { ...runJSRepo, ownerId: input.ownerId };
      return {
        repository: ensuredRepository,
        initialCommit: null,
      };
    });
    const getRepositoryForUpdate = vi.fn(async () => ensuredRepository);
    const push = vi.fn(async () => ({
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
      getRepositoryForUpdate,
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
      push,
    } as unknown as VscFileService;
    const service = new MoveToInlineService(
      db,
      { getEntry: vi.fn(async () => pageEntry) } as never,
      { compileEntry } as never,
      { syncFlowModelReferencesForNodeTree: syncReferences } as never,
      () => vscFileService,
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
      expect.objectContaining({ transaction }),
    );
    expect(JSON.stringify(compileEntry.mock.calls)).not.toContain('src/shared/unused.ts');
    expect(push).toHaveBeenCalledWith(
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
      expect.objectContaining({ transaction }),
    );
    const pushedFiles = push.mock.calls[0][0].files as VscFileChange[];
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
        transaction,
      }),
    );
    expect(getRepositoryForUpdate.mock.invocationCallOrder[0]).toBeLessThan(
      lockFlowModelRecord.mock.invocationCallOrder[0],
    );
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
            entryPath: entry.entryPath,
            kind: 'js-block',
            version: 'v2',
            files: [{ path: entry.entryPath, content: 'ctx.render(<div />);' }],
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
        entryPath: entry.entryPath,
        kind: 'js-block',
        version: 'v2',
        files: [
          {
            path: entry.entryPath,
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
});
