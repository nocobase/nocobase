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
  createActiveTemplateContextType,
  generateClientSettingsTypes,
  generateInlineClientSettingsTypes,
  JS_TEMPLATE_ACTIVE_TEMPLATE_CONTEXT_PATH,
  parseSettingsTypeImport,
} from '../typegen';

describe('JS Template settings typegen', () => {
  it('generates nested object, array, enum and required types from the entry.json settings field map', () => {
    const result = generateClientSettingsTypes({
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/entry.json',
          content: JSON.stringify({
            schemaVersion: 1,
            key: 'sales-kpi',
            settings: {
              mode: { type: 'integer', enum: [1, 2], required: true },
              title: { type: 'string', default: 'Sales' },
              display: {
                type: 'object',
                properties: {
                  showTotal: { type: 'boolean' },
                  tags: { type: 'array', items: { type: 'string' } },
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
    expect(result.templates).toHaveLength(1);
    const content = result.files.find((file) => file.path.endsWith('/sales-kpi.d.ts'))?.content || '';
    expect(content).toContain('mode: 1 | 2;');
    expect(content).toContain('title?: string;');
    expect(content).toContain('display?: {');
    expect(content).toContain('showTotal?: boolean;');
    expect(content).toContain('tags?: Array<string>;');
    expect(result.files.some((file) => file.path.endsWith('/ignored.d.ts'))).toBe(false);
    expect(result.files.some((file) => file.path.endsWith('/settings.d.ts'))).toBe(false);
  });

  it('enforces precise settings and summary literals through TypeScript semantic diagnostics', () => {
    const virtualImport = 'js-template:settings/client/js-block/typed-settings';
    const entryPath = 'src/client/js-blocks/typed-settings/index.tsx';
    const result = generateClientSettingsTypes({
      files: [
        {
          path: 'src/client/js-blocks/typed-settings/entry.json',
          content: JSON.stringify({
            key: 'typed-settings',
            settings: {
              count: { type: 'number', required: true },
              title: { type: 'string', required: true },
              enabled: { type: 'boolean', required: true },
              subtitle: { type: 'string' },
              mode: { type: 'string', enum: ['table', 'chart'], required: true },
              tags: { type: 'array', items: { type: 'string' }, required: true },
              display: {
                type: 'object',
                required: true,
                properties: {
                  showTotal: { type: 'boolean', required: true },
                  label: { type: 'string' },
                },
              },
            },
          }),
        },
      ],
    });
    const active = createActiveTemplateContextType({ activePath: entryPath, templates: result.templates });
    if (!active.file) {
      throw new Error('Expected active template context declarations');
    }
    const baseFiles = [...result.files, active.file, runJSContextDeclaration()];
    const validSource = [
      `import type { Settings, SettingsSchemaSummary } from "${virtualImport}";`,
      'const settings: Settings = { count: 1, title: "Sales", enabled: true, mode: "table", tags: ["hot"], display: { showTotal: true } };',
      'const count: number = settings.count;',
      'const title: string = settings.title;',
      'const enabled: boolean = settings.enabled;',
      'const subtitle: string | undefined = settings.subtitle?.trim();',
      'const mode: "table" | "chart" = settings.mode;',
      'const firstTag: string = settings.tags[0];',
      'const showTotal: boolean = settings.display.showTotal;',
      'const label: string | undefined = settings.display.label?.trim();',
      'const kind: "js-block" = null as unknown as SettingsSchemaSummary["kind"];',
      'const entryKey: "client/js-block/typed-settings" = null as unknown as SettingsSchemaSummary["entryKey"];',
      'const descriptorPath: "src/client/js-blocks/typed-settings/entry.json" = null as unknown as SettingsSchemaSummary["descriptorPath"];',
      `const moduleName: "${virtualImport}" = null as unknown as SettingsSchemaSummary["virtualImport"];`,
      'ctx.render([count, title, enabled, subtitle, mode, firstTag, showTotal, label, kind, entryKey, descriptorPath, moduleName]);',
      '',
    ].join('\n');

    expect(getTypeScriptDiagnostics([...baseFiles, { path: entryPath, content: validSource }])).toEqual([]);

    const invalidCases = [
      {
        name: 'number',
        source: `import type { Settings } from "${virtualImport}"; declare const settings: Settings; settings.count.trim();`,
        message: /trim/u,
      },
      {
        name: 'string',
        source: `import type { Settings } from "${virtualImport}"; declare const settings: Settings; const value: number = settings.title;`,
        message: /string.*number|number.*string/u,
      },
      {
        name: 'boolean',
        source: `import type { Settings } from "${virtualImport}"; declare const settings: Settings; const value: string = settings.enabled;`,
        message: /boolean.*string|string.*boolean/u,
      },
      {
        name: 'required',
        source: `import type { Settings } from "${virtualImport}"; const settings: Settings = { count: 1 };`,
        message: /missing/u,
      },
      {
        name: 'optional',
        source: `import type { Settings } from "${virtualImport}"; declare const settings: Settings; settings.subtitle.trim();`,
        message: /possibly.*undefined/u,
      },
      {
        name: 'enum',
        source: `import type { Settings } from "${virtualImport}"; declare const settings: Settings; const mode: "grid" = settings.mode;`,
        message: /table|chart/u,
      },
      {
        name: 'array',
        source: `import type { Settings } from "${virtualImport}"; declare const settings: Settings; const tag: number = settings.tags[0];`,
        message: /string.*number|number.*string/u,
      },
      {
        name: 'object',
        source: `import type { Settings } from "${virtualImport}"; declare const settings: Settings; const total: string = settings.display.showTotal;`,
        message: /boolean.*string|string.*boolean/u,
      },
      {
        name: 'summary literal',
        source: `import type { SettingsSchemaSummary } from "${virtualImport}"; const kind: "js-page" = null as unknown as SettingsSchemaSummary["kind"];`,
        message: /js-block.*js-page|js-page.*js-block/u,
      },
    ];
    for (const invalid of invalidCases) {
      const diagnostics = getTypeScriptDiagnostics([...baseFiles, { path: entryPath, content: invalid.source }]);
      expect(
        diagnostics.some((message) => invalid.message.test(message)),
        invalid.name,
      ).toBe(true);
    }
  });

  it('uses entry key for stable virtual imports after directory rename', () => {
    const generate = (directoryName: string) =>
      generateClientSettingsTypes({
        files: [
          {
            path: `src/client/js-blocks/${directoryName}/entry.json`,
            content: JSON.stringify({ key: 'stable-sales', settings: {} }),
          },
        ],
      }).templates[0];

    expect(generate('before').virtualImport).toBe('js-template:settings/client/js-block/stable-sales');
    expect(generate('after').virtualImport).toBe(generate('before').virtualImport);
    expect(generate('after').outputPath).toBe(generate('before').outputPath);
  });

  it('rejects the non-canonical settingsSchema field', () => {
    const result = generateClientSettingsTypes({
      files: [
        {
          path: 'src/client/js-blocks/invalid/entry.json',
          content: JSON.stringify({
            key: 'invalid',
            settingsSchema: { type: 'object', required: ['mode'], properties: { mode: { type: 'string' } } },
          }),
        },
      ],
    });
    expect(result.templates).toEqual([]);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ message: 'entry.json settingsSchema is not supported; use settings' }),
    );
  });

  it('replaces the active template context shim and types ctx.settings', () => {
    const result = generateClientSettingsTypes({
      files: [
        descriptor('js-blocks', 'sales-dir', 'sales', 'mode', 'number'),
        descriptor('js-actions', 'order-dir', 'orders', 'confirm', 'boolean'),
        descriptor('js-pages', 'page-dir', 'page', 'title', 'string'),
        descriptor('js-fields', 'field-dir', 'field', 'color', 'string'),
        descriptor('js-items', 'item-dir', 'item', 'label', 'string'),
      ],
    });
    const sales = createActiveTemplateContextType({
      activePath: 'src/client/js-blocks/sales-dir/index.tsx',
      templates: result.templates,
    });
    const orders = createActiveTemplateContextType({
      activePath: 'src/client/js-actions/order-dir/index.ts',
      templates: result.templates,
    });
    expect(sales.file?.path).toBe(JS_TEMPLATE_ACTIVE_TEMPLATE_CONTEXT_PATH);
    expect(sales.file?.content).toContain('client/js-block/sales');
    expect(orders.file?.path).toBe(JS_TEMPLATE_ACTIVE_TEMPLATE_CONTEXT_PATH);
    expect(orders.file?.content).toContain('client/js-action/orders');
    expect(orders.file?.content).not.toContain('client/js-block/sales');
    expect(result.templates.map((entry) => entry.kind).sort()).toEqual(
      ['js-action', 'js-block', 'js-field', 'js-item', 'js-page'].sort(),
    );
    expect(result.files.find((file) => file.path.endsWith('/js-block/sales.d.ts'))?.content).toContain(
      'export type Context = JSBlockContext<Settings>;',
    );
    expect(result.files.find((file) => file.path.endsWith('/js-action/orders.d.ts'))?.content).toContain(
      'export type Context = JSActionContext<Settings>;',
    );
    expect(result.files.find((file) => file.path.endsWith('/js-page/page.d.ts'))?.content).toContain(
      'export type Context = JSPageContext<Settings>;',
    );
    expect(result.files.find((file) => file.path.endsWith('/js-field/field.d.ts'))?.content).toContain(
      'export type Context = JSFieldContext<Settings>;',
    );
    expect(result.files.find((file) => file.path.endsWith('/js-item/item.d.ts'))?.content).toContain(
      'export type Context = JSItemContext<Settings>;',
    );
    if (!sales.file || !orders.file) {
      throw new Error('Expected active template context declarations');
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

  it('ignores the removed generic RunJS root and import while retaining the RunJSContext SDK type', () => {
    const result = generateClientSettingsTypes({
      files: [descriptor('runjs', 'subtotal-dir', 'subtotal', 'precision', 'number')],
    });

    expect(result.templates).toEqual([]);
    expect(result.files.some((file) => file.path.includes('/client/runjs/'))).toBe(false);
    expect(parseSettingsTypeImport('js-template:settings/client/runjs/subtotal')).toBeNull();
    expect(result.files.find((file) => file.path.endsWith('/sdk.d.ts'))?.content).toContain(
      'export interface RunJSContext',
    );
  });

  it('generates the active settings context from an inline src/client/entry.json file', () => {
    const result = generateInlineClientSettingsTypes({
      files: [
        { path: 'src/client/index.tsx', content: 'ctx.settings.columns; ctx.settings.missing;' },
        {
          path: 'src/client/entry.json',
          content: JSON.stringify({
            schemaVersion: 1,
            key: 'collection-table',
            settings: {
              columns: { type: 'array', items: { type: 'object' } },
              pageSize: { type: 'integer' },
            },
          }),
        },
      ],
      kind: 'js-block',
    });
    const active = createActiveTemplateContextType({
      activePath: 'src/client/index.tsx',
      templates: result.templates,
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.templates[0]).toMatchObject({
      descriptorPath: 'src/client/entry.json',
      sourceRoot: 'src/client',
      virtualImport: 'js-template:settings/client/js-block/collection-table',
    });
    expect(result.files.find((file) => file.path.endsWith('/collection-table.d.ts'))?.content).toContain(
      'columns?: Array<{}>;',
    );
    if (!active.file) {
      throw new Error('Expected inline active template context declaration');
    }
    const diagnostics = getTypeScriptDiagnostics([
      ...result.files,
      active.file,
      runJSContextDeclaration(),
      { path: 'src/client/index.tsx', content: 'ctx.settings.columns; ctx.settings.missing;' },
    ]);
    expect(diagnostics.some((message) => /columns/.test(message))).toBe(false);
    expect(diagnostics.some((message) => /missing/.test(message))).toBe(true);
  });

  it('generates JS Page settings with the page-specific context', () => {
    const result = generateClientSettingsTypes({
      files: [descriptor('js-pages', 'orders-dir', 'orders', 'title', 'string')],
    });
    const template = result.templates[0];
    const active = createActiveTemplateContextType({
      activePath: 'src/client/js-pages/orders-dir/index.tsx',
      templates: result.templates,
    });

    expect(result.diagnostics).toEqual([]);
    expect(template).toMatchObject({
      kind: 'js-page',
      sourceRoot: 'src/client/js-pages/orders-dir',
      virtualImport: 'js-template:settings/client/js-page/orders',
    });
    expect(result.files.find((file) => file.path.endsWith('/js-page/orders.d.ts'))?.content).toContain(
      'export type Context = JSPageContext<Settings>;',
    );
    expect(active.file?.content).toContain('type JsTemplateActiveTemplateContext = RunJSContext & Context;');
    const sdkDeclarations = result.files.find((file) => file.path.endsWith('/sdk.d.ts'))?.content || '';
    expect(sdkDeclarations).toContain('export interface JSPageContext');
    expect(sdkDeclarations.match(/declare module "@nocobase\/js-template-sdk\/client"/gu)).toHaveLength(1);
    expect(sdkDeclarations.match(/declare module "@nocobase\/js-template-sdk\/shared"/gu)).toHaveLength(1);
  });
});

function descriptor(kindRoot: string, directoryName: string, key: string, propertyName: string, propertyType: string) {
  return {
    path: `src/client/${kindRoot}/${directoryName}/entry.json`,
    content: JSON.stringify({
      key,
      settings: { [propertyName]: { type: propertyType } },
    }),
  };
}

function runJSContextDeclaration() {
  return {
    path: '__runjs__/context.d.ts',
    content: [
      'interface Array<T> { readonly [index: number]: T; }',
      'interface String { trim(): string; }',
      'interface RunJSContext { logger: unknown; render(node: unknown): void; }',
      'declare const ctx: JsTemplateActiveTemplateContext;',
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
    strictNullChecks: true,
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
