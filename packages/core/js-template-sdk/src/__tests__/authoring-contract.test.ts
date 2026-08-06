/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  JSActionContext,
  JSBlockContext,
  JSFieldContext,
  JSItemContext,
  JSPageContext,
  JSPageRuntimeFacade,
  RunJSContext,
} from '@nocobase/js-template-sdk/client';
import { assertSettings, defineSettings } from '@nocobase/js-template-sdk/shared';
import type {
  JsTemplateContextRecord,
  JsTemplateDataContext,
  JsTemplateSettingsContext,
} from '@nocobase/js-template-sdk/shared';
import ts from 'typescript';
import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  buildJsTemplateSdkDeclarations,
  getJsTemplateSettingsContextTypeName,
  JS_TEMPLATE_SDK_AUTHORING_MODULES,
  JS_TEMPLATE_SDK_CLIENT_IMPORT,
  JS_TEMPLATE_SDK_SHARED_IMPORT,
} from '../typegen';

const expectedTypes = [
  { name: 'JsTemplateSettingsContext', parameters: ['TSettings=unknown'] },
  { name: 'JsTemplateContextRecord', parameters: [] },
  { name: 'JsTemplateDataContext', parameters: ['TSettings=unknown'] },
  { name: 'JSBlockContext', parameters: ['TSettings=unknown'] },
  { name: 'JSPageRuntimeFacade', parameters: [] },
  { name: 'JSPageContext', parameters: ['TSettings=unknown'] },
  { name: 'JSFieldContext', parameters: ['TSettings=unknown', 'TValue=unknown'] },
  { name: 'JSActionContext', parameters: ['TSettings=unknown'] },
  { name: 'JSItemContext', parameters: ['TSettings=unknown', 'TValue=unknown'] },
  { name: 'RunJSContext', parameters: ['TSettings=unknown', 'TInput=unknown'] },
] as const;

