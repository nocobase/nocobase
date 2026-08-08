/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JS_TEMPLATE_SDK_CLIENT_IMPORT } from '@nocobase/js-template-sdk/typegen';
import { collectStaticModuleReferences } from '@nocobase/runjs/compiler';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { JsTemplateValidator } from '../services/JsTemplateValidator';
import { JsTemplateWorkspaceCompilerBridge } from '../services/JsTemplateWorkspaceCompilerBridge';
import { collectAndRelocateInlineFiles } from '../services/conversion/jsTemplateToInlineWorkspace';

const settingsImport = 'js-template:settings/client/js-page/orders';
const entryPath = 'src/client/js-pages/orders/index.tsx';

const publicTypeCases = [
  {
    name: 'JsTemplateSettingsContext',
    typeArguments: '<{ title: string }>',
    probe: 'return value.settings.title;',
  },
  { name: 'JsTemplateContextRecord', typeArguments: '', probe: 'return value.id;' },
  {
    name: 'JsTemplateDataContext',
    typeArguments: '<{ title: string }>',
    probe: 'return value.record?.id;',
  },
  {
    name: 'JSBlockContext',
    typeArguments: '<{ title: string }>',
    probe: 'value.render?.(value.settings.title); return value.element;',
  },
  {
    name: 'JSPageRuntimeFacade',
    typeArguments: '',
    probe: 'value.setDocumentTitle(value.uid); return value.refresh();',
  },
  {
    name: 'JSPageContext',
    typeArguments: '<{ title: string }>',
    probe: 'value.page.setDocumentTitle(value.settings.title); return value.page.uid;',
  },
  {
    name: 'JSFieldContext',
    typeArguments: '<{ title: string }, number>',
    probe: 'return value.value?.toFixed(0);',
  },
  {
    name: 'JSActionContext',
    typeArguments: '<{ title: string }>',
    probe: 'return value.formValues?.id;',
  },
  {
    name: 'JSItemContext',
    typeArguments: '<{ title: string }, number>',
    probe: 'return value.value?.toFixed(0);',
  },
  {
    name: 'RunJSContext',
    typeArguments: '<{ title: string }, { query: string }>',
    probe: 'return value.input?.query;',
  },
] as const;

