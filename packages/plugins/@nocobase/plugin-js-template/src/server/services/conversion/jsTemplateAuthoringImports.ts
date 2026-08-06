/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  parseSettingsTypeImport,
  type JsTemplateClientTypegenKind,
  type JsTemplateSettingsAuthoringContract,
  type JsTemplateSettingsAuthoringContractLookup,
} from '@nocobase/js-template-sdk/typegen';
import { posix as pathPosix } from 'path';
import ts from 'typescript';

export const JS_TEMPLATE_SDK_CLIENT_IMPORT = '@nocobase/js-template-sdk/client';
export const JS_TEMPLATE_SDK_SHARED_IMPORT = '@nocobase/js-template-sdk/shared';
export const JS_TEMPLATE_SETTINGS_IMPORT_PREFIX = 'js-template:settings/';

export type JsTemplateAuthoringImportDiagnosticCode =
  | 'import_not_allowed'
  | 'settings_type_import_invalid'
  | 'settings_type_import_runtime_not_allowed';

export interface JsTemplateAuthoringImportDiagnostic {
  code: JsTemplateAuthoringImportDiagnosticCode;
  severity: 'error';
  message: string;
  path: string;
  line: number;
  column: number;
}

export interface JsTemplateAuthoringImportAnalysis {
  recognized: boolean;
  diagnostics: JsTemplateAuthoringImportDiagnostic[];
  replacement?: string;
}

export interface RewriteJsTemplateAuthoringImportsResult {
  content: string;
  diagnostics: JsTemplateAuthoringImportDiagnostic[];
}

export interface JsTemplateAuthoringImportOptions {
  settingsContracts?: JsTemplateSettingsAuthoringContractLookup;
}

interface TypeParameterSpec {
  defaultType: string;
  name: string;
}

interface AuthoringTypeSpec {
  buildBody: (typeArguments: readonly string[]) => string;
  parameters: readonly TypeParameterSpec[];
}

interface SdkAuthoringModule {
  runtimeHelpers: ReadonlySet<string>;
  types: ReadonlyMap<string, AuthoringTypeSpec>;
}

interface SettingsAuthoringModule {
  contract?: JsTemplateSettingsAuthoringContract;
  kind: JsTemplateClientTypegenKind;
  specifier: string;
}

type AuthoringModule =
  | { kind: 'sdk'; module: SdkAuthoringModule; specifier: string }
  | { kind: 'settings'; module: SettingsAuthoringModule; specifier: string }
  | { kind: 'invalid-settings'; missingFromWorkspace?: boolean; specifier: string };

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

const publicAuthoringTypes = new Map<string, AuthoringTypeSpec>([
  [
    'JsTemplateSettingsContext',
    {
      parameters: [settingsParameter],
      buildBody: ([settingsType]) => settingsContextBody(settingsType),
    },
  ],
  [
    'JsTemplateContextRecord',
    {
      parameters: [],
      buildBody: () => contextRecordType,
    },
  ],
  [
    'JsTemplateDataContext',
    {
      parameters: [settingsParameter],
      buildBody: ([settingsType]) => dataContextBody(settingsType),
    },
  ],
  [
    'JSBlockContext',
    {
      parameters: [settingsParameter],
      buildBody: ([settingsType]) => blockContextBody(settingsType),
    },
  ],
  [
    'JSPageRuntimeFacade',
    {
      parameters: [],
      buildBody: () => pageRuntimeFacadeType,
    },
  ],
  [
    'JSPageContext',
    {
      parameters: [settingsParameter],
      buildBody: ([settingsType]) => `(${blockContextBody(settingsType)} & { page: ${pageRuntimeFacadeType} })`,
    },
  ],
  [
    'JSFieldContext',
    {
      parameters: [settingsParameter, valueParameter],
      buildBody: ([settingsType, valueType]) => valueContextBody(settingsType, valueType),
    },
  ],
  [
    'JSActionContext',
    {
      parameters: [settingsParameter],
      buildBody: ([settingsType]) => actionContextBody(settingsType),
    },
  ],
  [
    'JSItemContext',
    {
      parameters: [settingsParameter, valueParameter],
      buildBody: ([settingsType, valueType]) => valueContextBody(settingsType, valueType),
    },
  ],
  [
    'RunJSContext',
    {
      parameters: [settingsParameter, inputParameter],
      buildBody: ([settingsType, inputType]) =>
        `(${dataContextBody(
          settingsType,
        )} & { input?: ${inputType}; event?: unknown; formValues?: ${contextRecordType} })`,
    },
  ],
]);

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
const runtimeHelpers = new Set(['defineSettings', 'assertSettings']);

