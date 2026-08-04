/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { buildJsTemplateSettingsSchema } from '../schema/contracts';

export type JsTemplateClientTypegenKind = 'js-block' | 'js-page' | 'js-field' | 'js-action' | 'js-item';

export interface JsTemplateSettingsTypegenSourceFile {
  path: string;
  content?: string;
}

export interface JsTemplateSettingsTypegenFile {
  path: string;
  content: string;
}

export interface JsTemplateSettingsTypegenDiagnostic {
  code: string;
  severity: 'error';
  message: string;
  path?: string;
  kind?: JsTemplateClientTypegenKind;
  templateName?: string;
  details?: Record<string, unknown>;
}

export interface JsTemplateSettingsTypegenTemplate {
  target: 'client';
  kind: JsTemplateClientTypegenKind;
  directoryName: string;
  templateName: string;
  entryKey: string;
  descriptorPath: string;
  sourceRoot: string;
  virtualImport: string;
  outputPath: string;
  schema: Record<string, unknown>;
  schemaHash: string;
}

export interface JsTemplateSettingsTypegenResult {
  templates: JsTemplateSettingsTypegenTemplate[];
  files: JsTemplateSettingsTypegenFile[];
  diagnostics: JsTemplateSettingsTypegenDiagnostic[];
}

export interface JsTemplateActiveTemplateContextResult {
  template?: JsTemplateSettingsTypegenTemplate;
  file?: JsTemplateSettingsTypegenFile;
  globalContextType?: string;
}

type JsonSchemaLike = {
  type?: unknown;
  enum?: unknown;
  required?: unknown;
  properties?: unknown;
  items?: unknown;
};

export const JS_TEMPLATE_GENERATED_TYPES_ROOT = '.js-template/types';
export const JS_TEMPLATE_ACTIVE_TEMPLATE_CONTEXT_PATH = `${JS_TEMPLATE_GENERATED_TYPES_ROOT}/__active-template-context.d.ts`;
export const JS_TEMPLATE_SDK_DECLARATIONS_PATH = `${JS_TEMPLATE_GENERATED_TYPES_ROOT}/sdk.d.ts`;
export const JS_TEMPLATE_SETTINGS_MODULES_PATH = `${JS_TEMPLATE_GENERATED_TYPES_ROOT}/modules.d.ts`;
export const JS_TEMPLATE_SETTINGS_IMPORT_PREFIX = 'js-template:settings/';
export const JS_TEMPLATE_ACTIVE_TEMPLATE_CONTEXT_TYPE = 'JsTemplateActiveTemplateContext';

const entryKeyPattern = /^[a-z0-9][a-z0-9-]{0,62}$/;
const emptySettingsSchema: Record<string, unknown> = { type: 'object', properties: {} };

const clientKindRoots: Array<{ kind: JsTemplateClientTypegenKind; root: string }> = [
  { kind: 'js-block', root: 'src/client/js-blocks' },
  { kind: 'js-page', root: 'src/client/js-pages' },
  { kind: 'js-field', root: 'src/client/js-fields' },
  { kind: 'js-action', root: 'src/client/js-actions' },
  { kind: 'js-item', root: 'src/client/js-items' },
];

const contextTypes: Record<JsTemplateClientTypegenKind, string> = {
  'js-block': 'JSBlockContext',
  'js-page': 'JSPageContext',
  'js-field': 'JSFieldContext',
  'js-action': 'JSActionContext',
  'js-item': 'JSItemContext',
};

export function generateClientSettingsTypes(input: {
  files: JsTemplateSettingsTypegenSourceFile[];
}): JsTemplateSettingsTypegenResult {
  const sourceFiles = normalizeSourceFiles(input.files);
  const diagnostics: JsTemplateSettingsTypegenDiagnostic[] = [];
  const templates = collectClientSettingsTemplates(sourceFiles, diagnostics);

  return buildSettingsTypegenResult(templates, diagnostics);
}

