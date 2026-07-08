/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { posix as pathPosix } from 'path';
import ts from 'typescript';

import {
  LIGHT_EXTENSION_ENABLED_KINDS,
  LIGHT_EXTENSION_SUPPORTED_KINDS,
  type LightExtensionKind,
} from '../../constants';
import type {
  LightExtensionCapabilities,
  LightExtensionDiagnostic,
  LightExtensionDiagnosticSeverity,
  LightExtensionPulledFile,
  LightExtensionValidationLimits,
} from '../../shared/types';

export const LIGHT_EXTENSION_VALIDATOR_VERSION = 'light-extension-validator-v1';
export const LIGHT_EXTENSION_SDK_TEMPLATE_VERSION = 'light-extension-sdk-template-v1';

export const LIGHT_EXTENSION_VALIDATION_LIMITS: LightExtensionValidationLimits = {
  maxRepoFiles: 200,
  maxEntryFiles: 30,
  maxFileBytes: 256 * 1024,
  maxRepoBytes: 2 * 1024 * 1024,
  maxEntries: 50,
  maxSyncBatchFiles: 100,
  maxZipBytes: 5 * 1024 * 1024,
  maxZipCompressionRatio: 20,
  maxJsonBytes: 64 * 1024,
  maxSettingsSchemaDepth: 6,
};

export const LIGHT_EXTENSION_X_COMPONENT_WHITELIST = [
  'Input',
  'Input.TextArea',
  'InputNumber',
  'Select',
  'Switch',
  'Checkbox',
  'Radio.Group',
  'DatePicker',
  'ColorPicker',
] as const;

export const LIGHT_EXTENSION_SETTINGS_SCHEMA_TYPES = [
  'object',
  'array',
  'string',
  'number',
  'integer',
  'boolean',
] as const;

export const LIGHT_EXTENSION_SETTINGS_SCHEMA_KEYWORDS = [
  'type',
  'title',
  'description',
  'default',
  'enum',
  'required',
  'properties',
  'items',
  'minLength',
  'maxLength',
  'minimum',
  'maximum',
  'format',
  'x-component',
  'x-component-props',
  'x-decorator',
  'x-decorator-props',
] as const;

export interface LightExtensionSourceFileInput {
  path: string;
  content?: string;
  blobHash?: string;
  size?: number;
  language?: string;
  operation?: 'upsert' | 'delete';
}

export interface LightExtensionEntryValidationResult {
  target: 'client';
  kind: LightExtensionKind;
  entryName: string;
  entryPath: string;
  metaPath: string | null;
  settingsPath: string | null;
  title: string | null;
  description: string | null;
  category: string | null;
  icon: string | null;
  tags: string[] | null;
  sort: number | null;
  settingsSchema: Record<string, unknown> | null;
  diagnostics: LightExtensionDiagnostic[];
}

export interface LightExtensionWorkspaceValidationResult {
  accepted: boolean;
  diagnostics: LightExtensionDiagnostic[];
  entries: LightExtensionEntryValidationResult[];
  capabilities: LightExtensionCapabilities;
}

interface NormalizedSourceFile {
  path: string;
  content: string;
  size: number;
  language?: string;
}

interface EntryBucket {
  kind: LightExtensionKind;
  entryName: string;
  rootPath: string;
  files: NormalizedSourceFile[];
}

interface ParsedMeta {
  title: string | null;
  description: string | null;
  category: string | null;
  icon: string | null;
  tags: string[] | null;
  sort: number | null;
}

type DiagnosticTarget = Pick<LightExtensionDiagnostic, 'path' | 'kind' | 'entryName'>;
type ForbiddenStoredDiagnostic = { code: 'require_not_allowed' | 'blocked_global_api'; message: string };

interface EntryFileRule {
  root: string;
  indexFiles: string[];
  metadataFiles: string[];
  allowedExtensions: string[];
}

const entryFileRules: Record<LightExtensionKind, EntryFileRule> = {
  'js-block': {
    root: 'src/client/js-blocks',
    indexFiles: ['index.tsx', 'index.ts', 'index.jsx', 'index.js'],
    metadataFiles: ['meta.json', 'settings.json'],
    allowedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'],
  },
  'js-field': {
    root: 'src/client/js-fields',
    indexFiles: ['index.tsx', 'index.ts', 'index.jsx', 'index.js'],
    metadataFiles: ['meta.json', 'settings.json'],
    allowedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'],
  },
  'js-action': {
    root: 'src/client/js-actions',
    indexFiles: ['index.tsx', 'index.ts', 'index.jsx', 'index.js'],
    metadataFiles: ['meta.json', 'settings.json'],
    allowedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'],
  },
  'js-item': {
    root: 'src/client/js-items',
    indexFiles: ['index.tsx', 'index.ts', 'index.jsx', 'index.js'],
    metadataFiles: ['meta.json', 'settings.json'],
    allowedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'],
  },
  runjs: {
    root: 'src/client/runjs',
    indexFiles: ['index.tsx', 'index.ts', 'index.jsx', 'index.js'],
    metadataFiles: ['meta.json', 'settings.json'],
    allowedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'],
  },
  event: {
    root: 'src/client/events',
    indexFiles: ['index.tsx', 'index.ts', 'index.jsx', 'index.js'],
    metadataFiles: ['meta.json', 'settings.json'],
    allowedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'],
  },
};

const allowedRepoRootFiles = new Set(['README.md', 'light-extension.json', 'tsconfig.json']);
const sharedSourceRoot = 'src/shared';
const sharedAllowedExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md']);
const allowedClientSdkImports = new Set([
  '@nocobase/light-extension-sdk/client',
  '@nocobase/light-extension-sdk/shared',
]);
const allowedSdkRuntimeHelpers = new Set(['defineSettings', 'assertSettings']);
const globalObjectNames = new Set(['globalThis', 'window', 'global', 'self']);
const globalAliasMemberNames = new Set(['globalThis', 'window', 'global', 'self']);
const defaultReflectObjectAliases = new Set(['Reflect']);
const emptyAliasNames = new Set<string>();
const emptyAliasMap = new Map<string, string>();
const emptyStaticStringAliases = new Map<string, string>();
const blockedGlobalMembers = new Set(['Function', 'eval', 'process']);
const forbiddenGlobalProperties = new Set([...blockedGlobalMembers, 'require']);
const functionHelperMembers = new Set(['call', 'apply', 'bind']);
const privilegedObjectStaticMethods = new Set([
  'assign',
  'create',
  'defineProperties',
  'defineProperty',
  'getOwnPropertyDescriptor',
  'getOwnPropertyDescriptors',
  'setPrototypeOf',
]);
const privilegedGlobalDescriptorProperties = new Set([
  ...forbiddenGlobalProperties,
  ...globalAliasMemberNames,
  ...privilegedObjectStaticMethods,
  'get',
]);
const invalidJsonParse = Symbol('invalidJsonParse');

export class LightExtensionValidator {
  private readonly capabilities: LightExtensionCapabilities;

  constructor(options: { limits?: Partial<LightExtensionValidationLimits> } = {}) {
    const limits = {
      ...LIGHT_EXTENSION_VALIDATION_LIMITS,
      ...(options.limits || {}),
    };
    this.capabilities = buildCapabilities(limits);
  }

  getCapabilities(): LightExtensionCapabilities {
    return {
      ...this.capabilities,
      allowedPaths: {
        repo: [...this.capabilities.allowedPaths.repo],
        entries: Object.fromEntries(
          Object.entries(this.capabilities.allowedPaths.entries).map(([kind, paths]) => [kind, [...paths]]),
        ),
      },
      schemaSubset: {
        allowedTypes: [...this.capabilities.schemaSubset.allowedTypes],
        allowedKeywords: [...this.capabilities.schemaSubset.allowedKeywords],
        maxDepth: this.capabilities.schemaSubset.maxDepth,
      },
      xComponentWhitelist: [...this.capabilities.xComponentWhitelist],
      limits: { ...this.capabilities.limits },
      writePolicy: { ...this.capabilities.writePolicy },
      supportedKinds: [...this.capabilities.supportedKinds],
      enabledKinds: [...this.capabilities.enabledKinds],
    };
  }

  validateWorkspace(input: { files: LightExtensionSourceFileInput[] }): LightExtensionWorkspaceValidationResult {
    const diagnostics: LightExtensionDiagnostic[] = [];
    const normalizedFiles = this.normalizeFiles(input.files, diagnostics);
    const entryBuckets = this.collectEntryBuckets(normalizedFiles, diagnostics);
    const entries = entryBuckets.map((bucket) => this.validateEntry(bucket));
    diagnostics.push(...this.validateSharedFiles(normalizedFiles));
    attachDiagnosticsToEntries(diagnostics, entries);
    const allDiagnostics = sortDiagnostics(
      uniqueDiagnostics([...diagnostics, ...entries.flatMap((entry) => entry.diagnostics)]),
    );

    return {
      accepted: !hasErrorDiagnostic(allDiagnostics),
      diagnostics: allDiagnostics,
      entries,
      capabilities: this.getCapabilities(),
    };
  }

  validateSyncBatch(input: {
    files: LightExtensionSourceFileInput[];
    existingPaths?: Iterable<string>;
  }): LightExtensionDiagnostic[] {
    const diagnostics: LightExtensionDiagnostic[] = [];
    const existingPathSet = input.existingPaths
      ? new Set([...input.existingPaths].map(normalizeSourcePath))
      : undefined;
    if (input.files.length > this.capabilities.limits.maxSyncBatchFiles) {
      diagnostics.push(
        diagnostic('sync_batch_too_large', 'error', 'Sync batch contains too many files', {
          details: {
            fileCount: input.files.length,
            maxFiles: this.capabilities.limits.maxSyncBatchFiles,
          },
        }),
      );
    }
    for (const file of input.files) {
      if (file.operation === 'delete') {
        diagnostics.push(...validateDeleteSourcePath(file.path, existingPathSet));
        continue;
      }
      if (typeof file.content === 'string') {
        continue;
      }

      const path = normalizeSourcePath(file.path);
      const pathKind = classifySourcePath(path);
      const pathTarget =
        pathKind.status === 'enabled' || pathKind.status === 'kindDisabled'
          ? {
              kind: pathKind.kind,
              entryName: pathKind.entryName,
            }
          : {};
      diagnostics.push(
        diagnostic('source_content_required', 'error', 'Source file content is required for validation', {
          path,
          ...pathTarget,
        }),
      );
    }
    const normalizedFiles = this.normalizeFiles(
      input.files.filter((file) => file.operation !== 'delete'),
      diagnostics,
    );
    for (const file of normalizedFiles) {
      const pathKind = classifySourcePath(file.path);
      if (pathKind.status !== 'enabled' && pathKind.status !== 'kindDisabled') {
        if (pathKind.status === 'shared') {
          diagnostics.push(...this.validateSharedFile(file));
        }
        continue;
      }

      const target = {
        kind: pathKind.kind,
        entryName: pathKind.entryName,
      };
      if (isCodeFile(file.path)) {
        diagnostics.push(...this.validateCodeFile(file, target));
      } else if (pathPosix.basename(file.path) === 'meta.json') {
        this.validateMetaFile(file, diagnostics, target);
      } else if (pathPosix.basename(file.path) === 'settings.json') {
        this.validateSettingsFile(file, diagnostics, target);
      }
    }

    return sortDiagnostics(uniqueDiagnostics(diagnostics));
  }

  validateInitialFiles(input: { files: LightExtensionSourceFileInput[] }): LightExtensionDiagnostic[] {
    const writeDiagnostics = this.validateSyncBatch(input);
    const workspaceValidation = this.validateWorkspace(input);
    return sortDiagnostics(uniqueDiagnostics([...writeDiagnostics, ...workspaceValidation.diagnostics]));
  }

  validateZipBudget(input: { compressedBytes: number; uncompressedBytes: number }): LightExtensionDiagnostic[] {
    const diagnostics: LightExtensionDiagnostic[] = [];
    const limits = this.capabilities.limits;

    if (input.compressedBytes > limits.maxZipBytes) {
      diagnostics.push(
        diagnostic('zip_too_large', 'error', 'ZIP archive is too large', {
          details: {
            compressedBytes: input.compressedBytes,
            maxZipBytes: limits.maxZipBytes,
          },
        }),
      );
    }

    const ratio = input.compressedBytes > 0 ? input.uncompressedBytes / input.compressedBytes : Infinity;
    if (ratio > limits.maxZipCompressionRatio) {
      diagnostics.push(
        diagnostic('zip_compression_ratio_too_high', 'error', 'ZIP archive compression ratio is too high', {
          details: {
            compressedBytes: input.compressedBytes,
            uncompressedBytes: input.uncompressedBytes,
            ratio,
            maxRatio: limits.maxZipCompressionRatio,
          },
        }),
      );
    }

    return diagnostics;
  }

  private normalizeFiles(
    files: LightExtensionSourceFileInput[],
    diagnostics: LightExtensionDiagnostic[],
  ): NormalizedSourceFile[] {
    const normalizedFiles: NormalizedSourceFile[] = [];
    let totalBytes = 0;

    if (files.length > this.capabilities.limits.maxRepoFiles) {
      diagnostics.push(
        diagnostic('repo_file_count_exceeded', 'error', 'Repository contains too many source files', {
          details: {
            fileCount: files.length,
            maxFiles: this.capabilities.limits.maxRepoFiles,
          },
        }),
      );
    }

    for (const file of files) {
      const pathDiagnostics = validateSourcePath(file.path);
      diagnostics.push(...pathDiagnostics);
      if (pathDiagnostics.some((item) => item.severity === 'error')) {
        continue;
      }

      const path = normalizeSourcePath(file.path);
      const hasContent = typeof file.content === 'string';
      const content = hasContent ? file.content : '';
      const size = hasContent ? Buffer.byteLength(content, 'utf8') : typeof file.size === 'number' ? file.size : 0;
      totalBytes += size;

      const pathKind = classifySourcePath(path);
      const pathTarget =
        pathKind.status === 'enabled' || pathKind.status === 'kindDisabled'
          ? {
              kind: pathKind.kind,
              entryName: pathKind.entryName,
            }
          : {};
      if (size > this.capabilities.limits.maxFileBytes) {
        diagnostics.push(
          diagnostic('file_size_limit_exceeded', 'error', 'Source file is too large', {
            path,
            ...pathTarget,
            details: {
              size,
              maxFileBytes: this.capabilities.limits.maxFileBytes,
            },
          }),
        );
      }
      if (pathKind.status === 'unsupported') {
        diagnostics.push(
          diagnostic('path_not_allowed', 'error', 'Source file path is outside the allowed light-extension roots', {
            path,
          }),
        );
      } else if (pathKind.status === 'shared' && !isAllowedSharedFilePath(path)) {
        diagnostics.push(
          diagnostic('path_extension_not_allowed', 'error', 'Source file path is not allowed for shared helpers', {
            path,
          }),
        );
      } else if (pathKind.status === 'missingEntryName') {
        diagnostics.push(
          diagnostic('entry_name_required', 'error', 'Entry name segment is required', {
            path,
            kind: pathKind.kind,
          }),
        );
      }
      if ((pathKind.status === 'enabled' || pathKind.status === 'kindDisabled') && !isAllowedEntryFilePath(path)) {
        diagnostics.push(
          diagnostic(
            'path_extension_not_allowed',
            'error',
            'Source file path is not allowed for light-extension entries',
            {
              path,
              kind: pathKind.kind,
              entryName: pathKind.entryName,
            },
          ),
        );
      }

      normalizedFiles.push({
        path,
        content,
        size,
        language: file.language,
      });
    }

    if (totalBytes > this.capabilities.limits.maxRepoBytes) {
      diagnostics.push(
        diagnostic('repo_budget_limit_exceeded', 'error', 'Repository source budget is exceeded', {
          details: {
            totalBytes,
            maxRepoBytes: this.capabilities.limits.maxRepoBytes,
          },
        }),
      );
    }

    return normalizedFiles;
  }

  private collectEntryBuckets(files: NormalizedSourceFile[], diagnostics: LightExtensionDiagnostic[]): EntryBucket[] {
    const buckets = new Map<string, EntryBucket>();

    for (const file of files) {
      const pathKind = classifySourcePath(file.path);
      if (pathKind.status !== 'enabled' && pathKind.status !== 'kindDisabled') {
        continue;
      }

      if (!isValidEntryName(pathKind.entryName)) {
        diagnostics.push(
          diagnostic('invalid_entry_name', 'error', 'Entry name must be a lowercase slug', {
            path: file.path,
            kind: pathKind.kind,
            entryName: pathKind.entryName,
          }),
        );
        continue;
      }

      const key = `${pathKind.kind}:${pathKind.entryName}`;
      const existing = buckets.get(key);
      if (existing) {
        existing.files.push(file);
        continue;
      }

      buckets.set(key, {
        kind: pathKind.kind,
        entryName: pathKind.entryName,
        rootPath: getEntryRootPath(pathKind.kind, pathKind.entryName),
        files: [file],
      });
    }

    if (buckets.size > this.capabilities.limits.maxEntries) {
      diagnostics.push(
        diagnostic('entry_count_limit_exceeded', 'error', 'Repository contains too many entries', {
          details: {
            entryCount: buckets.size,
            maxEntries: this.capabilities.limits.maxEntries,
          },
        }),
      );
    }

    return [...buckets.values()].sort((left, right) =>
      `${left.kind}:${left.entryName}`.localeCompare(`${right.kind}:${right.entryName}`),
    );
  }

  private validateEntry(bucket: EntryBucket): LightExtensionEntryValidationResult {
    const target = {
      kind: bucket.kind,
      entryName: bucket.entryName,
    };
    const diagnostics: LightExtensionDiagnostic[] = [];
    const metaPath = `${bucket.rootPath}/meta.json`;
    const settingsPath = `${bucket.rootPath}/settings.json`;
    const indexFile = findEntryIndexFile(bucket);
    const metaFile = bucket.files.find((file) => file.path === metaPath);
    const settingsFile = bucket.files.find((file) => file.path === settingsPath);
    const meta = this.validateMetaFile(metaFile, diagnostics, target);
    const settingsSchema = this.validateSettingsFile(settingsFile, diagnostics, target);
    const codeFiles = bucket.files.filter((file) => isCodeFile(file.path));

    if (bucket.files.length > this.capabilities.limits.maxEntryFiles) {
      diagnostics.push(
        diagnostic('entry_file_count_exceeded', 'error', 'Entry contains too many files', {
          ...target,
          details: {
            fileCount: bucket.files.length,
            maxFiles: this.capabilities.limits.maxEntryFiles,
          },
        }),
      );
    }

    if (!indexFile) {
      diagnostics.push(
        diagnostic('entry_index_missing', 'error', 'Entry must include index.tsx, index.ts, index.jsx, or index.js', {
          ...target,
          path: bucket.rootPath,
        }),
      );
    }

    if (!(LIGHT_EXTENSION_ENABLED_KINDS as readonly string[]).includes(bucket.kind)) {
      diagnostics.push(
        diagnostic('kind_not_enabled', 'warning', `Entry kind "${bucket.kind}" is not enabled`, {
          ...target,
          path: bucket.rootPath,
        }),
      );
    }

    for (const file of codeFiles) {
      diagnostics.push(...this.validateCodeFile(file, target));
    }

    return {
      target: 'client',
      kind: bucket.kind,
      entryName: bucket.entryName,
      entryPath: indexFile?.path || bucket.rootPath,
      metaPath: metaFile ? metaPath : null,
      settingsPath: settingsFile ? settingsPath : null,
      title: meta.title || bucket.entryName,
      description: meta.description,
      category: meta.category,
      icon: meta.icon,
      tags: meta.tags,
      sort: meta.sort,
      settingsSchema,
      diagnostics,
    };
  }

  private validateSharedFiles(files: NormalizedSourceFile[]): LightExtensionDiagnostic[] {
    return files
      .filter((file) => classifySourcePath(file.path).status === 'shared')
      .flatMap((file) => this.validateSharedFile(file));
  }

  private validateSharedFile(file: NormalizedSourceFile): LightExtensionDiagnostic[] {
    if (!isCodeFile(file.path)) {
      return [];
    }

    return this.validateCodeFile(file, {}, 'shared');
  }

  private validateMetaFile(
    file: NormalizedSourceFile | undefined,
    diagnostics: LightExtensionDiagnostic[],
    target: Omit<DiagnosticTarget, 'path'>,
  ): ParsedMeta {
    const emptyMeta: ParsedMeta = {
      title: null,
      description: null,
      category: null,
      icon: null,
      tags: null,
      sort: null,
    };

    if (!file) {
      return emptyMeta;
    }

    const json = this.parseJson(file, 'meta_json_invalid', diagnostics, target);
    if (json === invalidJsonParse) {
      return emptyMeta;
    }
    if (!isPlainRecord(json)) {
      diagnostics.push(
        diagnostic('meta_json_invalid', 'error', 'meta.json must contain a JSON object', {
          ...target,
          path: file.path,
        }),
      );
      return emptyMeta;
    }

    const allowedKeys = new Set(['title', 'description', 'category', 'icon', 'tags', 'sort']);
    for (const key of Object.keys(json)) {
      if (!allowedKeys.has(key)) {
        diagnostics.push(
          diagnostic('meta_unknown_field', 'error', `meta.json field "${key}" is not supported`, {
            ...target,
            path: file.path,
          }),
        );
      }
    }

    return {
      title: optionalStringField(json, 'title', diagnostics, { ...target, path: file.path }, 120),
      description: optionalStringField(json, 'description', diagnostics, { ...target, path: file.path }, 1000),
      category: optionalSlugField(json, 'category', diagnostics, { ...target, path: file.path }),
      icon: optionalStringField(json, 'icon', diagnostics, { ...target, path: file.path }, 120),
      tags: optionalStringArrayField(json, 'tags', diagnostics, { ...target, path: file.path }),
      sort: optionalIntegerField(json, 'sort', diagnostics, { ...target, path: file.path }),
    };
  }

  private validateSettingsFile(
    file: NormalizedSourceFile | undefined,
    diagnostics: LightExtensionDiagnostic[],
    target: Omit<DiagnosticTarget, 'path'>,
  ): Record<string, unknown> | null {
    if (!file) {
      return null;
    }

    const json = this.parseJson(file, 'settings_json_invalid', diagnostics, target);
    if (json === invalidJsonParse) {
      return null;
    }
    if (!isPlainRecord(json)) {
      diagnostics.push(
        diagnostic('settings_schema_invalid', 'error', 'settings.json must contain a JSON object schema', {
          ...target,
          path: file.path,
        }),
      );
      return null;
    }

    this.validateSettingsSchemaNode(json, {
      path: file.path,
      schemaPath: '$',
      depth: 0,
      diagnostics,
      target,
    });

    return json;
  }

  private parseJson(
    file: NormalizedSourceFile,
    code: string,
    diagnostics: LightExtensionDiagnostic[],
    target: Omit<DiagnosticTarget, 'path'>,
  ): unknown {
    if (file.size > this.capabilities.limits.maxJsonBytes) {
      diagnostics.push(
        diagnostic('json_file_too_large', 'error', 'JSON metadata file is too large', {
          ...target,
          path: file.path,
          details: {
            size: file.size,
            maxJsonBytes: this.capabilities.limits.maxJsonBytes,
          },
        }),
      );
      return invalidJsonParse;
    }

    try {
      return JSON.parse(file.content);
    } catch (error) {
      diagnostics.push(
        diagnostic(code, 'error', error instanceof Error ? error.message : 'Invalid JSON', {
          ...target,
          path: file.path,
        }),
      );
      return invalidJsonParse;
    }
  }