export const JS_TEMPLATE_PUBLIC_AUTHORING_TYPES = Object.freeze({
  [JS_TEMPLATE_SDK_CLIENT_IMPORT]: Object.freeze([...clientTypeNames]),
  [JS_TEMPLATE_SDK_SHARED_IMPORT]: Object.freeze([...sharedTypeNames]),
});

export const JS_TEMPLATE_PUBLIC_AUTHORING_RUNTIME_HELPERS = Object.freeze([...runtimeHelpers]);

const sdkAuthoringModules = new Map<string, SdkAuthoringModule>([
  [
    JS_TEMPLATE_SDK_CLIENT_IMPORT,
    {
      types: pickAuthoringTypes(clientTypeNames),
      runtimeHelpers,
    },
  ],
  [
    JS_TEMPLATE_SDK_SHARED_IMPORT,
    {
      types: pickAuthoringTypes(sharedTypeNames),
      runtimeHelpers,
    },
  ],
]);

export function isJsTemplateAuthoringModuleSpecifier(specifier: string): boolean {
  return sdkAuthoringModules.has(specifier) || specifier.startsWith(JS_TEMPLATE_SETTINGS_IMPORT_PREFIX);
}

export function analyzeJsTemplateAuthoringImportDeclaration(
  node: ts.ImportDeclaration,
  sourceFile: ts.SourceFile,
  options: JsTemplateAuthoringImportOptions = {},
): JsTemplateAuthoringImportAnalysis {
  if (!ts.isStringLiteral(node.moduleSpecifier)) {
    return unrecognizedAnalysis();
  }
  const authoringModule = classifyAuthoringModule(node.moduleSpecifier.text, options);
  if (!authoringModule) {
    return unrecognizedAnalysis();
  }
  if (authoringModule.kind === 'invalid-settings') {
    return invalidSettingsSpecifierAnalysis(
      sourceFile,
      node.moduleSpecifier.getStart(sourceFile),
      authoringModule.specifier,
      authoringModule.missingFromWorkspace,
    );
  }
  if (authoringModule.kind === 'settings') {
    return analyzeSettingsImportDeclaration(node, sourceFile, authoringModule.module);
  }
  return analyzeSdkImportDeclaration(node, sourceFile, authoringModule);
}

export function analyzeJsTemplateAuthoringImportTypeNode(
  node: ts.ImportTypeNode,
  sourceFile: ts.SourceFile,
  rewrittenTypeArguments?: readonly string[],
  options: JsTemplateAuthoringImportOptions = {},
): JsTemplateAuthoringImportAnalysis {
  const specifier = getImportTypeSpecifier(node);
  if (!specifier) {
    return unrecognizedAnalysis();
  }
  const authoringModule = classifyAuthoringModule(specifier, options);
  if (!authoringModule) {
    return unrecognizedAnalysis();
  }
  if (authoringModule.kind === 'invalid-settings') {
    return invalidSettingsSpecifierAnalysis(
      sourceFile,
      node.argument.getStart(sourceFile),
      specifier,
      authoringModule.missingFromWorkspace,
    );
  }

  const importedName = node.qualifier && ts.isIdentifier(node.qualifier) ? node.qualifier.text : null;
  if (!importedName) {
    return invalidImportTypeAnalysis(
      sourceFile,
      node.getStart(sourceFile),
      authoringModule,
      `Import type from "${specifier}" must select one public authoring export`,
    );
  }

  if (authoringModule.kind === 'settings') {
    if (node.isTypeOf || node.typeArguments?.length) {
      return invalidImportTypeAnalysis(
        sourceFile,
        node.getStart(sourceFile),
        authoringModule,
        `Settings import type "${importedName}" from "${specifier}" cannot use typeof or type arguments`,
      );
    }
    const replacement = buildSettingsTypeExpression(importedName, authoringModule.module);
    if (!replacement) {
      return invalidImportTypeAnalysis(
        sourceFile,
        node.qualifier?.getStart(sourceFile) || node.getStart(sourceFile),
        authoringModule,
        settingsTypeUnavailableMessage(importedName, authoringModule.module),
      );
    }
    return recognizedAnalysis(replacement);
  }

  if (node.isTypeOf) {
    if (!authoringModule.module.runtimeHelpers.has(importedName) || node.typeArguments?.length) {
      return invalidImportTypeAnalysis(
        sourceFile,
        node.getStart(sourceFile),
        authoringModule,
        `Runtime helper "${importedName}" is not available through this SDK import type`,
      );
    }
    return recognizedAnalysis('<TSettings>(settings: TSettings) => TSettings');
  }

  const typeSpec = authoringModule.module.types.get(importedName);
  if (!typeSpec) {
    return invalidImportTypeAnalysis(
      sourceFile,
      node.qualifier?.getStart(sourceFile) || node.getStart(sourceFile),
      authoringModule,
      `Type "${importedName}" is not a public authoring type from "${specifier}"`,
    );
  }
  const typeArguments =
    rewrittenTypeArguments || node.typeArguments?.map((argument) => argument.getText(sourceFile)) || [];
  if (typeArguments.length > typeSpec.parameters.length) {
    return invalidImportTypeAnalysis(
      sourceFile,
      node.getStart(sourceFile),
      authoringModule,
      `Type "${importedName}" from "${specifier}" accepts at most ${typeSpec.parameters.length} type arguments`,
    );
  }
  return recognizedAnalysis(renderTypeExpression(typeSpec, typeArguments));
}