export function generateInlineClientSettingsTypes(input: {
  descriptorPath?: string;
  files: JsTemplateSettingsTypegenSourceFile[];
  kind: JsTemplateClientTypegenKind;
  sourceRoot?: string;
}): JsTemplateSettingsTypegenResult {
  const sourceFiles = normalizeSourceFiles(input.files);
  const diagnostics: JsTemplateSettingsTypegenDiagnostic[] = [];
  const descriptorPath = normalizeSourcePath(input.descriptorPath || 'src/client/entry.json');
  const descriptorFile = sourceFiles.find((file) => file.path === descriptorPath);
  const descriptor = descriptorFile
    ? parseEntryDescriptor(descriptorFile, { kind: input.kind, directoryName: 'inline' }, diagnostics)
    : null;
  const templates = descriptor
    ? [
        createClientSettingsTypegenTemplate({
          descriptor,
          descriptorPath,
          directoryName: 'inline',
          kind: input.kind,
          sourceRoot: normalizeSourcePath(input.sourceRoot || descriptorPath.replace(/\/[^/]+$/u, '')),
        }),
      ]
    : [];

  return buildSettingsTypegenResult(templates, diagnostics);
}

function buildSettingsTypegenResult(
  templates: JsTemplateSettingsTypegenTemplate[],
  diagnostics: JsTemplateSettingsTypegenDiagnostic[],
): JsTemplateSettingsTypegenResult {
  return {
    templates,
    files: buildGeneratedFiles(templates),
    diagnostics: sortDiagnostics(diagnostics),
  };
}

export function createActiveTemplateContextType(input: {
  activePath?: string;
  templates: JsTemplateSettingsTypegenTemplate[];
}): JsTemplateActiveTemplateContextResult {
  const activePath = normalizeSourcePath(input.activePath || '');
  if (!activePath) {
    return {};
  }

  const template = input.templates.find(
    (candidate) => activePath === candidate.descriptorPath || activePath.startsWith(`${candidate.sourceRoot}/`),
  );
  if (!template) {
    return {};
  }

  return {
    template,
    globalContextType: JS_TEMPLATE_ACTIVE_TEMPLATE_CONTEXT_TYPE,
    file: {
      path: JS_TEMPLATE_ACTIVE_TEMPLATE_CONTEXT_PATH,
      content: [
        generatedHeader(),
        `import type { Context } from "${template.virtualImport}";`,
        '',
        'declare global {',
        `  type ${JS_TEMPLATE_ACTIVE_TEMPLATE_CONTEXT_TYPE} = RunJSContext & Context;`,
        '}',
        '',
        'export {};',
        '',
      ].join('\n'),
    },
  };
}

export function parseSettingsTypeImport(
  specifier: string,
): { target: 'client'; kind: JsTemplateClientTypegenKind; templateName: string } | null {
  if (!specifier.startsWith(JS_TEMPLATE_SETTINGS_IMPORT_PREFIX)) {
    return null;
  }
  const [target, kind, templateName, ...rest] = specifier.slice(JS_TEMPLATE_SETTINGS_IMPORT_PREFIX.length).split('/');
  if (
    target === 'client' &&
    clientKindRoots.some((item) => item.kind === kind) &&
    typeof templateName === 'string' &&
    isValidTemplateName(templateName) &&
    rest.length === 0
  ) {
    return {
      target,
      kind: kind as JsTemplateClientTypegenKind,
      templateName,
    };
  }
  return null;
}

export function isNamespacedSettingsTypeImport(specifier: string): boolean {
  return Boolean(parseSettingsTypeImport(specifier));
}

function collectClientSettingsTemplates(
  files: Array<Required<JsTemplateSettingsTypegenSourceFile>>,
  diagnostics: JsTemplateSettingsTypegenDiagnostic[],
): JsTemplateSettingsTypegenTemplate[] {
  const templates: JsTemplateSettingsTypegenTemplate[] = [];
  const seenEntryKeys = new Set<string>();

  for (const file of files.sort((left, right) => left.path.localeCompare(right.path))) {
    const parsed = parseClientEntryDescriptorPath(file.path);
    if (!parsed) continue;

    const descriptor = parseEntryDescriptor(file, parsed, diagnostics);
    if (!descriptor) continue;

    const entryKey = `client/${parsed.kind}/${descriptor.key}`;
    if (seenEntryKeys.has(entryKey)) {
      diagnostics.push({
        code: 'settings_typegen_entry_key_duplicate',
        severity: 'error',
        message: `Entry key "${descriptor.key}" is duplicated for ${parsed.kind}`,
        path: file.path,
        kind: parsed.kind,
        templateName: descriptor.key,
      });
      continue;
    }
    seenEntryKeys.add(entryKey);

    templates.push(
      createClientSettingsTypegenTemplate({
        descriptor,
        descriptorPath: file.path,
        directoryName: parsed.directoryName,
        kind: parsed.kind,
        sourceRoot: `${parsed.root}/${parsed.directoryName}`,
      }),
    );
  }

  return templates.sort((left, right) => left.entryKey.localeCompare(right.entryKey));
}