  private validateSettingsSchemaNode(
    node: Record<string, unknown>,
    input: {
      path: string;
      schemaPath: string;
      depth: number;
      diagnostics: LightExtensionDiagnostic[];
      target: Omit<DiagnosticTarget, 'path'>;
    },
  ): void {
    const keywordSet = new Set<string>(this.capabilities.schemaSubset.allowedKeywords);
    const schemaTarget = {
      ...input.target,
      path: input.path,
    };

    if (input.depth > this.capabilities.limits.maxSettingsSchemaDepth) {
      input.diagnostics.push(
        diagnostic('settings_schema_too_deep', 'error', 'settings.json schema is too deeply nested', {
          ...schemaTarget,
          details: {
            schemaPath: input.schemaPath,
            maxDepth: this.capabilities.limits.maxSettingsSchemaDepth,
          },
        }),
      );
      return;
    }

    for (const key of Object.keys(node)) {
      if (!keywordSet.has(key)) {
        input.diagnostics.push(
          diagnostic(
            'settings_schema_keyword_not_allowed',
            'error',
            `settings.json keyword "${key}" is not supported`,
            {
              ...schemaTarget,
              details: {
                schemaPath: input.schemaPath,
                keyword: key,
              },
            },
          ),
        );
      }
    }
    for (const [key, value] of Object.entries(node)) {
      if (typeof value === 'string' && containsTemplateExpression(value)) {
        input.diagnostics.push(
          diagnostic('settings_expression_not_allowed', 'error', 'settings.json expression strings are not supported', {
            ...schemaTarget,
            details: {
              schemaPath: `${input.schemaPath}.${key}`,
              keyword: key,
            },
          }),
        );
      }
    }
    for (const key of ['default', 'enum', 'x-component-props', 'x-decorator-props'] as const) {
      const value = node[key];
      if (Array.isArray(value) || isPlainRecord(value)) {
        this.validateSettingsSchemaValue(value, {
          ...input,
          schemaPath: `${input.schemaPath}.${key}`,
          depth: input.depth + 1,
        });
      }
    }

    if (typeof node.type !== 'undefined') {
      if (typeof node.type !== 'string' || !this.capabilities.schemaSubset.allowedTypes.includes(node.type)) {
        input.diagnostics.push(
          diagnostic('settings_schema_type_not_allowed', 'error', 'settings.json schema type is not supported', {
            ...schemaTarget,
            details: {
              schemaPath: input.schemaPath,
              type: node.type,
            },
          }),
        );
      }
    }

    validateOptionalString(node, 'title', input.diagnostics, schemaTarget);
    validateOptionalString(node, 'description', input.diagnostics, schemaTarget);
    validateOptionalString(node, 'format', input.diagnostics, schemaTarget);
    validateOptionalNumber(node, 'minLength', input.diagnostics, schemaTarget);
    validateOptionalNumber(node, 'maxLength', input.diagnostics, schemaTarget);
    validateOptionalNumber(node, 'minimum', input.diagnostics, schemaTarget);
    validateOptionalNumber(node, 'maximum', input.diagnostics, schemaTarget);

    if (typeof node['x-component'] !== 'undefined') {
      if (
        typeof node['x-component'] !== 'string' ||
        !this.capabilities.xComponentWhitelist.includes(node['x-component'])
      ) {
        input.diagnostics.push(
          diagnostic('settings_x_component_not_allowed', 'error', 'settings.json x-component is not allowed', {
            ...schemaTarget,
            details: {
              schemaPath: input.schemaPath,
              component: node['x-component'],
            },
          }),
        );
      }
    }

    if (typeof node.required !== 'undefined') {
      if (!Array.isArray(node.required) || node.required.some((item) => typeof item !== 'string')) {
        input.diagnostics.push(
          diagnostic('settings_required_invalid', 'error', 'settings.json required must be a string array', {
            ...schemaTarget,
            details: {
              schemaPath: input.schemaPath,
            },
          }),
        );
      }
    }

    if (typeof node.enum !== 'undefined' && !Array.isArray(node.enum)) {
      input.diagnostics.push(
        diagnostic('settings_enum_invalid', 'error', 'settings.json enum must be an array', {
          ...schemaTarget,
          details: {
            schemaPath: input.schemaPath,
          },
        }),
      );
    }

    if (typeof node.properties !== 'undefined') {
      if (!isPlainRecord(node.properties)) {
        input.diagnostics.push(
          diagnostic('settings_properties_invalid', 'error', 'settings.json properties must be an object', {
            ...schemaTarget,
            details: {
              schemaPath: input.schemaPath,
            },
          }),
        );
      } else {
        for (const [propertyName, propertySchema] of Object.entries(node.properties)) {
          if (!isValidSettingsPropertyName(propertyName)) {
            input.diagnostics.push(
              diagnostic('settings_property_name_invalid', 'error', 'settings.json property name is invalid', {
                ...schemaTarget,
                details: {
                  schemaPath: `${input.schemaPath}.properties.${propertyName}`,
                  propertyName,
                },
              }),
            );
            continue;
          }
          if (!isPlainRecord(propertySchema)) {
            input.diagnostics.push(
              diagnostic(
                'settings_property_schema_invalid',
                'error',
                'settings.json property schema must be an object',
                {
                  ...schemaTarget,
                  details: {
                    schemaPath: `${input.schemaPath}.properties.${propertyName}`,
                  },
                },
              ),
            );
            continue;
          }
          this.validateSettingsSchemaNode(propertySchema, {
            ...input,
            schemaPath: `${input.schemaPath}.properties.${propertyName}`,
            depth: input.depth + 1,
          });
        }
      }
    }

    if (typeof node.items !== 'undefined') {
      if (!isPlainRecord(node.items)) {
        input.diagnostics.push(
          diagnostic('settings_items_invalid', 'error', 'settings.json items must be a schema object', {
            ...schemaTarget,
            details: {
              schemaPath: input.schemaPath,
            },
          }),
        );
      } else {
        this.validateSettingsSchemaNode(node.items, {
          ...input,
          schemaPath: `${input.schemaPath}.items`,
          depth: input.depth + 1,
        });
      }
    }
  }

  private validateSettingsSchemaValue(
    value: unknown,
    input: {
      path: string;
      schemaPath: string;
      depth: number;
      diagnostics: LightExtensionDiagnostic[];
      target: Omit<DiagnosticTarget, 'path'>;
    },
  ): void {
    const schemaTarget = {
      ...input.target,
      path: input.path,
    };

    if (input.depth > this.capabilities.limits.maxSettingsSchemaDepth) {
      input.diagnostics.push(
        diagnostic('settings_schema_too_deep', 'error', 'settings.json schema is too deeply nested', {
          ...schemaTarget,
          details: {
            schemaPath: input.schemaPath,
            maxDepth: this.capabilities.limits.maxSettingsSchemaDepth,
          },
        }),
      );
      return;
    }

    if (typeof value === 'string') {
      if (containsTemplateExpression(value)) {
        input.diagnostics.push(
          diagnostic('settings_expression_not_allowed', 'error', 'settings.json expression strings are not supported', {
            ...schemaTarget,
            details: {
              schemaPath: input.schemaPath,
            },
          }),
        );
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        this.validateSettingsSchemaValue(item, {
          ...input,
          schemaPath: `${input.schemaPath}[${index}]`,
          depth: input.depth + 1,
        });
      });
      return;
    }