export function rewriteJsTemplateAuthoringImports(
  path: string,
  content: string,
  options: JsTemplateAuthoringImportOptions = {},
): RewriteJsTemplateAuthoringImportsResult {
  const sourceFile = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true, scriptKind(path));
  const replacements: Array<{ start: number; end: number; value: string }> = [];
  const diagnostics: JsTemplateAuthoringImportDiagnostic[] = [];
  const namespaceTypes = new Map<string, ReadonlySet<string>>();
  const namespaceSpecifiers = new Map<string, string>();

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) {
      continue;
    }
    const analysis = analyzeJsTemplateAuthoringImportDeclaration(statement, sourceFile, options);
    diagnostics.push(...analysis.diagnostics);
    if (analysis.recognized && analysis.replacement !== undefined && analysis.diagnostics.length === 0) {
      const namespaceImport = getTypeNamespaceImport(statement);
      if (namespaceImport && ts.isStringLiteral(statement.moduleSpecifier)) {
        namespaceSpecifiers.set(namespaceImport, statement.moduleSpecifier.text);
        namespaceTypes.set(namespaceImport, getNamespaceTypeNames(statement.moduleSpecifier.text, options));
      }
      replacements.push({
        start: statement.getStart(sourceFile),
        end: statement.end,
        value: preserveStatementLineCount(
          analysis.replacement,
          sourceFile.text.slice(statement.getStart(sourceFile), statement.end),
        ),
      });
    }
  }

  const visitImportTypes = (node: ts.Node) => {
    if (ts.isQualifiedName(node) && ts.isIdentifier(node.left)) {
      const typeNames = namespaceTypes.get(node.left.text);
      if (typeNames) {
        if (typeNames.has(node.right.text)) {
          replacements.push({
            start: node.getStart(sourceFile),
            end: node.end,
            value: namespacedTypeName(node.left.text, node.right.text),
          });
        } else {
          diagnostics.push(
            createUnknownNamespaceTypeIssue(
              sourceFile,
              node.right.getStart(sourceFile),
              namespaceSpecifiers.get(node.left.text) || '',
              node.right.text,
            ),
          );
        }
        return;
      }
    }
    if (ts.isImportTypeNode(node)) {
      const typeArguments = node.typeArguments?.map((argument) =>
        rewriteNamespaceTypeReferences(argument, sourceFile, namespaceTypes, namespaceSpecifiers, diagnostics),
      );
      const analysis = analyzeJsTemplateAuthoringImportTypeNode(node, sourceFile, typeArguments, options);
      diagnostics.push(...analysis.diagnostics);
      if (analysis.recognized && analysis.replacement !== undefined && analysis.diagnostics.length === 0) {
        replacements.push({ start: node.getStart(sourceFile), end: node.end, value: analysis.replacement });
        return;
      }
    }
    ts.forEachChild(node, visitImportTypes);
  };
  visitImportTypes(sourceFile);

  return {
    content: replacements
      .sort((left, right) => right.start - left.start)
      .reduce(
        (current, replacement) =>
          `${current.slice(0, replacement.start)}${replacement.value}${current.slice(replacement.end)}`,
        content,
      ),
    diagnostics,
  };
}