describe('JS Template SDK authoring contract', () => {
  it('owns the public modules, types, generic defaults, helpers, and kind contexts', () => {
    const sharedModule = JS_TEMPLATE_SDK_AUTHORING_MODULES.get(JS_TEMPLATE_SDK_SHARED_IMPORT);
    const clientModule = JS_TEMPLATE_SDK_AUTHORING_MODULES.get(JS_TEMPLATE_SDK_CLIENT_IMPORT);
    if (!sharedModule || !clientModule) {
      throw new Error('Expected both JS Template SDK authoring modules');
    }

    expect([...sharedModule.types.keys()]).toEqual(expectedTypes.slice(0, 3).map((item) => item.name));
    expect(
      [...clientModule.types.values()].map(({ name, parameters }) => ({
        name,
        parameters: parameters.map((parameter) => `${parameter.name}=${parameter.defaultType}`),
      })),
    ).toEqual(expectedTypes);
    expect([...sharedModule.runtimeHelpers.keys()]).toEqual(['defineSettings', 'assertSettings']);
    expect([...clientModule.runtimeHelpers.keys()]).toEqual(['defineSettings', 'assertSettings']);
    expect([
      getJsTemplateSettingsContextTypeName('js-block'),
      getJsTemplateSettingsContextTypeName('js-page'),
      getJsTemplateSettingsContextTypeName('js-field'),
      getJsTemplateSettingsContextTypeName('js-action'),
      getJsTemplateSettingsContextTypeName('js-item'),
    ]).toEqual(['JSBlockContext', 'JSPageContext', 'JSFieldContext', 'JSActionContext', 'JSItemContext']);
  });

  it('keeps the real SDK exports aligned with every contracted public shape', () => {
    type Settings = { title: string };
    type Value = { id: number };
    type Input = { refresh: boolean };
    type DataContextKeys =
      | 'settings'
      | 'record'
      | 'records'
      | 'values'
      | 'collection'
      | 'collectionField'
      | 'dataSource';

    expectTypeOf<keyof JsTemplateSettingsContext<Settings>>().toEqualTypeOf<'settings'>();
    expectTypeOf<JsTemplateSettingsContext<Settings>['settings']>().toEqualTypeOf<Settings>();
    expectTypeOf<JsTemplateContextRecord>().toMatchTypeOf<Record<string, unknown>>();
    expectTypeOf<keyof JsTemplateDataContext<Settings>>().toEqualTypeOf<DataContextKeys>();
    expectTypeOf<JsTemplateDataContext<Settings>['record']>().toEqualTypeOf<
      JsTemplateContextRecord | null | undefined
    >();
    expectTypeOf<keyof JSBlockContext<Settings>>().toEqualTypeOf<DataContextKeys | 'element' | 'render' | 'i18n'>();
    expectTypeOf<JSBlockContext<Settings>['settings']>().toEqualTypeOf<Settings>();
    expectTypeOf<keyof JSPageRuntimeFacade>().toEqualTypeOf<'uid' | 'active' | 'refresh' | 'setDocumentTitle'>();
    expectTypeOf<keyof JSPageContext<Settings>>().toEqualTypeOf<
      DataContextKeys | 'element' | 'render' | 'i18n' | 'page'
    >();
    expectTypeOf<JSPageContext<Settings>['page']>().toEqualTypeOf<JSPageRuntimeFacade>();
    expectTypeOf<keyof JSFieldContext<Settings, Value>>().toEqualTypeOf<DataContextKeys | 'value'>();
    expectTypeOf<JSFieldContext<Settings, Value>['value']>().toEqualTypeOf<Value | undefined>();
    expectTypeOf<keyof JSActionContext<Settings>>().toEqualTypeOf<DataContextKeys | 'event' | 'formValues'>();
    expectTypeOf<JSActionContext<Settings>['formValues']>().toEqualTypeOf<JsTemplateContextRecord | undefined>();
    expectTypeOf<keyof JSItemContext<Settings, Value>>().toEqualTypeOf<DataContextKeys | 'value'>();
    expectTypeOf<JSItemContext<Settings, Value>['value']>().toEqualTypeOf<Value | undefined>();
    expectTypeOf<keyof RunJSContext<Settings, Input>>().toEqualTypeOf<
      DataContextKeys | 'input' | 'event' | 'formValues'
    >();
    expectTypeOf<RunJSContext<Settings, Input>['input']>().toEqualTypeOf<Input | undefined>();
    expect(defineSettings({ title: 'Orders' })).toEqual({ title: 'Orders' });
    expect(assertSettings({ title: 'Orders' })).toEqual({ title: 'Orders' });
  });

  it('builds editor declarations that type-check every public type and helper', () => {
    const declarations = buildJsTemplateSdkDeclarations();
    for (const { name } of expectedTypes) {
      expect(declarations).toContain(`export type ${name}`);
    }
    expect(declarations).toContain('export function defineSettings<TSettings>(settings: TSettings): TSettings;');
    expect(declarations).toContain('export function assertSettings<TSettings>(settings: TSettings): TSettings;');

    const source = [
      `import type { JSActionContext, JSBlockContext, JSFieldContext, JSItemContext, JSPageContext, JSPageRuntimeFacade, RunJSContext } from "${JS_TEMPLATE_SDK_CLIENT_IMPORT}";`,
      `import type { JsTemplateContextRecord, JsTemplateDataContext, JsTemplateSettingsContext } from "${JS_TEMPLATE_SDK_SHARED_IMPORT}";`,
      `import { assertSettings, defineSettings } from "${JS_TEMPLATE_SDK_CLIENT_IMPORT}";`,
      'type Settings = { title: string };',
      'type Equal<Left, Right> = (<Value>() => Value extends Left ? 1 : 2) extends (<Value>() => Value extends Right ? 1 : 2) ? true : false;',
      'type Assert<Condition extends true> = Condition;',
      'type DataContextKeys = "settings" | "record" | "records" | "values" | "collection" | "collectionField" | "dataSource";',
      'type SettingsContextContract = Assert<Equal<keyof JsTemplateSettingsContext<Settings>, "settings">>;',
      'type DataContextContract = Assert<Equal<keyof JsTemplateDataContext<Settings>, DataContextKeys>>;',
      'type BlockContextContract = Assert<Equal<keyof JSBlockContext<Settings>, DataContextKeys | "element" | "render" | "i18n">>;',
      'type PageFacadeContract = Assert<Equal<keyof JSPageRuntimeFacade, "uid" | "active" | "refresh" | "setDocumentTitle">>;',
      'type PageContextContract = Assert<Equal<keyof JSPageContext<Settings>, DataContextKeys | "element" | "render" | "i18n" | "page">>;',
      'type FieldContextContract = Assert<Equal<keyof JSFieldContext<Settings, number>, DataContextKeys | "value">>;',
      'type ActionContextContract = Assert<Equal<keyof JSActionContext<Settings>, DataContextKeys | "event" | "formValues">>;',
      'type ItemContextContract = Assert<Equal<keyof JSItemContext<Settings, string>, DataContextKeys | "value">>;',
      'type RunJSContextContract = Assert<Equal<keyof RunJSContext<Settings, boolean>, DataContextKeys | "input" | "event" | "formValues">>;',
      'declare const settingsContext: JsTemplateSettingsContext<Settings>;',
      'declare const record: JsTemplateContextRecord;',
      'declare const data: JsTemplateDataContext<Settings>;',
      'declare const block: JSBlockContext<Settings>;',
      'declare const pageFacade: JSPageRuntimeFacade;',
      'declare const page: JSPageContext<Settings>;',
      'declare const field: JSFieldContext<Settings, number>;',
      'declare const action: JSActionContext<Settings>;',
      'declare const item: JSItemContext<Settings, string>;',
      'declare const runjs: RunJSContext<Settings, boolean>;',
      'const title: string = settingsContext.settings.title;',
      'const values = [record, data.record, block.element, pageFacade.uid, page.page.uid, field.value, action.event, item.value, runjs.input, title];',
      'const exact: Settings = assertSettings(defineSettings({ title: "Orders" }));',
      'export { exact, values };',
      '',
    ].join('\n');

    expect(getTypeScriptDiagnostics(declarations, source)).toEqual([]);
  });
});

function getTypeScriptDiagnostics(declarations: string, source: string): string[] {
  const files = new Map([
    [
      '/globals.d.ts',
      [
        'type Record<K extends string | number | symbol, T> = { [P in K]: T };',
        'interface Array<T> { readonly [index: number]: T; }',
        'interface Promise<T> {}',
        'interface HTMLElement {}',
        '',
      ].join('\n'),
    ],
    ['/sdk.d.ts', declarations],
    ['/index.ts', source],
  ]);
  const service = ts.createLanguageService({
    fileExists: (fileName) => files.has(fileName),
    getCompilationSettings: () => ({
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      noEmit: true,
      noLib: true,
      skipLibCheck: true,
      strictNullChecks: true,
      target: ts.ScriptTarget.ES2020,
      types: [],
    }),
    getCurrentDirectory: () => '/',
    getDefaultLibFileName: () => 'lib.d.ts',
    getScriptFileNames: () => [...files.keys()],
    getScriptSnapshot(fileName) {
      const content = files.get(fileName);
      return typeof content === 'string' ? ts.ScriptSnapshot.fromString(content) : undefined;
    },
    getScriptVersion: () => '1',
    readFile: (fileName) => files.get(fileName),
  });
  return [...files.keys()].flatMap((fileName) =>
    service
      .getSemanticDiagnostics(fileName)
      .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')),
  );
}