    if (isPlainRecord(value)) {
      for (const [key, child] of Object.entries(value)) {
        this.validateSettingsSchemaValue(child, {
          ...input,
          schemaPath: `${input.schemaPath}.${key}`,
          depth: input.depth + 1,
        });
      }
    }
  }

  private validateCodeFile(
    file: NormalizedSourceFile,
    target: Omit<DiagnosticTarget, 'path'>,
    boundary: 'entry' | 'shared' = 'entry',
  ): LightExtensionDiagnostic[] {
    const sourceFile = ts.createSourceFile(
      file.path,
      file.content,
      ts.ScriptTarget.Latest,
      true,
      scriptKind(file.path),
    );
    const diagnostics: LightExtensionDiagnostic[] = sourceFile.parseDiagnostics.map((item) =>
      diagnosticAt(
        sourceFile,
        item.start || 0,
        'source_parse_error',
        'error',
        ts.flattenDiagnosticMessageText(item.messageText, '\n'),
        target,
      ),
    );
    const globalObjectAliases = new Set(globalObjectNames);
    const reflectObjectAliases = new Set(['Reflect']);
    const reflectGetAliases = new Set<string>();
    const requireAliases = new Set<string>();
    const blockedApiAliases = new Map<string, string>();
    const globalPropertyDescriptorAliases = new Map<string, string>();
    const globalPropertyDescriptorsObjectAliases = new Set<string>();
    const staticStringAliases = new Map<string, string>();

    const visit = (node: ts.Node) => {
      const staticStringAliasSnapshot = isStaticStringAliasScopeNode(node) ? new Map(staticStringAliases) : null;
      recordStaticStringAliasFromNode(node, staticStringAliases);

      if (ts.isImportDeclaration(node)) {
        const specifier = getImportSpecifier(node.moduleSpecifier);
        if (specifier && !specifier.startsWith('.')) {
          diagnostics.push(...validateExternalSdkImport(node, sourceFile, specifier, target));
        } else if (
          specifier &&
          (boundary === 'shared'
            ? isRelativeImportOutsideSharedRoot(file.path, specifier)
            : isRelativeImportOutsideCurrentEntry(file.path, specifier, target))
        ) {
          diagnostics.push(
            diagnosticAt(
              sourceFile,
              node.moduleSpecifier.getStart(sourceFile),
              'import_not_allowed',
              'error',
              boundary === 'shared'
                ? `Relative import "${specifier}" must stay within src/shared`
                : `Relative import "${specifier}" must stay within the current light-extension entry or src/shared`,
              target,
            ),
          );
        }
      }

      if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
        const specifier = getImportSpecifier(node.moduleSpecifier);
        if (specifier && !specifier.startsWith('.')) {
          diagnostics.push(
            diagnosticAt(
              sourceFile,
              node.moduleSpecifier.getStart(sourceFile),
              'import_not_allowed',
              'error',
              `Re-export from "${specifier}" is not allowed in light-extension source`,
              target,
            ),
          );
        } else if (
          specifier &&
          (boundary === 'shared'
            ? isRelativeImportOutsideSharedRoot(file.path, specifier)
            : isRelativeImportOutsideCurrentEntry(file.path, specifier, target))
        ) {
          diagnostics.push(
            diagnosticAt(
              sourceFile,
              node.moduleSpecifier.getStart(sourceFile),
              'import_not_allowed',
              'error',
              boundary === 'shared'
                ? `Relative re-export "${specifier}" must stay within src/shared`
                : `Relative re-export "${specifier}" must stay within the current light-extension entry or src/shared`,
              target,
            ),
          );
        }
      }

      if (ts.isImportEqualsDeclaration(node)) {
        const specifier = getImportEqualsSpecifier(node);
        if (specifier) {
          diagnostics.push(
            diagnosticAt(
              sourceFile,
              node.moduleReference.getStart(sourceFile),
              'require_not_allowed',
              'error',
              'import = require(...) is not allowed in light-extension source',
              target,
            ),
          );
        }
        if (specifier && !specifier.startsWith('.')) {
          diagnostics.push(
            diagnosticAt(
              sourceFile,
              node.moduleReference.getStart(sourceFile),
              'import_not_allowed',
              'error',
              `Import "${specifier}" is not allowed in light-extension source`,
              target,
            ),
          );
        }
      }

      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        diagnostics.push(
          diagnosticAt(
            sourceFile,
            node.getStart(sourceFile),
            'dynamic_import_not_allowed',
            'error',
            'Dynamic import(...) is not allowed in light-extension source',
            target,
          ),
        );
      }

      if (
        ts.isCallExpression(node) &&
        isForbiddenRequireCall(
          node.expression,
          globalObjectAliases,
          reflectObjectAliases,
          reflectGetAliases,
          requireAliases,
          globalPropertyDescriptorAliases,
          globalPropertyDescriptorsObjectAliases,
        )
      ) {
        diagnostics.push(
          diagnosticAt(
            sourceFile,
            node.getStart(sourceFile),
            'require_not_allowed',
            'error',
            'require(...) is not allowed in light-extension source',
            target,
          ),
        );
      }

      const forbiddenRequireReference = getForbiddenRequireReferenceExpression(
        node,
        globalObjectAliases,
        reflectObjectAliases,
        reflectGetAliases,
        requireAliases,
        globalPropertyDescriptorAliases,
        globalPropertyDescriptorsObjectAliases,
      );
      if (forbiddenRequireReference) {
        diagnostics.push(
          diagnosticAt(
            sourceFile,
            forbiddenRequireReference.getStart(sourceFile),
            'require_not_allowed',
            'error',
            'require references are not allowed in light-extension source',
            target,
          ),
        );
      }

      const forbiddenReflectGetReference = getForbiddenReflectGetReferenceExpression(
        node,
        reflectObjectAliases,
        reflectGetAliases,
        staticStringAliases,
      );
      if (forbiddenReflectGetReference) {
        diagnostics.push(
          diagnosticAt(
            sourceFile,
            forbiddenReflectGetReference.getStart(sourceFile),
            'blocked_global_api',
            'error',
            'Reflect.get references are not allowed in light-extension source',
            target,
          ),
        );
      }

      if (
        ts.isCallExpression(node) &&
        isReflectGetHighOrderCall(node.expression, reflectObjectAliases, reflectGetAliases, staticStringAliases)
      ) {
        diagnostics.push(
          diagnosticAt(
            sourceFile,
            node.getStart(sourceFile),
            'blocked_global_api',
            'error',
            'Reflect.get higher-order calls are not allowed in light-extension source',
            target,
          ),
        );
      }

      if (
        (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
        !isDirectCallee(node) &&
        isRequireCallHelperAccess(
          node,
          globalObjectAliases,
          reflectObjectAliases,
          reflectGetAliases,
          requireAliases,
          globalPropertyDescriptorAliases,
          globalPropertyDescriptorsObjectAliases,
        )
      ) {
        diagnostics.push(
          diagnosticAt(
            sourceFile,
            node.getStart(sourceFile),
            'require_not_allowed',
            'error',
            'require call helpers are not allowed in light-extension source',
            target,
          ),
        );
      }

      if (
        (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
        !isDirectCallee(node) &&
        isReflectGetCallHelperAccess(node, reflectObjectAliases, reflectGetAliases, staticStringAliases)
      ) {
        diagnostics.push(
          diagnosticAt(
            sourceFile,
            node.getStart(sourceFile),
            'blocked_global_api',
            'error',
            'Reflect.get call helpers are not allowed in light-extension source',
            target,
          ),
        );
      }

      if (ts.isObjectLiteralExpression(node) || ts.isArrayLiteralExpression(node)) {
        this.recordForbiddenContainerValues({
          expression: node,
          sourceFile,
          diagnostics,
          target,
          globalObjectAliases,
          reflectObjectAliases,
          reflectGetAliases,
          requireAliases,
          globalPropertyDescriptorAliases,
          globalPropertyDescriptorsObjectAliases,
          blockedApiAliases,
          staticStringAliases,
        });
      }

      if (isFunctionLikeWithBody(node)) {
        const forbiddenReturn = getForbiddenFunctionReturnDiagnostic(
          node,
          globalObjectAliases,
          reflectObjectAliases,
          reflectGetAliases,
          requireAliases,
          globalPropertyDescriptorAliases,
          globalPropertyDescriptorsObjectAliases,
          blockedApiAliases,
          staticStringAliases,
        );
        if (forbiddenReturn) {
          diagnostics.push(
            diagnosticAt(
              sourceFile,
              node.getStart(sourceFile),
              forbiddenReturn.code,
              'error',
              forbiddenReturn.message,
              target,
            ),
          );
        }
      }

      if (ts.isCallExpression(node)) {
        const forbiddenArguments = getForbiddenPrivilegedCallArguments(
          node,
          globalObjectAliases,
          reflectObjectAliases,
          reflectGetAliases,
          requireAliases,
          globalPropertyDescriptorAliases,
          globalPropertyDescriptorsObjectAliases,
          blockedApiAliases,
          staticStringAliases,
        );
        for (const item of forbiddenArguments) {
          diagnostics.push(
            diagnosticAt(
              sourceFile,
              item.argument.getStart(sourceFile),
              item.forbidden.code,
              'error',
              item.forbidden.message,
              target,
            ),
          );
        }

        this.recordForbiddenObjectWriteCall({
          expression: node,
          sourceFile,
          diagnostics,
          target,
          globalObjectAliases,
          reflectObjectAliases,
          reflectGetAliases,
          requireAliases,
          globalPropertyDescriptorAliases,
          globalPropertyDescriptorsObjectAliases,
          blockedApiAliases,
          staticStringAliases,
        });
      }

      if (
        ts.isCallExpression(node) &&
        isPrototypeGlobalExposureCall(
          node,
          globalObjectAliases,
          reflectObjectAliases,
          reflectGetAliases,
          staticStringAliases,
        )
      ) {
        diagnostics.push(
          diagnosticAt(
            sourceFile,
            node.getStart(sourceFile),
            'blocked_global_api',
            'error',
            'Global object prototype exposure is not allowed in light-extension source',
            target,
          ),
        );
      }

      if (
        ts.isCallExpression(node) &&
        (isUnknownObjectStaticCall(node, staticStringAliases) ||
          isReflectApplyPrivilegedStaticCall(node, reflectObjectAliases, staticStringAliases))
      ) {
        diagnostics.push(
          diagnosticAt(
            sourceFile,
            node.getStart(sourceFile),
            'blocked_global_api',
            'error',
            'Dynamic privileged static calls are not allowed in light-extension source',
            target,
          ),
        );
      }

      if (
        ts.isCallExpression(node) &&
        isBlockedApiExpression(
          node.expression,
          'eval',
          globalObjectAliases,
          reflectObjectAliases,
          reflectGetAliases,
          globalPropertyDescriptorAliases,
          globalPropertyDescriptorsObjectAliases,
          blockedApiAliases,
          staticStringAliases,
        )
      ) {
        diagnostics.push(
          diagnosticAt(
            sourceFile,
            node.getStart(sourceFile),
            'blocked_global_api',
            'error',
            'eval is not allowed in light-extension source',
            target,
          ),
        );
      }

      if (ts.isElementAccessExpression(node)) {
        const forbiddenComputedAccess = getForbiddenComputedElementAccessDiagnostic(
          node,
          staticStringAliases,
          globalObjectAliases,
          reflectObjectAliases,
          reflectGetAliases,
          globalPropertyDescriptorsObjectAliases,
        );
        if (forbiddenComputedAccess) {
          diagnostics.push(
            diagnosticAt(
              sourceFile,
              node.getStart(sourceFile),
              forbiddenComputedAccess.code,
              'error',
              forbiddenComputedAccess.message,
              target,
            ),
          );
        }
      }

      if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
        const privilegedObjectStaticAccessName = getPrivilegedObjectStaticAccessName(node, staticStringAliases);
        if (privilegedObjectStaticAccessName) {
          diagnostics.push(
            diagnosticAt(
              sourceFile,
              node.getStart(sourceFile),
              'blocked_global_api',
              'error',
              `${privilegedObjectStaticAccessName} references are not allowed in light-extension source`,
              target,
            ),
          );
        }

        const staticHelperName = getPrivilegedStaticCallHelperName(node, reflectObjectAliases, staticStringAliases);
        if (staticHelperName) {
          diagnostics.push(
            diagnosticAt(
              sourceFile,
              node.getStart(sourceFile),
              'blocked_global_api',
              'error',
              `${staticHelperName} call helpers are not allowed in light-extension source`,
              target,
            ),
          );
        }

        const globalConstructorName = getGlobalConstructorAccessName(
          node,
          globalObjectAliases,
          reflectObjectAliases,
          reflectGetAliases,
          staticStringAliases,
        );
        if (globalConstructorName) {
          diagnostics.push(
            diagnosticAt(
              sourceFile,
              node.getStart(sourceFile),
              'blocked_global_api',
              'error',
              `${globalConstructorName} global access is not allowed in light-extension source`,
              target,
            ),
          );
        }
      }

      if (
        (ts.isCallExpression(node) || ts.isNewExpression(node)) &&
        node.expression &&
        isBlockedApiExpression(
          node.expression,
          'Function',
          globalObjectAliases,
          reflectObjectAliases,
          reflectGetAliases,
          globalPropertyDescriptorAliases,
          globalPropertyDescriptorsObjectAliases,
          blockedApiAliases,
          staticStringAliases,
        )
      ) {
        diagnostics.push(
          diagnosticAt(
            sourceFile,
            node.getStart(sourceFile),
            'blocked_global_api',
            'error',
            'Function constructor is not allowed in light-extension source',
            target,
          ),
        );
      }

      if ((ts.isCallExpression(node) || ts.isNewExpression(node)) && node.expression) {
        const computedBlockedApiName = getComputedBlockedApiExpressionName(
          node.expression,
          staticStringAliases,
          globalObjectAliases,
          reflectObjectAliases,
          reflectGetAliases,
          globalPropertyDescriptorAliases,
          globalPropertyDescriptorsObjectAliases,
        );
        if (computedBlockedApiName) {
          diagnostics.push(
            diagnosticAt(
              sourceFile,
              node.getStart(sourceFile),
              computedBlockedApiName === 'require' ? 'require_not_allowed' : 'blocked_global_api',
              'error',
              `${computedBlockedApiName} is not allowed in light-extension source`,
              target,
            ),
          );
        }
      }

      if (ts.isNewExpression(node)) {
        const forbiddenArguments = getForbiddenPrivilegedCallArguments(
          node,
          globalObjectAliases,
          reflectObjectAliases,
          reflectGetAliases,
          requireAliases,
          globalPropertyDescriptorAliases,
          globalPropertyDescriptorsObjectAliases,
          blockedApiAliases,
          staticStringAliases,
        );
        for (const item of forbiddenArguments) {
          diagnostics.push(
            diagnosticAt(
              sourceFile,
              item.argument.getStart(sourceFile),
              item.forbidden.code,
              'error',
              item.forbidden.message,
              target,
            ),
          );
        }
      }

      if (ts.isBinaryExpression(node) && isAliasAssignmentOperator(node.operatorToken.kind)) {
        const assignmentTarget = stripParentheses(node.left);
        if (ts.isIdentifier(assignmentTarget)) {
          this.recordForbiddenAlias({
            name: assignmentTarget.text,
            expression: node.right,
            sourceFile,
            diagnostics,
            target,
            globalObjectAliases,
            reflectObjectAliases,
            reflectGetAliases,
            requireAliases,
            globalPropertyDescriptorAliases,
            globalPropertyDescriptorsObjectAliases,
            blockedApiAliases,
            staticStringAliases,
          });
        } else if (ts.isObjectLiteralExpression(assignmentTarget)) {
          this.recordForbiddenObjectAssignmentAliases({
            pattern: assignmentTarget,
            initializer: node.right,
            sourceFile,
            diagnostics,
            target,
            globalObjectAliases,
            reflectObjectAliases,
            reflectGetAliases,
            requireAliases,
            globalPropertyDescriptorAliases,
            globalPropertyDescriptorsObjectAliases,
            blockedApiAliases,
            staticStringAliases,
          });
        } else if (ts.isArrayLiteralExpression(assignmentTarget) && ts.isArrayLiteralExpression(node.right)) {
          this.recordForbiddenArrayAssignmentAliases({
            pattern: assignmentTarget,
            initializer: node.right,
            sourceFile,
            diagnostics,
            target,
            globalObjectAliases,
            reflectObjectAliases,
            reflectGetAliases,
            requireAliases,
            globalPropertyDescriptorAliases,
            globalPropertyDescriptorsObjectAliases,
            blockedApiAliases,
            staticStringAliases,
          });
        } else if (isMemberAssignmentTarget(assignmentTarget)) {
          this.recordForbiddenMemberAssignment({
            targetExpression: assignmentTarget,
            expression: node.right,
            sourceFile,
            diagnostics,
            target,
            globalObjectAliases,
            reflectObjectAliases,
            reflectGetAliases,
            requireAliases,
            globalPropertyDescriptorAliases,
            globalPropertyDescriptorsObjectAliases,
            blockedApiAliases,
            staticStringAliases,
          });
        }
      }

      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
        this.recordForbiddenAlias({
          name: node.name.text,
          expression: node.initializer,
          sourceFile,
          diagnostics,
          target,
          globalObjectAliases,
          reflectObjectAliases,
          reflectGetAliases,
          requireAliases,
          globalPropertyDescriptorAliases,
          globalPropertyDescriptorsObjectAliases,
          blockedApiAliases,
          staticStringAliases,
        });
      }

      if (ts.isVariableDeclaration(node) && ts.isObjectBindingPattern(node.name)) {
        this.recordForbiddenObjectBindingAliases({
          pattern: node.name,
          initializer: node.initializer,
          sourceFile,
          diagnostics,
          target,
          globalObjectAliases,
          reflectObjectAliases,
          reflectGetAliases,
          requireAliases,
          globalPropertyDescriptorAliases,
          globalPropertyDescriptorsObjectAliases,
          blockedApiAliases,
          staticStringAliases,
        });
      }

      if (ts.isVariableDeclaration(node) && ts.isArrayBindingPattern(node.name)) {
        this.recordForbiddenArrayBindingAliases({
          pattern: node.name,
          initializer: node.initializer,
          sourceFile,
          diagnostics,
          target,
          globalObjectAliases,
          reflectObjectAliases,
          reflectGetAliases,
          requireAliases,
          globalPropertyDescriptorAliases,
          globalPropertyDescriptorsObjectAliases,
          blockedApiAliases,
          staticStringAliases,
        });
      }

      if (ts.isParameter(node) && ts.isIdentifier(node.name) && node.initializer) {
        this.recordForbiddenAlias({
          name: node.name.text,
          expression: node.initializer,
          sourceFile,
          diagnostics,
          target,
          globalObjectAliases,
          reflectObjectAliases,
          reflectGetAliases,
          requireAliases,
          globalPropertyDescriptorAliases,
          globalPropertyDescriptorsObjectAliases,
          blockedApiAliases,
          staticStringAliases,
        });
      }

      if (ts.isParameter(node) && ts.isObjectBindingPattern(node.name)) {
        this.recordForbiddenObjectBindingAliases({
          pattern: node.name,
          initializer: node.initializer,
          sourceFile,
          diagnostics,
          target,
          globalObjectAliases,
          reflectObjectAliases,
          reflectGetAliases,
          requireAliases,
          globalPropertyDescriptorAliases,
          globalPropertyDescriptorsObjectAliases,
          blockedApiAliases,
          staticStringAliases,
        });
      }

      if (ts.isParameter(node) && ts.isArrayBindingPattern(node.name)) {
        this.recordForbiddenArrayBindingAliases({
          pattern: node.name,
          initializer: node.initializer,
          sourceFile,
          diagnostics,
          target,
          globalObjectAliases,
          reflectObjectAliases,
          reflectGetAliases,
          requireAliases,
          globalPropertyDescriptorAliases,
          globalPropertyDescriptorsObjectAliases,
          blockedApiAliases,
          staticStringAliases,
        });
      }

      const descriptorValueMemberName = getGlobalPropertyDescriptorValueMemberName(
        node,
        globalObjectAliases,
        reflectObjectAliases,
        reflectGetAliases,
        globalPropertyDescriptorAliases,
        globalPropertyDescriptorsObjectAliases,
        staticStringAliases,
      );
      if (descriptorValueMemberName) {
        diagnostics.push(
          diagnosticAt(
            sourceFile,
            node.getStart(sourceFile),
            descriptorValueMemberName === 'require' ? 'require_not_allowed' : 'blocked_global_api',
            'error',
            `${descriptorValueMemberName} is not allowed in light-extension source`,
            target,
          ),
        );
      }

      if (
        (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
        isBlockedGlobalMemberAccess(node, globalObjectAliases, reflectObjectAliases, reflectGetAliases)
      ) {
        const memberName = getBlockedMemberDisplayName(node);
        diagnostics.push(
          diagnosticAt(
            sourceFile,
            node.getStart(sourceFile),
            'blocked_global_api',
            'error',
            `${memberName || 'Global API'} is not allowed in light-extension source`,
            target,
          ),
        );
      }

      if (
        (ts.isCallExpression(node) || ts.isNewExpression(node)) &&
        node.expression &&
        isBlockedGlobalMemberAccess(node.expression, globalObjectAliases, reflectObjectAliases, reflectGetAliases)
      ) {
        const memberName = getAccessedPropertyName(node.expression);
        diagnostics.push(
          diagnosticAt(
            sourceFile,
            node.getStart(sourceFile),
            'blocked_global_api',
            'error',
            `${memberName || 'Global API'} is not allowed in light-extension source`,
            target,
          ),
        );
      }

      if (ts.isCallExpression(node)) {
        const reflectedMemberName = getReflectBlockedMemberName(
          node,
          globalObjectAliases,
          reflectObjectAliases,
          reflectGetAliases,
          staticStringAliases,
        );
        if (reflectedMemberName) {
          diagnostics.push(
            diagnosticAt(
              sourceFile,
              node.getStart(sourceFile),
              'blocked_global_api',
              'error',
              `${reflectedMemberName} is not allowed in light-extension source`,
              target,
            ),
          );
        }
      }

      const blockedIdentifierApi = getBlockedApiIdentifierName(node, blockedApiAliases);
      if (blockedIdentifierApi) {
        diagnostics.push(
          diagnosticAt(
            sourceFile,
            node.getStart(sourceFile),
            'blocked_global_api',
            'error',
            `${blockedIdentifierApi} is not allowed in light-extension source`,
            target,
          ),
        );
      }

      if (isProcessGlobalMemberAccess(node, globalObjectAliases, reflectObjectAliases, reflectGetAliases)) {
        diagnostics.push(
          diagnosticAt(
            sourceFile,
            node.getStart(sourceFile),
            'blocked_global_api',
            'error',
            'process is not allowed in light-extension source',
            target,
          ),
        );
      }

      if (
        ts.isIdentifier(node) &&
        (node.text === 'process' || blockedApiAliases.get(node.text) === 'process') &&
        !isDeclarationName(node) &&
        !isAccessPropertyName(node)
      ) {
        diagnostics.push(
          diagnosticAt(
            sourceFile,
            node.getStart(sourceFile),
            'blocked_global_api',
            'error',
            'process is not allowed in light-extension source',
            target,
          ),
        );
      }

      ts.forEachChild(node, visit);
      if (staticStringAliasSnapshot) {
        if (isStaticStringAliasBlockScopeNode(node)) {
          const changedNames = new Set([
            ...collectStaticStringAssignmentNames(node),
            ...collectFunctionScopedVarDeclarationNames(node),
          ]);
          for (const name of changedNames) {
            const currentValue = staticStringAliases.get(name);
            if (currentValue === undefined) {
              staticStringAliasSnapshot.delete(name);
            } else {
              staticStringAliasSnapshot.set(name, currentValue);
            }
          }
        }
        staticStringAliases.clear();
        for (const [name, value] of staticStringAliasSnapshot) {
          staticStringAliases.set(name, value);
        }
      }
    };

    ts.forEachChild(sourceFile, visit);
    return diagnostics.map((item) => ({
      ...item,
      path: item.path || file.path,
      ...target,
    }));
  }

  private recordForbiddenAlias(input: {
    name: string;
    expression: ts.Expression;
    sourceFile: ts.SourceFile;
    diagnostics: LightExtensionDiagnostic[];
    target: Omit<DiagnosticTarget, 'path'>;
    globalObjectAliases: Set<string>;
    reflectObjectAliases: Set<string>;
    reflectGetAliases: Set<string>;
    requireAliases: Set<string>;
    globalPropertyDescriptorAliases: Map<string, string>;
    globalPropertyDescriptorsObjectAliases: Set<string>;
    blockedApiAliases: Map<string, string>;
    staticStringAliases: Map<string, string>;
  }): void {
    const expression = stripParentheses(input.expression);
    recordStaticStringAlias(input.name, expression, input.staticStringAliases);
    const privilegedObjectStaticMethodName = getPrivilegedObjectStaticMethodAliasName(
      expression,
      input.staticStringAliases,
    );
    if (isObjectConstructorExpression(expression, input.staticStringAliases) || privilegedObjectStaticMethodName) {
      input.diagnostics.push(
        diagnosticAt(
          input.sourceFile,
          expression.getStart(input.sourceFile),
          'blocked_global_api',
          'error',
          `${privilegedObjectStaticMethodName || 'Object'} aliasing is not allowed in light-extension source`,
          input.target,
        ),
      );
    }
    if (
      isGlobalObjectOrDescriptorValueExpression(
        expression,
        input.globalObjectAliases,
        input.reflectObjectAliases,
        input.reflectGetAliases,
        input.globalPropertyDescriptorAliases,
        input.globalPropertyDescriptorsObjectAliases,
        input.staticStringAliases,
      )
    ) {
      input.globalObjectAliases.add(input.name);
    }
    if (isReflectObjectExpression(expression, input.reflectObjectAliases, input.staticStringAliases)) {
      input.reflectObjectAliases.add(input.name);
    }
    if (
      isReflectGetExpression(expression, input.reflectObjectAliases, input.reflectGetAliases, input.staticStringAliases)
    ) {
      input.reflectGetAliases.add(input.name);
    }
    const globalPropertyDescriptorMemberName = getGlobalPropertyDescriptorMemberName(
      expression,
      input.globalObjectAliases,
      input.reflectObjectAliases,
      input.reflectGetAliases,
      input.globalPropertyDescriptorAliases,
      input.globalPropertyDescriptorsObjectAliases,
      input.staticStringAliases,
    );
    if (globalPropertyDescriptorMemberName) {
      input.globalPropertyDescriptorAliases.set(input.name, globalPropertyDescriptorMemberName);
    }
    if (
      isGlobalPropertyDescriptorsObjectExpression(
        expression,
        input.globalObjectAliases,
        input.reflectObjectAliases,
        input.reflectGetAliases,
        input.globalPropertyDescriptorsObjectAliases,
        input.staticStringAliases,
      )
    ) {
      input.globalPropertyDescriptorsObjectAliases.add(input.name);
    }

    if (
      isRequireReferenceExpression(
        expression,
        input.globalObjectAliases,
        input.reflectObjectAliases,
        input.reflectGetAliases,
        input.requireAliases,
        input.globalPropertyDescriptorAliases,
        input.globalPropertyDescriptorsObjectAliases,
      )
    ) {
      input.requireAliases.add(input.name);
      input.diagnostics.push(
        diagnosticAt(
          input.sourceFile,
          expression.getStart(input.sourceFile),
          'require_not_allowed',
          'error',
          'require aliasing is not allowed in light-extension source',
          input.target,
        ),
      );
    }

    if (
      isRequireCallHelperAccess(
        expression,
        input.globalObjectAliases,
        input.reflectObjectAliases,
        input.reflectGetAliases,
        input.requireAliases,
        input.globalPropertyDescriptorAliases,
        input.globalPropertyDescriptorsObjectAliases,
      )
    ) {
      input.diagnostics.push(
        diagnosticAt(
          input.sourceFile,
          expression.getStart(input.sourceFile),
          'require_not_allowed',
          'error',
          'require call helper aliasing is not allowed in light-extension source',
          input.target,
        ),
      );
    }

    if (
      isReflectGetCallHelperAccess(
        expression,
        input.reflectObjectAliases,
        input.reflectGetAliases,
        input.staticStringAliases,
      )
    ) {
      input.diagnostics.push(
        diagnosticAt(
          input.sourceFile,
          expression.getStart(input.sourceFile),
          'blocked_global_api',
          'error',
          'Reflect.get call helper aliasing is not allowed in light-extension source',
          input.target,
        ),
      );
    }

    const blockedApiName =
      getBlockedApiExpressionName(
        expression,
        input.globalObjectAliases,
        input.blockedApiAliases,
        input.reflectObjectAliases,
        input.reflectGetAliases,
        input.globalPropertyDescriptorAliases,
        input.globalPropertyDescriptorsObjectAliases,
        input.staticStringAliases,
      ) ||
      getComputedBlockedApiExpressionName(
        expression,
        input.staticStringAliases,
        input.globalObjectAliases,
        input.reflectObjectAliases,
        input.reflectGetAliases,
        input.globalPropertyDescriptorAliases,
        input.globalPropertyDescriptorsObjectAliases,
      );
    if (!blockedApiName) {
      return;
    }

    input.blockedApiAliases.set(input.name, blockedApiName);
    input.diagnostics.push(
      diagnosticAt(
        input.sourceFile,
        expression.getStart(input.sourceFile),
        'blocked_global_api',
        'error',
        `${blockedApiName} is not allowed in light-extension source`,
        input.target,
      ),
    );
  }

  private recordForbiddenObjectBindingAliases(input: {
    pattern: ts.ObjectBindingPattern;
    initializer: ts.Expression | undefined;
    sourceFile: ts.SourceFile;
    diagnostics: LightExtensionDiagnostic[];
    target: Omit<DiagnosticTarget, 'path'>;
    globalObjectAliases: Set<string>;
    reflectObjectAliases: Set<string>;
    reflectGetAliases: Set<string>;
    requireAliases: Set<string>;
    globalPropertyDescriptorAliases: Map<string, string>;
    globalPropertyDescriptorsObjectAliases: Set<string>;
    blockedApiAliases: Map<string, string>;
    staticStringAliases: Map<string, string>;
  }): void {
    if (!input.initializer) {
      return;
    }

    const bindsFromGlobalObject = isGlobalObjectOrDescriptorValueExpression(
      input.initializer,
      input.globalObjectAliases,
      input.reflectObjectAliases,
      input.reflectGetAliases,
      input.globalPropertyDescriptorAliases,
      input.globalPropertyDescriptorsObjectAliases,
      input.staticStringAliases,
    );
    const bindsFromRequireFunction = isRequireFunctionExpression(
      input.initializer,
      input.globalObjectAliases,
      input.reflectObjectAliases,
      input.reflectGetAliases,
      input.requireAliases,
      input.globalPropertyDescriptorAliases,
      input.globalPropertyDescriptorsObjectAliases,
    );
    const bindsFromReflectObject = isReflectObjectExpression(
      input.initializer,
      input.reflectObjectAliases,
      input.staticStringAliases,
    );
    const bindsFromReflectGetFunction = isReflectGetFunctionExpression(
      input.initializer,
      input.reflectObjectAliases,
      input.reflectGetAliases,
      input.staticStringAliases,
    );
    const bindsFromObjectConstructor = isObjectConstructorExpression(input.initializer, input.staticStringAliases);
    const bindsFromGlobalPropertyDescriptor = getGlobalPropertyDescriptorMemberName(
      input.initializer,
      input.globalObjectAliases,
      input.reflectObjectAliases,
      input.reflectGetAliases,
      input.globalPropertyDescriptorAliases,
      input.globalPropertyDescriptorsObjectAliases,
      input.staticStringAliases,
    );
    const bindsFromGlobalPropertyDescriptorsObject = isGlobalPropertyDescriptorsObjectExpression(
      input.initializer,
      input.globalObjectAliases,
      input.reflectObjectAliases,
      input.reflectGetAliases,
      input.globalPropertyDescriptorsObjectAliases,
      input.staticStringAliases,
    );

    for (const element of input.pattern.elements) {
      if (element.dotDotDotToken) {
        const forbidden = getForbiddenStoredExpressionDiagnostic(
          input.initializer,
          input.globalObjectAliases,
          input.reflectObjectAliases,
          input.reflectGetAliases,
          input.requireAliases,
          input.globalPropertyDescriptorAliases,
          input.globalPropertyDescriptorsObjectAliases,
          input.blockedApiAliases,
          input.staticStringAliases,
        );
        if (forbidden) {
          input.diagnostics.push(
            diagnosticAt(
              input.sourceFile,
              element.getStart(input.sourceFile),
              forbidden.code,
              'error',
              forbidden.message,
              input.target,
            ),
          );
        }
        this.recordForbiddenBindingNameAliases({
          name: element.name,
          expression: input.initializer,
          sourceFile: input.sourceFile,
          diagnostics: input.diagnostics,
          target: input.target,
          globalObjectAliases: input.globalObjectAliases,
          reflectObjectAliases: input.reflectObjectAliases,
          reflectGetAliases: input.reflectGetAliases,
          requireAliases: input.requireAliases,
          globalPropertyDescriptorAliases: input.globalPropertyDescriptorAliases,
          globalPropertyDescriptorsObjectAliases: input.globalPropertyDescriptorsObjectAliases,
          blockedApiAliases: input.blockedApiAliases,
          staticStringAliases: input.staticStringAliases,
        });
        continue;
      }

      const memberName = getBindingElementPropertyName(element, input.staticStringAliases);
      if (element.initializer) {
        this.recordForbiddenBindingNameAliases({
          name: element.name,
          expression: element.initializer,
          sourceFile: input.sourceFile,
          diagnostics: input.diagnostics,
          target: input.target,
          globalObjectAliases: input.globalObjectAliases,
          reflectObjectAliases: input.reflectObjectAliases,
          reflectGetAliases: input.reflectGetAliases,
          requireAliases: input.requireAliases,
          globalPropertyDescriptorAliases: input.globalPropertyDescriptorAliases,
          globalPropertyDescriptorsObjectAliases: input.globalPropertyDescriptorsObjectAliases,
          blockedApiAliases: input.blockedApiAliases,
          staticStringAliases: input.staticStringAliases,
        });
      }
      if (!memberName && isUnknownComputedBindingElement(element, input.staticStringAliases)) {
        if (
          bindsFromGlobalObject ||
          bindsFromGlobalPropertyDescriptor ||
          bindsFromGlobalPropertyDescriptorsObject ||
          bindsFromReflectObject ||
          bindsFromObjectConstructor
        ) {
          input.diagnostics.push(
            diagnosticAt(
              input.sourceFile,
              element.getStart(input.sourceFile),
              bindsFromGlobalPropertyDescriptor === 'require' ? 'require_not_allowed' : 'blocked_global_api',
              'error',
              'Dynamic computed destructuring from privileged objects is not allowed in light-extension source',
              input.target,
            ),
          );
          continue;
        }
      }
      if (bindsFromObjectConstructor && memberName && privilegedObjectStaticMethods.has(memberName)) {
        input.diagnostics.push(
          diagnosticAt(
            input.sourceFile,
            element.getStart(input.sourceFile),
            'blocked_global_api',
            'error',
            `${memberName} aliasing is not allowed in light-extension source`,
            input.target,
          ),
        );
        continue;
      }
      if (bindsFromGlobalObject && memberName && globalAliasMemberNames.has(memberName)) {
        recordIdentifierAlias(element.name, input.globalObjectAliases);
        if (!ts.isIdentifier(element.name)) {
          this.recordForbiddenBindingNameAliases({
            name: element.name,
            expression: input.initializer,
            sourceFile: input.sourceFile,
            diagnostics: input.diagnostics,
            target: input.target,
            globalObjectAliases: input.globalObjectAliases,
            reflectObjectAliases: input.reflectObjectAliases,
            reflectGetAliases: input.reflectGetAliases,
            requireAliases: input.requireAliases,
            globalPropertyDescriptorAliases: input.globalPropertyDescriptorAliases,
            globalPropertyDescriptorsObjectAliases: input.globalPropertyDescriptorsObjectAliases,
            blockedApiAliases: input.blockedApiAliases,
            staticStringAliases: input.staticStringAliases,
          });
        }
      }

      if (bindsFromGlobalObject && memberName === 'require') {
        input.diagnostics.push(
          diagnosticAt(
            input.sourceFile,
            element.getStart(input.sourceFile),
            'require_not_allowed',
            'error',
            'require aliasing is not allowed in light-extension source',
            input.target,
          ),
        );
        recordIdentifierAlias(element.name, input.requireAliases);
        continue;
      }

      if (bindsFromRequireFunction && functionHelperMembers.has(memberName)) {
        input.diagnostics.push(
          diagnosticAt(
            input.sourceFile,
            element.getStart(input.sourceFile),
            'require_not_allowed',
            'error',
            'require call helper aliasing is not allowed in light-extension source',
            input.target,
          ),
        );
        continue;
      }

      const blockedMemberName =
        memberName === 'constructor'
          ? 'Function'
          : bindsFromGlobalObject && blockedGlobalMembers.has(memberName)
            ? memberName
            : null;
      if (blockedMemberName) {
        input.diagnostics.push(
          diagnosticAt(
            input.sourceFile,
            element.getStart(input.sourceFile),
            'blocked_global_api',
            'error',
            `${blockedMemberName} is not allowed in light-extension source`,
            input.target,
          ),
        );
        if (ts.isIdentifier(element.name)) {
          input.blockedApiAliases.set(element.name.text, blockedMemberName);
        }
        continue;
      }

      if (bindsFromReflectObject && memberName === 'get') {
        recordIdentifierAlias(element.name, input.reflectGetAliases);
      }

      if (bindsFromReflectGetFunction && functionHelperMembers.has(memberName)) {
        input.diagnostics.push(
          diagnosticAt(
            input.sourceFile,
            element.getStart(input.sourceFile),
            'blocked_global_api',
            'error',
            'Reflect.get call helper aliasing is not allowed in light-extension source',
            input.target,
          ),
        );
      }

      if (bindsFromGlobalPropertyDescriptor === 'require' && memberName === 'value') {
        input.diagnostics.push(
          diagnosticAt(
            input.sourceFile,
            element.getStart(input.sourceFile),
            'require_not_allowed',
            'error',
            'require aliasing is not allowed in light-extension source',
            input.target,
          ),
        );
        recordIdentifierAlias(element.name, input.requireAliases);
        continue;
      }

      if (
        bindsFromGlobalPropertyDescriptor &&
        blockedGlobalMembers.has(bindsFromGlobalPropertyDescriptor) &&
        memberName === 'value'
      ) {
        input.diagnostics.push(
          diagnosticAt(
            input.sourceFile,
            element.getStart(input.sourceFile),
            'blocked_global_api',
            'error',
            `${bindsFromGlobalPropertyDescriptor} is not allowed in light-extension source`,
            input.target,
          ),
        );
        if (ts.isIdentifier(element.name)) {
          input.blockedApiAliases.set(element.name.text, bindsFromGlobalPropertyDescriptor);
        }
        continue;
      }

      if (
        bindsFromGlobalPropertyDescriptor &&
        globalAliasMemberNames.has(bindsFromGlobalPropertyDescriptor) &&
        memberName === 'value'
      ) {
        recordIdentifierAlias(element.name, input.globalObjectAliases);
        continue;
      }

      if (
        bindsFromGlobalPropertyDescriptorsObject &&
        memberName &&
        privilegedGlobalDescriptorProperties.has(memberName) &&
        !ts.isIdentifier(element.name)
      ) {
        input.diagnostics.push(
          diagnosticAt(
            input.sourceFile,
            element.getStart(input.sourceFile),
            memberName === 'require' ? 'require_not_allowed' : 'blocked_global_api',
            'error',
            'Nested destructuring from privileged global descriptors is not allowed in light-extension source',
            input.target,
          ),
        );
        continue;
      }

      if (
        bindsFromGlobalPropertyDescriptorsObject &&
        memberName &&
        privilegedGlobalDescriptorProperties.has(memberName)
      ) {
        recordIdentifierMapAlias(element.name, input.globalPropertyDescriptorAliases, memberName);
      }
    }
  }

  private recordForbiddenObjectAssignmentAliases(input: {
    pattern: ts.ObjectLiteralExpression;
    initializer: ts.Expression;
    sourceFile: ts.SourceFile;
    diagnostics: LightExtensionDiagnostic[];
    target: Omit<DiagnosticTarget, 'path'>;
    globalObjectAliases: Set<string>;
    reflectObjectAliases: Set<string>;
    reflectGetAliases: Set<string>;
    requireAliases: Set<string>;
    globalPropertyDescriptorAliases: Map<string, string>;
    globalPropertyDescriptorsObjectAliases: Set<string>;
    blockedApiAliases: Map<string, string>;
    staticStringAliases: Map<string, string>;
  }): void {
    const bindsFromGlobalObject = isGlobalObjectOrDescriptorValueExpression(
      input.initializer,
      input.globalObjectAliases,
      input.reflectObjectAliases,
      input.reflectGetAliases,
      input.globalPropertyDescriptorAliases,
      input.globalPropertyDescriptorsObjectAliases,
      input.staticStringAliases,
    );
    const bindsFromRequireFunction = isRequireFunctionExpression(
      input.initializer,
      input.globalObjectAliases,
      input.reflectObjectAliases,
      input.reflectGetAliases,
      input.requireAliases,
      input.globalPropertyDescriptorAliases,
      input.globalPropertyDescriptorsObjectAliases,
    );
    const bindsFromReflectObject = isReflectObjectExpression(
      input.initializer,
      input.reflectObjectAliases,
      input.staticStringAliases,
    );
    const bindsFromReflectGetFunction = isReflectGetFunctionExpression(
      input.initializer,
      input.reflectObjectAliases,
      input.reflectGetAliases,
      input.staticStringAliases,
    );
    const bindsFromGlobalPropertyDescriptor = getGlobalPropertyDescriptorMemberName(
      input.initializer,
      input.globalObjectAliases,
      input.reflectObjectAliases,
      input.reflectGetAliases,
      input.globalPropertyDescriptorAliases,
      input.globalPropertyDescriptorsObjectAliases,
      input.staticStringAliases,
    );
    const bindsFromGlobalPropertyDescriptorsObject = isGlobalPropertyDescriptorsObjectExpression(
      input.initializer,
      input.globalObjectAliases,
      input.reflectObjectAliases,
      input.reflectGetAliases,
      input.globalPropertyDescriptorsObjectAliases,
      input.staticStringAliases,
    );
    const bindsFromObjectConstructor = isObjectConstructorExpression(input.initializer, input.staticStringAliases);
    for (const property of input.pattern.properties) {
      if (ts.isSpreadAssignment(property)) {
        const forbidden = getForbiddenStoredExpressionDiagnostic(
          input.initializer,
          input.globalObjectAliases,
          input.reflectObjectAliases,
          input.reflectGetAliases,
          input.requireAliases,
          input.globalPropertyDescriptorAliases,
          input.globalPropertyDescriptorsObjectAliases,
          input.blockedApiAliases,
          input.staticStringAliases,
        );
        if (forbidden) {
          input.diagnostics.push(
            diagnosticAt(
              input.sourceFile,
              property.getStart(input.sourceFile),
              forbidden.code,
              'error',
              forbidden.message,
              input.target,
            ),
          );
        }
        const restTarget = stripParentheses(property.expression);
        if (ts.isIdentifier(restTarget)) {
          this.recordForbiddenAlias({
            name: restTarget.text,
            expression: input.initializer,
            sourceFile: input.sourceFile,
            diagnostics: input.diagnostics,
            target: input.target,
            globalObjectAliases: input.globalObjectAliases,
            reflectObjectAliases: input.reflectObjectAliases,
            reflectGetAliases: input.reflectGetAliases,
            requireAliases: input.requireAliases,
            globalPropertyDescriptorAliases: input.globalPropertyDescriptorAliases,
            globalPropertyDescriptorsObjectAliases: input.globalPropertyDescriptorsObjectAliases,
            blockedApiAliases: input.blockedApiAliases,
            staticStringAliases: input.staticStringAliases,
          });
        } else if (isMemberAssignmentTarget(restTarget)) {
          this.recordForbiddenMemberAssignment({
            targetExpression: restTarget,
            expression: input.initializer,
            sourceFile: input.sourceFile,
            diagnostics: input.diagnostics,
            target: input.target,
            globalObjectAliases: input.globalObjectAliases,
            reflectObjectAliases: input.reflectObjectAliases,
            reflectGetAliases: input.reflectGetAliases,
            requireAliases: input.requireAliases,
            globalPropertyDescriptorAliases: input.globalPropertyDescriptorAliases,
            globalPropertyDescriptorsObjectAliases: input.globalPropertyDescriptorsObjectAliases,
            blockedApiAliases: input.blockedApiAliases,
            staticStringAliases: input.staticStringAliases,
          });
        }
        continue;
      }

      if (ts.isShorthandPropertyAssignment(property) && property.objectAssignmentInitializer) {
        this.recordForbiddenAlias({
          name: property.name.text,
          expression: property.objectAssignmentInitializer,
          sourceFile: input.sourceFile,
          diagnostics: input.diagnostics,
          target: input.target,
          globalObjectAliases: input.globalObjectAliases,
          reflectObjectAliases: input.reflectObjectAliases,
          reflectGetAliases: input.reflectGetAliases,
          requireAliases: input.requireAliases,
          globalPropertyDescriptorAliases: input.globalPropertyDescriptorAliases,
          globalPropertyDescriptorsObjectAliases: input.globalPropertyDescriptorsObjectAliases,
          blockedApiAliases: input.blockedApiAliases,
          staticStringAliases: input.staticStringAliases,
        });
      }

      const propertyTarget = getObjectAssignmentPropertyTarget(property, input.staticStringAliases);
      if (
        !propertyTarget.memberName &&
        isUnknownComputedObjectAssignmentProperty(property, input.staticStringAliases)
      ) {
        if (
          bindsFromGlobalObject ||
          bindsFromRequireFunction ||
          bindsFromReflectObject ||
          bindsFromReflectGetFunction ||
          bindsFromGlobalPropertyDescriptor ||
          bindsFromGlobalPropertyDescriptorsObject ||
          bindsFromObjectConstructor
        ) {
          input.diagnostics.push(
            diagnosticAt(
              input.sourceFile,
              property.getStart(input.sourceFile),
              bindsFromRequireFunction ? 'require_not_allowed' : 'blocked_global_api',
              'error',
              'Dynamic computed destructuring from privileged objects is not allowed in light-extension source',
              input.target,
            ),
          );
        }
        continue;
      }
      if (!propertyTarget.memberName) {
        continue;
      }
      if (bindsFromObjectConstructor && privilegedObjectStaticMethods.has(propertyTarget.memberName)) {
        input.diagnostics.push(
          diagnosticAt(
            input.sourceFile,
            property.getStart(input.sourceFile),
            'blocked_global_api',
            'error',
            `${propertyTarget.memberName} aliasing is not allowed in light-extension source`,
            input.target,
          ),
        );
        continue;
      }
      if (bindsFromReflectObject && propertyTarget.memberName === 'get' && propertyTarget.aliasName) {
        input.reflectGetAliases.add(propertyTarget.aliasName);
      }
      if (
        bindsFromGlobalObject &&
        propertyTarget.memberName &&
        globalAliasMemberNames.has(propertyTarget.memberName) &&
        propertyTarget.aliasName
      ) {
        input.globalObjectAliases.add(propertyTarget.aliasName);
      }

      const nestedAssignmentTarget = propertyTarget.targetExpression
        ? stripParentheses(propertyTarget.targetExpression)
        : null;
      if (
        bindsFromGlobalObject &&
        globalAliasMemberNames.has(propertyTarget.memberName) &&
        nestedAssignmentTarget &&
        ts.isObjectLiteralExpression(nestedAssignmentTarget)
      ) {
        this.recordForbiddenObjectAssignmentAliases({
          pattern: nestedAssignmentTarget,
          initializer: input.initializer,
          sourceFile: input.sourceFile,
          diagnostics: input.diagnostics,
          target: input.target,
          globalObjectAliases: input.globalObjectAliases,
          reflectObjectAliases: input.reflectObjectAliases,
          reflectGetAliases: input.reflectGetAliases,
          requireAliases: input.requireAliases,
          globalPropertyDescriptorAliases: input.globalPropertyDescriptorAliases,
          globalPropertyDescriptorsObjectAliases: input.globalPropertyDescriptorsObjectAliases,
          blockedApiAliases: input.blockedApiAliases,
          staticStringAliases: input.staticStringAliases,
        });
      }

      if (
        bindsFromGlobalObject &&
        propertyTarget.memberName &&
        globalAliasMemberNames.has(propertyTarget.memberName) &&
        propertyTarget.targetExpression &&
        isMemberAssignmentTarget(propertyTarget.targetExpression)
      ) {
        input.diagnostics.push(
          diagnosticAt(
            input.sourceFile,
            property.getStart(input.sourceFile),
            'blocked_global_api',
            'error',
            'Global object aliasing into object properties is not allowed in light-extension source',
            input.target,
          ),
        );
        continue;
      }

      if (bindsFromGlobalObject && propertyTarget.memberName === 'require') {
        input.diagnostics.push(
          diagnosticAt(
            input.sourceFile,
            property.getStart(input.sourceFile),
            'require_not_allowed',
            'error',
            'require aliasing is not allowed in light-extension source',
            input.target,
          ),
        );
        if (propertyTarget.aliasName) {
          input.requireAliases.add(propertyTarget.aliasName);
        }
        continue;
      }

      if (bindsFromRequireFunction && functionHelperMembers.has(propertyTarget.memberName)) {
        input.diagnostics.push(
          diagnosticAt(
            input.sourceFile,
            property.getStart(input.sourceFile),
            'require_not_allowed',
            'error',
            'require call helper aliasing is not allowed in light-extension source',
            input.target,
          ),
        );
        continue;
      }

      if (bindsFromReflectGetFunction && functionHelperMembers.has(propertyTarget.memberName)) {
        input.diagnostics.push(
          diagnosticAt(
            input.sourceFile,
            property.getStart(input.sourceFile),
            'blocked_global_api',
            'error',
            'Reflect.get call helper aliasing is not allowed in light-extension source',
            input.target,
          ),
        );
        continue;
      }

      if (bindsFromGlobalPropertyDescriptor === 'require' && propertyTarget.memberName === 'value') {
        input.diagnostics.push(
          diagnosticAt(
            input.sourceFile,
            property.getStart(input.sourceFile),
            'require_not_allowed',
            'error',
            'require aliasing is not allowed in light-extension source',
            input.target,
          ),
        );
        if (propertyTarget.aliasName) {
          input.requireAliases.add(propertyTarget.aliasName);
        }
        continue;
      }

      if (
        bindsFromGlobalPropertyDescriptor &&
        blockedGlobalMembers.has(bindsFromGlobalPropertyDescriptor) &&
        propertyTarget.memberName === 'value'
      ) {
        input.diagnostics.push(
          diagnosticAt(
            input.sourceFile,
            property.getStart(input.sourceFile),
            'blocked_global_api',
            'error',
            `${bindsFromGlobalPropertyDescriptor} is not allowed in light-extension source`,
            input.target,
          ),
        );
        if (propertyTarget.aliasName) {
          input.blockedApiAliases.set(propertyTarget.aliasName, bindsFromGlobalPropertyDescriptor);
        }
        continue;
      }

      if (
        bindsFromGlobalPropertyDescriptor &&
        globalAliasMemberNames.has(bindsFromGlobalPropertyDescriptor) &&
        propertyTarget.memberName === 'value'
      ) {
        if (propertyTarget.aliasName) {
          input.globalObjectAliases.add(propertyTarget.aliasName);
        }
        continue;
      }

      if (
        bindsFromGlobalPropertyDescriptorsObject &&
        privilegedGlobalDescriptorProperties.has(propertyTarget.memberName) &&
        propertyTarget.targetExpression &&
        ts.isObjectLiteralExpression(stripParentheses(propertyTarget.targetExpression))
      ) {
        input.diagnostics.push(
          diagnosticAt(
            input.sourceFile,
            property.getStart(input.sourceFile),
            propertyTarget.memberName === 'require' ? 'require_not_allowed' : 'blocked_global_api',
            'error',
            'Nested destructuring from privileged global descriptors is not allowed in light-extension source',
            input.target,
          ),
        );
        continue;
      }

      if (
        bindsFromGlobalPropertyDescriptorsObject &&
        privilegedGlobalDescriptorProperties.has(propertyTarget.memberName) &&
        propertyTarget.aliasName
      ) {
        input.globalPropertyDescriptorAliases.set(propertyTarget.aliasName, propertyTarget.memberName);
        continue;
      }

      if (
        bindsFromGlobalPropertyDescriptorsObject &&
        privilegedGlobalDescriptorProperties.has(propertyTarget.memberName) &&
        propertyTarget.targetExpression &&
        isMemberAssignmentTarget(propertyTarget.targetExpression)
      ) {
        input.diagnostics.push(
          diagnosticAt(
            input.sourceFile,
            property.getStart(input.sourceFile),
            propertyTarget.memberName === 'require' ? 'require_not_allowed' : 'blocked_global_api',
            'error',
            `${propertyTarget.memberName} is not allowed in light-extension source`,
            input.target,
          ),
        );
        continue;
      }

      const blockedMemberName =
        propertyTarget.memberName === 'constructor'
          ? 'Function'
          : bindsFromGlobalObject && blockedGlobalMembers.has(propertyTarget.memberName)
            ? propertyTarget.memberName
            : null;
      if (!blockedMemberName) {
        continue;
      }

      input.diagnostics.push(
        diagnosticAt(
          input.sourceFile,
          property.getStart(input.sourceFile),
          'blocked_global_api',
          'error',
          `${blockedMemberName} is not allowed in light-extension source`,
          input.target,
        ),
      );
      if (propertyTarget.aliasName) {
        input.blockedApiAliases.set(propertyTarget.aliasName, blockedMemberName);
      }
    }
  }

  private recordForbiddenMemberAssignment(input: {
    targetExpression: ts.Expression;
    expression: ts.Expression;
    sourceFile: ts.SourceFile;
    diagnostics: LightExtensionDiagnostic[];
    target: Omit<DiagnosticTarget, 'path'>;
    globalObjectAliases: Set<string>;
    reflectObjectAliases: Set<string>;
    reflectGetAliases: Set<string>;
    requireAliases: Set<string>;
    globalPropertyDescriptorAliases: Map<string, string>;
    globalPropertyDescriptorsObjectAliases: Set<string>;
    blockedApiAliases: Map<string, string>;
    staticStringAliases: Map<string, string>;
  }): void {
    const forbidden = getForbiddenStoredExpressionDiagnostic(
      input.expression,
      input.globalObjectAliases,
      input.reflectObjectAliases,
      input.reflectGetAliases,
      input.requireAliases,
      input.globalPropertyDescriptorAliases,
      input.globalPropertyDescriptorsObjectAliases,
      input.blockedApiAliases,
      input.staticStringAliases,
    );
    if (!forbidden) {
      return;
    }

    input.diagnostics.push(
      diagnosticAt(
        input.sourceFile,
        input.targetExpression.getStart(input.sourceFile),
        forbidden.code,
        'error',
        forbidden.message,
        input.target,
      ),
    );
  }

  private recordForbiddenContainerValues(input: {
    expression: ts.ObjectLiteralExpression | ts.ArrayLiteralExpression;
    sourceFile: ts.SourceFile;
    diagnostics: LightExtensionDiagnostic[];
    target: Omit<DiagnosticTarget, 'path'>;
    globalObjectAliases: Set<string>;
    reflectObjectAliases: Set<string>;
    reflectGetAliases: Set<string>;
    requireAliases: Set<string>;
    globalPropertyDescriptorAliases: Map<string, string>;
    globalPropertyDescriptorsObjectAliases: Set<string>;
    blockedApiAliases: Map<string, string>;
    staticStringAliases: Map<string, string>;
  }): void {
    const expressions: Array<{ expression: ts.Expression; position: ts.Node }> = [];
    if (ts.isObjectLiteralExpression(input.expression)) {
      for (const property of input.expression.properties) {
        if (ts.isSpreadAssignment(property)) {
          expressions.push({ expression: property.expression, position: property });
        } else if (ts.isPropertyAssignment(property)) {
          expressions.push({ expression: property.initializer, position: property });
        } else if (ts.isShorthandPropertyAssignment(property)) {
          expressions.push({ expression: property.name, position: property });
          if (property.objectAssignmentInitializer) {
            expressions.push({ expression: property.objectAssignmentInitializer, position: property });
          }
        } else if (ts.isMethodDeclaration(property) || ts.isGetAccessor(property) || ts.isSetAccessor(property)) {
          const forbidden = getForbiddenFunctionReturnDiagnostic(
            property,
            input.globalObjectAliases,
            input.reflectObjectAliases,
            input.reflectGetAliases,
            input.requireAliases,
            input.globalPropertyDescriptorAliases,
            input.globalPropertyDescriptorsObjectAliases,
            input.blockedApiAliases,
            input.staticStringAliases,
          );
          if (forbidden) {
            input.diagnostics.push(
              diagnosticAt(
                input.sourceFile,
                property.getStart(input.sourceFile),
                forbidden.code,
                'error',
                forbidden.message,
                input.target,
              ),
            );
          }
        }
      }
    } else {
      for (const element of input.expression.elements) {
        if (ts.isSpreadElement(element)) {
          expressions.push({ expression: element.expression, position: element });
        } else if (!ts.isOmittedExpression(element)) {
          expressions.push({ expression: element, position: element });
        }
      }
    }

    for (const item of expressions) {
      const forbidden = getForbiddenStoredExpressionDiagnostic(
        item.expression,
        input.globalObjectAliases,
        input.reflectObjectAliases,
        input.reflectGetAliases,
        input.requireAliases,
        input.globalPropertyDescriptorAliases,
        input.globalPropertyDescriptorsObjectAliases,
        input.blockedApiAliases,
        input.staticStringAliases,
      );
      if (!forbidden) {
        continue;
      }

      input.diagnostics.push(
        diagnosticAt(
          input.sourceFile,
          item.position.getStart(input.sourceFile),
          forbidden.code,
          'error',
          forbidden.message,
          input.target,
        ),
      );
    }
  }

  private recordForbiddenObjectWriteCall(input: {
    expression: ts.CallExpression;
    sourceFile: ts.SourceFile;
    diagnostics: LightExtensionDiagnostic[];
    target: Omit<DiagnosticTarget, 'path'>;
    globalObjectAliases: Set<string>;
    reflectObjectAliases: Set<string>;
    reflectGetAliases: Set<string>;
    requireAliases: Set<string>;
    globalPropertyDescriptorAliases: Map<string, string>;
    globalPropertyDescriptorsObjectAliases: Set<string>;
    blockedApiAliases: Map<string, string>;
    staticStringAliases: Map<string, string>;
  }): void {
    const candidateArguments = getStorageWriteArgumentExpressions(
      input.expression,
      input.reflectObjectAliases,
      input.staticStringAliases,
    );

    for (const argument of candidateArguments) {
      const forbidden = getForbiddenStoredExpressionDiagnostic(
        argument,
        input.globalObjectAliases,
        input.reflectObjectAliases,
        input.reflectGetAliases,
        input.requireAliases,
        input.globalPropertyDescriptorAliases,
        input.globalPropertyDescriptorsObjectAliases,
        input.blockedApiAliases,
        input.staticStringAliases,
      );
      if (!forbidden) {
        continue;
      }

      input.diagnostics.push(
        diagnosticAt(
          input.sourceFile,
          argument.getStart(input.sourceFile),
          forbidden.code,
          'error',
          forbidden.message,
          input.target,
        ),
      );
    }
  }

  private recordForbiddenArrayBindingAliases(input: {
    pattern: ts.ArrayBindingPattern;
    initializer: ts.Expression | undefined;
    sourceFile: ts.SourceFile;
    diagnostics: LightExtensionDiagnostic[];
    target: Omit<DiagnosticTarget, 'path'>;
    globalObjectAliases: Set<string>;
    reflectObjectAliases: Set<string>;
    reflectGetAliases: Set<string>;
    requireAliases: Set<string>;
    globalPropertyDescriptorAliases: Map<string, string>;
    globalPropertyDescriptorsObjectAliases: Set<string>;
    blockedApiAliases: Map<string, string>;
    staticStringAliases: Map<string, string>;
  }): void {
    const initializer = stripParentheses(input.initializer);
    const initializerElements =
      initializer && ts.isArrayLiteralExpression(initializer) ? initializer.elements : undefined;

    input.pattern.elements.forEach((targetElement, index) => {
      if (ts.isOmittedExpression(targetElement)) {
        return;
      }

      const initializerElement = initializerElements?.[index];
      const sourceExpression =
        initializerElement && !ts.isSpreadElement(initializerElement) && !ts.isOmittedExpression(initializerElement)
          ? initializerElement
          : targetElement.initializer;
      if (!sourceExpression) {
        return;
      }

      this.recordForbiddenBindingNameAliases({
        name: targetElement.name,
        expression: sourceExpression,
        sourceFile: input.sourceFile,
        diagnostics: input.diagnostics,
        target: input.target,
        globalObjectAliases: input.globalObjectAliases,
        reflectObjectAliases: input.reflectObjectAliases,
        reflectGetAliases: input.reflectGetAliases,
        requireAliases: input.requireAliases,
        globalPropertyDescriptorAliases: input.globalPropertyDescriptorAliases,
        globalPropertyDescriptorsObjectAliases: input.globalPropertyDescriptorsObjectAliases,
        blockedApiAliases: input.blockedApiAliases,
        staticStringAliases: input.staticStringAliases,
      });
    });
  }

  private recordForbiddenBindingNameAliases(input: {
    name: ts.BindingName;
    expression: ts.Expression;
    sourceFile: ts.SourceFile;
    diagnostics: LightExtensionDiagnostic[];
    target: Omit<DiagnosticTarget, 'path'>;
    globalObjectAliases: Set<string>;
    reflectObjectAliases: Set<string>;
    reflectGetAliases: Set<string>;
    requireAliases: Set<string>;
    globalPropertyDescriptorAliases: Map<string, string>;
    globalPropertyDescriptorsObjectAliases: Set<string>;
    blockedApiAliases: Map<string, string>;
    staticStringAliases: Map<string, string>;
  }): void {
    if (ts.isIdentifier(input.name)) {
      this.recordForbiddenAlias({
        name: input.name.text,
        expression: input.expression,
        sourceFile: input.sourceFile,
        diagnostics: input.diagnostics,
        target: input.target,
        globalObjectAliases: input.globalObjectAliases,
        reflectObjectAliases: input.reflectObjectAliases,
        reflectGetAliases: input.reflectGetAliases,
        requireAliases: input.requireAliases,
        globalPropertyDescriptorAliases: input.globalPropertyDescriptorAliases,
        globalPropertyDescriptorsObjectAliases: input.globalPropertyDescriptorsObjectAliases,
        blockedApiAliases: input.blockedApiAliases,
        staticStringAliases: input.staticStringAliases,
      });
      return;
    }

    if (ts.isObjectBindingPattern(input.name)) {
      this.recordForbiddenObjectBindingAliases({
        pattern: input.name,
        initializer: input.expression,
        sourceFile: input.sourceFile,
        diagnostics: input.diagnostics,
        target: input.target,
        globalObjectAliases: input.globalObjectAliases,
        reflectObjectAliases: input.reflectObjectAliases,
        reflectGetAliases: input.reflectGetAliases,
        requireAliases: input.requireAliases,
        globalPropertyDescriptorAliases: input.globalPropertyDescriptorAliases,
        globalPropertyDescriptorsObjectAliases: input.globalPropertyDescriptorsObjectAliases,
        blockedApiAliases: input.blockedApiAliases,
        staticStringAliases: input.staticStringAliases,
      });
      return;
    }

    if (ts.isArrayBindingPattern(input.name)) {
      this.recordForbiddenArrayBindingAliases({
        pattern: input.name,
        initializer: input.expression,
        sourceFile: input.sourceFile,
        diagnostics: input.diagnostics,
        target: input.target,
        globalObjectAliases: input.globalObjectAliases,
        reflectObjectAliases: input.reflectObjectAliases,
        reflectGetAliases: input.reflectGetAliases,
        requireAliases: input.requireAliases,
        globalPropertyDescriptorAliases: input.globalPropertyDescriptorAliases,
        globalPropertyDescriptorsObjectAliases: input.globalPropertyDescriptorsObjectAliases,
        blockedApiAliases: input.blockedApiAliases,
        staticStringAliases: input.staticStringAliases,
      });
    }
  }

  private recordForbiddenArrayAssignmentAliases(input: {
    pattern: ts.ArrayLiteralExpression;
    initializer: ts.ArrayLiteralExpression;
    sourceFile: ts.SourceFile;
    diagnostics: LightExtensionDiagnostic[];
    target: Omit<DiagnosticTarget, 'path'>;
    globalObjectAliases: Set<string>;
    reflectObjectAliases: Set<string>;
    reflectGetAliases: Set<string>;
    requireAliases: Set<string>;
    globalPropertyDescriptorAliases: Map<string, string>;
    globalPropertyDescriptorsObjectAliases: Set<string>;
    blockedApiAliases: Map<string, string>;
    staticStringAliases: Map<string, string>;
  }): void {
    input.pattern.elements.forEach((targetElement, index) => {
      if (ts.isOmittedExpression(targetElement)) {
        return;
      }
      const assignmentTarget = ts.isSpreadElement(targetElement)
        ? stripParentheses(targetElement.expression)
        : stripParentheses(targetElement);
      const initializerElement = input.initializer.elements[index];
      const initializerExpression =
        initializerElement && !ts.isSpreadElement(initializerElement) && !ts.isOmittedExpression(initializerElement)
          ? initializerElement
          : undefined;
      if (ts.isIdentifier(assignmentTarget)) {
        if (!initializerExpression) {
          return;
        }
        this.recordForbiddenAlias({
          name: assignmentTarget.text,
          expression: initializerExpression,
          sourceFile: input.sourceFile,
          diagnostics: input.diagnostics,
          target: input.target,
          globalObjectAliases: input.globalObjectAliases,
          reflectObjectAliases: input.reflectObjectAliases,
          reflectGetAliases: input.reflectGetAliases,
          requireAliases: input.requireAliases,
          globalPropertyDescriptorAliases: input.globalPropertyDescriptorAliases,
          globalPropertyDescriptorsObjectAliases: input.globalPropertyDescriptorsObjectAliases,
          blockedApiAliases: input.blockedApiAliases,
          staticStringAliases: input.staticStringAliases,
        });
      } else if (isMemberAssignmentTarget(assignmentTarget)) {
        if (!initializerExpression) {
          return;
        }
        this.recordForbiddenMemberAssignment({
          targetExpression: assignmentTarget,
          expression: initializerExpression,
          sourceFile: input.sourceFile,
          diagnostics: input.diagnostics,
          target: input.target,
          globalObjectAliases: input.globalObjectAliases,
          reflectObjectAliases: input.reflectObjectAliases,
          reflectGetAliases: input.reflectGetAliases,
          requireAliases: input.requireAliases,
          globalPropertyDescriptorAliases: input.globalPropertyDescriptorAliases,
          globalPropertyDescriptorsObjectAliases: input.globalPropertyDescriptorsObjectAliases,
          blockedApiAliases: input.blockedApiAliases,
          staticStringAliases: input.staticStringAliases,
        });
      } else if (
        ts.isBinaryExpression(assignmentTarget) &&
        isAliasAssignmentOperator(assignmentTarget.operatorToken.kind) &&
        ts.isIdentifier(stripParentheses(assignmentTarget.left))
      ) {
        const aliasTarget = stripParentheses(assignmentTarget.left);
        if (initializerExpression) {
          this.recordForbiddenAlias({
            name: aliasTarget.text,
            expression: initializerExpression,
            sourceFile: input.sourceFile,
            diagnostics: input.diagnostics,
            target: input.target,
            globalObjectAliases: input.globalObjectAliases,
            reflectObjectAliases: input.reflectObjectAliases,
            reflectGetAliases: input.reflectGetAliases,
            requireAliases: input.requireAliases,
            globalPropertyDescriptorAliases: input.globalPropertyDescriptorAliases,
            globalPropertyDescriptorsObjectAliases: input.globalPropertyDescriptorsObjectAliases,
            blockedApiAliases: input.blockedApiAliases,
            staticStringAliases: input.staticStringAliases,
          });
        }
        this.recordForbiddenAlias({
          name: aliasTarget.text,
          expression: assignmentTarget.right,
          sourceFile: input.sourceFile,
          diagnostics: input.diagnostics,
          target: input.target,
          globalObjectAliases: input.globalObjectAliases,
          reflectObjectAliases: input.reflectObjectAliases,
          reflectGetAliases: input.reflectGetAliases,
          requireAliases: input.requireAliases,
          globalPropertyDescriptorAliases: input.globalPropertyDescriptorAliases,
          globalPropertyDescriptorsObjectAliases: input.globalPropertyDescriptorsObjectAliases,
          blockedApiAliases: input.blockedApiAliases,
          staticStringAliases: input.staticStringAliases,
        });
      } else if (ts.isObjectLiteralExpression(assignmentTarget) && initializerExpression) {
        this.recordForbiddenObjectAssignmentAliases({
          pattern: assignmentTarget,
          initializer: initializerExpression,
          sourceFile: input.sourceFile,
          diagnostics: input.diagnostics,
          target: input.target,
          globalObjectAliases: input.globalObjectAliases,
          reflectObjectAliases: input.reflectObjectAliases,
          reflectGetAliases: input.reflectGetAliases,
          requireAliases: input.requireAliases,
          globalPropertyDescriptorAliases: input.globalPropertyDescriptorAliases,
          globalPropertyDescriptorsObjectAliases: input.globalPropertyDescriptorsObjectAliases,
          blockedApiAliases: input.blockedApiAliases,
          staticStringAliases: input.staticStringAliases,
        });
      }
    });
  }
}