function rewriteNamespaceTypeReferences(
  node: ts.TypeNode,
  sourceFile: ts.SourceFile,
  namespaceTypes: ReadonlyMap<string, ReadonlySet<string>>,
  namespaceSpecifiers: ReadonlyMap<string, string>,
  diagnostics: JsTemplateAuthoringImportDiagnostic[],
): string {
  const nodeStart = node.getStart(sourceFile);
  const replacements: Array<{ start: number; end: number; value: string }> = [];
  const visit = (current: ts.Node) => {
    if (ts.isQualifiedName(current) && ts.isIdentifier(current.left)) {
      const typeNames = namespaceTypes.get(current.left.text);
      if (typeNames) {
        if (typeNames.has(current.right.text)) {
          replacements.push({
            start: current.getStart(sourceFile) - nodeStart,
            end: current.end - nodeStart,
            value: namespacedTypeName(current.left.text, current.right.text),
          });
        } else {
          diagnostics.push(
            createUnknownNamespaceTypeIssue(
              sourceFile,
              current.right.getStart(sourceFile),
              namespaceSpecifiers.get(current.left.text) || '',
              current.right.text,
            ),
          );
        }
        return;
      }
    }
    ts.forEachChild(current, visit);
  };
  visit(node);
  return replacements
    .sort((left, right) => right.start - left.start)
    .reduce(
      (current, replacement) =>
        `${current.slice(0, replacement.start)}${replacement.value}${current.slice(replacement.end)}`,
      node.getText(sourceFile),
    );
}

function analyzeSdkImportDeclaration(
  node: ts.ImportDeclaration,
  sourceFile: ts.SourceFile,
  authoringModule: Extract<AuthoringModule, { kind: 'sdk' }>,
): JsTemplateAuthoringImportAnalysis {
  const importClause = node.importClause;
  if (!importClause) {
    return issueAnalysis(
      sourceFile,
      node.moduleSpecifier.getStart(sourceFile),
      'import_not_allowed',
      `Side-effect import from "${authoringModule.specifier}" is not allowed in js-template source`,
    );
  }
  if (importClause.name) {
    return issueAnalysis(
      sourceFile,
      importClause.name.getStart(sourceFile),
      'import_not_allowed',
      `Default import from "${authoringModule.specifier}" is not allowed in js-template source`,
    );
  }
  if (!importClause.namedBindings) {
    return issueAnalysis(
      sourceFile,
      importClause.getStart(sourceFile),
      'import_not_allowed',
      `Runtime import from "${authoringModule.specifier}" must use allowed helpers`,
    );
  }
  if (ts.isNamespaceImport(importClause.namedBindings)) {
    if (!importClause.isTypeOnly) {
      return issueAnalysis(
        sourceFile,
        importClause.namedBindings.getStart(sourceFile),
        'import_not_allowed',
        `Namespace import from "${authoringModule.specifier}" is only allowed as import type`,
      );
    }
    return recognizedAnalysis(
      `export {}; ${buildNamespacedTypeAliases(importClause.namedBindings.name.text, authoringModule.module.types)}`,
    );
  }

  if (!importClause.isTypeOnly && importClause.namedBindings.elements.length === 0) {
    return issueAnalysis(
      sourceFile,
      importClause.namedBindings.getStart(sourceFile),
      'import_not_allowed',
      `Runtime import from "${authoringModule.specifier}" must use allowed helpers`,
    );
  }

  const diagnostics: JsTemplateAuthoringImportDiagnostic[] = [];
  const declarations: string[] = [];
  for (const element of importClause.namedBindings.elements) {
    const importedName = element.propertyName?.text || element.name.text;
    if (importClause.isTypeOnly || element.isTypeOnly) {
      const typeSpec = authoringModule.module.types.get(importedName);
      if (!typeSpec) {
        diagnostics.push(
          createIssue(
            sourceFile,
            element.getStart(sourceFile),
            'import_not_allowed',
            `Type "${importedName}" is not a public authoring type from "${authoringModule.specifier}"`,
          ),
        );
        continue;
      }
      declarations.push(renderTypeDeclaration(typeSpec, element.name.text));
      continue;
    }
    if (!authoringModule.module.runtimeHelpers.has(importedName)) {
      diagnostics.push(
        createIssue(
          sourceFile,
          element.getStart(sourceFile),
          'import_not_allowed',
          `Runtime import "${importedName}" from "${authoringModule.specifier}" is not allowed in js-template source`,
        ),
      );
      continue;
    }
    declarations.push(buildRuntimeHelperDeclaration(element.name.text, sourceFile.scriptKind));
  }

  return {
    recognized: true,
    diagnostics,
    replacement: diagnostics.length === 0 ? `export {}; ${declarations.join(' ')}` : undefined,
  };
}

