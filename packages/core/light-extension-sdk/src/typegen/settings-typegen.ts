/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { buildLightExtensionSettingsSchema } from '../schema/contracts';

export type LightExtensionClientTypegenKind = 'js-block' | 'js-page' | 'js-field' | 'js-action' | 'js-item' | 'runjs';

export interface LightExtensionSettingsTypegenSourceFile {
  path: string;
  content?: string;
}

export interface LightExtensionSettingsTypegenFile {
  path: string;
  content: string;
}

export interface LightExtensionSettingsTypegenDiagnostic {
  code: string;
  severity: 'error';
  message: string;
  path?: string;
  kind?: LightExtensionClientTypegenKind;
  entryName?: string;
  details?: Record<string, unknown>;
}

export interface LightExtensionSettingsTypegenEntry {
  target: 'client';
  kind: LightExtensionClientTypegenKind;
  directoryName: string;
  entryName: string;
  entryKey: string;
  descriptorPath: string;
  sourceRoot: string;
  virtualImport: string;
  outputPath: string;
  schema: Record<string, unknown>;
  schemaHash: string;
}

export interface LightExtensionSettingsTypegenResult {
  entries: LightExtensionSettingsTypegenEntry[];
  files: LightExtensionSettingsTypegenFile[];
  diagnostics: LightExtensionSettingsTypegenDiagnostic[];
}

export interface LightExtensionActiveEntryContextResult {
  entry?: LightExtensionSettingsTypegenEntry;
  file?: LightExtensionSettingsTypegenFile;
  globalContextType?: string;
}

type JsonSchemaLike = {
  type?: unknown;
  enum?: unknown;
  required?: unknown;
  properties?: unknown;
  items?: unknown;
};

export const LIGHT_EXTENSION_GENERATED_TYPES_ROOT = '.light-extension/types';
export const LIGHT_EXTENSION_ACTIVE_ENTRY_CONTEXT_PATH = `${LIGHT_EXTENSION_GENERATED_TYPES_ROOT}/__active-entry-context.d.ts`;
export const LIGHT_EXTENSION_SDK_DECLARATIONS_PATH = `${LIGHT_EXTENSION_GENERATED_TYPES_ROOT}/sdk.d.ts`;
export const LIGHT_EXTENSION_SETTINGS_MODULES_PATH = `${LIGHT_EXTENSION_GENERATED_TYPES_ROOT}/modules.d.ts`;
export const LIGHT_EXTENSION_SETTINGS_IMPORT_PREFIX = 'light-extension:settings/';
export const LIGHT_EXTENSION_ACTIVE_CONTEXT_TYPE = 'LightExtensionActiveEntryContext';

const entryKeyPattern = /^[a-z0-9][a-z0-9-]{0,62}$/;
const emptySettingsSchema: Record<string, unknown> = { type: 'object', properties: {} };

const clientKindRoots: Array<{ kind: LightExtensionClientTypegenKind; root: string }> = [
  { kind: 'js-block', root: 'src/client/js-blocks' },
  { kind: 'js-page', root: 'src/client/js-pages' },
  { kind: 'js-field', root: 'src/client/js-fields' },
  { kind: 'js-action', root: 'src/client/js-actions' },
  { kind: 'js-item', root: 'src/client/js-items' },
  { kind: 'runjs', root: 'src/client/runjs' },
];

const contextTypes: Record<LightExtensionClientTypegenKind, string> = {
  'js-block': 'JSBlockContext',
  'js-page': 'JSPageContext',
  'js-field': 'JSFieldContext',
  'js-action': 'JSActionContext',
  'js-item': 'JSItemContext',
  runjs: 'RunJSContext',
};

export function generateClientSettingsTypes(input: {
  files: LightExtensionSettingsTypegenSourceFile[];
}): LightExtensionSettingsTypegenResult {
  const sourceFiles = normalizeSourceFiles(input.files);
  const diagnostics: LightExtensionSettingsTypegenDiagnostic[] = [];
  const entries = collectClientSettingsEntries(sourceFiles, diagnostics);

  return buildSettingsTypegenResult(entries, diagnostics);
}