describe('JS Template authoring imports across compile and detach', () => {
  it.each(publicTypeCases)(
    'compiles, detaches, and recompiles the public $name type without authoring module references',
    async ({ name, typeArguments, probe }) => {
      const source = buildSource(name, typeArguments, probe);
      const descriptor = {
        path: 'src/client/js-pages/orders/entry.json',
        content: JSON.stringify({ schemaVersion: 1, key: 'orders', settings: {} }),
      };
      const validator = new JsTemplateValidator();
      const validation = validator.validateWorkspace({
        files: [{ path: entryPath, content: source }, descriptor],
      });
      expect(validation.accepted).toBe(true);
      expect(validation.diagnostics).toEqual([]);

      const bridge = new JsTemplateWorkspaceCompilerBridge();
      const compileInput = {
        kind: 'js-page' as const,
        templateName: 'orders',
        entryPath,
        surfaceStyle: 'render' as const,
        files: [{ path: entryPath, content: source }, descriptor],
      };
      const preparation = bridge.prepareEntry(compileInput);
      expect(preparation.accepted).toBe(true);
      expect(preparation.diagnostics).toEqual([]);

      const compiled = await bridge.compileEntry(compileInput);
      expect(compiled.accepted, JSON.stringify(compiled.diagnostics, null, 2)).toBe(true);
      expect(compiled.diagnostics).toEqual([]);

      const inlineFiles = collectAndRelocateInlineFiles({
        files: compileInput.files,
        entryPath,
      });
      const inlineEntry = inlineFiles.find((file) => file.path === 'src/client/index.tsx');
      expect(findAuthoringModuleReferences(inlineEntry?.content || '')).not.toEqual([]);

      const inlinePreparation = bridge.prepareEntry({
        ...compileInput,
        templateName: 'orders-inline',
        entryPath: 'src/client/index.tsx',
        files: inlineFiles,
      });
      expect(inlinePreparation.accepted).toBe(true);
      expect(inlinePreparation.diagnostics).toEqual([]);
      const preparedInlineEntry = inlinePreparation.files.find((file) => file.path === 'src/client/index.tsx');
      expect(findAuthoringModuleReferences(preparedInlineEntry?.content || '')).toEqual([]);
      expect(preparation.files.find((file) => file.path === entryPath)?.content).toContain(
        'descriptorPath: "src/client/js-pages/orders/entry.json"',
      );
      expect(preparedInlineEntry?.content).toContain('descriptorPath: "src/client/entry.json"');

      const inlineCompiled = await bridge.compileEntry({
        kind: 'js-page',
        templateName: 'orders-inline',
        entryPath: 'src/client/index.tsx',
        surfaceStyle: 'render',
        files: inlineFiles,
      });
      expect(inlineCompiled.accepted, JSON.stringify(inlineCompiled.diagnostics, null, 2)).toBe(true);
      expect(inlineCompiled.diagnostics).toEqual([]);
    },
  );

  it('preserves precise settings for named, aliased, namespace, context, summary, and import-type forms', async () => {
    const descriptor = preciseSettingsDescriptor();
    const source = [
      `import type { Settings, Settings as AliasedSettings, Context, SettingsSchemaSummary } from "${settingsImport}";`,
      `import type * as Template from "${settingsImport}";`,
      `type ImportedSettings = import("${settingsImport}").Settings;`,
      'const named: Settings = { count: 1, enabled: true, mode: "table", tags: ["hot"], display: { showTotal: true } };',
      'const aliased: AliasedSettings = named;',
      'const namespaced: Template.Settings = aliased;',
      'const imported: ImportedSettings = namespaced;',
      'const optional: string | undefined = imported.title?.trim();',
      'const kind: "js-page" = null as unknown as SettingsSchemaSummary["kind"];',
      'const entryKey: "client/js-page/orders" = null as unknown as Template.SettingsSchemaSummary["entryKey"];',
      'const descriptorPath: "src/client/js-pages/orders/entry.json" = null as unknown as Template.SettingsSchemaSummary["descriptorPath"];',
      'const readContext = (context: Context): number => context.settings.count;',
      'ctx.render(<div>{String(readContext(null as unknown as Context))}:{optional}:{kind}:{entryKey}:{descriptorPath}</div>);',
      '',
    ].join('\n');
    const input = {
      kind: 'js-page' as const,
      templateName: 'orders',
      entryPath,
      surfaceStyle: 'render' as const,
      files: [{ path: entryPath, content: source }, descriptor],
    };
    const bridge = new JsTemplateWorkspaceCompilerBridge();

    const preparation = bridge.prepareEntry(input);
    const compiled = await bridge.compileEntry(input);
    const preparedEntry = preparation.files.find((file) => file.path === entryPath)?.content || '';

    expect(preparation.accepted, JSON.stringify(preparation.diagnostics, null, 2)).toBe(true);
    expect(preparedEntry).toContain('count: number');
    expect(preparedEntry).toContain('title?: string');
    expect(preparedEntry).toContain('kind: "js-page"');
    expect(preparedEntry).toContain('descriptorPath: "src/client/js-pages/orders/entry.json"');
    expect(findAuthoringModuleReferences(preparedEntry)).toEqual([]);
    expect(compiled.accepted, JSON.stringify(compiled.diagnostics, null, 2)).toBe(true);
    expect(compiled.diagnostics).toEqual([]);
    expect(findAuthoringModuleReferences(compiled.artifact.code)).toEqual([]);
  });

  it.each([
    {
      name: 'number methods',
      body: 'declare const settings: Settings; settings.count.trim();',
      message: 'trim',
    },
    {
      name: 'required fields',
      body: 'const settings: Settings = { count: 1 };',
      message: 'missing',
    },
    {
      name: 'optional fields without narrowing',
      body: 'declare const settings: Settings; settings.title.trim();',
      message: 'possibly',
    },
    {
      name: 'enum values',
      body: 'declare const settings: Settings; const mode: "grid" = settings.mode;',
      message: 'not assignable',
    },
    {
      name: 'array members',
      body: 'declare const settings: Settings; const tag: number = settings.tags[0];',
      message: 'not assignable',
    },
    {
      name: 'object members',
      body: 'declare const settings: Settings; const total: string = settings.display.showTotal;',
      message: 'not assignable',
    },
  ])('rejects invalid precise settings $name during compilation', async ({ body, message }) => {
    const bridge = new JsTemplateWorkspaceCompilerBridge();
    const result = await bridge.compileEntry({
      kind: 'js-page',
      templateName: 'orders',
      entryPath,
      files: [
        {
          path: entryPath,
          content: `import type { Settings } from "${settingsImport}";\n${body}\nctx.render(<div />);\n`,
        },
        preciseSettingsDescriptor(),
      ],
    });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: entryPath, message: expect.stringContaining(message) })]),
    );
  });

  it('reports a structurally valid settings module that is absent from the current workspace', () => {
    const source = [
      'import type { Settings } from "js-template:settings/client/js-page/missing";',
      'ctx.render(null as unknown as Settings);',
      '',
    ].join('\n');
    const preparation = new JsTemplateWorkspaceCompilerBridge().prepareEntry({
      kind: 'js-page',
      templateName: 'orders',
      entryPath,
      files: [{ path: entryPath, content: source }, preciseSettingsDescriptor()],
    });

    expect(preparation.accepted).toBe(false);
    expect(preparation.diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'settings_type_import_invalid',
        path: entryPath,
        message: expect.stringContaining('does not exist in the current workspace'),
      }),
    );
  });

  it.each([
    {
      name: 'a non-public SDK namespace type',
      source: [
        `import type * as SDK from "${JS_TEMPLATE_SDK_CLIENT_IMPORT}";`,
        'type Missing = SDK.MissingContext;',
        'ctx.render(null as unknown as Missing);',
        '',
      ].join('\n'),
      code: 'import_not_allowed',
      message: 'not a public authoring type',
      line: 2,
    },
    {
      name: 'an invalid settings specifier',
      source: [
        'import type { Settings } from "js-template:settings/client/runjs/orders";',
        'ctx.render(null as unknown as Settings);',
        '',
      ].join('\n'),
      code: 'settings_type_import_invalid',
      message: 'is not valid',
      line: 1,
    },
    {
      name: 'a runtime settings import',
      source: [`import { Settings } from "${settingsImport}";`, 'ctx.render(null as unknown as Settings);', ''].join(
        '\n',
      ),
      code: 'settings_type_import_runtime_not_allowed',
      message: 'must use import type',
      line: 1,
    },
  ])(
    'rejects $name in validation and compiler preparation while conversion preserves it',
    ({ source, code, message, line }) => {
      const files = [
        { path: entryPath, content: source },
        {
          path: 'src/client/js-pages/orders/entry.json',
          content: JSON.stringify({ schemaVersion: 1, key: 'orders', settings: {} }),
        },
      ];
      const expectedDiagnostic = expect.objectContaining({
        code,
        message: expect.stringContaining(message),
        path: entryPath,
        line,
      });

      const validation = new JsTemplateValidator().validateWorkspace({ files });
      expect(validation.accepted).toBe(false);
      expect(validation.diagnostics).toContainEqual(expectedDiagnostic);

      const preparation = new JsTemplateWorkspaceCompilerBridge().prepareEntry({
        kind: 'js-page',
        templateName: 'orders',
        entryPath,
        files,
      });
      expect(preparation.accepted).toBe(false);
      expect(preparation.diagnostics).toContainEqual(expectedDiagnostic);

      const inlineFiles = collectAndRelocateInlineFiles({ files, entryPath });
      const inlineEntry = inlineFiles.find((file) => file.path === 'src/client/index.tsx');
      expect(findAuthoringModuleReferences(inlineEntry?.content || '')).not.toEqual([]);

      const inlinePreparation = new JsTemplateWorkspaceCompilerBridge().prepareEntry({
        kind: 'js-page',
        templateName: 'orders-inline',
        entryPath: 'src/client/index.tsx',
        files: inlineFiles,
      });
      expect(inlinePreparation.accepted).toBe(false);
      expect(inlinePreparation.failureCode).toBe('JS_TEMPLATE_COMPILE_DENIED');
      expect(inlinePreparation.diagnostics).toContainEqual(
        expect.objectContaining({
          code,
          message: expect.stringContaining(message),
          path: 'src/client/index.tsx',
          line,
        }),
      );
    },
  );
});