export function buildCapabilities(limits: LightExtensionValidationLimits): LightExtensionCapabilities {
  return {
    allowedPaths: {
      repo: [
        'README.md',
        'light-extension.json',
        'tsconfig.json',
        'src/shared/**',
        'src/client/js-blocks/**',
        'src/client/js-fields/**',
        'src/client/js-actions/**',
        'src/client/js-items/**',
        'src/client/runjs/**',
        'src/client/events/**',
      ],
      entries: buildEntryAllowedPaths(),
    },
    schemaSubset: {
      allowedTypes: [...LIGHT_EXTENSION_SETTINGS_SCHEMA_TYPES],
      allowedKeywords: [...LIGHT_EXTENSION_SETTINGS_SCHEMA_KEYWORDS],
      maxDepth: limits.maxSettingsSchemaDepth,
    },
    xComponentWhitelist: [...LIGHT_EXTENSION_X_COMPONENT_WHITELIST],
    limits,
    writePolicy: {
      validateFinalWorkspaceOnPush: true,
      allowDeleteExistingInvalidPaths: true,
    },
    supportedKinds: [...LIGHT_EXTENSION_SUPPORTED_KINDS],
    enabledKinds: [...LIGHT_EXTENSION_ENABLED_KINDS],
    validatorVersion: LIGHT_EXTENSION_VALIDATOR_VERSION,
    sdkTemplateVersion: LIGHT_EXTENSION_SDK_TEMPLATE_VERSION,
  };
}

export function entryHasErrors(entry: LightExtensionEntryValidationResult): boolean {
  return hasErrorDiagnostic(entry.diagnostics);
}

export function hasErrorDiagnostic(diagnostics: LightExtensionDiagnostic[]): boolean {
  return diagnostics.some((item) => item.severity === 'error');
}

export function getWorkspaceLevelDiagnostics(diagnostics: LightExtensionDiagnostic[]): LightExtensionDiagnostic[] {
  return diagnostics.filter((item) => !item.kind || !item.entryName);
}

function attachDiagnosticsToEntries(
  diagnostics: LightExtensionDiagnostic[],
  entries: LightExtensionEntryValidationResult[],
): void {
  for (const entry of entries) {
    const entryDiagnostics = diagnostics.filter(
      (item) => item.kind === entry.kind && item.entryName === entry.entryName,
    );
    entry.diagnostics = sortDiagnostics(uniqueDiagnostics([...entry.diagnostics, ...entryDiagnostics]));
  }
}

export function sortDiagnostics(diagnostics: LightExtensionDiagnostic[]): LightExtensionDiagnostic[] {
  return [...diagnostics].sort((left, right) => diagnosticSortKey(left).localeCompare(diagnosticSortKey(right)));
}

function uniqueDiagnostics(diagnostics: LightExtensionDiagnostic[]): LightExtensionDiagnostic[] {
  const seen = new Set<string>();
  const result: LightExtensionDiagnostic[] = [];

  for (const item of diagnostics) {
    const key = [
      item.code,
      item.severity,
      item.path || '',
      item.line || '',
      item.column || '',
      item.kind || '',
      item.entryName || '',
      item.message,
      stableDetailsKey(item.details),
    ].join('\u0000');
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(item);
  }

  return result;
}

function diagnosticSortKey(item: LightExtensionDiagnostic): string {
  return [
    item.path || '',
    item.kind || '',
    item.entryName || '',
    item.severity || '',
    item.code || '',
    String(item.line || 0).padStart(8, '0'),
    String(item.column || 0).padStart(8, '0'),
    item.message || '',
    stableDetailsKey(item.details),
  ].join('\u0000');
}

export function toValidatorFiles(files: LightExtensionPulledFile[]): LightExtensionSourceFileInput[] {
  return files.map((file) => ({
    path: file.path,
    content: file.content,
    size: file.size,
    language: file.language,
  }));
}

function validateSourcePath(path: string): LightExtensionDiagnostic[] {
  const diagnostics: LightExtensionDiagnostic[] = [];

  if (!path || typeof path !== 'string') {
    return [diagnostic('path_required', 'error', 'Source file path is required')];
  }

  const rawPath = path.trim();

  if (rawPath.includes('\\')) {
    diagnostics.push(
      diagnostic('path_backslash_not_allowed', 'error', 'Source file path must use "/" separators', { path }),
    );
  }

  if (rawPath.startsWith('/')) {
    diagnostics.push(
      diagnostic('path_absolute_not_allowed', 'error', 'Source file path must be repository relative', { path }),
    );
  }

  const rawSegments = rawPath.split('/');
  if (rawSegments.includes('..')) {
    diagnostics.push(
      diagnostic('path_traversal_not_allowed', 'error', 'Source file path cannot traverse directories', { path }),
    );
  }

  if (rawSegments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    diagnostics.push(
      diagnostic('path_segment_invalid', 'error', 'Source file path contains an invalid segment', { path }),
    );
  }

  const normalizedPath = normalizeSourcePath(rawPath);
  if (!normalizedPath || normalizedPath === '.') {
    diagnostics.push(diagnostic('path_required', 'error', 'Source file path is required', { path }));
  }

  if (normalizedPath.startsWith('../') || normalizedPath.includes('/../')) {
    diagnostics.push(
      diagnostic('path_traversal_not_allowed', 'error', 'Source file path cannot traverse directories', { path }),
    );
  }

  if (normalizedPath.split('/').some((segment) => segment === '' || segment === '.')) {
    diagnostics.push(
      diagnostic('path_segment_invalid', 'error', 'Source file path contains an invalid segment', { path }),
    );
  }

  if (normalizedPath.length > 240) {
    diagnostics.push(diagnostic('path_too_long', 'error', 'Source file path is too long', { path }));
  }

  return diagnostics;
}