function createClientSettingsTypegenTemplate(input: {
  descriptor: { key: string; settingsSchema: Record<string, unknown> | null };
  descriptorPath: string;
  directoryName: string;
  kind: JsTemplateClientTypegenKind;
  sourceRoot: string;
}): JsTemplateSettingsTypegenTemplate {
  const schema = input.descriptor.settingsSchema || emptySettingsSchema;
  const entryKey = `client/${input.kind}/${input.descriptor.key}`;
  return {
    target: 'client',
    kind: input.kind,
    directoryName: input.directoryName,
    templateName: input.descriptor.key,
    entryKey,
    descriptorPath: input.descriptorPath,
    sourceRoot: input.sourceRoot,
    virtualImport: `${JS_TEMPLATE_SETTINGS_IMPORT_PREFIX}${entryKey}`,
    outputPath: `${JS_TEMPLATE_GENERATED_TYPES_ROOT}/client/${input.kind}/${input.descriptor.key}.d.ts`,
    schema,
    schemaHash: shortHash(stableSerialize(schema)),
  };
}

function parseEntryDescriptor(
  file: Required<JsTemplateSettingsTypegenSourceFile>,
  parsed: { kind: JsTemplateClientTypegenKind; directoryName: string },
  diagnostics: JsTemplateSettingsTypegenDiagnostic[],
): { key: string; settingsSchema: Record<string, unknown> | null } | null {
  try {
    const value = JSON.parse(file.content) as unknown;
    if (!isRecord(value) || typeof value.key !== 'string' || !isValidTemplateName(value.key)) {
      throw new Error('entry.json must contain a valid key to generate settings types');
    }
    if (typeof value.settings !== 'undefined' && !isRecord(value.settings)) {
      throw new Error('entry.json settings must be an object');
    }
    if (typeof value.settingsSchema !== 'undefined') {
      throw new Error('entry.json settingsSchema is not supported; use settings');
    }
    return {
      key: value.key,
      settingsSchema: isRecord(value.settings) ? buildJsTemplateSettingsSchema(value.settings) : null,
    };
  } catch (error) {
    diagnostics.push({
      code: 'settings_typegen_schema_invalid',
      severity: 'error',
      message: error instanceof Error ? error.message : 'entry.json is invalid',
      path: file.path,
      kind: parsed.kind,
      templateName: parsed.directoryName,
    });
    return null;
  }
}

function buildGeneratedFiles(templates: JsTemplateSettingsTypegenTemplate[]): JsTemplateSettingsTypegenFile[] {
  return [
    { path: JS_TEMPLATE_SDK_DECLARATIONS_PATH, content: buildSdkDeclarations() },
    ...templates.map((template) => ({ path: template.outputPath, content: buildTemplateTypes(template) })),
    { path: JS_TEMPLATE_SETTINGS_MODULES_PATH, content: buildVirtualSettingsModules(templates) },
    { path: `${JS_TEMPLATE_GENERATED_TYPES_ROOT}/index.d.ts`, content: buildIndexTypes(templates) },
  ];
}

function buildVirtualSettingsModules(templates: JsTemplateSettingsTypegenTemplate[]): string {
  return [
    generatedHeader(),
    ...templates.flatMap((template) => [
      '',
      `declare module "${template.virtualImport}" {`,
      `  export type Settings = import("./client/${template.kind}/${template.templateName}").Settings;`,
      `  export type SettingsSchemaSummary = import("./client/${template.kind}/${template.templateName}").SettingsSchemaSummary;`,
      `  export type Context = import("./client/${template.kind}/${template.templateName}").Context;`,
      '}',
    ]),
    '',
  ].join('\n');
}

