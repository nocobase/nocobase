/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { collectStaticModuleReferences } from '@nocobase/runjs/compiler';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { JsTemplateValidator } from '../services/JsTemplateValidator';
import { JsTemplateWorkspaceCompilerBridge } from '../services/JsTemplateWorkspaceCompilerBridge';
import { JS_TEMPLATE_SDK_CLIENT_IMPORT } from '../services/conversion/jsTemplateAuthoringImports';
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
        kind: 'js-page',
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
      expect(preparedInlineEntry?.content).toBe(preparation.files.find((file) => file.path === entryPath)?.content);

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
      const files = [{ path: entryPath, content: source }];
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

      const inlineFiles = collectAndRelocateInlineFiles({ files, entryPath, kind: 'js-page' });
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