function validateDeleteSourcePath(path: string, existingPaths?: ReadonlySet<string>): LightExtensionDiagnostic[] {
  const diagnostics = validateSourcePath(path);
  if (diagnostics.some((item) => item.severity === 'error')) {
    return diagnostics;
  }

  const normalizedPath = normalizeSourcePath(path);
  if (existingPaths?.has(normalizedPath)) {
    return diagnostics;
  }

  const pathKind = classifySourcePath(normalizedPath);
  const pathTarget =
    pathKind.status === 'enabled' || pathKind.status === 'kindDisabled'
      ? {
          kind: pathKind.kind,
          entryName: pathKind.entryName,
        }
      : {};

  if (pathKind.status === 'unsupported') {
    diagnostics.push(
      diagnostic('path_not_allowed', 'error', 'Source file path is outside the allowed light-extension roots', {
        path: normalizedPath,
      }),
    );
  } else if (pathKind.status === 'missingEntryName') {
    diagnostics.push(
      diagnostic('entry_name_required', 'error', 'Entry name segment is required', {
        path: normalizedPath,
        kind: pathKind.kind,
      }),
    );
  } else if (
    (pathKind.status === 'enabled' || pathKind.status === 'kindDisabled') &&
    !isValidEntryName(pathKind.entryName)
  ) {
    diagnostics.push(
      diagnostic('invalid_entry_name', 'error', 'Entry name must be a lowercase slug', {
        path: normalizedPath,
        ...pathTarget,
      }),
    );
  } else if (
    (pathKind.status === 'enabled' || pathKind.status === 'kindDisabled') &&
    !isAllowedEntryFilePath(normalizedPath)
  ) {
    diagnostics.push(
      diagnostic('path_extension_not_allowed', 'error', 'Source file path is not allowed for light-extension entries', {
        path: normalizedPath,
        ...pathTarget,
      }),
    );
  }

  return diagnostics;
}

function normalizeSourcePath(path: string): string {
  return pathPosix.normalize(path.trim()).replace(/^\.\/+/, '');
}

type SourcePathKind =
  | {
      status: 'enabled' | 'kindDisabled';
      kind: LightExtensionKind;
      entryName: string;
    }
  | {
      status: 'missingEntryName';
      kind: LightExtensionKind;
    }
  | {
      status: 'shared';
    }
  | {
      status: 'unsupported' | 'ignored';
    };

function classifySourcePath(path: string): SourcePathKind {
  if (allowedRepoRootFiles.has(path)) {
    return { status: 'ignored' };
  }
  if (path.startsWith(`${sharedSourceRoot}/`)) {
    return { status: 'shared' };
  }

  for (const kind of LIGHT_EXTENSION_SUPPORTED_KINDS) {
    const rule = entryFileRules[kind];
    const prefix = `${rule.root}/`;
    if (path === rule.root || path === `${rule.root}/`) {
      return { status: 'missingEntryName', kind };
    }
    if (path.startsWith(prefix)) {
      const entryName = path.slice(prefix.length).split('/')[0] || '';
      if (!entryName) {
        return { status: 'missingEntryName', kind };
      }
      return (LIGHT_EXTENSION_ENABLED_KINDS as readonly string[]).includes(kind)
        ? { status: 'enabled', kind, entryName }
        : { status: 'kindDisabled', kind, entryName };
    }
  }

  return { status: 'unsupported' };
}

function getEntryRootPath(kind: LightExtensionKind, entryName: string): string {
  return `${entryFileRules[kind].root}/${entryName}`;
}

function findEntryIndexFile(bucket: EntryBucket): NormalizedSourceFile | undefined {
  const candidates = entryFileRules[bucket.kind].indexFiles.map((fileName) => `${bucket.rootPath}/${fileName}`);
  return candidates.map((candidate) => bucket.files.find((file) => file.path === candidate)).find(Boolean);
}

function isCodeFile(path: string): boolean {
  return ['.ts', '.tsx', '.js', '.jsx'].includes(pathPosix.extname(path));
}

function isAllowedEntryFilePath(path: string): boolean {
  const pathKind = classifySourcePath(path);
  if (pathKind.status !== 'enabled' && pathKind.status !== 'kindDisabled') {
    return false;
  }
  const rule = entryFileRules[pathKind.kind];
  const fileName = pathPosix.basename(path);
  if (rule.metadataFiles.includes(fileName)) {
    return true;
  }

  return rule.allowedExtensions.includes(pathPosix.extname(path));
}

function isAllowedSharedFilePath(path: string): boolean {
  return path.startsWith(`${sharedSourceRoot}/`) && sharedAllowedExtensions.has(pathPosix.extname(path));
}

function validateExternalSdkImport(
  node: ts.ImportDeclaration,
  sourceFile: ts.SourceFile,
  specifier: string,
  target: Omit<DiagnosticTarget, 'path'>,
): LightExtensionDiagnostic[] {
  if (!allowedClientSdkImports.has(specifier)) {
    return [
      diagnosticAt(
        sourceFile,
        node.moduleSpecifier.getStart(sourceFile),
        'import_not_allowed',
        'error',
        `Import "${specifier}" is not allowed in light-extension source`,
        target,
      ),
    ];
  }

  const importClause = node.importClause;
  if (!importClause) {
    return [
      diagnosticAt(
        sourceFile,
        node.moduleSpecifier.getStart(sourceFile),
        'import_not_allowed',
        'error',
        `Side-effect import from "${specifier}" is not allowed in light-extension source`,
        target,
      ),
    ];
  }
  if (importClause.name) {
    return [
      diagnosticAt(
        sourceFile,
        importClause.name.getStart(sourceFile),
        'import_not_allowed',
        'error',
        `Default import from "${specifier}" is not allowed in light-extension source`,
        target,
      ),
    ];
  }
  if (!importClause.namedBindings) {
    return importClause.isTypeOnly
      ? []
      : [
          diagnosticAt(
            sourceFile,
            importClause.getStart(sourceFile),
            'import_not_allowed',
            'error',
            `Runtime import from "${specifier}" must use allowed helpers`,
            target,
          ),
        ];
  }
  if (ts.isNamespaceImport(importClause.namedBindings)) {
    return importClause.isTypeOnly
      ? []
      : [
          diagnosticAt(
            sourceFile,
            importClause.namedBindings.getStart(sourceFile),
            'import_not_allowed',
            'error',
            `Namespace import from "${specifier}" is only allowed as import type`,
            target,
          ),
        ];
  }
  if (!importClause.isTypeOnly && importClause.namedBindings.elements.length === 0) {
    return [
      diagnosticAt(
        sourceFile,
        importClause.namedBindings.getStart(sourceFile),
        'import_not_allowed',
        'error',
        `Runtime import from "${specifier}" must use allowed helpers`,
        target,
      ),
    ];
  }

  const diagnostics: LightExtensionDiagnostic[] = [];
  for (const element of importClause.namedBindings.elements) {
    if (importClause.isTypeOnly || element.isTypeOnly) {
      continue;
    }
    const imported = element.propertyName?.text || element.name.text;
    if (allowedSdkRuntimeHelpers.has(imported)) {
      continue;
    }
    diagnostics.push(
      diagnosticAt(
        sourceFile,
        element.getStart(sourceFile),
        'import_not_allowed',
        'error',
        `Runtime import "${imported}" from "${specifier}" is not allowed in light-extension source`,
        target,
      ),
    );
  }

  return diagnostics;
}

function isRelativeImportOutsideCurrentEntry(
  filePath: string,
  specifier: string,
  target: Omit<DiagnosticTarget, 'path'>,
): boolean {
  if (!specifier.startsWith('.') || !target.kind || !target.entryName) {
    return false;
  }

  const resolvedPath = normalizeSourcePath(pathPosix.join(pathPosix.dirname(filePath), specifier));
  if (resolvedPath === sharedSourceRoot || resolvedPath.startsWith(`${sharedSourceRoot}/`)) {
    return false;
  }
  const rootPath = getEntryRootPath(target.kind, target.entryName);
  return resolvedPath !== rootPath && !resolvedPath.startsWith(`${rootPath}/`);
}

function isRelativeImportOutsideSharedRoot(filePath: string, specifier: string): boolean {
  const resolvedPath = normalizeSourcePath(pathPosix.join(pathPosix.dirname(filePath), specifier));
  return resolvedPath !== sharedSourceRoot && !resolvedPath.startsWith(`${sharedSourceRoot}/`);
}

function buildEntryAllowedPaths(): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(entryFileRules).map(([kind, rule]) => [
      kind,
      [
        ...rule.indexFiles.map((fileName) => `${rule.root}/<entryName>/${fileName}`),
        ...rule.metadataFiles.map((fileName) => `${rule.root}/<entryName>/${fileName}`),
        `${rule.root}/<entryName>/**/*.{${rule.allowedExtensions.map((extension) => extension.slice(1)).join(',')}}`,
      ],
    ]),
  );
}

function scriptKind(path: string): ts.ScriptKind {
  if (path.endsWith('.tsx')) {
    return ts.ScriptKind.TSX;
  }
  if (path.endsWith('.jsx')) {
    return ts.ScriptKind.JSX;
  }
  if (path.endsWith('.js')) {
    return ts.ScriptKind.JS;
  }
  return ts.ScriptKind.TS;
}

function getImportSpecifier(moduleSpecifier: ts.Expression): string | null {
  return ts.isStringLiteral(moduleSpecifier) ? moduleSpecifier.text : null;
}

function getImportEqualsSpecifier(node: ts.ImportEqualsDeclaration): string | null {
  if (!ts.isExternalModuleReference(node.moduleReference)) {
    return null;
  }
  const expression = node.moduleReference.expression;
  return expression && ts.isStringLiteral(expression) ? expression.text : null;
}

function isBlockedGlobalMemberAccess(
  expression: ts.Expression,
  globalObjectAliases: Set<string>,
  reflectObjectAliases?: Set<string>,
  reflectGetAliases?: Set<string>,
): boolean {
  const memberName = getAccessedPropertyName(expression);
  return Boolean(
    memberName &&
      blockedGlobalMembers.has(memberName) &&
      isGlobalObjectAccessHost(expression, globalObjectAliases, reflectObjectAliases, reflectGetAliases),
  );
}

function getBlockedMemberDisplayName(expression: ts.Expression): string | null {
  return getAccessedPropertyName(expression);
}

function isProcessGlobalMemberAccess(
  node: ts.Node,
  globalObjectAliases: Set<string>,
  reflectObjectAliases?: Set<string>,
  reflectGetAliases?: Set<string>,
): boolean {
  return ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)
    ? getAccessedPropertyName(node) === 'process' &&
        isGlobalObjectAccessHost(node, globalObjectAliases, reflectObjectAliases, reflectGetAliases)
    : false;
}

function isGlobalObjectAccessHost(
  expression: ts.Expression,
  globalObjectAliases: Set<string>,
  reflectObjectAliases?: Set<string>,
  reflectGetAliases?: Set<string>,
): boolean {
  if (ts.isPropertyAccessExpression(expression) || ts.isElementAccessExpression(expression)) {
    return isGlobalObjectExpression(
      expression.expression,
      globalObjectAliases,
      reflectObjectAliases,
      reflectGetAliases,
    );
  }

  return false;
}

function isGlobalObjectExpression(
  expression: ts.Node | undefined,
  globalObjectAliases: Set<string>,
  reflectObjectAliases?: Set<string>,
  reflectGetAliases?: Set<string>,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): boolean {
  const unwrapped = stripParentheses(expression);
  if (!unwrapped) {
    return false;
  }
  const branchExpressions = getConditionalOrLogicalBranchExpressions(unwrapped);
  if (branchExpressions) {
    return branchExpressions.some((branch) =>
      isGlobalObjectExpression(
        branch,
        globalObjectAliases,
        reflectObjectAliases,
        reflectGetAliases,
        staticStringAliases,
      ),
    );
  }
  if (ts.isIdentifier(unwrapped)) {
    return globalObjectAliases.has(unwrapped.text);
  }
  if (ts.isPropertyAccessExpression(unwrapped) || ts.isElementAccessExpression(unwrapped)) {
    const memberName = getAccessedPropertyName(unwrapped, staticStringAliases);
    return Boolean(
      memberName &&
        globalAliasMemberNames.has(memberName) &&
        isGlobalObjectExpression(
          unwrapped.expression,
          globalObjectAliases,
          reflectObjectAliases,
          reflectGetAliases,
          staticStringAliases,
        ),
    );
  }
  if (ts.isObjectLiteralExpression(unwrapped)) {
    return unwrapped.properties.some(
      (property) =>
        ts.isSpreadAssignment(property) &&
        isGlobalObjectExpression(
          property.expression,
          globalObjectAliases,
          reflectObjectAliases,
          reflectGetAliases,
          staticStringAliases,
        ),
    );
  }
  if (ts.isCallExpression(unwrapped)) {
    return (
      isReflectGetGlobalAliasExpression(
        unwrapped,
        globalObjectAliases,
        reflectObjectAliases,
        reflectGetAliases,
        staticStringAliases,
      ) ||
      isObjectAssignGlobalMaterializationExpression(
        unwrapped,
        globalObjectAliases,
        reflectObjectAliases,
        reflectGetAliases,
        staticStringAliases,
      )
    );
  }
  return false;
}

function isObjectAssignGlobalMaterializationExpression(
  expression: ts.CallExpression,
  globalObjectAliases: Set<string>,
  reflectObjectAliases?: Set<string>,
  reflectGetAliases?: Set<string>,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): boolean {
  if (isObjectStaticMethodExpression(expression.expression, 'create', staticStringAliases)) {
    const [prototype] = expression.arguments;
    return Boolean(
      prototype &&
        isGlobalObjectExpression(
          prototype,
          globalObjectAliases,
          reflectObjectAliases,
          reflectGetAliases,
          staticStringAliases,
        ),
    );
  }

  if (isObjectStaticMethodExpression(expression.expression, 'assign', staticStringAliases)) {
    return expression.arguments.some((argument) =>
      isGlobalObjectExpression(
        argument,
        globalObjectAliases,
        reflectObjectAliases,
        reflectGetAliases,
        staticStringAliases,
      ),
    );
  }

  return false;
}

function isReflectGetGlobalAliasExpression(
  expression: ts.CallExpression,
  globalObjectAliases: Set<string>,
  reflectObjectAliases?: Set<string>,
  reflectGetAliases?: Set<string>,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): boolean {
  if (
    !isReflectGetExpression(
      expression.expression,
      reflectObjectAliases || defaultReflectObjectAliases,
      reflectGetAliases || emptyAliasNames,
      staticStringAliases,
    )
  ) {
    return false;
  }

  const [target, member] = expression.arguments;
  const memberName = member ? getStaticStringValue(member, staticStringAliases) : null;
  return Boolean(
    target &&
      memberName &&
      globalAliasMemberNames.has(memberName) &&
      isGlobalObjectExpression(
        target,
        globalObjectAliases,
        reflectObjectAliases,
        reflectGetAliases,
        staticStringAliases,
      ),
  );
}

function isGlobalObjectOrDescriptorValueExpression(
  expression: ts.Node | undefined,
  globalObjectAliases: Set<string>,
  reflectObjectAliases: Set<string>,
  reflectGetAliases: Set<string>,
  globalPropertyDescriptorAliases: Map<string, string>,
  globalPropertyDescriptorsObjectAliases: Set<string>,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): boolean {
  if (
    isGlobalObjectExpression(
      expression,
      globalObjectAliases,
      reflectObjectAliases,
      reflectGetAliases,
      staticStringAliases,
    )
  ) {
    return true;
  }

  const descriptorValueMemberName = getGlobalPropertyDescriptorValueMemberName(
    expression,
    globalObjectAliases,
    reflectObjectAliases,
    reflectGetAliases,
    globalPropertyDescriptorAliases,
    globalPropertyDescriptorsObjectAliases,
    staticStringAliases,
  );
  return Boolean(descriptorValueMemberName && globalAliasMemberNames.has(descriptorValueMemberName));
}

function getGlobalPropertyDescriptorValueMemberName(
  expression: ts.Node | undefined,
  globalObjectAliases: Set<string>,
  reflectObjectAliases: Set<string>,
  reflectGetAliases: Set<string>,
  globalPropertyDescriptorAliases: Map<string, string>,
  globalPropertyDescriptorsObjectAliases: Set<string>,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): string | null {
  const unwrapped = stripParentheses(expression);
  if (!unwrapped) {
    return null;
  }

  if (ts.isPropertyAccessExpression(unwrapped) || ts.isElementAccessExpression(unwrapped)) {
    if (getAccessedPropertyName(unwrapped, staticStringAliases) !== 'value') {
      return null;
    }
    return getGlobalPropertyDescriptorMemberName(
      unwrapped.expression,
      globalObjectAliases,
      reflectObjectAliases,
      reflectGetAliases,
      globalPropertyDescriptorAliases,
      globalPropertyDescriptorsObjectAliases,
      staticStringAliases,
    );
  }

  if (
    ts.isCallExpression(unwrapped) &&
    isReflectGetExpression(unwrapped.expression, reflectObjectAliases, reflectGetAliases, staticStringAliases)
  ) {
    const [target, member] = unwrapped.arguments;
    if (!member || getStaticStringValue(member, staticStringAliases) !== 'value') {
      return null;
    }
    return getGlobalPropertyDescriptorMemberName(
      target,
      globalObjectAliases,
      reflectObjectAliases,
      reflectGetAliases,
      globalPropertyDescriptorAliases,
      globalPropertyDescriptorsObjectAliases,
      staticStringAliases,
    );
  }

  return null;
}

function getGlobalPropertyDescriptorMemberName(
  expression: ts.Node | undefined,
  globalObjectAliases: Set<string>,
  reflectObjectAliases: Set<string>,
  reflectGetAliases: Set<string>,
  globalPropertyDescriptorAliases: Map<string, string>,
  globalPropertyDescriptorsObjectAliases: Set<string>,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): string | null {
  const unwrapped = stripParentheses(expression);
  if (!unwrapped) {
    return null;
  }

  const branchExpressions = getConditionalOrLogicalBranchExpressions(unwrapped);
  if (branchExpressions) {
    for (const branch of branchExpressions) {
      const branchMemberName = getGlobalPropertyDescriptorMemberName(
        branch,
        globalObjectAliases,
        reflectObjectAliases,
        reflectGetAliases,
        globalPropertyDescriptorAliases,
        globalPropertyDescriptorsObjectAliases,
        staticStringAliases,
      );
      if (branchMemberName) {
        return branchMemberName;
      }
    }
    return null;
  }

  if (ts.isIdentifier(unwrapped)) {
    return globalPropertyDescriptorAliases.get(unwrapped.text) || null;
  }

  const materializedMemberName = getMaterializedGlobalPropertyDescriptorMemberName(
    unwrapped,
    globalObjectAliases,
    reflectObjectAliases,
    reflectGetAliases,
    globalPropertyDescriptorAliases,
    globalPropertyDescriptorsObjectAliases,
    staticStringAliases,
  );
  if (materializedMemberName) {
    return materializedMemberName;
  }

  if (ts.isPropertyAccessExpression(unwrapped) || ts.isElementAccessExpression(unwrapped)) {
    const memberName = getAccessedPropertyName(unwrapped, staticStringAliases);
    return memberName &&
      privilegedGlobalDescriptorProperties.has(memberName) &&
      isGlobalPropertyDescriptorsObjectExpression(
        unwrapped.expression,
        globalObjectAliases,
        reflectObjectAliases,
        reflectGetAliases,
        globalPropertyDescriptorsObjectAliases,
        staticStringAliases,
      )
      ? memberName
      : null;
  }

  if (ts.isCallExpression(unwrapped)) {
    return (
      getOwnPropertyDescriptorMemberName(
        unwrapped,
        globalObjectAliases,
        reflectObjectAliases,
        reflectGetAliases,
        staticStringAliases,
      ) ||
      getReflectDescriptorsObjectMemberName(
        unwrapped,
        globalObjectAliases,
        reflectObjectAliases,
        reflectGetAliases,
        globalPropertyDescriptorsObjectAliases,
        staticStringAliases,
      )
    );
  }

  return null;
}

function getMaterializedGlobalPropertyDescriptorMemberName(
  expression: ts.Node,
  globalObjectAliases: Set<string>,
  reflectObjectAliases: Set<string>,
  reflectGetAliases: Set<string>,
  globalPropertyDescriptorAliases: Map<string, string>,
  globalPropertyDescriptorsObjectAliases: Set<string>,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): string | null {
  if (ts.isObjectLiteralExpression(expression)) {
    for (const property of expression.properties) {
      if (!ts.isSpreadAssignment(property)) {
        continue;
      }
      const memberName = getGlobalPropertyDescriptorMemberName(
        property.expression,
        globalObjectAliases,
        reflectObjectAliases,
        reflectGetAliases,
        globalPropertyDescriptorAliases,
        globalPropertyDescriptorsObjectAliases,
        staticStringAliases,
      );
      if (memberName) {
        return memberName;
      }
    }
    return null;
  }

  if (
    !ts.isCallExpression(expression) ||
    !isObjectStaticMethodExpression(expression.expression, 'assign', staticStringAliases)
  ) {
    return null;
  }

  for (const argument of expression.arguments) {
    const memberName = getGlobalPropertyDescriptorMemberName(
      argument,
      globalObjectAliases,
      reflectObjectAliases,
      reflectGetAliases,
      globalPropertyDescriptorAliases,
      globalPropertyDescriptorsObjectAliases,
      staticStringAliases,
    );
    if (memberName) {
      return memberName;
    }
  }

  return null;
}

function getOwnPropertyDescriptorMemberName(
  expression: ts.CallExpression,
  globalObjectAliases: Set<string>,
  reflectObjectAliases: Set<string>,
  reflectGetAliases: Set<string>,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): string | null {
  if (
    !isObjectStaticMethodExpression(expression.expression, 'getOwnPropertyDescriptor', staticStringAliases) &&
    getReflectStaticMethodName(expression.expression, reflectObjectAliases, staticStringAliases) !==
      'getOwnPropertyDescriptor'
  ) {
    return null;
  }

  const [target, member] = expression.arguments;
  const memberName = member ? getStaticStringValue(member, staticStringAliases) : null;
  if (memberName === 'constructor') {
    return 'Function';
  }
  if (!target) {
    return null;
  }
  if (isObjectConstructorExpression(target, staticStringAliases)) {
    if (!memberName) {
      return 'Function';
    }
    return privilegedObjectStaticMethods.has(memberName) ? memberName : null;
  }
  if (isReflectObjectExpression(target, reflectObjectAliases, staticStringAliases)) {
    if (!memberName) {
      return 'Reflect.get';
    }
    return memberName === 'get' ? 'Reflect.get' : null;
  }
  if (
    !isGlobalObjectExpression(target, globalObjectAliases, reflectObjectAliases, reflectGetAliases, staticStringAliases)
  ) {
    return null;
  }
  if (!memberName) {
    return 'Function';
  }
  return privilegedGlobalDescriptorProperties.has(memberName) ? memberName : null;
}

function isGlobalPropertyDescriptorsObjectExpression(
  expression: ts.Node | undefined,
  globalObjectAliases: Set<string>,
  reflectObjectAliases: Set<string>,
  reflectGetAliases: Set<string>,
  globalPropertyDescriptorsObjectAliases: Set<string>,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): boolean {
  const unwrapped = stripParentheses(expression);
  if (!unwrapped) {
    return false;
  }
  const branchExpressions = getConditionalOrLogicalBranchExpressions(unwrapped);
  if (branchExpressions) {
    return branchExpressions.some((branch) =>
      isGlobalPropertyDescriptorsObjectExpression(
        branch,
        globalObjectAliases,
        reflectObjectAliases,
        reflectGetAliases,
        globalPropertyDescriptorsObjectAliases,
        staticStringAliases,
      ),
    );
  }
  if (ts.isIdentifier(unwrapped)) {
    return globalPropertyDescriptorsObjectAliases.has(unwrapped.text);
  }
  if (ts.isObjectLiteralExpression(unwrapped)) {
    return unwrapped.properties.some(
      (property) =>
        ts.isSpreadAssignment(property) &&
        isGlobalPropertyDescriptorsObjectExpression(
          property.expression,
          globalObjectAliases,
          reflectObjectAliases,
          reflectGetAliases,
          globalPropertyDescriptorsObjectAliases,
          staticStringAliases,
        ),
    );
  }
  if (
    ts.isCallExpression(unwrapped) &&
    isObjectStaticMethodExpression(unwrapped.expression, 'assign', staticStringAliases)
  ) {
    return unwrapped.arguments.some((argument) =>
      isGlobalPropertyDescriptorsObjectExpression(
        argument,
        globalObjectAliases,
        reflectObjectAliases,
        reflectGetAliases,
        globalPropertyDescriptorsObjectAliases,
        staticStringAliases,
      ),
    );
  }
  if (
    !ts.isCallExpression(unwrapped) ||
    !isObjectStaticMethodExpression(unwrapped.expression, 'getOwnPropertyDescriptors', staticStringAliases)
  ) {
    return false;
  }

  const [target] = unwrapped.arguments;
  return Boolean(
    target &&
      (isGlobalObjectExpression(
        target,
        globalObjectAliases,
        reflectObjectAliases,
        reflectGetAliases,
        staticStringAliases,
      ) ||
        isObjectConstructorExpression(target, staticStringAliases) ||
        isReflectObjectExpression(target, reflectObjectAliases, staticStringAliases)),
  );
}