export function generateInlineClientSettingsTypes(input: {
  descriptorPath?: string;
  files: LightExtensionSettingsTypegenSourceFile[];
  kind: LightExtensionClientTypegenKind;
  sourceRoot?: string;
}): LightExtensionSettingsTypegenResult {
  const sourceFiles = normalizeSourceFiles(input.files);
  const diagnostics: LightExtensionSettingsTypegenDiagnostic[] = [];
  const descriptorPath = normalizeSourcePath(input.descriptorPath || 'src/client/entry.json');
  const descriptorFile = sourceFiles.find((file) => file.path === descriptorPath);
  const descriptor = descriptorFile
    ? parseEntryDescriptor(descriptorFile, { kind: input.kind, directoryName: 'inline' }, diagnostics)
    : null;
  const entries = descriptor
    ? [
        createClientSettingsTypegenEntry({
          descriptor,
          descriptorPath,
          directoryName: 'inline',
          kind: input.kind,
          sourceRoot: normalizeSourcePath(input.sourceRoot || descriptorPath.replace(/\/[^/]+$/u, '')),
        }),
      ]
    : [];

  return buildSettingsTypegenResult(entries, diagnostics);
}

function buildSettingsTypegenResult(
  entries: LightExtensionSettingsTypegenEntry[],
  diagnostics: LightExtensionSettingsTypegenDiagnostic[],
): LightExtensionSettingsTypegenResult {
  return {
    entries,
    files: buildGeneratedFiles(entries),
    diagnostics: sortDiagnostics(diagnostics),
  };
}

export function createActiveEntryContextType(input: {
  activePath?: string;
  entries: LightExtensionSettingsTypegenEntry[];
}): LightExtensionActiveEntryContextResult {
  const activePath = normalizeSourcePath(input.activePath || '');
  if (!activePath) {
    return {};
  }

  const entry = input.entries.find(
    (candidate) => activePath === candidate.descriptorPath || activePath.startsWith(`${candidate.sourceRoot}/`),
  );
  if (!entry) {
    return {};
  }

  return {
    entry,
    globalContextType: LIGHT_EXTENSION_ACTIVE_CONTEXT_TYPE,
    file: {
      path: LIGHT_EXTENSION_ACTIVE_ENTRY_CONTEXT_PATH,
      content: [
        generatedHeader(),
        `import type { Context } from "${entry.virtualImport}";`,
        '',
        'declare global {',
        `  type ${LIGHT_EXTENSION_ACTIVE_CONTEXT_TYPE} = RunJSContext & Context;`,
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
): { target: 'client'; kind: LightExtensionClientTypegenKind; entryName: string } | null {
  if (!specifier.startsWith(LIGHT_EXTENSION_SETTINGS_IMPORT_PREFIX)) {
    return null;
  }
  const [target, kind, entryName, ...rest] = specifier.slice(LIGHT_EXTENSION_SETTINGS_IMPORT_PREFIX.length).split('/');
  if (
    target === 'client' &&
    clientKindRoots.some((item) => item.kind === kind) &&
    typeof entryName === 'string' &&
    isValidEntryName(entryName) &&
    rest.length === 0
  ) {
    return {
      target,
      kind: kind as LightExtensionClientTypegenKind,
      entryName,
    };
  }
  return null;
}

export function isNamespacedSettingsTypeImport(specifier: string): boolean {
  return Boolean(parseSettingsTypeImport(specifier));
}

function collectClientSettingsEntries(
  files: Array<Required<LightExtensionSettingsTypegenSourceFile>>,
  diagnostics: LightExtensionSettingsTypegenDiagnostic[],
): LightExtensionSettingsTypegenEntry[] {
  const entries: LightExtensionSettingsTypegenEntry[] = [];
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
        entryName: descriptor.key,
      });
      continue;
    }
    seenEntryKeys.add(entryKey);

    entries.push(
      createClientSettingsTypegenEntry({
        descriptor,
        descriptorPath: file.path,
        directoryName: parsed.directoryName,
        kind: parsed.kind,
        sourceRoot: `${parsed.root}/${parsed.directoryName}`,
      }),
    );
  }

  return entries.sort((left, right) => left.entryKey.localeCompare(right.entryKey));
}

function createClientSettingsTypegenEntry(input: {
  descriptor: { key: string; settingsSchema: Record<string, unknown> | null };
  descriptorPath: string;
  directoryName: string;
  kind: LightExtensionClientTypegenKind;
  sourceRoot: string;
}): LightExtensionSettingsTypegenEntry {
  const schema = input.descriptor.settingsSchema || emptySettingsSchema;
  const entryKey = `client/${input.kind}/${input.descriptor.key}`;
  return {
    target: 'client',
    kind: input.kind,
    directoryName: input.directoryName,
    entryName: input.descriptor.key,
    entryKey,
    descriptorPath: input.descriptorPath,
    sourceRoot: input.sourceRoot,
    virtualImport: `${LIGHT_EXTENSION_SETTINGS_IMPORT_PREFIX}${entryKey}`,
    outputPath: `${LIGHT_EXTENSION_GENERATED_TYPES_ROOT}/client/${input.kind}/${input.descriptor.key}.d.ts`,
    schema,
    schemaHash: shortHash(stableSerialize(schema)),
  };
}