function buildTemplateTypes(template: JsTemplateSettingsTypegenTemplate): string {
  const contextType = contextTypes[template.kind];
  return [
    generatedHeader(),
    `import type { ${contextType} } from "@nocobase/js-template-sdk/client";`,
    '',
    'export type SettingsSchemaSummary = {',
    '  target: "client";',
    `  kind: "${template.kind}";`,
    `  templateName: "${template.templateName}";`,
    `  entryKey: "${template.entryKey}";`,
    `  descriptorPath: "${template.descriptorPath}";`,
    `  virtualImport: "${template.virtualImport}";`,
    `  schemaHash: "${template.schemaHash}";`,
    '};',
    '',
    `export interface Settings ${schemaObjectToTypeBody(template.schema)}`,
    '',
    `export type Context = ${contextType}<Settings>;`,
    '',
  ].join('\n');
}

function buildIndexTypes(templates: JsTemplateSettingsTypegenTemplate[]): string {
  const imports = templates.map(
    (template) =>
      `import type { Settings as ${templateTypeIdentifier(template)} } from "./client/${template.kind}/${
        template.templateName
      }";`,
  );
  const mapEntries = templates.map((template) => `  "${template.entryKey}": ${templateTypeIdentifier(template)};`);
  return [
    generatedHeader(),
    ...imports,
    '',
    'export interface JsTemplateSettingsMap {',
    ...mapEntries,
    '}',
    '',
    'export type JsTemplateKey = keyof JsTemplateSettingsMap;',
    'export type JsTemplateSettings<TKey extends JsTemplateKey> = JsTemplateSettingsMap[TKey];',
    '',
  ].join('\n');
}

function buildSdkDeclarations(): string {
  return `${generatedHeader()}
declare module "@nocobase/js-template-sdk/shared" {
  export interface JsTemplateSettingsContext<TSettings = unknown> { settings: TSettings; }
  export type JsTemplateContextRecord = Record<string, unknown>;
  export interface JsTemplateDataContext<TSettings = unknown> extends JsTemplateSettingsContext<TSettings> {
    record?: JsTemplateContextRecord | null;
    records?: JsTemplateContextRecord[];
    values?: JsTemplateContextRecord;
    collection?: unknown;
    collectionField?: unknown;
    dataSource?: unknown;
  }
  export function defineSettings<TSettings>(settings: TSettings): TSettings;
  export function assertSettings<TSettings>(settings: TSettings): TSettings;
}

declare module "@nocobase/js-template-sdk/client" {
  import type { JsTemplateDataContext, JsTemplateContextRecord } from "@nocobase/js-template-sdk/shared";
  export type { JsTemplateDataContext, JsTemplateContextRecord, JsTemplateSettingsContext } from "@nocobase/js-template-sdk/shared";
  export { assertSettings, defineSettings } from "@nocobase/js-template-sdk/shared";
  export interface JSBlockContext<TSettings = unknown> extends JsTemplateDataContext<TSettings> {
    element?: HTMLElement | null;
    render?: (node: unknown) => void;
    i18n?: { t: (key: string, options?: Record<string, unknown>) => string };
  }
  export interface JSPageRuntimeFacade { readonly uid: string; readonly active: boolean; refresh(): Promise<void>; setDocumentTitle(title: string): void; }
  export interface JSPageContext<TSettings = unknown> extends JSBlockContext<TSettings> { page: JSPageRuntimeFacade; }
  export interface JSFieldContext<TSettings = unknown, TValue = unknown> extends JsTemplateDataContext<TSettings> { value?: TValue; }
  export interface JSActionContext<TSettings = unknown> extends JsTemplateDataContext<TSettings> { event?: unknown; formValues?: JsTemplateContextRecord; }
  export interface JSItemContext<TSettings = unknown, TValue = unknown> extends JsTemplateDataContext<TSettings> { value?: TValue; }
  export interface RunJSContext<TSettings = unknown, TInput = unknown> extends JsTemplateDataContext<TSettings> { input?: TInput; event?: unknown; formValues?: JsTemplateContextRecord; }
}
`;
}