function getReflectDescriptorsObjectMemberName(
  expression: ts.CallExpression,
  globalObjectAliases: Set<string>,
  reflectObjectAliases: Set<string>,
  reflectGetAliases: Set<string>,
  globalPropertyDescriptorsObjectAliases: Set<string>,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): string | null {
  if (!isReflectGetExpression(expression.expression, reflectObjectAliases, reflectGetAliases, staticStringAliases)) {
    return null;
  }

  const [target, member] = expression.arguments;
  const memberName = member ? getStaticStringValue(member, staticStringAliases) : null;
  if (
    !target ||
    !isGlobalPropertyDescriptorsObjectExpression(
      target,
      globalObjectAliases,
      reflectObjectAliases,
      reflectGetAliases,
      globalPropertyDescriptorsObjectAliases,
      staticStringAliases,
    )
  ) {
    return null;
  }
  if (!memberName) {
    return 'Function';
  }
  return privilegedGlobalDescriptorProperties.has(memberName) ? memberName : null;
}

function isObjectStaticMethodExpression(
  expression: ts.Expression,
  methodName: string,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): boolean {
  return getObjectStaticMethodName(expression, staticStringAliases) === methodName;
}

function getStorageWriteArgumentExpressions(
  expression: ts.CallExpression,
  reflectObjectAliases: Set<string>,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): ts.Expression[] {
  const objectMethodName = getObjectStaticMethodName(expression.expression, staticStringAliases);
  if (objectMethodName === 'assign') {
    return [...expression.arguments.slice(1)];
  }
  if (objectMethodName === 'defineProperty') {
    return [...expression.arguments.slice(2, 3)];
  }
  if (objectMethodName === 'defineProperties') {
    return [...expression.arguments.slice(1, 2)];
  }

  const reflectMethodName = getReflectStaticMethodName(
    expression.expression,
    reflectObjectAliases,
    staticStringAliases,
  );
  if (reflectMethodName === 'set' || reflectMethodName === 'defineProperty') {
    return [...expression.arguments.slice(2, 3)];
  }

  const methodName = getAccessedPropertyName(expression.expression, staticStringAliases);
  if (methodName === 'push' || methodName === 'unshift') {
    return [...expression.arguments];
  }
  if (methodName === 'splice') {
    return [...expression.arguments.slice(2)];
  }
  if (methodName === 'fill' || methodName === 'add') {
    return [...expression.arguments.slice(0, 1)];
  }
  if (methodName === 'set') {
    return [...expression.arguments.slice(1, 2)];
  }

  return [];
}

function isPrototypeGlobalExposureCall(
  expression: ts.CallExpression,
  globalObjectAliases: Set<string>,
  reflectObjectAliases: Set<string>,
  reflectGetAliases: Set<string>,
  staticStringAliases: Map<string, string>,
): boolean {
  const objectMethodName = getObjectStaticMethodName(expression.expression, staticStringAliases);
  const reflectMethodName = getReflectStaticMethodName(
    expression.expression,
    reflectObjectAliases,
    staticStringAliases,
  );
  if (objectMethodName !== 'setPrototypeOf' && reflectMethodName !== 'setPrototypeOf') {
    return false;
  }
  const [, prototype] = expression.arguments;
  return Boolean(
    prototype &&
      isGlobalObjectExpression(
        prototype,
        globalObjectAliases,
        reflectObjectAliases,
        reflectGetAliases,
        staticStringAliases,
      ),
  );
}

function isUnknownObjectStaticCall(expression: ts.CallExpression, staticStringAliases: Map<string, string>): boolean {
  const callee = stripParentheses(expression.expression);
  return Boolean(
    ts.isElementAccessExpression(callee) &&
      getStaticStringValue(callee.argumentExpression, staticStringAliases) === null &&
      isObjectConstructorExpression(callee.expression, staticStringAliases),
  );
}

function isReflectApplyPrivilegedStaticCall(
  expression: ts.CallExpression,
  reflectObjectAliases: Set<string>,
  staticStringAliases: Map<string, string>,
): boolean {
  if (getReflectStaticMethodName(expression.expression, reflectObjectAliases, staticStringAliases) !== 'apply') {
    return false;
  }
  const [target] = expression.arguments;
  if (!target) {
    return false;
  }
  const unwrappedTarget = stripParentheses(target);
  if (!ts.isPropertyAccessExpression(unwrappedTarget) && !ts.isElementAccessExpression(unwrappedTarget)) {
    return false;
  }
  const objectMethodName = getPrivilegedObjectStaticMethodAliasName(unwrappedTarget, staticStringAliases);
  const reflectMethodName = getReflectStaticMethodName(unwrappedTarget, reflectObjectAliases, staticStringAliases);
  return Boolean(
    objectMethodName || ['get', 'getOwnPropertyDescriptor', 'setPrototypeOf'].includes(reflectMethodName || ''),
  );
}

function getObjectStaticMethodName(
  expression: ts.Expression,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): string | null {
  const unwrapped = stripParentheses(expression);
  if (!ts.isPropertyAccessExpression(unwrapped) && !ts.isElementAccessExpression(unwrapped)) {
    return null;
  }

  const memberName = getAccessedPropertyName(unwrapped, staticStringAliases);
  return memberName && isObjectConstructorExpression(unwrapped.expression, staticStringAliases) ? memberName : null;
}

function isObjectConstructorExpression(
  expression: ts.Node | undefined,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): boolean {
  const unwrapped = stripParentheses(expression);
  if (!unwrapped) {
    return false;
  }
  const branchExpressions = getConditionalOrLogicalBranchExpressions(unwrapped);
  if (branchExpressions) {
    return branchExpressions.some((branch) => isObjectConstructorExpression(branch, staticStringAliases));
  }
  if (ts.isIdentifier(unwrapped)) {
    return unwrapped.text === 'Object';
  }
  if (ts.isPropertyAccessExpression(unwrapped) || ts.isElementAccessExpression(unwrapped)) {
    return Boolean(
      getAccessedPropertyName(unwrapped, staticStringAliases) === 'Object' &&
        isGlobalObjectExpression(
          unwrapped.expression,
          globalObjectNames,
          defaultReflectObjectAliases,
          emptyAliasNames,
          staticStringAliases,
        ),
    );
  }
  return false;
}

function getPrivilegedObjectStaticMethodAliasName(
  expression: ts.Expression,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): string | null {
  const methodName = getObjectStaticMethodName(expression, staticStringAliases);
  return methodName && privilegedObjectStaticMethods.has(methodName) ? methodName : null;
}

function getReflectStaticMethodName(
  expression: ts.Expression,
  reflectObjectAliases: Set<string>,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): string | null {
  const unwrapped = stripParentheses(expression);
  if (!ts.isPropertyAccessExpression(unwrapped) && !ts.isElementAccessExpression(unwrapped)) {
    return null;
  }

  const memberName = getAccessedPropertyName(unwrapped, staticStringAliases);
  return memberName && isReflectObjectExpression(unwrapped.expression, reflectObjectAliases, staticStringAliases)
    ? memberName
    : null;
}

function isRequireExpression(expression: ts.Expression, requireAliases: Set<string>): boolean {
  const unwrapped = stripExpressionWrappers(expression);
  const branchExpressions = getConditionalOrLogicalBranchExpressions(unwrapped);
  if (branchExpressions) {
    return branchExpressions.some((branch) => isRequireExpression(branch, requireAliases));
  }
  return ts.isIdentifier(unwrapped) && (unwrapped.text === 'require' || requireAliases.has(unwrapped.text));
}

function isRequireReferenceExpression(
  expression: ts.Expression,
  globalObjectAliases: Set<string>,
  reflectObjectAliases: Set<string>,
  reflectGetAliases: Set<string>,
  requireAliases: Set<string>,
  globalPropertyDescriptorAliases: Map<string, string>,
  globalPropertyDescriptorsObjectAliases: Set<string>,
): boolean {
  const unwrapped = stripExpressionWrappers(expression);
  if (isRequireExpression(unwrapped, requireAliases)) {
    return true;
  }

  if (
    getGlobalPropertyDescriptorValueMemberName(
      unwrapped,
      globalObjectAliases,
      reflectObjectAliases,
      reflectGetAliases,
      globalPropertyDescriptorAliases,
      globalPropertyDescriptorsObjectAliases,
    ) === 'require'
  ) {
    return true;
  }

  if (ts.isPropertyAccessExpression(unwrapped) || ts.isElementAccessExpression(unwrapped)) {
    return (
      getAccessedPropertyName(unwrapped) === 'require' &&
      isGlobalObjectExpression(unwrapped.expression, globalObjectAliases, reflectObjectAliases, reflectGetAliases)
    );
  }

  if (ts.isCallExpression(unwrapped)) {
    return (
      getReflectBlockedMemberName(unwrapped, globalObjectAliases, reflectObjectAliases, reflectGetAliases) === 'require'
    );
  }

  return false;
}

function isForbiddenRequireCall(
  expression: ts.Expression,
  globalObjectAliases: Set<string>,
  reflectObjectAliases: Set<string>,
  reflectGetAliases: Set<string>,
  requireAliases: Set<string>,
  globalPropertyDescriptorAliases: Map<string, string>,
  globalPropertyDescriptorsObjectAliases: Set<string>,
): boolean {
  const unwrapped = stripExpressionWrappers(expression);
  if (
    isRequireReferenceExpression(
      unwrapped,
      globalObjectAliases,
      reflectObjectAliases,
      reflectGetAliases,
      requireAliases,
      globalPropertyDescriptorAliases,
      globalPropertyDescriptorsObjectAliases,
    )
  ) {
    return true;
  }

  if (ts.isPropertyAccessExpression(unwrapped) || ts.isElementAccessExpression(unwrapped)) {
    const memberName = getAccessedPropertyName(unwrapped);
    return (
      Boolean(memberName && functionHelperMembers.has(memberName)) &&
      isRequireReferenceExpression(
        unwrapped.expression,
        globalObjectAliases,
        reflectObjectAliases,
        reflectGetAliases,
        requireAliases,
        globalPropertyDescriptorAliases,
        globalPropertyDescriptorsObjectAliases,
      )
    );
  }

  return false;
}

function isRequireCallHelperAccess(
  expression: ts.Expression,
  globalObjectAliases: Set<string>,
  reflectObjectAliases: Set<string>,
  reflectGetAliases: Set<string>,
  requireAliases: Set<string>,
  globalPropertyDescriptorAliases: Map<string, string>,
  globalPropertyDescriptorsObjectAliases: Set<string>,
): boolean {
  const unwrapped = stripExpressionWrappers(expression);
  if (!ts.isPropertyAccessExpression(unwrapped) && !ts.isElementAccessExpression(unwrapped)) {
    return false;
  }

  const memberName = getAccessedPropertyName(unwrapped);
  return (
    Boolean(memberName && functionHelperMembers.has(memberName)) &&
    isRequireReferenceExpression(
      unwrapped.expression,
      globalObjectAliases,
      reflectObjectAliases,
      reflectGetAliases,
      requireAliases,
      globalPropertyDescriptorAliases,
      globalPropertyDescriptorsObjectAliases,
    )
  );
}

function isRequireFunctionExpression(
  expression: ts.Expression | undefined,
  globalObjectAliases: Set<string>,
  reflectObjectAliases: Set<string>,
  reflectGetAliases: Set<string>,
  requireAliases: Set<string>,
  globalPropertyDescriptorAliases: Map<string, string>,
  globalPropertyDescriptorsObjectAliases: Set<string>,
): boolean {
  return Boolean(
    expression &&
      isRequireReferenceExpression(
        expression,
        globalObjectAliases,
        reflectObjectAliases,
        reflectGetAliases,
        requireAliases,
        globalPropertyDescriptorAliases,
        globalPropertyDescriptorsObjectAliases,
      ),
  );
}

function getForbiddenRequireReferenceExpression(
  node: ts.Node,
  globalObjectAliases: Set<string>,
  reflectObjectAliases: Set<string>,
  reflectGetAliases: Set<string>,
  requireAliases: Set<string>,
  globalPropertyDescriptorAliases: Map<string, string>,
  globalPropertyDescriptorsObjectAliases: Set<string>,
): ts.Expression | null {
  if (!isPotentialRequireReferenceExpression(node)) {
    return null;
  }

  const expression = stripExpressionWrappers(node);
  if (ts.isIdentifier(expression) && shouldIgnoreIdentifierReference(expression)) {
    return null;
  }
  if (
    !isRequireReferenceExpression(
      expression,
      globalObjectAliases,
      reflectObjectAliases,
      reflectGetAliases,
      requireAliases,
      globalPropertyDescriptorAliases,
      globalPropertyDescriptorsObjectAliases,
    )
  ) {
    return null;
  }
  if (isDirectHandledRequireReferenceExpression(expression)) {
    return null;
  }

  return expression;
}

function isPotentialRequireReferenceExpression(node: ts.Node): node is ts.Expression {
  return (
    ts.isIdentifier(node) ||
    ts.isPropertyAccessExpression(node) ||
    ts.isElementAccessExpression(node) ||
    ts.isCallExpression(node) ||
    ts.isParenthesizedExpression(node) ||
    ts.isBinaryExpression(node)
  );
}

function shouldIgnoreIdentifierReference(node: ts.Identifier): boolean {
  return isDeclarationName(node) || isAccessPropertyName(node) || isObjectPropertyName(node);
}

function isObjectPropertyName(node: ts.Identifier): boolean {
  const parent = node.parent;
  return (
    (ts.isPropertyAssignment(parent) && parent.name === node) ||
    (ts.isMethodDeclaration(parent) && parent.name === node) ||
    (ts.isGetAccessor(parent) && parent.name === node) ||
    (ts.isSetAccessor(parent) && parent.name === node)
  );
}

function isDirectHandledRequireReferenceExpression(expression: ts.Expression): boolean {
  const parent = expression.parent;
  if ((ts.isCallExpression(parent) || ts.isNewExpression(parent)) && parent.expression === expression) {
    return true;
  }
  if (ts.isVariableDeclaration(parent) && parent.initializer === expression) {
    return true;
  }
  return (
    ts.isBinaryExpression(parent) && isAliasAssignmentOperator(parent.operatorToken.kind) && parent.right === expression
  );
}

function getForbiddenReflectGetReferenceExpression(
  node: ts.Node,
  reflectObjectAliases: Set<string>,
  reflectGetAliases: Set<string>,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): ts.Expression | null {
  if (!isPotentialRequireReferenceExpression(node)) {
    return null;
  }

  const expression = stripExpressionWrappers(node);
  if (ts.isIdentifier(expression) && shouldIgnoreIdentifierReference(expression)) {
    return null;
  }
  if (!isReflectGetExpression(expression, reflectObjectAliases, reflectGetAliases, staticStringAliases)) {
    return null;
  }
  if (isDirectHandledReflectGetExpression(expression)) {
    return null;
  }

  return expression;
}

function isDirectHandledReflectGetExpression(expression: ts.Expression): boolean {
  const parent = expression.parent;
  if ((ts.isCallExpression(parent) || ts.isNewExpression(parent)) && parent.expression === expression) {
    return true;
  }
  if (ts.isPropertyAccessExpression(parent) && parent.expression === expression) {
    return true;
  }
  if (ts.isElementAccessExpression(parent) && parent.expression === expression) {
    return true;
  }
  if (ts.isVariableDeclaration(parent) && parent.initializer === expression) {
    return true;
  }
  return (
    ts.isBinaryExpression(parent) && isAliasAssignmentOperator(parent.operatorToken.kind) && parent.right === expression
  );
}

function isReflectGetFunctionExpression(
  expression: ts.Expression | undefined,
  reflectObjectAliases: Set<string>,
  reflectGetAliases: Set<string>,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): boolean {
  return Boolean(
    expression && isReflectGetExpression(expression, reflectObjectAliases, reflectGetAliases, staticStringAliases),
  );
}

function isReflectGetCallHelperAccess(
  expression: ts.Expression,
  reflectObjectAliases: Set<string>,
  reflectGetAliases: Set<string>,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): boolean {
  const unwrapped = stripExpressionWrappers(expression);
  if (!ts.isPropertyAccessExpression(unwrapped) && !ts.isElementAccessExpression(unwrapped)) {
    return false;
  }

  const memberName = getAccessedPropertyName(unwrapped, staticStringAliases);
  return (
    Boolean(memberName && functionHelperMembers.has(memberName)) &&
    isReflectGetExpression(unwrapped.expression, reflectObjectAliases, reflectGetAliases, staticStringAliases)
  );
}

function isDirectCallee(expression: ts.Expression): boolean {
  const parent = expression.parent;
  return Boolean((ts.isCallExpression(parent) || ts.isNewExpression(parent)) && parent.expression === expression);
}

function isMemberAssignmentTarget(expression: ts.Expression): boolean {
  const unwrapped = stripParentheses(expression);
  return ts.isPropertyAccessExpression(unwrapped) || ts.isElementAccessExpression(unwrapped);
}

function isBlockedApiExpression(
  expression: ts.Expression,
  apiName: string,
  globalObjectAliases: Set<string>,
  reflectObjectAliases: Set<string>,
  reflectGetAliases: Set<string>,
  globalPropertyDescriptorAliases: Map<string, string>,
  globalPropertyDescriptorsObjectAliases: Set<string>,
  blockedApiAliases: Map<string, string>,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): boolean {
  return (
    getBlockedApiExpressionName(
      expression,
      globalObjectAliases,
      blockedApiAliases,
      reflectObjectAliases,
      reflectGetAliases,
      globalPropertyDescriptorAliases,
      globalPropertyDescriptorsObjectAliases,
      staticStringAliases,
    ) === apiName
  );
}

function getForbiddenFunctionReturnDiagnostic(
  node:
    | ts.ArrowFunction
    | ts.FunctionDeclaration
    | ts.FunctionExpression
    | ts.MethodDeclaration
    | ts.GetAccessorDeclaration
    | ts.SetAccessorDeclaration,
  globalObjectAliases: Set<string>,
  reflectObjectAliases: Set<string>,
  reflectGetAliases: Set<string>,
  requireAliases: Set<string>,
  globalPropertyDescriptorAliases: Map<string, string>,
  globalPropertyDescriptorsObjectAliases: Set<string>,
  blockedApiAliases: Map<string, string>,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): ForbiddenStoredDiagnostic | null {
  const body = node.body;
  if (!body) {
    return null;
  }
  const localAliases = cloneForbiddenAliasContext({
    globalObjectAliases,
    reflectObjectAliases,
    reflectGetAliases,
    requireAliases,
    globalPropertyDescriptorAliases,
    globalPropertyDescriptorsObjectAliases,
    blockedApiAliases,
    staticStringAliases,
  });
  for (const parameter of node.parameters) {
    if (parameter.initializer) {
      recordLocalBindingAliases(parameter.name, parameter.initializer, localAliases);
    }
  }

  if (!ts.isBlock(body)) {
    return getForbiddenStoredExpressionDiagnostic(
      body,
      localAliases.globalObjectAliases,
      localAliases.reflectObjectAliases,
      localAliases.reflectGetAliases,
      localAliases.requireAliases,
      localAliases.globalPropertyDescriptorAliases,
      localAliases.globalPropertyDescriptorsObjectAliases,
      localAliases.blockedApiAliases,
      localAliases.staticStringAliases,
    );
  }

  let forbidden: ForbiddenStoredDiagnostic | null = null;
  const visit = (child: ts.Node) => {
    if (forbidden || isNestedFunctionLikeNode(child)) {
      return;
    }
    recordLocalForbiddenAliases(child, localAliases);
    if (ts.isReturnStatement(child) && child.expression) {
      forbidden = getForbiddenStoredExpressionDiagnostic(
        child.expression,
        localAliases.globalObjectAliases,
        localAliases.reflectObjectAliases,
        localAliases.reflectGetAliases,
        localAliases.requireAliases,
        localAliases.globalPropertyDescriptorAliases,
        localAliases.globalPropertyDescriptorsObjectAliases,
        localAliases.blockedApiAliases,
        localAliases.staticStringAliases,
      );
      return;
    }
    ts.forEachChild(child, visit);
  };
  ts.forEachChild(body, visit);

  return forbidden;
}

function isFunctionLikeWithBody(
  node: ts.Node,
): node is
  | ts.ArrowFunction
  | ts.FunctionDeclaration
  | ts.FunctionExpression
  | ts.MethodDeclaration
  | ts.GetAccessorDeclaration
  | ts.SetAccessorDeclaration {
  return (
    (ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isGetAccessor(node) ||
      ts.isSetAccessor(node)) &&
    Boolean(node.body)
  );
}

interface ForbiddenAliasContext {
  globalObjectAliases: Set<string>;
  reflectObjectAliases: Set<string>;
  reflectGetAliases: Set<string>;
  requireAliases: Set<string>;
  globalPropertyDescriptorAliases: Map<string, string>;
  globalPropertyDescriptorsObjectAliases: Set<string>;
  blockedApiAliases: Map<string, string>;
  staticStringAliases: Map<string, string>;
}

function cloneForbiddenAliasContext(input: ForbiddenAliasContext): ForbiddenAliasContext {
  return {
    globalObjectAliases: new Set(input.globalObjectAliases),
    reflectObjectAliases: new Set(input.reflectObjectAliases),
    reflectGetAliases: new Set(input.reflectGetAliases),
    requireAliases: new Set(input.requireAliases),
    globalPropertyDescriptorAliases: new Map(input.globalPropertyDescriptorAliases),
    globalPropertyDescriptorsObjectAliases: new Set(input.globalPropertyDescriptorsObjectAliases),
    blockedApiAliases: new Map(input.blockedApiAliases),
    staticStringAliases: new Map(input.staticStringAliases),
  };
}

function recordLocalForbiddenAliases(node: ts.Node, context: ForbiddenAliasContext): void {
  if (ts.isVariableDeclaration(node) && node.initializer) {
    recordLocalBindingAliases(node.name, node.initializer, context);
    return;
  }

  if (ts.isBinaryExpression(node) && isAliasAssignmentOperator(node.operatorToken.kind)) {
    const target = stripParentheses(node.left);
    if (ts.isIdentifier(target)) {
      recordLocalIdentifierAlias(target.text, node.right, context);
      return;
    }
    if (ts.isObjectLiteralExpression(target)) {
      recordLocalObjectAssignmentAliases(target, node.right, context);
      return;
    }
    if (ts.isArrayLiteralExpression(target) && ts.isArrayLiteralExpression(stripParentheses(node.right))) {
      recordLocalArrayAssignmentAliases(target, stripParentheses(node.right), context);
    }
  }
}

function recordLocalBindingAliases(
  name: ts.BindingName,
  expression: ts.Expression,
  context: ForbiddenAliasContext,
): void {
  if (ts.isIdentifier(name)) {
    recordLocalIdentifierAlias(name.text, expression, context);
    return;
  }

  if (ts.isObjectBindingPattern(name)) {
    recordLocalObjectBindingAliases(name, expression, context);
    return;
  }

  recordLocalArrayBindingAliases(name, expression, context);
}

function recordLocalIdentifierAlias(name: string, expression: ts.Expression, context: ForbiddenAliasContext): void {
  const unwrapped = stripParentheses(expression);
  recordStaticStringAlias(name, unwrapped, context.staticStringAliases);
  if (
    isGlobalObjectOrDescriptorValueExpression(
      unwrapped,
      context.globalObjectAliases,
      context.reflectObjectAliases,
      context.reflectGetAliases,
      context.globalPropertyDescriptorAliases,
      context.globalPropertyDescriptorsObjectAliases,
      context.staticStringAliases,
    )
  ) {
    context.globalObjectAliases.add(name);
  }
  if (isReflectObjectExpression(unwrapped, context.reflectObjectAliases, context.staticStringAliases)) {
    context.reflectObjectAliases.add(name);
  }
  if (
    isReflectGetExpression(
      unwrapped,
      context.reflectObjectAliases,
      context.reflectGetAliases,
      context.staticStringAliases,
    )
  ) {
    context.reflectGetAliases.add(name);
  }
  if (
    isRequireFunctionExpression(
      unwrapped,
      context.globalObjectAliases,
      context.reflectObjectAliases,
      context.reflectGetAliases,
      context.requireAliases,
      context.globalPropertyDescriptorAliases,
      context.globalPropertyDescriptorsObjectAliases,
    )
  ) {
    context.requireAliases.add(name);
  }

  const descriptorMemberName = getGlobalPropertyDescriptorMemberName(
    unwrapped,
    context.globalObjectAliases,
    context.reflectObjectAliases,
    context.reflectGetAliases,
    context.globalPropertyDescriptorAliases,
    context.globalPropertyDescriptorsObjectAliases,
    context.staticStringAliases,
  );
  if (descriptorMemberName) {
    context.globalPropertyDescriptorAliases.set(name, descriptorMemberName);
  }

  if (
    isGlobalPropertyDescriptorsObjectExpression(
      unwrapped,
      context.globalObjectAliases,
      context.reflectObjectAliases,
      context.reflectGetAliases,
      context.globalPropertyDescriptorsObjectAliases,
      context.staticStringAliases,
    )
  ) {
    context.globalPropertyDescriptorsObjectAliases.add(name);
  }

  const blockedApiName =
    getBlockedApiExpressionName(
      unwrapped,
      context.globalObjectAliases,
      context.blockedApiAliases,
      context.reflectObjectAliases,
      context.reflectGetAliases,
      context.globalPropertyDescriptorAliases,
      context.globalPropertyDescriptorsObjectAliases,
      context.staticStringAliases,
    ) ||
    getComputedBlockedApiExpressionName(
      unwrapped,
      context.staticStringAliases,
      context.globalObjectAliases,
      context.reflectObjectAliases,
      context.reflectGetAliases,
      context.globalPropertyDescriptorAliases,
      context.globalPropertyDescriptorsObjectAliases,
    );
  if (blockedApiName) {
    context.blockedApiAliases.set(name, blockedApiName);
  }
}

