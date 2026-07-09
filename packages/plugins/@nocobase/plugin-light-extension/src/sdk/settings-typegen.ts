/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type LightExtensionClientTypegenKind = 'js-block' | 'js-field' | 'js-action' | 'js-item' | 'runjs' | 'event';

export interface LightExtensionSettingsTypegenSourceFile {
  path: string;
  content?: string;
}

export interface LightExtensionSettingsTypegenFile {
  path: string;
  content: string;
  stale?: boolean;
}

export interface LightExtensionSettingsTypegenDiagnostic {
  code: string;
  severity: 'error' | 'warning';
  message: string;
  path?: string;
  kind?: LightExtensionClientTypegenKind;
  entryName?: string;
  details?: Record<string, unknown>;
}

export interface LightExtensionSettingsTypegenEntry {
  target: 'client';
  kind: LightExtensionClientTypegenKind;
  entryName: string;
  entryKey: string;
  settingsPath: string;
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

type JsonSchemaLike = {
  type?: unknown;
  enum?: unknown;
  required?: unknown;
  properties?: unknown;
  items?: unknown;
  default?: unknown;
};

const GENERATED_TYPES_ROOT = '.light-extension/types';
const VIRTUAL_SETTINGS_MODULES_PATH = `${GENERATED_TYPES_ROOT}/modules.d.ts`;
const VIRTUAL_SETTINGS_PREFIX = 'light-extension:settings/';

const clientKindRoots: Array<{ kind: LightExtensionClientTypegenKind; root: string }> = [
  { kind: 'js-block', root: 'src/client/js-blocks' },
  { kind: 'js-field', root: 'src/client/js-fields' },
  { kind: 'js-action', root: 'src/client/js-actions' },
  { kind: 'js-item', root: 'src/client/js-items' },
  { kind: 'runjs', root: 'src/client/runjs' },
  { kind: 'event', root: 'src/client/events' },
];

const contextTypes: Record<LightExtensionClientTypegenKind, string> = {
  'js-block': 'JSBlockContext',
  'js-field': 'JSFieldContext',
  'js-action': 'JSActionContext',
  'js-item': 'JSItemContext',
  runjs: 'RunJSContext',
  event: 'EventContext',
};

export function generateClientSettingsTypes(input: {
  files: LightExtensionSettingsTypegenSourceFile[];
}): LightExtensionSettingsTypegenResult {
  const sourceFiles = input.files.map((file) => ({
    ...file,
    path: normalizeSourcePath(file.path),
    content: typeof file.content === 'string' ? file.content : '',
  }));
  const diagnostics = collectSettingsImportDiagnostics(sourceFiles);
  const entries = collectClientSettingsEntries(sourceFiles, diagnostics);
  const files = buildGeneratedFiles(entries);
  const generatedPathSet = new Set(files.map((file) => file.path));

  for (const file of sourceFiles) {
    if (isGeneratedTypeFilePath(file.path) && !generatedPathSet.has(file.path)) {
      diagnostics.push({
        code: 'settings_type_stale_file',
        severity: 'warning',
        message: `Generated settings type file "${file.path}" is stale for the current source tree`,
        path: file.path,
      });
    }
  }

  return {
    entries,
    files,
    diagnostics: sortDiagnostics(diagnostics),
  };
}

export function isAmbiguousSettingsTypeImport(specifier: string): boolean {
  if (!specifier.startsWith(VIRTUAL_SETTINGS_PREFIX)) {
    return false;
  }

  const suffix = specifier.slice(VIRTUAL_SETTINGS_PREFIX.length);
  return suffix.split('/').filter(Boolean).length < 3;
}

export function isNamespacedSettingsTypeImport(specifier: string): boolean {
  const parsed = parseNamespacedSettingsImport(specifier);
  return Boolean(parsed);
}

function collectClientSettingsEntries(
  files: Array<Required<LightExtensionSettingsTypegenSourceFile>>,
  diagnostics: LightExtensionSettingsTypegenDiagnostic[],
): LightExtensionSettingsTypegenEntry[] {
  const entries: LightExtensionSettingsTypegenEntry[] = [];

  for (const file of files) {
    const parsed = parseClientSettingsPath(file.path);
    if (!parsed) {
      continue;
    }
    const schema = parseSettingsSchema(file, parsed, diagnostics);
    if (!schema) {
      continue;
    }
    const entryKey = `client/${parsed.kind}/${parsed.entryName}`;
    entries.push({
      target: 'client',
      kind: parsed.kind,
      entryName: parsed.entryName,
      entryKey,
      settingsPath: file.path,
      virtualImport: `${VIRTUAL_SETTINGS_PREFIX}${entryKey}`,
      outputPath: `${GENERATED_TYPES_ROOT}/client/${parsed.kind}/${parsed.entryName}.d.ts`,
      schema,
      schemaHash: shortHash(stableSerialize(schema)),
    });
  }

  return entries.sort((left, right) => left.entryKey.localeCompare(right.entryKey));
}

function parseSettingsSchema(
  file: Required<LightExtensionSettingsTypegenSourceFile>,
  parsed: { kind: LightExtensionClientTypegenKind; entryName: string },
  diagnostics: LightExtensionSettingsTypegenDiagnostic[],
): Record<string, unknown> | null {
  try {
    const value = JSON.parse(file.content) as unknown;
    if (isRecord(value)) {
      return value;
    }
    diagnostics.push({
      code: 'settings_typegen_schema_invalid',
      severity: 'error',
      message: 'settings.json must contain a JSON object schema to generate settings types',
      path: file.path,
      kind: parsed.kind,
      entryName: parsed.entryName,
    });
  } catch (error) {
    diagnostics.push({
      code: 'settings_typegen_schema_invalid',
      severity: 'error',
      message: error instanceof Error ? error.message : 'settings.json is invalid',
      path: file.path,
      kind: parsed.kind,
      entryName: parsed.entryName,
    });
  }

  return null;
}

function buildGeneratedFiles(entries: LightExtensionSettingsTypegenEntry[]): LightExtensionSettingsTypegenFile[] {
  if (!entries.length) {
    return [
      {
        path: `${GENERATED_TYPES_ROOT}/index.d.ts`,
        content: buildEmptyIndexTypes(),
      },
      {
        path: `${GENERATED_TYPES_ROOT}/settings.d.ts`,
        content: buildEmptySettingsTypes(),
      },
    ];
  }

  return [
    ...entries.map((entry) => ({
      path: entry.outputPath,
      content: buildEntryTypes(entry),
    })),
    {
      path: VIRTUAL_SETTINGS_MODULES_PATH,
      content: buildVirtualSettingsModules(entries),
    },
    {
      path: `${GENERATED_TYPES_ROOT}/index.d.ts`,
      content: buildIndexTypes(entries),
    },
    {
      path: `${GENERATED_TYPES_ROOT}/settings.d.ts`,
      content: buildCompatSettingsTypes(entries),
    },
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
      `  export type SettingsContext = import("./client/${entry.kind}/${entry.entryName}").SettingsContext;`,
      `}`,
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
    `export type SettingsSchemaSummary = {`,
    `  target: "client";`,
    `  kind: "${entry.kind}";`,
    `  entryName: "${entry.entryName}";`,
    `  entryKey: "${entry.entryKey}";`,
    `  settingsPath: "${entry.settingsPath}";`,
    `  virtualImport: "${entry.virtualImport}";`,
    `  schemaHash: "${entry.schemaHash}";`,
    `};`,
    '',
    `export interface Settings ${schemaObjectToTypeBody(entry.schema)}`,
    '',
    `export type Context = ${contextType}<Settings>;`,
    `export type SettingsContext = Context;`,
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

function buildCompatSettingsTypes(entries: LightExtensionSettingsTypegenEntry[]): string {
  const exports = entries.map(
    (entry) =>
      `export type { Settings as ${entryTypeIdentifier(entry)} } from "./client/${entry.kind}/${entry.entryName}";`,
  );

  return [
    generatedHeader(),
    'export type { LightExtensionEntryKey, LightExtensionEntrySettings, LightExtensionEntrySettingsMap } from "./index";',
    ...exports,
    '',
  ].join('\n');
}

function buildEmptyIndexTypes(): string {
  return [
    generatedHeader(),
    'export interface LightExtensionEntrySettingsMap {}',
    'export type LightExtensionEntryKey = keyof LightExtensionEntrySettingsMap;',
    'export type LightExtensionEntrySettings<TKey extends LightExtensionEntryKey> = LightExtensionEntrySettingsMap[TKey];',
    '',
  ].join('\n');
}

function buildEmptySettingsTypes(): string {
  return [
    generatedHeader(),
    'export type { LightExtensionEntryKey, LightExtensionEntrySettings, LightExtensionEntrySettingsMap } from "./index";',
    '',
  ].join('\n');
}

function schemaObjectToTypeBody(schema: Record<string, unknown>): string {
  const schemaLike = schema as JsonSchemaLike;
  const properties = isRecord(schemaLike.properties) ? schemaLike.properties : {};
  const required = new Set(Array.isArray(schemaLike.required) ? schemaLike.required.filter(isString) : []);
  const lines = Object.entries(properties)
    .filter(([, propertySchema]) => isRecord(propertySchema))
    .map(([propertyName, propertySchema]) => {
      const property = propertySchema as JsonSchemaLike;
      const optional = required.has(propertyName) || property.default !== undefined ? '' : '?';
      return `  ${quotePropertyName(propertyName)}${optional}: ${schemaToType(property)};`;
    });

  if (!lines.length) {
    return '{\n  [key: string]: unknown;\n}';
  }

  return `{\n${lines.join('\n')}\n}`;
}

function schemaToType(schema: JsonSchemaLike): string {
  if (Array.isArray(schema.enum)) {
    return schema.enum.map(literalToType).join(' | ') || 'unknown';
  }

  const type = normalizeSchemaType(schema);
  if (type === 'string') {
    return 'string';
  }
  if (type === 'number' || type === 'integer') {
    return 'number';
  }
  if (type === 'boolean') {
    return 'boolean';
  }
  if (type === 'array') {
    return `Array<${isRecord(schema.items) ? schemaToType(schema.items as JsonSchemaLike) : 'unknown'}>`;
  }
  if (type === 'object') {
    return schemaObjectToTypeBody(schema as Record<string, unknown>);
  }

  return 'unknown';
}

function normalizeSchemaType(schema: JsonSchemaLike): string | undefined {
  if (Array.isArray(schema.type)) {
    return schema.type.find((item): item is string => typeof item === 'string' && item !== 'null');
  }
  if (typeof schema.type === 'string') {
    return schema.type;
  }
  if (isRecord(schema.properties) || Array.isArray(schema.required)) {
    return 'object';
  }
  if (isRecord(schema.items)) {
    return 'array';
  }
  return undefined;
}

function literalToType(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
    return JSON.stringify(value);
  }

  return 'unknown';
}

function collectSettingsImportDiagnostics(
  files: Array<Required<LightExtensionSettingsTypegenSourceFile>>,
): LightExtensionSettingsTypegenDiagnostic[] {
  const diagnostics: LightExtensionSettingsTypegenDiagnostic[] = [];
  for (const file of files) {
    if (!isCodeFilePath(file.path)) {
      continue;
    }
    for (const specifier of getSettingsImportSpecifiers(file.content)) {
      if (isNamespacedSettingsTypeImport(specifier)) {
        continue;
      }
      if (isAmbiguousSettingsTypeImport(specifier)) {
        diagnostics.push({
          code: 'settings_type_import_ambiguous',
          severity: 'error',
          message:
            'Settings type import must include target and kind, for example light-extension:settings/client/js-block/product-list',
          path: file.path,
          details: {
            specifier,
          },
        });
        continue;
      }
      diagnostics.push({
        code: 'settings_type_import_invalid',
        severity: 'error',
        message: `Settings type import "${specifier}" is not valid`,
        path: file.path,
        details: {
          specifier,
        },
      });
    }
  }
  return diagnostics;
}

function getSettingsImportSpecifiers(content: string): string[] {
  const specifiers = new Set<string>();
  const importDeclarationPattern = /\bimport\s+(?:type\s+)?[\s\S]*?\s+from\s+["']([^"']+)["']/g;
  let match = importDeclarationPattern.exec(content);
  while (match) {
    if (match[1].startsWith(VIRTUAL_SETTINGS_PREFIX)) {
      specifiers.add(match[1]);
    }
    match = importDeclarationPattern.exec(content);
  }
  const importTypePattern = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;
  match = importTypePattern.exec(content);
  while (match) {
    if (match[1].startsWith(VIRTUAL_SETTINGS_PREFIX)) {
      specifiers.add(match[1]);
    }
    match = importTypePattern.exec(content);
  }
  return Array.from(specifiers);
}

function parseClientSettingsPath(path: string): { kind: LightExtensionClientTypegenKind; entryName: string } | null {
  for (const item of clientKindRoots) {
    const prefix = `${item.root}/`;
    if (!path.startsWith(prefix) || !path.endsWith('/settings.json')) {
      continue;
    }
    const rest = path.slice(prefix.length);
    const segments = rest.split('/');
    if (segments.length === 2 && segments[1] === 'settings.json' && isValidEntryName(segments[0])) {
      return {
        kind: item.kind,
        entryName: segments[0],
      };
    }
  }

  return null;
}

function parseNamespacedSettingsImport(
  specifier: string,
): { target: 'client'; kind: LightExtensionClientTypegenKind; entryName: string } | null {
  if (!specifier.startsWith(VIRTUAL_SETTINGS_PREFIX)) {
    return null;
  }
  const [target, kind, entryName, ...rest] = specifier.slice(VIRTUAL_SETTINGS_PREFIX.length).split('/');
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

function isGeneratedTypeFilePath(path: string): boolean {
  return path.startsWith(`${GENERATED_TYPES_ROOT}/`) && path.endsWith('.d.ts');
}

function isCodeFilePath(path: string): boolean {
  return ['.ts', '.tsx', '.js', '.jsx'].some((extension) => path.endsWith(extension));
}

function isValidEntryName(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
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

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }
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
    `${left.severity}:${left.path || ''}:${left.code}`.localeCompare(
      `${right.severity}:${right.path || ''}:${right.code}`,
    ),
  );
}
