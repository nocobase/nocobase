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
  generateClientSettingsTypes,
  LIGHT_EXTENSION_ACTIVE_ENTRY_CONTEXT_PATH,
} from '../typegen';

describe('light extension settings typegen', () => {
  it('generates nested object, array, enum and required types only from entry.json', () => {
    const result = generateClientSettingsTypes({
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/entry.json',
          content: JSON.stringify({
            schemaVersion: 1,
            key: 'sales-kpi',
            settingsSchema: {
              type: 'object',
              required: ['mode'],
              properties: {
                mode: { type: 'integer', enum: [1, 2] },
                title: { type: 'string', default: 'Sales' },
                display: {
                  type: 'object',
                  properties: {
                    showTotal: { type: 'boolean' },
                    tags: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          }),
        },
        { path: 'src/client/js-blocks/ignored/settings.json', content: '{"type":"object"}' },
        { path: 'src/client/js-blocks/ignored/meta.json', content: '{"key":"ignored"}' },
      ],
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.entries).toHaveLength(1);
    const content = result.files.find((file) => file.path.endsWith('/sales-kpi.d.ts'))?.content || '';
    expect(content).toContain('mode: 1 | 2;');
    expect(content).toContain('title?: string;');
    expect(content).toContain('display?: {');
    expect(content).toContain('showTotal?: boolean;');
    expect(content).toContain('tags?: Array<string>;');
    expect(result.files.some((file) => file.path.endsWith('/ignored.d.ts'))).toBe(false);
    expect(result.files.some((file) => file.path.endsWith('/settings.d.ts'))).toBe(false);
  });

  it('uses entry key for stable virtual imports after directory rename', () => {
    const generate = (directoryName: string) =>
      generateClientSettingsTypes({
        files: [
          {
            path: `src/client/js-blocks/${directoryName}/entry.json`,
            content: JSON.stringify({ key: 'stable-sales', settingsSchema: { type: 'object', properties: {} } }),
          },
        ],
      }).entries[0];

    expect(generate('before').virtualImport).toBe('light-extension:settings/client/js-block/stable-sales');
    expect(generate('after').virtualImport).toBe(generate('before').virtualImport);
    expect(generate('after').outputPath).toBe(generate('before').outputPath);
  });

  it('replaces the active Entry context shim and types ctx.settings', () => {
    const result = generateClientSettingsTypes({
      files: [
        descriptor('js-blocks', 'sales-dir', 'sales', 'mode', 'number'),
        descriptor('js-actions', 'order-dir', 'orders', 'confirm', 'boolean'),
      ],
    });
    const sales = createActiveEntryContextType({
      activePath: 'src/client/js-blocks/sales-dir/index.tsx',
      entries: result.entries,
    });
    const orders = createActiveEntryContextType({
      activePath: 'src/client/js-actions/order-dir/index.ts',
      entries: result.entries,
    });

    expect(sales.file?.path).toBe(LIGHT_EXTENSION_ACTIVE_ENTRY_CONTEXT_PATH);
    expect(sales.file?.content).toContain('client/js-block/sales');
    expect(orders.file?.path).toBe(LIGHT_EXTENSION_ACTIVE_ENTRY_CONTEXT_PATH);
    expect(orders.file?.content).toContain('client/js-action/orders');
    expect(orders.file?.content).not.toContain('client/js-block/sales');
    if (!sales.file || !orders.file) {
      throw new Error('Expected active Entry context declarations');
    }

    const salesDiagnostics = getTypeScriptDiagnostics([
      ...result.files,
      sales.file,
      runJSContextDeclaration(),
      { path: 'src/client/js-blocks/sales-dir/index.tsx', content: 'const value: string = ctx.settings.mode;' },
    ]);
    expect(salesDiagnostics.some((message) => /number.*string|string.*number/.test(message))).toBe(true);

    const ordersDiagnostics = getTypeScriptDiagnostics([
      ...result.files,
      orders.file,
      runJSContextDeclaration(),
      { path: 'src/client/js-actions/order-dir/index.ts', content: 'ctx.settings.confirm; ctx.settings.mode;' },
    ]);
    expect(ordersDiagnostics.some((message) => /mode/.test(message))).toBe(true);
    expect(ordersDiagnostics.some((message) => /confirm/.test(message))).toBe(false);
  });
});

function descriptor(kindRoot: string, directoryName: string, key: string, propertyName: string, propertyType: string) {
  return {
    path: `src/client/${kindRoot}/${directoryName}/entry.json`,
    content: JSON.stringify({
      key,
      settingsSchema: { type: 'object', properties: { [propertyName]: { type: propertyType } } },
    }),
  };
}

function runJSContextDeclaration() {
  return {
    path: '__runjs__/context.d.ts',
    content: 'interface RunJSContext { logger: unknown; }\ndeclare const ctx: LightExtensionActiveEntryContext;\n',
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
    directoryExists(directoryName) {
      return Array.from(fileMap.keys()).some((path) => path.startsWith(`${directoryName.replace(/\/$/, '')}/`));
    },
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