function buildSource(name: string, typeArguments: string, probe: string): string {
  return [
    `import { type ${name} as PublicType, defineSettings as define, assertSettings as assert } from "${JS_TEMPLATE_SDK_CLIENT_IMPORT}";`,
    `import type * as SDK from "${JS_TEMPLATE_SDK_CLIENT_IMPORT}";`,
    `import type { Settings as TemplateSettings } from "${settingsImport}";`,
    `import type * as Template from "${settingsImport}";`,
    `type ImportedType = import("${JS_TEMPLATE_SDK_CLIENT_IMPORT}").${name}${typeArguments};`,
    `type NamespaceType = SDK.${name}${typeArguments};`,
    `type ImportedSettings = import("${settingsImport}").Settings;`,
    `function probe(value: PublicType${typeArguments}) { ${probe} }`,
    `function acceptAlternates(imported: ImportedType, namespaced: NamespaceType) { return [imported, namespaced]; }`,
    `function acceptSettings(named: TemplateSettings, namespaced: Template.Settings, imported: ImportedSettings, context: Template.Context) { return [named, namespaced, imported, context.settings]; }`,
    `const settings = assert(define({ title: "Orders" }));`,
    `ctx.render(<div>{settings.title}</div>);`,
    '',
  ].join('\n');
}

function preciseSettingsDescriptor() {
  return {
    path: 'src/client/js-pages/orders/entry.json',
    content: JSON.stringify({
      schemaVersion: 1,
      key: 'orders',
      settings: {
        count: { type: 'number', required: true },
        enabled: { type: 'boolean', required: true },
        title: { type: 'string' },
        mode: { type: 'string', enum: ['table', 'chart'], required: true },
        tags: { type: 'array', items: { type: 'string' }, required: true },
        display: {
          type: 'object',
          required: true,
          properties: { showTotal: { type: 'boolean', required: true } },
        },
      },
    }),
  };
}

function findAuthoringModuleReferences(content: string) {
  const sourceFile = ts.createSourceFile(
    'src/client/index.tsx',
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  return collectStaticModuleReferences(sourceFile).filter(
    (reference) =>
      reference.specifier.startsWith('@nocobase/js-template-sdk/') ||
      reference.specifier.startsWith('js-template:settings/'),
  );
}
