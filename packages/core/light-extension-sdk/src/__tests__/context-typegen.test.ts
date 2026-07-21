/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import ts from 'typescript';

import {
  createActiveEntryContextType,
  generateBindingContextTypes,
  generateClientSettingsTypes,
  LIGHT_EXTENSION_BINDING_CONTEXT_PATH,
  LIGHT_EXTENSION_COLLECTION_TYPES_PATH,
  type LightExtensionContextPackLike,
} from '../typegen';

describe('light extension binding context typegen', () => {
  it('generates deterministic ACL-filtered record and writable value types', () => {
    const pack = precisePack();
    const first = generateBindingContextTypes(pack);
    const second = generateBindingContextTypes({
      ...pack,
      collection: pack.collection ? { ...pack.collection, fields: [...pack.collection.fields].reverse() } : undefined,
    });

    expect(first.files.map((file) => file.path)).toEqual([
      LIGHT_EXTENSION_COLLECTION_TYPES_PATH,
      LIGHT_EXTENSION_BINDING_CONTEXT_PATH,
    ]);
    expect(first.files).toEqual(second.files);
    expect(first).toMatchObject({ contextHash: 'context_orders_1', contextMode: 'precise', precise: true });
    const collections = first.files.find((file) => file.path === LIGHT_EXTENSION_COLLECTION_TYPES_PATH)?.content || '';
    expect(collections).toContain('amount?: number;');
    expect(collections).toContain('status?: "draft" | "published";');
    expect(collections).toContain('title?: string | null;');
    expect(collections).toContain('customer?: Record<string, unknown> | null;');
    expect(collections).toContain('mystery?: unknown | null;');
    expect(collections).not.toContain('secret');
    const createValues = collections.slice(
      collections.indexOf('export interface CurrentCreateValues'),
      collections.indexOf('export interface CurrentUpdateValues'),
    );
    expect(createValues).toContain('amount?: number;');
    expect(createValues).toContain('title?: string | null;');
    expect(createValues).not.toContain('status');
    expect(createValues).not.toContain('mystery');
  });

  it('composes a precise active context and rejects unreadable or non-writable fields', () => {
    const settings = generateClientSettingsTypes({
      files: [
        {
          path: 'src/client/js-blocks/orders/entry.json',
          content: JSON.stringify({ key: 'orders', settings: { title: { type: 'string' } } }),
        },
      ],
    });
    const bindingTypes = generateBindingContextTypes(precisePack());
    const active = createActiveEntryContextType({
      activePath: 'src/client/js-blocks/orders/index.tsx',
      bindingTypes,
      entries: settings.entries,
    });
    if (!active.file) throw new Error('Expected an active context declaration');

    expect(active.file.content).toContain('LightExtensionBindingContext<Settings>');
    expect(active.file.content).toContain('TKey extends keyof LightExtensionCurrentEntryContext ? never : TKey');
    const diagnostics = getTypeScriptDiagnostics([
      ...settings.files,
      ...bindingTypes.files,
      active.file,
      runJSContextDeclaration(),
      {
        path: 'src/client/js-blocks/orders/index.tsx',
        content: [
          'ctx.record?.title;',
          'ctx.record?.secret;',
          'ctx.values?.amount;',
          'ctx.values?.status;',
          'ctx.settings.title;',
        ].join('\n'),
      },
    ]);
    expect(diagnostics.some((message) => /secret/u.test(message))).toBe(true);
    expect(diagnostics.some((message) => /status/u.test(message))).toBe(true);
    expect(diagnostics.some((message) => /amount|title/u.test(message))).toBe(false);
  });

  it.each([
    ['generic', 'binding_not_selected'],
    ['multiple', 'multiple_bindings'],
  ] as const)('falls back to unknown data for %s context packs', (contextMode, reason) => {
    const result = generateBindingContextTypes({
      ...precisePack(),
      binding: undefined,
      collection: undefined,
      contextMode,
      contextHash: `hash_${contextMode}`,
      reason,
    });
    const collections = result.files.find((file) => file.path === LIGHT_EXTENSION_COLLECTION_TYPES_PATH)?.content;

    expect(result).toMatchObject({ contextMode, precise: false, reason });
    expect(collections).toContain('export type CurrentRecord = unknown;');
    expect(collections).not.toContain('title');
    expect(JSON.stringify(result.files)).not.toContain('orders');
  });

  it('uses the page context contract for JS Page bindings without inventing collection types', () => {
    const result = generateBindingContextTypes({
      ...precisePack(),
      entry: { ...precisePack().entry, kind: 'js-page' },
      collection: undefined,
      reason: 'precise_binding_no_collection',
    });
    const context = result.files.find((file) => file.path === LIGHT_EXTENSION_BINDING_CONTEXT_PATH)?.content;

    expect(result.precise).toBe(true);
    expect(context).toContain('JSPageContext<TSettings, unknown, unknown, unknown, unknown, unknown>');
  });
});