function analyzeSettingsImportDeclaration(
  node: ts.ImportDeclaration,
  sourceFile: ts.SourceFile,
  settingsModule: SettingsAuthoringModule,
): JsTemplateAuthoringImportAnalysis {
  const importClause = node.importClause;
  if (!importClause?.isTypeOnly) {
    return issueAnalysis(
      sourceFile,
      node.moduleSpecifier.getStart(sourceFile),
      'settings_type_import_runtime_not_allowed',
      `Settings type import "${settingsModule.specifier}" must use import type`,
    );
  }
  if (importClause.name) {
    return issueAnalysis(
      sourceFile,
      importClause.name.getStart(sourceFile),
      'settings_type_import_invalid',
      `Default import from "${settingsModule.specifier}" is not supported`,
    );
  }
  if (!importClause.namedBindings) {
    return issueAnalysis(
      sourceFile,
      importClause.getStart(sourceFile),
      'settings_type_import_invalid',
      `Settings type import "${settingsModule.specifier}" must select public settings types`,
    );
  }
  if (ts.isNamespaceImport(importClause.namedBindings)) {
    const aliases = buildNamespacedSettingsTypeAliases(importClause.namedBindings.name.text, settingsModule);
    return aliases
      ? recognizedAnalysis(`export {}; ${aliases}`)
      : issueAnalysis(
          sourceFile,
          importClause.namedBindings.getStart(sourceFile),
          'settings_type_import_invalid',
          `Settings module "${settingsModule.specifier}" does not provide every exact authoring type`,
        );
  }

  const diagnostics: JsTemplateAuthoringImportDiagnostic[] = [];
  const declarations: string[] = [];
  for (const element of importClause.namedBindings.elements) {
    const importedName = element.propertyName?.text || element.name.text;
    const body = buildSettingsTypeExpression(importedName, settingsModule);
    if (!body) {
      diagnostics.push(
        createIssue(
          sourceFile,
          element.getStart(sourceFile),
          'settings_type_import_invalid',
          settingsTypeUnavailableMessage(importedName, settingsModule),
        ),
      );
      continue;
    }
    declarations.push(`type ${element.name.text} = ${body};`);
  }
  return {
    recognized: true,
    diagnostics,
    replacement: diagnostics.length === 0 ? `export {}; ${declarations.join(' ')}` : undefined,
  };
}

function buildSettingsTypeExpression(importedName: string, settingsModule: SettingsAuthoringModule): string | null {
  if (importedName === 'Settings') {
    return settingsModule.contract
      ? nonEmptyTypeExpression(settingsModule.contract.settingsTypeExpression)
      : contextRecordType;
  }
  if (importedName === 'SettingsSchemaSummary') {
    return settingsModule.contract
      ? nonEmptyTypeExpression(settingsModule.contract.settingsSchemaSummaryTypeExpression)
      : contextRecordType;
  }
  if (!settingsModule.contract && importedName !== 'Context') {
    return null;
  }
  if (!settingsModule.contract && importedName === 'Context') {
    const contextTypeName: Record<JsTemplateClientTypegenKind, string> = {
      'js-block': 'JSBlockContext',
      'js-page': 'JSPageContext',
      'js-field': 'JSFieldContext',
      'js-action': 'JSActionContext',
      'js-item': 'JSItemContext',
    };
    const contextType = publicAuthoringTypes.get(contextTypeName[settingsModule.kind]);
    return contextType ? renderTypeExpression(contextType, [contextRecordType]) : null;
  }
  if (importedName !== 'Context') {
    return null;
  }
  const contextType = publicAuthoringTypes.get(settingsModule.contract.context.publicTypeName);
  const settingsTypeExpression = nonEmptyTypeExpression(settingsModule.contract.context.settingsTypeExpression);
  if (!contextType || !settingsTypeExpression) {
    return null;
  }
  return renderTypeExpression(contextType, [settingsTypeExpression]);
}

