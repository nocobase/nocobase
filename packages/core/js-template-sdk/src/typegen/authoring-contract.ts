/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const JS_TEMPLATE_SDK_CLIENT_IMPORT = '@nocobase/js-template-sdk/client';
export const JS_TEMPLATE_SDK_SHARED_IMPORT = '@nocobase/js-template-sdk/shared';

export type JsTemplateClientTypegenKind = 'js-block' | 'js-page' | 'js-field' | 'js-action' | 'js-item';

const authoringTypeNames = [
  'JsTemplateSettingsContext',
  'JsTemplateContextRecord',
  'JsTemplateDataContext',
  'JSBlockContext',
  'JSPageRuntimeFacade',
  'JSPageContext',
  'JSFieldContext',
  'JSActionContext',
  'JSItemContext',
  'RunJSContext',
] as const;

export type JsTemplateAuthoringTypeName = (typeof authoringTypeNames)[number];
export type JsTemplateSettingsContextTypeName = Extract<
  JsTemplateAuthoringTypeName,
  'JSBlockContext' | 'JSPageContext' | 'JSFieldContext' | 'JSActionContext' | 'JSItemContext'
>;

export interface JsTemplateAuthoringTypeParameterContract {
  defaultType: string;
  name: string;
}

export interface JsTemplateAuthoringTypeContract {
  buildTypeExpression: (typeArguments: readonly string[]) => string;
  name: JsTemplateAuthoringTypeName;
  parameters: readonly JsTemplateAuthoringTypeParameterContract[];
}

export interface JsTemplateAuthoringRuntimeHelperContract {
  buildDeclaration: (localName: string, mode: 'ambient' | 'javascript' | 'typescript') => string;
  name: 'assertSettings' | 'defineSettings';
  typeExpression: string;
}

export interface JsTemplateSdkAuthoringModuleContract {
  runtimeHelpers: ReadonlyMap<string, JsTemplateAuthoringRuntimeHelperContract>;
  specifier: string;
  types: ReadonlyMap<string, JsTemplateAuthoringTypeContract>;
}

const contextRecordType = 'Record<string, unknown>';
const pageRuntimeFacadeType =
  '{ readonly uid: string; readonly active: boolean; refresh(): Promise<void>; setDocumentTitle(title: string): void }';

const settingsParameter = Object.freeze({ name: 'TSettings', defaultType: 'unknown' });
const valueParameter = Object.freeze({ name: 'TValue', defaultType: 'unknown' });
const inputParameter = Object.freeze({ name: 'TInput', defaultType: 'unknown' });

function settingsContextBody(settingsType: string): string {
  return `{ settings: ${settingsType} }`;
}

function dataContextBody(settingsType: string): string {
  return `{ settings: ${settingsType}; record?: ${contextRecordType} | null; records?: ${contextRecordType}[]; values?: ${contextRecordType}; collection?: unknown; collectionField?: unknown; dataSource?: unknown }`;
}

function blockContextBody(settingsType: string): string {
  return `(${dataContextBody(
    settingsType,
  )} & { element?: HTMLElement | null; render?: (node: unknown) => void; i18n?: { t: (key: string, options?: Record<string, unknown>) => string } })`;
}

function actionContextBody(settingsType: string): string {
  return `(${dataContextBody(settingsType)} & { event?: unknown; formValues?: ${contextRecordType} })`;
}

function valueContextBody(settingsType: string, valueType: string): string {
  return `(${dataContextBody(settingsType)} & { value?: ${valueType} })`;
}

const authoringTypes = new Map<JsTemplateAuthoringTypeName, JsTemplateAuthoringTypeContract>([
  [
    'JsTemplateSettingsContext',
    {
      name: 'JsTemplateSettingsContext',
      parameters: [settingsParameter],
      buildTypeExpression: ([settingsType]) => settingsContextBody(settingsType),
    },
  ],
  [
    'JsTemplateContextRecord',
    {
      name: 'JsTemplateContextRecord',
      parameters: [],
      buildTypeExpression: () => contextRecordType,
    },
  ],
  [
    'JsTemplateDataContext',
    {
      name: 'JsTemplateDataContext',
      parameters: [settingsParameter],
      buildTypeExpression: ([settingsType]) => dataContextBody(settingsType),
    },
  ],
  [
    'JSBlockContext',
    {
      name: 'JSBlockContext',
      parameters: [settingsParameter],
      buildTypeExpression: ([settingsType]) => blockContextBody(settingsType),
    },
  ],
  [
    'JSPageRuntimeFacade',
    {
      name: 'JSPageRuntimeFacade',
      parameters: [],
      buildTypeExpression: () => pageRuntimeFacadeType,
    },
  ],
  [
    'JSPageContext',
    {
      name: 'JSPageContext',
      parameters: [settingsParameter],
      buildTypeExpression: ([settingsType]) =>
        `(${blockContextBody(settingsType)} & { page: ${pageRuntimeFacadeType} })`,
    },
  ],
  [
    'JSFieldContext',
    {
      name: 'JSFieldContext',
      parameters: [settingsParameter, valueParameter],
      buildTypeExpression: ([settingsType, valueType]) => valueContextBody(settingsType, valueType),
    },
  ],
  [
    'JSActionContext',
    {
      name: 'JSActionContext',
      parameters: [settingsParameter],
      buildTypeExpression: ([settingsType]) => actionContextBody(settingsType),
    },
  ],
  [
    'JSItemContext',
    {
      name: 'JSItemContext',
      parameters: [settingsParameter, valueParameter],
      buildTypeExpression: ([settingsType, valueType]) => valueContextBody(settingsType, valueType),
    },
  ],
  [
    'RunJSContext',
    {
      name: 'RunJSContext',
      parameters: [settingsParameter, inputParameter],
      buildTypeExpression: ([settingsType, inputType]) =>
        `(${dataContextBody(
          settingsType,
        )} & { input?: ${inputType}; event?: unknown; formValues?: ${contextRecordType} })`,
    },
  ],
]);