function recordLocalObjectBindingAliases(
  pattern: ts.ObjectBindingPattern,
  initializer: ts.Expression,
  context: ForbiddenAliasContext,
): void {
  const bindsFromGlobalObject = isGlobalObjectOrDescriptorValueExpression(
    initializer,
    context.globalObjectAliases,
    context.reflectObjectAliases,
    context.reflectGetAliases,
    context.globalPropertyDescriptorAliases,
    context.globalPropertyDescriptorsObjectAliases,
    context.staticStringAliases,
  );
  const bindsFromRequireFunction = isRequireFunctionExpression(
    initializer,
    context.globalObjectAliases,
    context.reflectObjectAliases,
    context.reflectGetAliases,
    context.requireAliases,
    context.globalPropertyDescriptorAliases,
    context.globalPropertyDescriptorsObjectAliases,
  );
  const bindsFromReflectObject = isReflectObjectExpression(
    initializer,
    context.reflectObjectAliases,
    context.staticStringAliases,
  );
  const bindsFromReflectGetFunction = isReflectGetFunctionExpression(
    initializer,
    context.reflectObjectAliases,
    context.reflectGetAliases,
    context.staticStringAliases,
  );
  const bindsFromGlobalPropertyDescriptor = getGlobalPropertyDescriptorMemberName(
    initializer,
    context.globalObjectAliases,
    context.reflectObjectAliases,
    context.reflectGetAliases,
    context.globalPropertyDescriptorAliases,
    context.globalPropertyDescriptorsObjectAliases,
    context.staticStringAliases,
  );
  const bindsFromGlobalPropertyDescriptorsObject = isGlobalPropertyDescriptorsObjectExpression(
    initializer,
    context.globalObjectAliases,
    context.reflectObjectAliases,
    context.reflectGetAliases,
    context.globalPropertyDescriptorsObjectAliases,
    context.staticStringAliases,
  );

  for (const element of pattern.elements) {
    const memberName = getBindingElementPropertyName(element, context.staticStringAliases);
    if (element.initializer) {
      recordLocalBindingAliases(element.name, element.initializer, context);
    }
    if (!memberName && isUnknownComputedBindingElement(element, context.staticStringAliases)) {
      if (bindsFromGlobalPropertyDescriptor === 'require') {
        recordBindingNameIdentifierAlias(element.name, context.requireAliases);
      } else if (bindsFromGlobalPropertyDescriptor && blockedGlobalMembers.has(bindsFromGlobalPropertyDescriptor)) {
        recordBindingNameIdentifierMapAlias(element.name, context.blockedApiAliases, bindsFromGlobalPropertyDescriptor);
      } else if (bindsFromGlobalPropertyDescriptorsObject) {
        recordBindingNameIdentifierMapAlias(element.name, context.globalPropertyDescriptorAliases, 'Function');
      } else if (bindsFromGlobalObject || bindsFromReflectObject) {
        recordBindingNameIdentifierMapAlias(element.name, context.blockedApiAliases, 'Function');
      }
      continue;
    }
    if (!memberName) {
      continue;
    }
    if (bindsFromGlobalObject && globalAliasMemberNames.has(memberName)) {
      recordBindingNameIdentifierAlias(element.name, context.globalObjectAliases);
      if (!ts.isIdentifier(element.name)) {
        recordLocalBindingAliases(element.name, initializer, context);
      }
    }
    if (bindsFromGlobalObject && memberName === 'require') {
      recordBindingNameIdentifierAlias(element.name, context.requireAliases);
    }
    if (bindsFromGlobalObject && blockedGlobalMembers.has(memberName)) {
      recordBindingNameIdentifierMapAlias(element.name, context.blockedApiAliases, memberName);
    }
    if (bindsFromReflectObject && memberName === 'get') {
      recordBindingNameIdentifierAlias(element.name, context.reflectGetAliases);
    }
    if (bindsFromReflectGetFunction && functionHelperMembers.has(memberName)) {
      recordBindingNameIdentifierMapAlias(element.name, context.blockedApiAliases, 'Reflect.get');
    }
    if (bindsFromGlobalPropertyDescriptor && memberName === 'value') {
      if (bindsFromGlobalPropertyDescriptor === 'require') {
        recordBindingNameIdentifierAlias(element.name, context.requireAliases);
      } else if (blockedGlobalMembers.has(bindsFromGlobalPropertyDescriptor)) {
        recordBindingNameIdentifierMapAlias(element.name, context.blockedApiAliases, bindsFromGlobalPropertyDescriptor);
      } else if (globalAliasMemberNames.has(bindsFromGlobalPropertyDescriptor)) {
        recordBindingNameIdentifierAlias(element.name, context.globalObjectAliases);
      }
    }
    if (bindsFromGlobalPropertyDescriptorsObject && privilegedGlobalDescriptorProperties.has(memberName)) {
      recordBindingNameIdentifierMapAlias(element.name, context.globalPropertyDescriptorAliases, memberName);
    }
  }
}

function recordLocalArrayBindingAliases(
  pattern: ts.ArrayBindingPattern,
  initializer: ts.Expression,
  context: ForbiddenAliasContext,
): void {
  const unwrapped = stripParentheses(initializer);
  if (!ts.isArrayLiteralExpression(unwrapped)) {
    return;
  }

  pattern.elements.forEach((element, index) => {
    if (ts.isOmittedExpression(element)) {
      return;
    }
    const initializerElement = unwrapped.elements[index];
    const source =
      initializerElement && !ts.isSpreadElement(initializerElement) && !ts.isOmittedExpression(initializerElement)
        ? initializerElement
        : element.initializer;
    if (source) {
      recordLocalBindingAliases(element.name, source, context);
    }
  });
}

function recordLocalObjectAssignmentAliases(
  pattern: ts.ObjectLiteralExpression,
  initializer: ts.Expression,
  context: ForbiddenAliasContext,
): void {
  const bindsFromGlobalObject = isGlobalObjectOrDescriptorValueExpression(
    initializer,
    context.globalObjectAliases,
    context.reflectObjectAliases,
    context.reflectGetAliases,
    context.globalPropertyDescriptorAliases,
    context.globalPropertyDescriptorsObjectAliases,
    context.staticStringAliases,
  );
  const bindsFromRequireFunction = isRequireFunctionExpression(
    initializer,
    context.globalObjectAliases,
    context.reflectObjectAliases,
    context.reflectGetAliases,
    context.requireAliases,
    context.globalPropertyDescriptorAliases,
    context.globalPropertyDescriptorsObjectAliases,
  );
  const bindsFromReflectObject = isReflectObjectExpression(
    initializer,
    context.reflectObjectAliases,
    context.staticStringAliases,
  );
  const bindsFromReflectGetFunction = isReflectGetFunctionExpression(
    initializer,
    context.reflectObjectAliases,
    context.reflectGetAliases,
    context.staticStringAliases,
  );
  const bindsFromGlobalPropertyDescriptor = getGlobalPropertyDescriptorMemberName(
    initializer,
    context.globalObjectAliases,
    context.reflectObjectAliases,
    context.reflectGetAliases,
    context.globalPropertyDescriptorAliases,
    context.globalPropertyDescriptorsObjectAliases,
    context.staticStringAliases,
  );
  const bindsFromGlobalPropertyDescriptorsObject = isGlobalPropertyDescriptorsObjectExpression(
    initializer,
    context.globalObjectAliases,
    context.reflectObjectAliases,
    context.reflectGetAliases,
    context.globalPropertyDescriptorsObjectAliases,
    context.staticStringAliases,
  );

  for (const property of pattern.properties) {
    if (ts.isShorthandPropertyAssignment(property) && property.objectAssignmentInitializer) {
      recordLocalIdentifierAlias(property.name.text, property.objectAssignmentInitializer, context);
    }
    const propertyTarget = getObjectAssignmentPropertyTarget(property, context.staticStringAliases);
    if (
      !propertyTarget.memberName &&
      isUnknownComputedObjectAssignmentProperty(property, context.staticStringAliases)
    ) {
      if (!propertyTarget.aliasName) {
        continue;
      }
      if (bindsFromRequireFunction) {
        context.requireAliases.add(propertyTarget.aliasName);
      } else if (bindsFromGlobalPropertyDescriptor || bindsFromGlobalPropertyDescriptorsObject) {
        context.globalPropertyDescriptorAliases.set(propertyTarget.aliasName, 'Function');
      } else if (bindsFromGlobalObject || bindsFromReflectObject || bindsFromReflectGetFunction) {
        context.blockedApiAliases.set(propertyTarget.aliasName, 'Function');
      }
      continue;
    }
    if (!propertyTarget.memberName) {
      continue;
    }
    const nestedAssignmentTarget = propertyTarget.targetExpression
      ? stripParentheses(propertyTarget.targetExpression)
      : null;
    if (
      bindsFromGlobalObject &&
      globalAliasMemberNames.has(propertyTarget.memberName) &&
      nestedAssignmentTarget &&
      ts.isObjectLiteralExpression(nestedAssignmentTarget)
    ) {
      recordLocalObjectAssignmentAliases(nestedAssignmentTarget, initializer, context);
      continue;
    }
    if (!propertyTarget.aliasName) {
      continue;
    }
    if (bindsFromGlobalObject && globalAliasMemberNames.has(propertyTarget.memberName)) {
      context.globalObjectAliases.add(propertyTarget.aliasName);
    }
    if (bindsFromGlobalObject && propertyTarget.memberName === 'require') {
      context.requireAliases.add(propertyTarget.aliasName);
    }
    if (bindsFromGlobalObject && blockedGlobalMembers.has(propertyTarget.memberName)) {
      context.blockedApiAliases.set(propertyTarget.aliasName, propertyTarget.memberName);
    }
    if (bindsFromReflectObject && propertyTarget.memberName === 'get') {
      context.reflectGetAliases.add(propertyTarget.aliasName);
    }
    if (bindsFromReflectGetFunction && functionHelperMembers.has(propertyTarget.memberName)) {
      context.blockedApiAliases.set(propertyTarget.aliasName, 'Reflect.get');
    }
    if (bindsFromGlobalPropertyDescriptor && propertyTarget.memberName === 'value') {
      if (bindsFromGlobalPropertyDescriptor === 'require') {
        context.requireAliases.add(propertyTarget.aliasName);
      } else if (blockedGlobalMembers.has(bindsFromGlobalPropertyDescriptor)) {
        context.blockedApiAliases.set(propertyTarget.aliasName, bindsFromGlobalPropertyDescriptor);
      } else if (globalAliasMemberNames.has(bindsFromGlobalPropertyDescriptor)) {
        context.globalObjectAliases.add(propertyTarget.aliasName);
      }
    }
    if (
      bindsFromGlobalPropertyDescriptorsObject &&
      privilegedGlobalDescriptorProperties.has(propertyTarget.memberName)
    ) {
      context.globalPropertyDescriptorAliases.set(propertyTarget.aliasName, propertyTarget.memberName);
    }
  }
}

function recordLocalArrayAssignmentAliases(
  pattern: ts.ArrayLiteralExpression,
  initializer: ts.ArrayLiteralExpression,
  context: ForbiddenAliasContext,
): void {
  pattern.elements.forEach((targetElement, index) => {
    if (ts.isOmittedExpression(targetElement)) {
      return;
    }
    const target = ts.isSpreadElement(targetElement) ? stripParentheses(targetElement.expression) : targetElement;
    const source = initializer.elements[index];
    if (!source || ts.isSpreadElement(source) || ts.isOmittedExpression(source)) {
      return;
    }
    if (ts.isIdentifier(target)) {
      recordLocalIdentifierAlias(target.text, source, context);
    }
  });
}

function recordBindingNameIdentifierAlias(name: ts.BindingName, aliases: Set<string>): void {
  if (ts.isIdentifier(name)) {
    aliases.add(name.text);
  }
}

function recordBindingNameIdentifierMapAlias(name: ts.BindingName, aliases: Map<string, string>, value: string): void {
  if (ts.isIdentifier(name)) {
    aliases.set(name.text, value);
  }
}

function isNestedFunctionLikeNode(node: ts.Node): boolean {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isGetAccessor(node) ||
    ts.isSetAccessor(node) ||
    ts.isConstructorDeclaration(node)
  );
}

function isStaticStringAliasScopeNode(node: ts.Node): boolean {
  return isNestedFunctionLikeNode(node) || isStaticStringAliasBlockScopeNode(node);
}

function isStaticStringAliasBlockScopeNode(node: ts.Node): boolean {
  return ts.isBlock(node) || ts.isModuleBlock(node) || ts.isCaseBlock(node);
}

function collectStaticStringAssignmentNames(node: ts.Node): Set<string> {
  const names = new Set<string>();
  const declaredNames = new Set<string>();
  const collectDeclared = (child: ts.Node) => {
    if (child !== node && (isNestedFunctionLikeNode(child) || isStaticStringAliasBlockScopeNode(child))) {
      return;
    }
    if (ts.isVariableDeclaration(child)) {
      collectBindingIdentifierNames(child.name, declaredNames);
    }
    ts.forEachChild(child, collectDeclared);
  };
  const visit = (child: ts.Node) => {
    if (child !== node && (isNestedFunctionLikeNode(child) || isStaticStringAliasBlockScopeNode(child))) {
      return;
    }
    if (ts.isBinaryExpression(child) && isAliasAssignmentOperator(child.operatorToken.kind)) {
      const target = stripParentheses(child.left);
      if (ts.isIdentifier(target) && !declaredNames.has(target.text)) {
        names.add(target.text);
      }
    }
    ts.forEachChild(child, visit);
  };
  ts.forEachChild(node, collectDeclared);
  ts.forEachChild(node, visit);
  return names;
}

function collectFunctionScopedVarDeclarationNames(node: ts.Node): Set<string> {
  const names = new Set<string>();
  const visit = (child: ts.Node) => {
    if (child !== node && (isNestedFunctionLikeNode(child) || isStaticStringAliasBlockScopeNode(child))) {
      return;
    }
    if (ts.isVariableDeclaration(child) && child.initializer && !isBlockScopedVariableDeclaration(child)) {
      collectBindingIdentifierNames(child.name, names);
    }
    ts.forEachChild(child, visit);
  };
  ts.forEachChild(node, visit);
  return names;
}

function isBlockScopedVariableDeclaration(node: ts.VariableDeclaration): boolean {
  return Boolean(ts.getCombinedNodeFlags(node) & (ts.NodeFlags.Let | ts.NodeFlags.Const));
}

function collectBindingIdentifierNames(name: ts.BindingName, names: Set<string>): void {
  if (ts.isIdentifier(name)) {
    names.add(name.text);
    return;
  }
  for (const element of name.elements) {
    if (ts.isOmittedExpression(element)) {
      continue;
    }
    collectBindingIdentifierNames(element.name, names);
  }
}

function isBlockedDescriptorValueMemberName(memberName: string): boolean {
  return (
    blockedGlobalMembers.has(memberName) ||
    memberName === 'Reflect.get' ||
    memberName === 'get' ||
    privilegedObjectStaticMethods.has(memberName)
  );
}

function getForbiddenContainerExpressionDiagnostic(
  expression: ts.ObjectLiteralExpression | ts.ArrayLiteralExpression,
  globalObjectAliases: Set<string>,
  reflectObjectAliases: Set<string>,
  reflectGetAliases: Set<string>,
  requireAliases: Set<string>,
  globalPropertyDescriptorAliases: Map<string, string>,
  globalPropertyDescriptorsObjectAliases: Set<string>,
  blockedApiAliases: Map<string, string>,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): ForbiddenStoredDiagnostic | null {
  if (ts.isObjectLiteralExpression(expression)) {
    for (const property of expression.properties) {
      if (ts.isSpreadAssignment(property)) {
        const forbidden = getForbiddenStoredExpressionDiagnostic(
          property.expression,
          globalObjectAliases,
          reflectObjectAliases,
          reflectGetAliases,
          requireAliases,
          globalPropertyDescriptorAliases,
          globalPropertyDescriptorsObjectAliases,
          blockedApiAliases,
          staticStringAliases,
        );
        if (forbidden) {
          return forbidden;
        }
      } else if (ts.isPropertyAssignment(property)) {
        const forbidden = getForbiddenStoredExpressionDiagnostic(
          property.initializer,
          globalObjectAliases,
          reflectObjectAliases,
          reflectGetAliases,
          requireAliases,
          globalPropertyDescriptorAliases,
          globalPropertyDescriptorsObjectAliases,
          blockedApiAliases,
          staticStringAliases,
        );
        if (forbidden) {
          return forbidden;
        }
      } else if (ts.isShorthandPropertyAssignment(property)) {
        const shorthandForbidden = getForbiddenStoredExpressionDiagnostic(
          property.name,
          globalObjectAliases,
          reflectObjectAliases,
          reflectGetAliases,
          requireAliases,
          globalPropertyDescriptorAliases,
          globalPropertyDescriptorsObjectAliases,
          blockedApiAliases,
          staticStringAliases,
        );
        if (shorthandForbidden) {
          return shorthandForbidden;
        }
        if (property.objectAssignmentInitializer) {
          const defaultForbidden = getForbiddenStoredExpressionDiagnostic(
            property.objectAssignmentInitializer,
            globalObjectAliases,
            reflectObjectAliases,
            reflectGetAliases,
            requireAliases,
            globalPropertyDescriptorAliases,
            globalPropertyDescriptorsObjectAliases,
            blockedApiAliases,
            staticStringAliases,
          );
          if (defaultForbidden) {
            return defaultForbidden;
          }
        }
      } else if (ts.isMethodDeclaration(property) || ts.isGetAccessor(property) || ts.isSetAccessor(property)) {
        const forbidden = getForbiddenFunctionReturnDiagnostic(
          property,
          globalObjectAliases,
          reflectObjectAliases,
          reflectGetAliases,
          requireAliases,
          globalPropertyDescriptorAliases,
          globalPropertyDescriptorsObjectAliases,
          blockedApiAliases,
          staticStringAliases,
        );
        if (forbidden) {
          return forbidden;
        }
      }
    }
    return null;
  }

  for (const element of expression.elements) {
    if (ts.isOmittedExpression(element)) {
      continue;
    }
    const targetExpression = ts.isSpreadElement(element) ? element.expression : element;
    const forbidden = getForbiddenStoredExpressionDiagnostic(
      targetExpression,
      globalObjectAliases,
      reflectObjectAliases,
      reflectGetAliases,
      requireAliases,
      globalPropertyDescriptorAliases,
      globalPropertyDescriptorsObjectAliases,
      blockedApiAliases,
      staticStringAliases,
    );
    if (forbidden) {
      return forbidden;
    }
  }

  return null;
}

function getForbiddenPrivilegedCallArguments(
  expression: ts.CallExpression | ts.NewExpression,
  globalObjectAliases: Set<string>,
  reflectObjectAliases: Set<string>,
  reflectGetAliases: Set<string>,
  requireAliases: Set<string>,
  globalPropertyDescriptorAliases: Map<string, string>,
  globalPropertyDescriptorsObjectAliases: Set<string>,
  blockedApiAliases: Map<string, string>,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): Array<{ argument: ts.Expression; forbidden: ForbiddenStoredDiagnostic }> {
  const findings: Array<{ argument: ts.Expression; forbidden: ForbiddenStoredDiagnostic }> = [];
  for (const argument of expression.arguments || []) {
    const targetExpression = ts.isSpreadElement(argument) ? argument.expression : argument;
    const forbidden = getForbiddenStoredExpressionDiagnostic(
      targetExpression,
      globalObjectAliases,
      reflectObjectAliases,
      reflectGetAliases,
      requireAliases,
      globalPropertyDescriptorAliases,
      globalPropertyDescriptorsObjectAliases,
      blockedApiAliases,
      staticStringAliases,
    );
    if (!forbidden) {
      continue;
    }

    findings.push({
      argument,
      forbidden: {
        code: forbidden.code,
        message:
          forbidden.code === 'require_not_allowed'
            ? 'Passing require references into calls is not allowed in light-extension source'
            : 'Passing privileged object or API references into calls is not allowed in light-extension source',
      },
    });
  }
  return findings;
}

function getForbiddenStoredExpressionDiagnostic(
  expression: ts.Expression,
  globalObjectAliases: Set<string>,
  reflectObjectAliases: Set<string>,
  reflectGetAliases: Set<string>,
  requireAliases: Set<string>,
  globalPropertyDescriptorAliases: Map<string, string>,
  globalPropertyDescriptorsObjectAliases: Set<string>,
  blockedApiAliases: Map<string, string>,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): ForbiddenStoredDiagnostic | null {
  const branchExpressions = getConditionalOrLogicalBranchExpressions(expression);
  if (branchExpressions) {
    for (const branch of branchExpressions) {
      const branchForbidden = getForbiddenStoredExpressionDiagnostic(
        branch,
        globalObjectAliases,
        reflectObjectAliases,
        reflectGetAliases,
        requireAliases,
        globalPropertyDescriptorAliases,
        globalPropertyDescriptorsObjectAliases,
        blockedApiAliases,
        staticStringAliases,
      );
      if (branchForbidden) {
        return branchForbidden;
      }
    }
  }

  const objectStaticMethodName = getPrivilegedObjectStaticMethodAliasName(expression, staticStringAliases);
  if (isObjectConstructorExpression(expression, staticStringAliases) || objectStaticMethodName) {
    return {
      code: 'blocked_global_api',
      message: `${
        objectStaticMethodName || 'Object'
      } aliasing into object properties is not allowed in light-extension source`,
    };
  }

  if (
    isRequireFunctionExpression(
      expression,
      globalObjectAliases,
      reflectObjectAliases,
      reflectGetAliases,
      requireAliases,
      globalPropertyDescriptorAliases,
      globalPropertyDescriptorsObjectAliases,
    )
  ) {
    return {
      code: 'require_not_allowed',
      message: 'require aliasing into object properties is not allowed in light-extension source',
    };
  }

  const descriptorMemberName = getGlobalPropertyDescriptorMemberName(
    expression,
    globalObjectAliases,
    reflectObjectAliases,
    reflectGetAliases,
    globalPropertyDescriptorAliases,
    globalPropertyDescriptorsObjectAliases,
    staticStringAliases,
  );
  if (descriptorMemberName) {
    return {
      code: descriptorMemberName === 'require' ? 'require_not_allowed' : 'blocked_global_api',
      message: `${descriptorMemberName} is not allowed in light-extension source`,
    };
  }

  const blockedApiName = getBlockedApiExpressionName(
    expression,
    globalObjectAliases,
    blockedApiAliases,
    reflectObjectAliases,
    reflectGetAliases,
    globalPropertyDescriptorAliases,
    globalPropertyDescriptorsObjectAliases,
    staticStringAliases,
  );
  if (blockedApiName) {
    return {
      code: blockedApiName === 'require' ? 'require_not_allowed' : 'blocked_global_api',
      message: `${blockedApiName} is not allowed in light-extension source`,
    };
  }

  if (
    isGlobalPropertyDescriptorsObjectExpression(
      expression,
      globalObjectAliases,
      reflectObjectAliases,
      reflectGetAliases,
      globalPropertyDescriptorsObjectAliases,
      staticStringAliases,
    )
  ) {
    return {
      code: 'blocked_global_api',
      message: 'Global property descriptors are not allowed in light-extension source',
    };
  }

  const unwrapped = stripParentheses(expression);
  if (ts.isArrowFunction(unwrapped) || ts.isFunctionExpression(unwrapped)) {
    const forbidden = getForbiddenFunctionReturnDiagnostic(
      unwrapped,
      globalObjectAliases,
      reflectObjectAliases,
      reflectGetAliases,
      requireAliases,
      globalPropertyDescriptorAliases,
      globalPropertyDescriptorsObjectAliases,
      blockedApiAliases,
      staticStringAliases,
    );
    if (forbidden) {
      return forbidden;
    }
  }

  if (ts.isObjectLiteralExpression(unwrapped) || ts.isArrayLiteralExpression(unwrapped)) {
    const forbidden = getForbiddenContainerExpressionDiagnostic(
      unwrapped,
      globalObjectAliases,
      reflectObjectAliases,
      reflectGetAliases,
      requireAliases,
      globalPropertyDescriptorAliases,
      globalPropertyDescriptorsObjectAliases,
      blockedApiAliases,
      staticStringAliases,
    );
    if (forbidden) {
      return forbidden;
    }
  }

  if (
    isGlobalObjectOrDescriptorValueExpression(
      expression,
      globalObjectAliases,
      reflectObjectAliases,
      reflectGetAliases,
      globalPropertyDescriptorAliases,
      globalPropertyDescriptorsObjectAliases,
      staticStringAliases,
    )
  ) {
    return {
      code: 'blocked_global_api',
      message: 'Global object aliasing into object properties is not allowed in light-extension source',
    };
  }

  if (isReflectGetFunctionExpression(expression, reflectObjectAliases, reflectGetAliases, staticStringAliases)) {
    return {
      code: 'blocked_global_api',
      message: 'Reflect.get aliasing into object properties is not allowed in light-extension source',
    };
  }

  if (isReflectObjectExpression(expression, reflectObjectAliases, staticStringAliases)) {
    return {
      code: 'blocked_global_api',
      message: 'Reflect aliasing into object properties is not allowed in light-extension source',
    };
  }

  return null;
}

function getBlockedApiIdentifierName(node: ts.Node, blockedApiAliases: Map<string, string>): string | null {
  if (!ts.isIdentifier(node) || isDeclarationName(node) || isAccessPropertyName(node)) {
    return null;
  }

  if (isDirectHandledBlockedInvocation(node) || isDirectHandledForbiddenAlias(node)) {
    return null;
  }

  if (blockedGlobalMembers.has(node.text)) {
    return node.text;
  }

  return blockedApiAliases.get(node.text) || null;
}

function isDirectHandledBlockedInvocation(node: ts.Identifier): boolean {
  const parent = node.parent;
  return (
    (ts.isCallExpression(parent) || ts.isNewExpression(parent)) &&
    parent.expression === node &&
    blockedGlobalMembers.has(node.text)
  );
}

function isDirectHandledForbiddenAlias(node: ts.Identifier): boolean {
  const parent = node.parent;
  if (ts.isVariableDeclaration(parent) && parent.initializer === node) {
    return true;
  }
  return ts.isBinaryExpression(parent) && isAliasAssignmentOperator(parent.operatorToken.kind) && parent.right === node;
}

function isAliasAssignmentOperator(kind: ts.SyntaxKind): boolean {
  return (
    kind === ts.SyntaxKind.EqualsToken ||
    kind === ts.SyntaxKind.QuestionQuestionEqualsToken ||
    kind === ts.SyntaxKind.BarBarEqualsToken ||
    kind === ts.SyntaxKind.AmpersandAmpersandEqualsToken
  );
}

function recordStaticStringAliasFromNode(node: ts.Node, staticStringAliases: Map<string, string>): void {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
    if (node.initializer) {
      recordStaticStringAlias(node.name.text, node.initializer, staticStringAliases);
    } else {
      staticStringAliases.delete(node.name.text);
    }
    return;
  }
  if (ts.isParameter(node) && ts.isIdentifier(node.name)) {
    if (node.initializer) {
      recordStaticStringAlias(node.name.text, node.initializer, staticStringAliases);
    } else {
      staticStringAliases.delete(node.name.text);
    }
    return;
  }
  if (ts.isBinaryExpression(node) && isAliasAssignmentOperator(node.operatorToken.kind)) {
    const target = stripParentheses(node.left);
    if (ts.isIdentifier(target)) {
      recordStaticStringAlias(target.text, node.right, staticStringAliases);
    }
  }
}