function buildNamespacedSettingsTypeAliases(localName: string, settingsModule: SettingsAuthoringModule): string | null {
  const settingsBody = buildSettingsTypeExpression('Settings', settingsModule);
  const summaryBody = buildSettingsTypeExpression('SettingsSchemaSummary', settingsModule);
  const contextBody = buildSettingsTypeExpression('Context', settingsModule);
  if (!settingsBody || !summaryBody || !contextBody) {
    return null;
  }
  return [
    `type ${namespacedTypeName(localName, 'Settings')} = ${settingsBody};`,
    `type ${namespacedTypeName(localName, 'SettingsSchemaSummary')} = ${summaryBody};`,
    `type ${namespacedTypeName(localName, 'Context')} = ${contextBody};`,
  ].join(' ');
}

function settingsTypeUnavailableMessage(importedName: string, settingsModule: SettingsAuthoringModule): string {
  if (
    settingsModule.contract &&
    (importedName === 'Settings' || importedName === 'SettingsSchemaSummary' || importedName === 'Context')
  ) {
    return `Settings module "${settingsModule.specifier}" does not provide an exact "${importedName}" authoring type`;
  }
  return `Type "${importedName}" is not exported by settings module "${settingsModule.specifier}"`;
}

function nonEmptyTypeExpression(expression: string): string | null {
  return expression.trim() ? expression : null;
}

function buildNamespacedTypeAliases(localName: string, types: ReadonlyMap<string, AuthoringTypeSpec>): string {
  return [...types]
    .map(([name, typeSpec]) => renderTypeDeclaration(typeSpec, namespacedTypeName(localName, name)))
    .join(' ');
}

function buildRuntimeHelperDeclaration(localName: string, sourceScriptKind: ts.ScriptKind): string {
  if (sourceScriptKind === ts.ScriptKind.JS || sourceScriptKind === ts.ScriptKind.JSX) {
    return `function ${localName}(settings) { return settings; }`;
  }
  return `function ${localName}<TSettings>(settings: TSettings): TSettings { return settings; }`;
}

function renderTypeDeclaration(typeSpec: AuthoringTypeSpec, localName: string): string {
  const parameters = typeSpec.parameters.length
    ? `<${typeSpec.parameters.map((parameter) => `${parameter.name} = ${parameter.defaultType}`).join(', ')}>`
    : '';
  const body = typeSpec.buildBody(typeSpec.parameters.map((parameter) => parameter.name));
  return `type ${localName}${parameters} = ${body};`;
}

function renderTypeExpression(typeSpec: AuthoringTypeSpec, typeArguments: readonly string[]): string {
  const resolvedArguments = typeSpec.parameters.map(
    (parameter, index) => typeArguments[index] || parameter.defaultType,
  );
  return typeSpec.buildBody(resolvedArguments);
}

function classifyAuthoringModule(
  specifier: string,
  options: JsTemplateAuthoringImportOptions = {},
): AuthoringModule | null {
  const sdkModule = sdkAuthoringModules.get(specifier);
  if (sdkModule) {
    return { kind: 'sdk', module: sdkModule, specifier };
  }
  if (!specifier.startsWith(JS_TEMPLATE_SETTINGS_IMPORT_PREFIX)) {
    return null;
  }
  const settingsImport = parseSettingsTypeImport(specifier);
  if (!settingsImport) {
    return { kind: 'invalid-settings', specifier };
  }
  const contract = options.settingsContracts?.get(specifier);
  if (options.settingsContracts && !contract) {
    return { kind: 'invalid-settings', missingFromWorkspace: true, specifier };
  }
  return {
    kind: 'settings',
    module: { contract, kind: settingsImport.kind, specifier },
    specifier,
  };
}

function getImportTypeSpecifier(node: ts.ImportTypeNode): string | null {
  return ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)
    ? node.argument.literal.text
    : null;
}