function buildSettingsRuntimeHelperDeclaration(
  localName: string,
  mode: 'ambient' | 'javascript' | 'typescript',
): string {
  if (mode === 'javascript') {
    return `function ${localName}(settings) { return settings; }`;
  }
  const declaration = `function ${localName}<TSettings>(settings: TSettings): TSettings`;
  return mode === 'ambient' ? `${declaration};` : `${declaration} { return settings; }`;
}

const runtimeHelperNames = ['defineSettings', 'assertSettings'] as const;
const runtimeHelpers = new Map<string, JsTemplateAuthoringRuntimeHelperContract>(
  runtimeHelperNames.map((name) => [
    name,
    {
      name,
      typeExpression: '<TSettings>(settings: TSettings) => TSettings',
      buildDeclaration: buildSettingsRuntimeHelperDeclaration,
    },
  ]),
);

const sharedTypeNames = ['JsTemplateSettingsContext', 'JsTemplateContextRecord', 'JsTemplateDataContext'] as const;
const clientTypeNames = [
  ...sharedTypeNames,
  'JSBlockContext',
  'JSPageRuntimeFacade',
  'JSPageContext',
  'JSFieldContext',
  'JSActionContext',
  'JSItemContext',
  'RunJSContext',
] as const;

export const JS_TEMPLATE_SDK_AUTHORING_MODULES: ReadonlyMap<string, JsTemplateSdkAuthoringModuleContract> = new Map([
  [
    JS_TEMPLATE_SDK_SHARED_IMPORT,
    {
      specifier: JS_TEMPLATE_SDK_SHARED_IMPORT,
      types: pickAuthoringTypes(sharedTypeNames),
      runtimeHelpers,
    },
  ],
  [
    JS_TEMPLATE_SDK_CLIENT_IMPORT,
    {
      specifier: JS_TEMPLATE_SDK_CLIENT_IMPORT,
      types: pickAuthoringTypes(clientTypeNames),
      runtimeHelpers,
    },
  ],
]);

const settingsContextTypeNames: Record<JsTemplateClientTypegenKind, JsTemplateSettingsContextTypeName> = {
  'js-block': 'JSBlockContext',
  'js-page': 'JSPageContext',
  'js-field': 'JSFieldContext',
  'js-action': 'JSActionContext',
  'js-item': 'JSItemContext',
};

export function getJsTemplateSettingsContextTypeName(
  kind: JsTemplateClientTypegenKind,
): JsTemplateSettingsContextTypeName {
  return settingsContextTypeNames[kind];
}

export function getJsTemplateAuthoringTypeContract(name: string): JsTemplateAuthoringTypeContract | undefined {
  return authoringTypes.get(name as JsTemplateAuthoringTypeName);
}

export function renderJsTemplateAuthoringTypeExpression(
  typeContract: JsTemplateAuthoringTypeContract,
  typeArguments: readonly string[],
): string {
  const resolvedArguments = typeContract.parameters.map(
    (parameter, index) => typeArguments[index] || parameter.defaultType,
  );
  return typeContract.buildTypeExpression(resolvedArguments);
}

export function renderJsTemplateAuthoringTypeDeclaration(
  typeContract: JsTemplateAuthoringTypeContract,
  localName: string = typeContract.name,
): string {
  const parameters = typeContract.parameters.length
    ? `<${typeContract.parameters.map((parameter) => `${parameter.name} = ${parameter.defaultType}`).join(', ')}>`
    : '';
  const body = typeContract.buildTypeExpression(typeContract.parameters.map((parameter) => parameter.name));
  return `type ${localName}${parameters} = ${body};`;
}

export function buildJsTemplateSdkDeclarations(): string {
  return [JS_TEMPLATE_SDK_SHARED_IMPORT, JS_TEMPLATE_SDK_CLIENT_IMPORT]
    .map((specifier) => {
      const moduleContract = JS_TEMPLATE_SDK_AUTHORING_MODULES.get(specifier);
      if (!moduleContract) {
        throw new Error(`Missing JS Template SDK authoring module contract for ${specifier}`);
      }
      return [
        `declare module "${moduleContract.specifier}" {`,
        ...[...moduleContract.types.values()].map(
          (typeContract) => `  export ${renderJsTemplateAuthoringTypeDeclaration(typeContract)}`,
        ),
        ...[...moduleContract.runtimeHelpers.values()].map(
          (helper) => `  export ${helper.buildDeclaration(helper.name, 'ambient')}`,
        ),
        '}',
      ].join('\n');
    })
    .join('\n\n');
}

function pickAuthoringTypes(
  names: readonly JsTemplateAuthoringTypeName[],
): ReadonlyMap<string, JsTemplateAuthoringTypeContract> {
  return new Map(
    names.map((name) => {
      const typeContract = authoringTypes.get(name);
      if (!typeContract) {
        throw new Error(`Missing JS Template authoring type contract for ${name}`);
      }
      return [name, typeContract] as const;
    }),
  );
}