function precisePack(): LightExtensionContextPackLike {
  return {
    contextPackVersion: 'light-extension.context-pack.v1',
    contextMode: 'precise',
    reason: 'precise_binding',
    repoId: 'repo_sales',
    entry: {
      id: 'entry_orders',
      kind: 'js-block',
      entryName: 'orders',
      entryPath: 'src/client/js-blocks/orders/index.tsx',
      settingsSchema: null,
    },
    references: [],
    binding: {
      referenceId: 'reference_orders',
      ownerLocatorHash: 'owner_hash',
      owner: {
        ownerKind: 'flowModel.step',
        modelUid: 'orders_block',
        modelUse: 'JSBlockModel',
        surface: 'js-model.render',
        dataSourceKey: 'main',
        collectionName: 'orders',
      },
    },
    collection: {
      dataSourceKey: 'main',
      name: 'orders',
      fields: [
        field('secret', { readable: false, writable: false, type: 'string' }),
        field('status', { enum: ['published', 'draft'], nullable: false, writable: false }),
        field('title', { type: 'string', writable: true }),
        field('mystery', { interface: 'custom', writable: false }),
        field('customer', { associationTarget: 'customers', type: 'belongsTo', writable: false }),
        field('amount', { nullable: false, type: 'double', writable: true }),
      ],
    },
    supportedImports: [],
    versions: { sdk: '2.2.0-beta.15', validator: '1' },
    contextHash: 'context_orders_1',
  };
}

function field(
  name: string,
  overrides: Partial<LightExtensionContextPackLike['collection']['fields'][number]> = {},
): LightExtensionContextPackLike['collection']['fields'][number] {
  return {
    name,
    nullable: true,
    readable: true,
    writable: false,
    ...overrides,
  };
}

function runJSContextDeclaration() {
  return {
    path: '__runjs__/context.d.ts',
    content: [
      'interface RunJSRecord { [key: string]: unknown; id?: string | number; }',
      'interface RunJSContext { logger: unknown; record?: RunJSRecord; values?: Record<string, unknown>; settings: Record<string, unknown>; }',
      'declare const ctx: LightExtensionActiveEntryContext;',
      '',
    ].join('\n'),
  };
}

function getTypeScriptDiagnostics(files: Array<{ path: string; content: string }>): string[] {
  const fileMap = new Map(files.map((file) => [`/${file.path}`, file.content]));
  const options: ts.CompilerOptions = {
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    noEmit: true,
    noLib: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2020,
    types: [],
  };
  const service = ts.createLanguageService({
    directoryExists: (directoryName) =>
      Array.from(fileMap.keys()).some((path) => path.startsWith(`${directoryName.replace(/\/$/u, '')}/`)),
    fileExists: (fileName) => fileMap.has(fileName),
    getCompilationSettings: () => options,
    getCurrentDirectory: () => '/',
    getDefaultLibFileName: () => 'lib.d.ts',
    getDirectories: () => [],
    getScriptFileNames: () => Array.from(fileMap.keys()),
    getScriptSnapshot(fileName) {
      const content = fileMap.get(fileName);
      return typeof content === 'string' ? ts.ScriptSnapshot.fromString(content) : undefined;
    },
    getScriptVersion: () => '1',
    readFile: (fileName) => fileMap.get(fileName),
  });
  return Array.from(fileMap.keys()).flatMap((fileName) =>
    service
      .getSemanticDiagnostics(fileName)
      .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')),
  );
}