function schemaObjectToTypeBody(schema: Record<string, unknown>): string {
  const schemaLike = schema as JsonSchemaLike;
  const properties = isRecord(schemaLike.properties) ? schemaLike.properties : {};
  const required = new Set(Array.isArray(schemaLike.required) ? schemaLike.required.filter(isString) : []);
  const lines = Object.entries(properties)
    .filter(([, propertySchema]) => isRecord(propertySchema))
    .map(([propertyName, propertySchema]) => {
      const optional = required.has(propertyName) ? '' : '?';
      return `  ${quotePropertyName(propertyName)}${optional}: ${schemaToType(propertySchema as JsonSchemaLike)};`;
    });
  return lines.length ? `{\n${lines.join('\n')}\n}` : '{}';
}

function schemaToType(schema: JsonSchemaLike): string {
  if (Array.isArray(schema.enum)) {
    return schema.enum.map(literalToType).join(' | ') || 'unknown';
  }
  const type = normalizeSchemaType(schema);
  if (type === 'string') return 'string';
  if (type === 'number' || type === 'integer') return 'number';
  if (type === 'boolean') return 'boolean';
  if (type === 'array') {
    return `Array<${isRecord(schema.items) ? schemaToType(schema.items as JsonSchemaLike) : 'unknown'}>`;
  }
  if (type === 'object') return schemaObjectToTypeBody(schema as Record<string, unknown>);
  return 'unknown';
}

function normalizeSchemaType(schema: JsonSchemaLike): string | undefined {
  if (Array.isArray(schema.type)) {
    return schema.type.find((item): item is string => typeof item === 'string' && item !== 'null');
  }
  if (typeof schema.type === 'string') return schema.type;
  if (isRecord(schema.properties) || Array.isArray(schema.required)) return 'object';
  if (isRecord(schema.items)) return 'array';
  return undefined;
}

function literalToType(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null
    ? JSON.stringify(value)
    : 'unknown';
}

function parseClientEntryDescriptorPath(
  path: string,
): { kind: JsTemplateClientTypegenKind; directoryName: string; root: string } | null {
  for (const item of clientKindRoots) {
    const prefix = `${item.root}/`;
    if (!path.startsWith(prefix) || !path.endsWith('/entry.json')) continue;
    const segments = path.slice(prefix.length).split('/');
    if (segments.length === 2 && segments[1] === 'entry.json' && isValidTemplateName(segments[0])) {
      return { kind: item.kind, directoryName: segments[0], root: item.root };
    }
  }
  return null;
}

function templateTypeIdentifier(template: JsTemplateSettingsTypegenTemplate): string {
  return `${toPascalCase(template.target)}${toPascalCase(template.kind)}${toPascalCase(template.templateName)}Settings`;
}

function toPascalCase(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((item) => `${item.charAt(0).toUpperCase()}${item.slice(1)}`)
    .join('');
}

function quotePropertyName(propertyName: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(propertyName) ? propertyName : JSON.stringify(propertyName);
}

function isValidTemplateName(value: string): boolean {
  return entryKeyPattern.test(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeSourcePath(path: string): string {
  return path
    .trim()
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/^\.\/+/, '')
    .replace(/^\/+|\/+$/g, '');
}

function normalizeSourceFiles(
  files: JsTemplateSettingsTypegenSourceFile[],
): Array<Required<JsTemplateSettingsTypegenSourceFile>> {
  return files.map((file) => ({
    path: normalizeSourcePath(file.path),
    content: typeof file.content === 'string' ? file.content : '',
  }));
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(',')}}`;
  }
  const serialized = JSON.stringify(value);
  return typeof serialized === 'undefined' ? 'undefined' : serialized;
}

function shortHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36).padStart(6, '0').slice(0, 8);
}

function generatedHeader(): string {
  return '/* Generated by NocoBase js-template settings typegen. Do not edit by hand. */';
}

function sortDiagnostics(diagnostics: JsTemplateSettingsTypegenDiagnostic[]): JsTemplateSettingsTypegenDiagnostic[] {
  return [...diagnostics].sort((left, right) =>
    `${left.path || ''}:${left.code}`.localeCompare(`${right.path || ''}:${right.code}`),
  );
}