function parseEntryDescriptor(
  file: Required<LightExtensionSettingsTypegenSourceFile>,
  parsed: { kind: LightExtensionClientTypegenKind; directoryName: string },
  diagnostics: LightExtensionSettingsTypegenDiagnostic[],
): { key: string; settingsSchema: Record<string, unknown> | null } | null {
  try {
    const value = JSON.parse(file.content) as unknown;
    if (!isRecord(value) || typeof value.key !== 'string' || !isValidEntryName(value.key)) {
      throw new Error('entry.json must contain a valid key to generate settings types');
    }
    if (typeof value.settings !== 'undefined' && !isRecord(value.settings)) {
      throw new Error('entry.json settings must be an object');
    }
    if (typeof value.settingsSchema !== 'undefined' && !isRecord(value.settingsSchema)) {
      throw new Error('entry.json settingsSchema must be an object');
    }
    if (typeof value.settings !== 'undefined' && typeof value.settingsSchema !== 'undefined') {
      throw new Error('entry.json must not define both settings and settingsSchema');
    }
    return {
      key: value.key,
      settingsSchema: isRecord(value.settings)
        ? buildLightExtensionSettingsSchema(value.settings)
        : isRecord(value.settingsSchema)
          ? value.settingsSchema
          : null,
    };
  } catch (error) {
    diagnostics.push({
      code: 'settings_typegen_schema_invalid',
      severity: 'error',
      message: error instanceof Error ? error.message : 'entry.json is invalid',
      path: file.path,
      kind: parsed.kind,
      entryName: parsed.directoryName,
    });
    return null;
  }
}

function buildGeneratedFiles(entries: LightExtensionSettingsTypegenEntry[]): LightExtensionSettingsTypegenFile[] {
  return [
    { path: LIGHT_EXTENSION_SDK_DECLARATIONS_PATH, content: buildSdkDeclarations() },
    ...entries.map((entry) => ({ path: entry.outputPath, content: buildEntryTypes(entry) })),
    { path: LIGHT_EXTENSION_SETTINGS_MODULES_PATH, content: buildVirtualSettingsModules(entries) },
    { path: `${LIGHT_EXTENSION_GENERATED_TYPES_ROOT}/index.d.ts`, content: buildIndexTypes(entries) },
  ];
}

function buildVirtualSettingsModules(entries: LightExtensionSettingsTypegenEntry[]): string {
  return [
    generatedHeader(),
    ...entries.flatMap((entry) => [
      '',
      `declare module "${entry.virtualImport}" {`,
      `  export type Settings = import("./client/${entry.kind}/${entry.entryName}").Settings;`,
      `  export type SettingsSchemaSummary = import("./client/${entry.kind}/${entry.entryName}").SettingsSchemaSummary;`,
      `  export type Context = import("./client/${entry.kind}/${entry.entryName}").Context;`,
      '}',
    ]),
    '',
  ].join('\n');
}

function buildEntryTypes(entry: LightExtensionSettingsTypegenEntry): string {
  const contextType = contextTypes[entry.kind];
  return [
    generatedHeader(),
    `import type { ${contextType} } from "@nocobase/light-extension-sdk/client";`,
    '',
    'export type SettingsSchemaSummary = {',
    '  target: "client";',
    `  kind: "${entry.kind}";`,
    `  entryName: "${entry.entryName}";`,
    `  entryKey: "${entry.entryKey}";`,
    `  descriptorPath: "${entry.descriptorPath}";`,
    `  virtualImport: "${entry.virtualImport}";`,
    `  schemaHash: "${entry.schemaHash}";`,
    '};',
    '',
    `export interface Settings ${schemaObjectToTypeBody(entry.schema)}`,
    '',
    `export type Context = ${contextType}<Settings>;`,
    '',
  ].join('\n');
}

