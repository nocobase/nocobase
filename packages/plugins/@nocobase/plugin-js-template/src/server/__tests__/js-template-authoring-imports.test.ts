/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  buildJsTemplateSettingsAuthoringContract,
  JS_TEMPLATE_SDK_CLIENT_IMPORT,
  JS_TEMPLATE_SDK_SHARED_IMPORT,
  type JsTemplateSettingsAuthoringContract,
} from '@nocobase/js-template-sdk/typegen';
import { collectStaticModuleReferences } from '@nocobase/runjs/compiler';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { rewriteJsTemplateAuthoringImports } from '../services/conversion/jsTemplateAuthoringImports';

type SourceFileWithParseDiagnostics = ts.SourceFile & {
  readonly parseDiagnostics: readonly ts.Diagnostic[];
};

const publicTypeCases = [
  { name: 'JsTemplateSettingsContext', fragment: 'settings: TSettings' },
  { name: 'JsTemplateContextRecord', fragment: 'Record<string, unknown>' },
  { name: 'JsTemplateDataContext', fragment: 'record?: Record<string, unknown> | null' },
  { name: 'JSBlockContext', fragment: 'element?: HTMLElement | null' },
  { name: 'JSPageRuntimeFacade', fragment: 'readonly uid: string' },
  { name: 'JSPageContext', fragment: 'page: { readonly uid: string' },
  { name: 'JSFieldContext', fragment: 'value?: TValue' },
  { name: 'JSActionContext', fragment: 'event?: unknown' },
  { name: 'JSItemContext', fragment: 'value?: TValue' },
  { name: 'RunJSContext', fragment: 'input?: TInput' },
] as const;