function getTypeNamespaceImport(node: ts.ImportDeclaration): string | null {
  const importClause = node.importClause;
  return importClause?.isTypeOnly && importClause.namedBindings && ts.isNamespaceImport(importClause.namedBindings)
    ? importClause.namedBindings.name.text
    : null;
}

function getNamespaceTypeNames(specifier: string, options: JsTemplateAuthoringImportOptions = {}): ReadonlySet<string> {
  const authoringModule = classifyAuthoringModule(specifier, options);
  if (!authoringModule || authoringModule.kind === 'invalid-settings') {
    return new Set();
  }
  if (authoringModule.kind === 'settings') {
    return new Set(['Settings', 'SettingsSchemaSummary', 'Context']);
  }
  return new Set(authoringModule.module.types.keys());
}

function namespacedTypeName(namespaceName: string, typeName: string): string {
  return `__jsTemplateAuthoring_${namespaceName}_${typeName}`;
}

function createUnknownNamespaceTypeIssue(
  sourceFile: ts.SourceFile,
  position: number,
  specifier: string,
  importedName: string,
): JsTemplateAuthoringImportDiagnostic {
  const authoringModule = classifyAuthoringModule(specifier);
  if (authoringModule?.kind === 'settings') {
    return createIssue(
      sourceFile,
      position,
      'settings_type_import_invalid',
      `Type "${importedName}" is not exported by settings module "${specifier}"`,
    );
  }
  return createIssue(
    sourceFile,
    position,
    'import_not_allowed',
    `Type "${importedName}" is not a public authoring type from "${specifier}"`,
  );
}

function invalidImportTypeAnalysis(
  sourceFile: ts.SourceFile,
  position: number,
  authoringModule: Exclude<AuthoringModule, { kind: 'invalid-settings' }>,
  message: string,
): JsTemplateAuthoringImportAnalysis {
  return issueAnalysis(
    sourceFile,
    position,
    authoringModule.kind === 'settings' ? 'settings_type_import_invalid' : 'import_not_allowed',
    message,
  );
}

function invalidSettingsSpecifierAnalysis(
  sourceFile: ts.SourceFile,
  position: number,
  specifier: string,
  missingFromWorkspace = false,
): JsTemplateAuthoringImportAnalysis {
  return issueAnalysis(
    sourceFile,
    position,
    'settings_type_import_invalid',
    missingFromWorkspace
      ? `Settings type import "${specifier}" does not exist in the current workspace`
      : `Settings type import "${specifier}" is not valid`,
  );
}

function issueAnalysis(
  sourceFile: ts.SourceFile,
  position: number,
  code: JsTemplateAuthoringImportDiagnosticCode,
  message: string,
): JsTemplateAuthoringImportAnalysis {
  return { recognized: true, diagnostics: [createIssue(sourceFile, position, code, message)] };
}

function createIssue(
  sourceFile: ts.SourceFile,
  position: number,
  code: JsTemplateAuthoringImportDiagnosticCode,
  message: string,
): JsTemplateAuthoringImportDiagnostic {
  const location = sourceFile.getLineAndCharacterOfPosition(position);
  return {
    code,
    severity: 'error',
    message,
    path: sourceFile.fileName,
    line: location.line + 1,
    column: location.character + 1,
  };
}

function recognizedAnalysis(replacement: string): JsTemplateAuthoringImportAnalysis {
  return { recognized: true, diagnostics: [], replacement };
}

function unrecognizedAnalysis(): JsTemplateAuthoringImportAnalysis {
  return { recognized: false, diagnostics: [] };
}

function preserveStatementLineCount(replacement: string, original: string): string {
  const originalLineBreaks = (original.match(/\n/gu) || []).length;
  return `${replacement}${'\n'.repeat(originalLineBreaks)}`;
}

function pickAuthoringTypes(names: readonly string[]): ReadonlyMap<string, AuthoringTypeSpec> {
  const entries = names.flatMap((name) => {
    const typeSpec = publicAuthoringTypes.get(name);
    return typeSpec ? [[name, typeSpec] as const] : [];
  });
  return new Map(entries);
}

function scriptKind(path: string): ts.ScriptKind {
  const extension = pathPosix.extname(path);
  if (extension === '.tsx') return ts.ScriptKind.TSX;
  if (extension === '.jsx') return ts.ScriptKind.JSX;
  if (extension === '.js') return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}