function buildIndexTypes(entries: LightExtensionSettingsTypegenEntry[]): string {
  const imports = entries.map(
    (entry) =>
      `import type { Settings as ${entryTypeIdentifier(entry)} } from "./client/${entry.kind}/${entry.entryName}";`,
  );
  const mapEntries = entries.map((entry) => `  "${entry.entryKey}": ${entryTypeIdentifier(entry)};`);
  return [
    generatedHeader(),
    ...imports,
    '',
    'export interface LightExtensionEntrySettingsMap {',
    ...mapEntries,
    '}',
    '',
    'export type LightExtensionEntryKey = keyof LightExtensionEntrySettingsMap;',
    'export type LightExtensionEntrySettings<TKey extends LightExtensionEntryKey> = LightExtensionEntrySettingsMap[TKey];',
    '',
  ].join('\n');
}

function buildSdkDeclarations(): string {
  return `${generatedHeader()}
declare module "@nocobase/light-extension-sdk/shared" {
  export interface LightExtensionSettingsContext<TSettings = unknown> { settings: TSettings; }
  export type LightExtensionRecord = Record<string, unknown>;
  export interface LightExtensionDataContext<TSettings = unknown> extends LightExtensionSettingsContext<TSettings> {
    record?: LightExtensionRecord | null;
    records?: LightExtensionRecord[];
    values?: LightExtensionRecord;
    collection?: unknown;
    collectionField?: unknown;
    dataSource?: unknown;
  }
  export function defineSettings<TSettings>(settings: TSettings): TSettings;
  export function assertSettings<TSettings>(settings: TSettings): TSettings;
}

declare module "@nocobase/light-extension-sdk/client" {
  import type { LightExtensionDataContext, LightExtensionRecord } from "@nocobase/light-extension-sdk/shared";
  export type { LightExtensionDataContext, LightExtensionRecord, LightExtensionSettingsContext } from "@nocobase/light-extension-sdk/shared";
  export { assertSettings, defineSettings } from "@nocobase/light-extension-sdk/shared";
  export interface JSBlockContext<TSettings = unknown> extends LightExtensionDataContext<TSettings> {
    element?: HTMLElement | null;
    render?: (node: unknown) => void;
    i18n?: { t: (key: string, options?: Record<string, unknown>) => string };
  }
  export interface JSPageRuntimeFacade { readonly uid: string; readonly active: boolean; refresh(): Promise<void>; setDocumentTitle(title: string): void; }
  export interface JSPageContext<TSettings = unknown> extends JSBlockContext<TSettings> { page: JSPageRuntimeFacade; }
  export interface JSFieldContext<TSettings = unknown, TValue = unknown> extends LightExtensionDataContext<TSettings> { value?: TValue; }
  export interface JSActionContext<TSettings = unknown> extends LightExtensionDataContext<TSettings> { event?: unknown; formValues?: LightExtensionRecord; }
  export interface JSItemContext<TSettings = unknown, TValue = unknown> extends LightExtensionDataContext<TSettings> { value?: TValue; }
  export interface RunJSContext<TSettings = unknown, TInput = unknown> extends LightExtensionDataContext<TSettings> { input?: TInput; event?: unknown; formValues?: LightExtensionRecord; }
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
): { kind: LightExtensionClientTypegenKind; directoryName: string; root: string } | null {
  for (const item of clientKindRoots) {
    const prefix = `${item.root}/`;
    if (!path.startsWith(prefix) || !path.endsWith('/entry.json')) continue;
    const segments = path.slice(prefix.length).split('/');
    if (segments.length === 2 && segments[1] === 'entry.json' && isValidEntryName(segments[0])) {
      return { kind: item.kind, directoryName: segments[0], root: item.root };
    }
  }
  return null;
}

function entryTypeIdentifier(entry: LightExtensionSettingsTypegenEntry): string {
  return `${toPascalCase(entry.target)}${toPascalCase(entry.kind)}${toPascalCase(entry.entryName)}Settings`;
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

function isValidEntryName(value: string): boolean {
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
  files: LightExtensionSettingsTypegenSourceFile[],
): Array<Required<LightExtensionSettingsTypegenSourceFile>> {
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
  return '/* Generated by NocoBase light-extension settings typegen. Do not edit by hand. */';
}

function sortDiagnostics(
  diagnostics: LightExtensionSettingsTypegenDiagnostic[],
): LightExtensionSettingsTypegenDiagnostic[] {
  return [...diagnostics].sort((left, right) =>
    `${left.path || ''}:${left.code}`.localeCompare(`${right.path || ''}:${right.code}`),
  );
}