function recordStaticStringAlias(
  name: string,
  expression: ts.Expression,
  staticStringAliases: Map<string, string>,
): void {
  const value = getStaticStringValue(expression, staticStringAliases);
  if (value === null) {
    staticStringAliases.delete(name);
    return;
  }
  staticStringAliases.set(name, value);
}

function getConditionalOrLogicalBranchExpressions(node: ts.Node | undefined): ts.Expression[] | null {
  const unwrapped = stripParentheses(node);
  if (!unwrapped) {
    return null;
  }
  if (ts.isConditionalExpression(unwrapped)) {
    return [unwrapped.whenTrue, unwrapped.whenFalse];
  }
  if (ts.isBinaryExpression(unwrapped) && isLogicalExpressionOperator(unwrapped.operatorToken.kind)) {
    return [unwrapped.left, unwrapped.right];
  }
  return null;
}

function isLogicalExpressionOperator(kind: ts.SyntaxKind): boolean {
  return (
    kind === ts.SyntaxKind.BarBarToken ||
    kind === ts.SyntaxKind.AmpersandAmpersandToken ||
    kind === ts.SyntaxKind.QuestionQuestionToken
  );
}

function getForbiddenComputedElementAccessDiagnostic(
  expression: ts.ElementAccessExpression,
  staticStringAliases: Map<string, string>,
  globalObjectAliases: Set<string>,
  reflectObjectAliases: Set<string>,
  reflectGetAliases: Set<string>,
  globalPropertyDescriptorsObjectAliases: Set<string>,
): ForbiddenStoredDiagnostic | null {
  const memberName = getStaticStringValue(expression.argumentExpression, staticStringAliases);
  if (!memberName) {
    if (
      isGlobalObjectExpression(
        expression.expression,
        globalObjectAliases,
        reflectObjectAliases,
        reflectGetAliases,
        staticStringAliases,
      )
    ) {
      return {
        code: 'blocked_global_api',
        message: 'Dynamic global property access is not allowed in light-extension source',
      };
    }
    if (
      isGlobalPropertyDescriptorsObjectExpression(
        expression.expression,
        globalObjectAliases,
        reflectObjectAliases,
        reflectGetAliases,
        globalPropertyDescriptorsObjectAliases,
        staticStringAliases,
      )
    ) {
      return {
        code: 'blocked_global_api',
        message: 'Dynamic global descriptor access is not allowed in light-extension source',
      };
    }
    if (isReflectObjectExpression(expression.expression, reflectObjectAliases, staticStringAliases)) {
      return {
        code: 'blocked_global_api',
        message: 'Dynamic Reflect property access is not allowed in light-extension source',
      };
    }
    return null;
  }

  if (
    isGlobalObjectExpression(
      expression.expression,
      globalObjectAliases,
      reflectObjectAliases,
      reflectGetAliases,
      staticStringAliases,
    )
  ) {
    if (memberName === 'require') {
      return {
        code: 'require_not_allowed',
        message: 'require is not allowed in light-extension source',
      };
    }
    if (blockedGlobalMembers.has(memberName)) {
      return {
        code: 'blocked_global_api',
        message: `${memberName} is not allowed in light-extension source`,
      };
    }
    if (globalAliasMemberNames.has(memberName)) {
      return {
        code: 'blocked_global_api',
        message: 'Global object aliasing is not allowed in light-extension source',
      };
    }
  }

  if (
    privilegedGlobalDescriptorProperties.has(memberName) &&
    isGlobalPropertyDescriptorsObjectExpression(
      expression.expression,
      globalObjectAliases,
      reflectObjectAliases,
      reflectGetAliases,
      globalPropertyDescriptorsObjectAliases,
      staticStringAliases,
    )
  ) {
    return {
      code: memberName === 'require' ? 'require_not_allowed' : 'blocked_global_api',
      message: `${memberName} is not allowed in light-extension source`,
    };
  }

  return null;
}

function getGlobalConstructorAccessName(
  expression: ts.PropertyAccessExpression | ts.ElementAccessExpression,
  globalObjectAliases: Set<string>,
  reflectObjectAliases: Set<string>,
  reflectGetAliases: Set<string>,
  staticStringAliases: Map<string, string>,
): string | null {
  const memberName = getAccessedPropertyName(expression, staticStringAliases);
  if (memberName !== 'Object' && memberName !== 'Reflect') {
    return null;
  }
  return isGlobalObjectExpression(
    expression.expression,
    globalObjectAliases,
    reflectObjectAliases,
    reflectGetAliases,
    staticStringAliases,
  )
    ? memberName
    : null;
}

function getPrivilegedStaticCallHelperName(
  expression: ts.PropertyAccessExpression | ts.ElementAccessExpression,
  reflectObjectAliases: Set<string>,
  staticStringAliases: Map<string, string>,
): string | null {
  const helperName = getAccessedPropertyName(expression, staticStringAliases);
  if (!helperName || !functionHelperMembers.has(helperName)) {
    return null;
  }
  const target = stripParentheses(expression.expression);
  if (!ts.isPropertyAccessExpression(target) && !ts.isElementAccessExpression(target)) {
    return null;
  }
  const objectMethodName = getObjectStaticMethodName(target, staticStringAliases);
  if (objectMethodName && privilegedObjectStaticMethods.has(objectMethodName)) {
    return `Object.${objectMethodName}`;
  }
  const reflectMethodName = getReflectStaticMethodName(target, reflectObjectAliases, staticStringAliases);
  return reflectMethodName && ['get', 'getOwnPropertyDescriptor', 'setPrototypeOf'].includes(reflectMethodName)
    ? `Reflect.${reflectMethodName}`
    : null;
}

function getPrivilegedObjectStaticAccessName(
  expression: ts.PropertyAccessExpression | ts.ElementAccessExpression,
  staticStringAliases: Map<string, string>,
): string | null {
  if (
    ts.isElementAccessExpression(expression) &&
    isObjectConstructorExpression(expression.expression, staticStringAliases) &&
    getStaticStringValue(expression.argumentExpression, staticStringAliases) === null
  ) {
    return 'Object';
  }
  const objectMethodName = getObjectStaticMethodName(expression, staticStringAliases);
  return objectMethodName && privilegedObjectStaticMethods.has(objectMethodName) ? `Object.${objectMethodName}` : null;
}

function getComputedBlockedApiExpressionName(
  expression: ts.Expression,
  staticStringAliases: Map<string, string>,
  globalObjectAliases: Set<string>,
  reflectObjectAliases: Set<string>,
  reflectGetAliases: Set<string>,
  globalPropertyDescriptorAliases: Map<string, string>,
  globalPropertyDescriptorsObjectAliases: Set<string>,
): string | null {
  const unwrapped = stripParentheses(expression);
  if (!ts.isElementAccessExpression(unwrapped)) {
    return null;
  }

  const memberName = getStaticStringValue(unwrapped.argumentExpression, staticStringAliases);
  if (!memberName) {
    return isSuspiciousComputedAccessHost(
      unwrapped.expression,
      globalObjectAliases,
      reflectObjectAliases,
      reflectGetAliases,
      globalPropertyDescriptorsObjectAliases,
      staticStringAliases,
    )
      ? 'Function'
      : null;
  }
  const descriptorValueMemberName =
    memberName === 'value'
      ? getGlobalPropertyDescriptorMemberName(
          unwrapped.expression,
          globalObjectAliases,
          reflectObjectAliases,
          reflectGetAliases,
          globalPropertyDescriptorAliases,
          globalPropertyDescriptorsObjectAliases,
          staticStringAliases,
        )
      : null;
  if (descriptorValueMemberName && isBlockedDescriptorValueMemberName(descriptorValueMemberName)) {
    return descriptorValueMemberName;
  }
  if (memberName === 'constructor') {
    return 'Function';
  }
  if (
    blockedGlobalMembers.has(memberName) &&
    isGlobalObjectOrDescriptorValueExpression(
      unwrapped.expression,
      globalObjectAliases,
      reflectObjectAliases,
      reflectGetAliases,
      globalPropertyDescriptorAliases,
      globalPropertyDescriptorsObjectAliases,
      staticStringAliases,
    )
  ) {
    return memberName;
  }
  return null;
}

function isSuspiciousComputedAccessHost(
  expression: ts.Expression,
  globalObjectAliases: Set<string>,
  reflectObjectAliases: Set<string>,
  reflectGetAliases: Set<string>,
  globalPropertyDescriptorsObjectAliases: Set<string>,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): boolean {
  const unwrapped = stripParentheses(expression);
  return (
    isGlobalObjectExpression(
      unwrapped,
      globalObjectAliases,
      reflectObjectAliases,
      reflectGetAliases,
      staticStringAliases,
    ) ||
    isReflectObjectExpression(unwrapped, reflectObjectAliases, staticStringAliases) ||
    isGlobalPropertyDescriptorsObjectExpression(
      unwrapped,
      globalObjectAliases,
      reflectObjectAliases,
      reflectGetAliases,
      globalPropertyDescriptorsObjectAliases,
      staticStringAliases,
    ) ||
    ts.isPropertyAccessExpression(unwrapped) ||
    ts.isElementAccessExpression(unwrapped) ||
    ts.isCallExpression(unwrapped) ||
    ts.isFunctionExpression(unwrapped) ||
    ts.isArrowFunction(unwrapped)
  );
}

function getBlockedApiExpressionName(
  expression: ts.Expression,
  globalObjectAliases: Set<string>,
  blockedApiAliases: Map<string, string>,
  reflectObjectAliases: Set<string> = defaultReflectObjectAliases,
  reflectGetAliases: Set<string> = emptyAliasNames,
  globalPropertyDescriptorAliases: Map<string, string> = emptyAliasMap,
  globalPropertyDescriptorsObjectAliases: Set<string> = emptyAliasNames,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): string | null {
  const unwrapped = stripParentheses(expression);
  const branchExpressions = getConditionalOrLogicalBranchExpressions(unwrapped);
  if (branchExpressions) {
    for (const branch of branchExpressions) {
      const branchBlockedApiName = getBlockedApiExpressionName(
        branch,
        globalObjectAliases,
        blockedApiAliases,
        reflectObjectAliases,
        reflectGetAliases,
        globalPropertyDescriptorAliases,
        globalPropertyDescriptorsObjectAliases,
        staticStringAliases,
      );
      if (branchBlockedApiName) {
        return branchBlockedApiName;
      }
    }
    return null;
  }
  if (ts.isIdentifier(unwrapped)) {
    if (blockedGlobalMembers.has(unwrapped.text)) {
      return unwrapped.text;
    }
    return blockedApiAliases.get(unwrapped.text) || null;
  }

  if (ts.isPropertyAccessExpression(unwrapped) || ts.isElementAccessExpression(unwrapped)) {
    const memberName = getAccessedPropertyName(unwrapped, staticStringAliases);
    const descriptorValueMemberName = getGlobalPropertyDescriptorValueMemberName(
      unwrapped,
      globalObjectAliases,
      reflectObjectAliases,
      reflectGetAliases,
      globalPropertyDescriptorAliases,
      globalPropertyDescriptorsObjectAliases,
      staticStringAliases,
    );
    if (descriptorValueMemberName && isBlockedDescriptorValueMemberName(descriptorValueMemberName)) {
      return descriptorValueMemberName;
    }
    if (memberName === 'constructor') {
      return 'Function';
    }
    if (
      memberName &&
      blockedGlobalMembers.has(memberName) &&
      isGlobalObjectOrDescriptorValueExpression(
        unwrapped.expression,
        globalObjectAliases,
        reflectObjectAliases,
        reflectGetAliases,
        globalPropertyDescriptorAliases,
        globalPropertyDescriptorsObjectAliases,
        staticStringAliases,
      )
    ) {
      return memberName;
    }
  }

  if (ts.isCallExpression(unwrapped)) {
    const descriptorValueMemberName = getGlobalPropertyDescriptorValueMemberName(
      unwrapped,
      globalObjectAliases,
      reflectObjectAliases,
      reflectGetAliases,
      globalPropertyDescriptorAliases,
      globalPropertyDescriptorsObjectAliases,
      staticStringAliases,
    );
    if (descriptorValueMemberName && isBlockedDescriptorValueMemberName(descriptorValueMemberName)) {
      return descriptorValueMemberName;
    }

    return getReflectBlockedMemberName(
      unwrapped,
      globalObjectAliases,
      reflectObjectAliases,
      reflectGetAliases,
      staticStringAliases,
    );
  }

  return null;
}

function getReflectBlockedMemberName(
  expression: ts.CallExpression,
  globalObjectAliases: Set<string>,
  reflectObjectAliases: Set<string>,
  reflectGetAliases: Set<string>,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): string | null {
  if (!isReflectGetExpression(expression.expression, reflectObjectAliases, reflectGetAliases, staticStringAliases)) {
    return null;
  }
  const [target, member] = expression.arguments;
  const memberName = member ? getStaticStringValue(member, staticStringAliases) : null;
  if (memberName === 'constructor') {
    return 'Function';
  }
  if (memberName === 'get' && isReflectObjectExpression(target, reflectObjectAliases, staticStringAliases)) {
    return 'Reflect.get';
  }
  if (
    !isGlobalObjectExpression(target, globalObjectAliases, reflectObjectAliases, reflectGetAliases, staticStringAliases)
  ) {
    return null;
  }
  if (!memberName) {
    return 'Function';
  }
  if (memberName === 'require') {
    return 'require';
  }
  return memberName && blockedGlobalMembers.has(memberName) ? memberName : null;
}

function isReflectGetHighOrderCall(
  expression: ts.Expression,
  reflectObjectAliases: Set<string>,
  reflectGetAliases: Set<string>,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): boolean {
  const unwrapped = stripParentheses(expression);
  if (!ts.isPropertyAccessExpression(unwrapped) && !ts.isElementAccessExpression(unwrapped)) {
    return false;
  }

  const memberName = getAccessedPropertyName(unwrapped, staticStringAliases);
  return (
    Boolean(memberName && functionHelperMembers.has(memberName)) &&
    isReflectGetExpression(unwrapped.expression, reflectObjectAliases, reflectGetAliases, staticStringAliases)
  );
}

function isReflectGetExpression(
  expression: ts.Expression,
  reflectObjectAliases: Set<string>,
  reflectGetAliases: Set<string>,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): boolean {
  const unwrapped = stripParentheses(expression);
  const branchExpressions = getConditionalOrLogicalBranchExpressions(unwrapped);
  if (branchExpressions) {
    return branchExpressions.some((branch) =>
      isReflectGetExpression(branch, reflectObjectAliases, reflectGetAliases, staticStringAliases),
    );
  }
  if (ts.isIdentifier(unwrapped)) {
    return reflectGetAliases.has(unwrapped.text);
  }
  if (ts.isPropertyAccessExpression(unwrapped)) {
    return (
      unwrapped.name.text === 'get' &&
      isReflectObjectExpression(unwrapped.expression, reflectObjectAliases, staticStringAliases)
    );
  }
  if (ts.isElementAccessExpression(unwrapped)) {
    return (
      getAccessedPropertyName(unwrapped, staticStringAliases) === 'get' &&
      isReflectObjectExpression(unwrapped.expression, reflectObjectAliases, staticStringAliases)
    );
  }
  return false;
}

function isReflectObjectExpression(
  expression: ts.Node | undefined,
  reflectObjectAliases: Set<string>,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): boolean {
  const unwrapped = stripParentheses(expression);
  const branchExpressions = getConditionalOrLogicalBranchExpressions(unwrapped);
  if (branchExpressions) {
    return branchExpressions.some((branch) =>
      isReflectObjectExpression(branch, reflectObjectAliases, staticStringAliases),
    );
  }
  if (unwrapped && ts.isIdentifier(unwrapped)) {
    return reflectObjectAliases.has(unwrapped.text);
  }
  if (ts.isPropertyAccessExpression(unwrapped) || ts.isElementAccessExpression(unwrapped)) {
    return Boolean(
      getAccessedPropertyName(unwrapped, staticStringAliases) === 'Reflect' &&
        isGlobalObjectExpression(
          unwrapped.expression,
          globalObjectNames,
          defaultReflectObjectAliases,
          emptyAliasNames,
          staticStringAliases,
        ),
    );
  }
  return false;
}

function getAccessedPropertyName(
  expression: ts.Expression,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): string | null {
  if (ts.isPropertyAccessExpression(expression)) {
    return expression.name.text;
  }
  if (ts.isElementAccessExpression(expression)) {
    return getStaticStringValue(expression.argumentExpression, staticStringAliases);
  }
  return null;
}

function getStaticStringValue(
  expression: ts.Expression,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): string | null {
  const unwrapped = stripParentheses(expression);
  if (ts.isStringLiteral(unwrapped) || ts.isNoSubstitutionTemplateLiteral(unwrapped)) {
    return unwrapped.text;
  }
  if (ts.isIdentifier(unwrapped)) {
    return staticStringAliases.get(unwrapped.text) || null;
  }
  const branchExpressions = getConditionalOrLogicalBranchExpressions(unwrapped);
  if (branchExpressions) {
    const values = branchExpressions.map((branch) => getStaticStringValue(branch, staticStringAliases));
    const [first] = values;
    if (first && values.every((value) => value === first)) {
      return first;
    }
    return values.find((value): value is string => Boolean(value && isDangerousStaticMemberName(value))) || null;
  }
  if (ts.isBinaryExpression(unwrapped) && unwrapped.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = getStaticStringValue(unwrapped.left, staticStringAliases);
    const right = getStaticStringValue(unwrapped.right, staticStringAliases);
    return left !== null && right !== null ? `${left}${right}` : null;
  }
  if (ts.isTemplateExpression(unwrapped)) {
    let value = unwrapped.head.text;
    for (const span of unwrapped.templateSpans) {
      const expressionValue = getStaticStringValue(span.expression, staticStringAliases);
      if (expressionValue === null) {
        return null;
      }
      value += expressionValue + span.literal.text;
    }
    return value;
  }

  return null;
}

function isDangerousStaticMemberName(value: string): boolean {
  return (
    value === 'constructor' ||
    value === 'value' ||
    value === 'get' ||
    forbiddenGlobalProperties.has(value) ||
    globalAliasMemberNames.has(value)
  );
}

function stripParentheses<T extends ts.Node | undefined>(node: T): T {
  let current = node;
  while (current) {
    if (ts.isParenthesizedExpression(current)) {
      current = current.expression as T;
      continue;
    }
    if (ts.isBinaryExpression(current) && current.operatorToken.kind === ts.SyntaxKind.CommaToken) {
      current = current.right as T;
      continue;
    }
    break;
  }
  return current;
}

function stripExpressionWrappers(expression: ts.Expression): ts.Expression {
  let current = stripParentheses(expression);
  while (ts.isBinaryExpression(current) && current.operatorToken.kind === ts.SyntaxKind.CommaToken) {
    current = stripParentheses(current.right);
  }
  return current;
}

function getBindingElementPropertyName(
  element: ts.BindingElement,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): string | null {
  if (element.propertyName) {
    return getPropertyNameText(element.propertyName, staticStringAliases);
  }
  return ts.isIdentifier(element.name) ? element.name.text : null;
}

function isUnknownComputedBindingElement(
  element: ts.BindingElement,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): boolean {
  return Boolean(
    element.propertyName &&
      ts.isComputedPropertyName(element.propertyName) &&
      getStaticStringValue(element.propertyName.expression, staticStringAliases) === null,
  );
}

function isUnknownComputedObjectAssignmentProperty(
  property: ts.ObjectLiteralElementLike,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): boolean {
  return Boolean(
    ts.isPropertyAssignment(property) &&
      ts.isComputedPropertyName(property.name) &&
      getStaticStringValue(property.name.expression, staticStringAliases) === null,
  );
}

function recordIdentifierAlias(target: ts.BindingName, aliases: Set<string>): void {
  if (ts.isIdentifier(target)) {
    aliases.add(target.text);
  }
}

function recordIdentifierMapAlias(target: ts.BindingName, aliases: Map<string, string>, value: string): void {
  if (ts.isIdentifier(target)) {
    aliases.set(target.text, value);
  }
}

function getPropertyNameText(
  propertyName: ts.PropertyName,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): string | null {
  if (ts.isIdentifier(propertyName) || ts.isStringLiteral(propertyName) || ts.isNumericLiteral(propertyName)) {
    return propertyName.text;
  }
  if (ts.isComputedPropertyName(propertyName)) {
    return getStaticStringValue(propertyName.expression, staticStringAliases);
  }
  return null;
}

function getObjectAssignmentPropertyTarget(
  property: ts.ObjectLiteralElementLike,
  staticStringAliases: Map<string, string> = emptyStaticStringAliases,
): {
  memberName: string | null;
  aliasName: string | null;
  targetExpression: ts.Expression | null;
} {
  if (ts.isShorthandPropertyAssignment(property)) {
    return {
      memberName: property.name.text,
      aliasName: property.name.text,
      targetExpression: property.name,
    };
  }

  if (!ts.isPropertyAssignment(property)) {
    return {
      memberName: null,
      aliasName: null,
      targetExpression: null,
    };
  }

  const aliasTarget = stripParentheses(property.initializer);
  const targetExpression =
    ts.isBinaryExpression(aliasTarget) && isAliasAssignmentOperator(aliasTarget.operatorToken.kind)
      ? stripParentheses(aliasTarget.left)
      : aliasTarget;
  return {
    memberName: getPropertyNameText(property.name, staticStringAliases),
    aliasName: ts.isIdentifier(targetExpression) ? targetExpression.text : null,
    targetExpression,
  };
}

function isDeclarationName(node: ts.Identifier): boolean {
  const parent = node.parent;
  return (
    (ts.isVariableDeclaration(parent) && parent.name === node) ||
    (ts.isParameter(parent) && parent.name === node) ||
    (ts.isFunctionDeclaration(parent) && parent.name === node) ||
    (ts.isClassDeclaration(parent) && parent.name === node) ||
    (ts.isPropertyDeclaration(parent) && parent.name === node) ||
    (ts.isPropertySignature(parent) && parent.name === node)
  );
}

function isAccessPropertyName(node: ts.Identifier): boolean {
  const parent = node.parent;
  return ts.isPropertyAccessExpression(parent) && parent.name === node;
}

function diagnosticAt(
  sourceFile: ts.SourceFile,
  position: number,
  code: string,
  severity: LightExtensionDiagnosticSeverity,
  message: string,
  target: Omit<DiagnosticTarget, 'path'> = {},
): LightExtensionDiagnostic {
  const location = sourceFile.getLineAndCharacterOfPosition(position);
  return diagnostic(code, severity, message, {
    ...target,
    path: sourceFile.fileName,
    line: location.line + 1,
    column: location.character + 1,
  });
}

function diagnostic(
  code: string,
  severity: LightExtensionDiagnosticSeverity,
  message: string,
  extra: Partial<LightExtensionDiagnostic> = {},
): LightExtensionDiagnostic {
  return {
    code,
    severity,
    message,
    ...compactDiagnostic(extra),
  };
}

function compactDiagnostic(input: Partial<LightExtensionDiagnostic>): Partial<LightExtensionDiagnostic> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => typeof value !== 'undefined' && value !== null),
  ) as Partial<LightExtensionDiagnostic>;
}

function stableDetailsKey(details: Record<string, unknown> | undefined): string {
  if (!details) {
    return '';
  }

  return JSON.stringify(toStableJson(details));
}

function toStableJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(toStableJson);
  }
  if (isPlainRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, toStableJson(value[key])]),
    );
  }

  return value;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function optionalStringField(
  record: Record<string, unknown>,
  key: string,
  diagnostics: LightExtensionDiagnostic[],
  target: DiagnosticTarget,
  maxLength: number,
): string | null {
  const value = record[key];
  if (typeof value === 'undefined' || value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    diagnostics.push(diagnostic('meta_field_invalid', 'error', `meta.json field "${key}" must be a string`, target));
    return null;
  }
  if (value.length > maxLength) {
    diagnostics.push(diagnostic('meta_field_too_long', 'error', `meta.json field "${key}" is too long`, target));
    return null;
  }
  return value;
}

function optionalSlugField(
  record: Record<string, unknown>,
  key: string,
  diagnostics: LightExtensionDiagnostic[],
  target: DiagnosticTarget,
): string | null {
  const value = optionalStringField(record, key, diagnostics, target, 80);
  if (value && !isValidEntryName(value)) {
    diagnostics.push(diagnostic('meta_field_invalid', 'error', `meta.json field "${key}" must be a slug`, target));
    return null;
  }
  return value;
}

function optionalStringArrayField(
  record: Record<string, unknown>,
  key: string,
  diagnostics: LightExtensionDiagnostic[],
  target: DiagnosticTarget,
): string[] | null {
  const value = record[key];
  if (typeof value === 'undefined' || value === null) {
    return null;
  }
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    diagnostics.push(
      diagnostic('meta_field_invalid', 'error', `meta.json field "${key}" must be a string array`, target),
    );
    return null;
  }
  if (value.length > 20) {
    diagnostics.push(
      diagnostic('meta_field_too_large', 'error', `meta.json field "${key}" has too many items`, target),
    );
    return null;
  }
  return value;
}

function optionalIntegerField(
  record: Record<string, unknown>,
  key: string,
  diagnostics: LightExtensionDiagnostic[],
  target: DiagnosticTarget,
): number | null {
  const value = record[key];
  if (typeof value === 'undefined' || value === null) {
    return null;
  }
  if (!Number.isInteger(value)) {
    diagnostics.push(diagnostic('meta_field_invalid', 'error', `meta.json field "${key}" must be an integer`, target));
    return null;
  }
  return value;
}

function validateOptionalString(
  record: Record<string, unknown>,
  key: string,
  diagnostics: LightExtensionDiagnostic[],
  target: DiagnosticTarget,
): void {
  if (typeof record[key] !== 'undefined' && typeof record[key] !== 'string') {
    diagnostics.push(
      diagnostic('settings_field_invalid', 'error', `settings.json field "${key}" must be a string`, target),
    );
  }
}

function validateOptionalNumber(
  record: Record<string, unknown>,
  key: string,
  diagnostics: LightExtensionDiagnostic[],
  target: DiagnosticTarget,
): void {
  if (typeof record[key] !== 'undefined' && typeof record[key] !== 'number') {
    diagnostics.push(
      diagnostic('settings_field_invalid', 'error', `settings.json field "${key}" must be a number`, target),
    );
  }
}

function isValidEntryName(value: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,62}$/.test(value);
}

function isValidSettingsPropertyName(value: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_-]{0,63}$/.test(value);
}

function containsTemplateExpression(value: string): boolean {
  return value.includes('{{') || value.includes('}}');
}