describe('JS Template authoring imports', () => {
  it.each(publicTypeCases)('lowers the public $name type with its usable shape', ({ name, fragment }) => {
    const source = `import type { ${name} as LocalType } from "${JS_TEMPLATE_SDK_CLIENT_IMPORT}";\ntype Probe = LocalType;\n`;
    const result = rewriteJsTemplateAuthoringImports('src/client/js-pages/orders/index.tsx', source);

    expect(result.diagnostics).toEqual([]);
    expect(result.content).toContain('export {};');
    expect(result.content).toContain(`type LocalType`);
    expect(result.content).toContain(fragment);
    expect(result.content).not.toContain(`type LocalType = unknown;`);
    expect(result.content).not.toContain(JS_TEMPLATE_SDK_CLIENT_IMPORT);
  });

  it('preserves aliases, mixed helper imports, module scope, and source line counts', () => {
    const source = [
      `import {`,
      `  type JSPageRuntimeFacade as PageFacade,`,
      `  defineSettings as define,`,
      `} from "${JS_TEMPLATE_SDK_CLIENT_IMPORT}";`,
      `const settings = define({ title: "Orders" });`,
      `type Page = PageFacade;`,
      '',
    ].join('\n');
    const result = rewriteJsTemplateAuthoringImports('src/client/js-pages/orders/index.tsx', source);

    expect(result.diagnostics).toEqual([]);
    expect(result.content).toContain('export {};');
    expect(result.content).toContain('type PageFacade = { readonly uid: string; readonly active: boolean;');
    expect(result.content).toContain('function define<TSettings>(settings: TSettings): TSettings');
    expect(result.content.match(/\n/gu)).toHaveLength(source.match(/\n/gu)?.length || 0);
  });

  it('keeps the public settings context assignable without requiring the ambient ctx shape', () => {
    const result = rewriteJsTemplateAuthoringImports(
      'src/client/js-pages/orders/index.ts',
      `import type { JsTemplateSettingsContext } from "${JS_TEMPLATE_SDK_CLIENT_IMPORT}";\nconst value: JsTemplateSettingsContext<{ title: string }> = { settings: { title: "Orders" } };\n`,
    );

    expect(result.diagnostics).toEqual([]);
    expect(result.content).toContain('type JsTemplateSettingsContext<TSettings = unknown> = { settings: TSettings };');
    expect(result.content).not.toContain('typeof ctx & { settings: TSettings }');
  });

  it.each(['js', 'jsx'])('emits valid JavaScript syntax for runtime helpers in .%s files', (extension) => {
    const source = `import { defineSettings as define } from "${JS_TEMPLATE_SDK_CLIENT_IMPORT}";\nconst settings = define({ title: "Orders" });\n`;
    const result = rewriteJsTemplateAuthoringImports(`src/client/js-pages/orders/index.${extension}`, source);
    const sourceFile = ts.createSourceFile(
      `src/client/js-pages/orders/index.${extension}`,
      result.content,
      ts.ScriptTarget.Latest,
      true,
      extension === 'jsx' ? ts.ScriptKind.JSX : ts.ScriptKind.JS,
    );

    expect(result.diagnostics).toEqual([]);
    expect(result.content).toContain('function define(settings) { return settings; }');
    expect(result.content).not.toContain('<TSettings>');
    expect((sourceFile as SourceFileWithParseDiagnostics).parseDiagnostics).toEqual([]);
  });

  it.each(['ts', 'tsx'])('preserves TypeScript runtime helper declarations in .%s files', (extension) => {
    const source = `import { defineSettings as define } from "${JS_TEMPLATE_SDK_CLIENT_IMPORT}";\nconst settings = define({ title: "Orders" });\n`;
    const path = `src/client/js-pages/orders/index.${extension}`;
    const result = rewriteJsTemplateAuthoringImports(path, source);
    const sourceFile = ts.createSourceFile(
      path,
      result.content,
      ts.ScriptTarget.Latest,
      true,
      extension === 'tsx' ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );

    expect(result.diagnostics).toEqual([]);
    expect(result.content).toContain('function define<TSettings>(settings: TSettings): TSettings');
    expect(result.content).not.toContain('function define(settings)');
    expect((sourceFile as SourceFileWithParseDiagnostics).parseDiagnostics).toEqual([]);
  });

  it('lowers client and settings namespaces plus SDK and settings import types', () => {
    const source = [
      `import type * as SDK from "${JS_TEMPLATE_SDK_CLIENT_IMPORT}";`,
      `import type * as Template from "js-template:settings/client/js-page/orders";`,
      `type Page = SDK.JSPageContext<Template.Settings>;`,
      `type ImportedPage = import("${JS_TEMPLATE_SDK_CLIENT_IMPORT}").JSPageContext<Template.Settings>;`,
      `type ImportedSettings = import("js-template:settings/client/js-page/orders").Settings;`,
      `const untouched = "js-template:settings/client/js-page/orders";`,
      `// ${JS_TEMPLATE_SDK_CLIENT_IMPORT}`,
      '',
    ].join('\n');
    const result = rewriteJsTemplateAuthoringImports('src/client/js-pages/orders/index.tsx', source);
    const sourceFile = ts.createSourceFile(
      'src/client/js-pages/orders/index.tsx',
      result.content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );

    expect(result.diagnostics).toEqual([]);
    expect(result.content).toContain('type __jsTemplateAuthoring_SDK_JSPageRuntimeFacade');
    expect(result.content).toContain('type __jsTemplateAuthoring_Template_Context =');
    expect(result.content).toContain('type ImportedPage =');
    expect(result.content).toContain('page: { readonly uid: string; readonly active: boolean;');
    expect(result.content).not.toContain('Template.Settings');
    expect(result.content).toContain('__jsTemplateAuthoring_Template_Settings');
    expect(result.content).toContain('const untouched = "js-template:settings/client/js-page/orders";');
    expect(result.content).toContain(`// ${JS_TEMPLATE_SDK_CLIENT_IMPORT}`);
    expect(
      collectStaticModuleReferences(sourceFile).filter(
        (reference) =>
          reference.specifier.startsWith('@nocobase/js-template-sdk/') ||
          reference.specifier.startsWith('js-template:settings/'),
      ),
    ).toEqual([]);
  });

  it.each([
    {
      name: 'named import',
      source: 'import type { Settings } from "js-template:settings/client/js-page/orders";',
      contractPatch: { settingsTypeExpression: '' },
      message: 'does not provide an exact "Settings" authoring type',
    },
    {
      name: 'namespace import',
      source: 'import type * as Template from "js-template:settings/client/js-page/orders";',
      contractPatch: { settingsSchemaSummaryTypeExpression: '' },
      message: 'does not provide every exact authoring type',
    },
    {
      name: 'import type',
      source: 'type Settings = import("js-template:settings/client/js-page/orders").Context;',
      contractPatch: { context: { publicTypeName: 'JSPageContext' as const, settingsTypeExpression: '' } },
      message: 'does not provide an exact "Context" authoring type',
    },
  ])('rejects an incomplete exact settings contract for a $name', ({ source, contractPatch, message }) => {
    const contract = createSettingsContract(contractPatch);
    const result = rewriteJsTemplateAuthoringImports(
      'src/client/js-pages/orders/index.tsx',
      `${source}\nctx.render(null);\n`,
      { settingsContracts: new Map([[contract.specifier, contract]]) },
    );

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]).toMatchObject({
      code: 'settings_type_import_invalid',
      message: expect.stringContaining(message),
    });
    expect(result.content).toContain(source);
    expect(result.content).not.toContain('type Settings = Record<string, unknown>');
  });

  it('keeps shared namespace exports limited to the shared public surface', () => {
    const result = rewriteJsTemplateAuthoringImports(
      'src/shared/context.ts',
      `import type * as SDK from "${JS_TEMPLATE_SDK_SHARED_IMPORT}";\ntype RecordType = SDK.JsTemplateContextRecord;\n`,
    );

    expect(result.diagnostics).toEqual([]);
    expect(result.content).toContain('type __jsTemplateAuthoring_SDK_JsTemplateContextRecord');
    expect(result.content).not.toContain('type __jsTemplateAuthoring_SDK_JSPageContext');
  });

  it.each([
    {
      name: 'unknown SDK namespace type',
      source: `import type * as SDK from "${JS_TEMPLATE_SDK_CLIENT_IMPORT}";\ntype Missing = SDK.MissingContext;\n`,
      code: 'import_not_allowed',
      message: 'not a public authoring type',
    },
    {
      name: 'unknown settings namespace type',
      source:
        'import type * as Template from "js-template:settings/client/js-page/orders";\ntype Missing = Template.SettingsContext;\n',
      code: 'settings_type_import_invalid',
      message: 'is not exported',
    },
    {
      name: 'unknown settings namespace type nested in an SDK import type',
      source: [
        'import type * as Template from "js-template:settings/client/js-page/orders";',
        `type Missing = import("${JS_TEMPLATE_SDK_CLIENT_IMPORT}").JSPageContext<Template.SettingsContext>;`,
        '',
      ].join('\n'),
      code: 'settings_type_import_invalid',
      message: 'is not exported',
    },
  ])('rejects $name', ({ source, code, message }) => {
    const result = rewriteJsTemplateAuthoringImports('src/client/js-pages/orders/index.tsx', source);

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]).toMatchObject({ code, message: expect.stringContaining(message) });
  });

  it.each([
    {
      name: 'SDK side-effect import',
      source: `import "${JS_TEMPLATE_SDK_CLIENT_IMPORT}";`,
      code: 'import_not_allowed',
      message: 'Side-effect import',
    },
    {
      name: 'SDK default import',
      source: `import SDK from "${JS_TEMPLATE_SDK_CLIENT_IMPORT}";`,
      code: 'import_not_allowed',
      message: 'Default import',
    },
    {
      name: 'SDK runtime namespace',
      source: `import * as SDK from "${JS_TEMPLATE_SDK_CLIENT_IMPORT}";`,
      code: 'import_not_allowed',
      message: 'only allowed as import type',
    },
    {
      name: 'SDK runtime type export',
      source: `import { JSPageContext } from "${JS_TEMPLATE_SDK_CLIENT_IMPORT}";`,
      code: 'import_not_allowed',
      message: 'Runtime import',
    },
    {
      name: 'unknown SDK type',
      source: `import type { MissingContext } from "${JS_TEMPLATE_SDK_CLIENT_IMPORT}";`,
      code: 'import_not_allowed',
      message: 'not a public authoring type',
    },
    {
      name: 'host type from shared SDK',
      source: `import type { JSPageContext } from "${JS_TEMPLATE_SDK_SHARED_IMPORT}";`,
      code: 'import_not_allowed',
      message: 'not a public authoring type',
    },
    {
      name: 'settings runtime import',
      source: `import { Settings } from "js-template:settings/client/js-page/orders";`,
      code: 'settings_type_import_runtime_not_allowed',
      message: 'must use import type',
    },
    {
      name: 'unknown settings type',
      source: `import type { SettingsContext } from "js-template:settings/client/js-page/orders";`,
      code: 'settings_type_import_invalid',
      message: 'is not exported',
    },
    {
      name: 'invalid settings specifier',
      source: `import type { Settings } from "js-template:settings/client/runjs/orders";`,
      code: 'settings_type_import_invalid',
      message: 'is not valid',
    },
    {
      name: 'unknown SDK import type',
      source: `type Missing = import("${JS_TEMPLATE_SDK_CLIENT_IMPORT}").MissingContext;`,
      code: 'import_not_allowed',
      message: 'not a public authoring type',
    },
  ])('returns a stable diagnostic for $name', ({ source, code, message }) => {
    const result = rewriteJsTemplateAuthoringImports(
      'src/client/js-pages/orders/index.tsx',
      `${source}\nctx.render(null);\n`,
    );

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]).toMatchObject({ code, message: expect.stringContaining(message) });
    expect(result.content).toContain(source);
  });
});

function createSettingsContract(
  patch: Partial<JsTemplateSettingsAuthoringContract>,
): JsTemplateSettingsAuthoringContract {
  return {
    ...buildJsTemplateSettingsAuthoringContract({
      target: 'client',
      kind: 'js-page',
      templateName: 'orders',
      entryKey: 'client/js-page/orders',
      descriptorPath: 'src/client/js-pages/orders/entry.json',
      virtualImport: 'js-template:settings/client/js-page/orders',
      schema: { type: 'object', properties: { count: { type: 'number' } } },
      schemaHash: 'schema-hash',
    }),
    ...patch,
  };
}
