/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  LIGHT_EXTENSION_ENTRY_KEY_PATTERN,
  LIGHT_EXTENSION_ENTRY_SCHEMA_URI,
  LIGHT_EXTENSION_ENTRY_SCHEMA_VERSION,
  LIGHT_EXTENSION_SETTINGS_CONDITION_LIMITS,
  LIGHT_EXTENSION_SETTINGS_CONDITION_LOGICS,
  LIGHT_EXTENSION_SETTINGS_CONDITION_OPERATORS,
  LIGHT_EXTENSION_SETTINGS_SCHEMA_KEYWORDS,
  LIGHT_EXTENSION_SETTINGS_SCHEMA_TYPES,
  LIGHT_EXTENSION_X_COMPONENT_WHITELIST,
  lightExtensionEntryV1SchemaJson,
} from '@nocobase/light-extension-sdk/schema';
import sdkPackageJson from '@nocobase/light-extension-sdk/package.json';
import { createHash } from 'crypto';
import { posix as pathPosix } from 'path';
import {
  LIGHT_EXTENSION_ENTRY_DESCRIPTOR_FILE,
  LIGHT_EXTENSION_ENTRY_DESCRIPTOR_MAX_BYTES,
  LIGHT_EXTENSION_SUPPORTED_KINDS,
  type LightExtensionKind,
} from '../../constants';
import type {
  LightExtensionCapabilities,
  LightExtensionDiagnostic,
  LightExtensionPulledFile,
  LightExtensionValidationLimits,
} from '../../shared/types';
import { diagnostic, stableDetailsKey } from './light-extension-validator/diagnostics';
import { validateCodeFile } from './light-extension-validator/forbiddenRuntimeApi';
import { LightExtensionSchemaValidator } from './light-extension-validator/schemaPolicy';
import type {
  DiagnosticTarget,
  EntryBucket,
  LightExtensionSourceFileInput,
  NormalizedSourceFile,
} from './light-extension-validator/types';
import {
  buildEntryAllowedPaths,
  classifySourcePath,
  collectEntryBuckets,
  findEntryIndexFile,
  isAllowedSharedFilePath,
  isCodeFile,
  normalizeFiles,
  normalizeSourcePath,
  validateDeleteSourcePath,
  validateZipBudget as validateWorkspaceZipBudget,
} from './light-extension-validator/workspacePolicy';

export const LIGHT_EXTENSION_VALIDATOR_VERSION = 'light-extension-validator-v2';
export const LIGHT_EXTENSION_SDK_TEMPLATE_VERSION = 'light-extension-sdk-template-v2';

export const LIGHT_EXTENSION_VALIDATION_LIMITS: LightExtensionValidationLimits = {
  maxRepoFiles: 200,
  maxEntryFiles: 30,
  maxFileBytes: 256 * 1024,
  maxEntryDescriptorBytes: LIGHT_EXTENSION_ENTRY_DESCRIPTOR_MAX_BYTES,
  maxRepoBytes: 2 * 1024 * 1024,
  maxEntries: 50,
  maxSyncBatchFiles: 100,
  maxZipBytes: 5 * 1024 * 1024,
  maxZipCompressionRatio: 20,
  maxJsonBytes: 64 * 1024,
  maxSettingsSchemaDepth: 6,
};

export type { LightExtensionSourceFileInput } from './light-extension-validator/types';

export interface LightExtensionEntryValidationResult {
  target: 'client';
  kind: LightExtensionKind;
  entryName: string;
  entryPath: string;
  descriptorPath: string;
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

export class LightExtensionValidator {
  private readonly capabilities: LightExtensionCapabilities;

  private readonly schemaValidator: LightExtensionSchemaValidator;

  constructor(options: { limits?: Partial<LightExtensionValidationLimits> } = {}) {
    const limits = {
      ...LIGHT_EXTENSION_VALIDATION_LIMITS,
      ...(options.limits || {}),
    };
    this.capabilities = buildCapabilities(limits);
    this.schemaValidator = new LightExtensionSchemaValidator(this.capabilities);
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
      entryDescriptor: { ...this.capabilities.entryDescriptor },
      xComponentWhitelist: [...this.capabilities.xComponentWhitelist],
      conditions: {
        operators: [...this.capabilities.conditions.operators],
        logic: [...this.capabilities.conditions.logic],
        limits: { ...this.capabilities.conditions.limits },
      },
      sdk: { ...this.capabilities.sdk },
      limits: { ...this.capabilities.limits },
      writePolicy: { ...this.capabilities.writePolicy },
      supportedKinds: [...this.capabilities.supportedKinds],
    };
  }

  validateWorkspace(input: { files: LightExtensionSourceFileInput[] }): LightExtensionWorkspaceValidationResult {
    const diagnostics: LightExtensionDiagnostic[] = [];
    const normalizedFiles = normalizeFiles(input.files, diagnostics, this.capabilities.limits);
    const entryBuckets = collectEntryBuckets(normalizedFiles, diagnostics, this.capabilities.limits);
    const entries = entryBuckets.map((bucket) => this.validateEntry(bucket));
    diagnostics.push(...validateUniqueEntryKeys(entries));
    diagnostics.push(...this.validateSharedFiles(normalizedFiles));
    attachDiagnosticsToEntries(diagnostics, entries);
    removeBlockedGlobalDiagnosticsFromEntries(entries);
    const allDiagnostics = sortDiagnostics(
      removeBlockedGlobalDiagnostics(
        uniqueDiagnostics([...diagnostics, ...entries.flatMap((entry) => entry.diagnostics)]),
      ),
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
        pathKind.status === 'enabled'
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
    const normalizedFiles = normalizeFiles(
      input.files.filter((file) => file.operation !== 'delete'),
      diagnostics,
      this.capabilities.limits,
    );
    for (const file of normalizedFiles) {
      const pathKind = classifySourcePath(file.path);
      if (pathKind.status !== 'enabled') {
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
        diagnostics.push(...validateCodeFile(file, target));
      } else if (pathPosix.basename(file.path) === LIGHT_EXTENSION_ENTRY_DESCRIPTOR_FILE) {
        this.schemaValidator.validateEntryDescriptor(file, diagnostics, target);
      }
    }

    return sortDiagnostics(removeBlockedGlobalDiagnostics(uniqueDiagnostics(diagnostics)));
  }

  validateInitialFiles(input: { files: LightExtensionSourceFileInput[] }): LightExtensionDiagnostic[] {
    const writeDiagnostics = this.validateSyncBatch(input);
    const workspaceValidation = this.validateWorkspace(input);
    return sortDiagnostics(uniqueDiagnostics([...writeDiagnostics, ...workspaceValidation.diagnostics]));
  }
  validateZipBudget(input: { compressedBytes: number; uncompressedBytes: number }): LightExtensionDiagnostic[] {
    return validateWorkspaceZipBudget(input, this.capabilities.limits);
  }

  private validateEntry(bucket: EntryBucket): LightExtensionEntryValidationResult {
    const folderTarget = {
      kind: bucket.kind,
      entryName: bucket.entryName,
    };
    const diagnostics: LightExtensionDiagnostic[] = [];
    const descriptorPath = `${bucket.rootPath}/${LIGHT_EXTENSION_ENTRY_DESCRIPTOR_FILE}`;
    const indexFile = findEntryIndexFile(bucket);
    const descriptorFile = bucket.files.find((file) => file.path === descriptorPath);
    const descriptorDiagnostics: LightExtensionDiagnostic[] = [];
    const descriptor = this.schemaValidator.validateEntryDescriptor(
      descriptorFile,
      descriptorDiagnostics,
      folderTarget,
    );
    const entryName = descriptor?.key || bucket.entryName;
    const target = {
      kind: bucket.kind,
      entryName,
    };
    diagnostics.push(
      ...descriptorDiagnostics.map((item) => ({
        ...item,
        entryName,
      })),
    );
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

    for (const file of codeFiles) {
      diagnostics.push(...validateCodeFile(file, target, 'entry', bucket.rootPath));
    }

    return {
      target: 'client',
      kind: bucket.kind,
      entryName,
      entryPath: indexFile?.path || bucket.rootPath,
      descriptorPath,
      title: descriptor?.title || entryName,
      description: descriptor?.description || null,
      category: descriptor?.category || null,
      icon: descriptor?.icon || null,
      tags: descriptor?.tags || null,
      sort: descriptor?.sort ?? null,
      settingsSchema: descriptor?.settingsSchema || null,
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

    return validateCodeFile(file, {}, 'shared');
  }
}

export function buildCapabilities(limits: LightExtensionValidationLimits): LightExtensionCapabilities {
  return {
    entryDescriptor: {
      schemaVersion: LIGHT_EXTENSION_ENTRY_SCHEMA_VERSION,
      keyPattern: LIGHT_EXTENSION_ENTRY_KEY_PATTERN,
    },
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
      ],
      entries: buildEntryAllowedPaths(),
    },
    schemaSubset: {
      allowedTypes: [...LIGHT_EXTENSION_SETTINGS_SCHEMA_TYPES],
      allowedKeywords: [...LIGHT_EXTENSION_SETTINGS_SCHEMA_KEYWORDS],
      maxDepth: limits.maxSettingsSchemaDepth,
    },
    xComponentWhitelist: [...LIGHT_EXTENSION_X_COMPONENT_WHITELIST],
    conditions: {
      operators: [...LIGHT_EXTENSION_SETTINGS_CONDITION_OPERATORS],
      logic: [...LIGHT_EXTENSION_SETTINGS_CONDITION_LOGICS],
      limits: { ...LIGHT_EXTENSION_SETTINGS_CONDITION_LIMITS },
    },
    sdk: {
      packageName: sdkPackageJson.name,
      version: sdkPackageJson.version,
      entrySchemaUri: LIGHT_EXTENSION_ENTRY_SCHEMA_URI,
      entrySchemaSha256: createHash('sha256').update(lightExtensionEntryV1SchemaJson).digest('hex'),
    },
    limits,
    writePolicy: {
      validateFinalWorkspaceOnPush: true,
      allowDeleteExistingInvalidPaths: true,
    },
    supportedKinds: [...LIGHT_EXTENSION_SUPPORTED_KINDS],
    validatorVersion: LIGHT_EXTENSION_VALIDATOR_VERSION,
    sdkTemplateVersion: LIGHT_EXTENSION_SDK_TEMPLATE_VERSION,
  };
}

export function hasErrorDiagnostic(diagnostics: LightExtensionDiagnostic[]): boolean {
  return diagnostics.some((item) => item.severity === 'error');
}

export function getWorkspaceLevelDiagnostics(diagnostics: LightExtensionDiagnostic[]): LightExtensionDiagnostic[] {
  return diagnostics.filter((item) => !item.kind || !item.entryName);
}

function validateUniqueEntryKeys(entries: LightExtensionEntryValidationResult[]): LightExtensionDiagnostic[] {
  const entryGroups = new Map<string, LightExtensionEntryValidationResult[]>();
  for (const entry of entries) {
    const key = `${entry.target}:${entry.kind}:${entry.entryName}`;
    const group = entryGroups.get(key) || [];
    group.push(entry);
    entryGroups.set(key, group);
  }

  return [...entryGroups.values()]
    .filter((group) => group.length > 1)
    .flatMap((group) =>
      group.map((entry) =>
        diagnostic('duplicate_entry_key', 'error', `Entry key "${entry.entryName}" must be unique for ${entry.kind}`, {
          path: entry.descriptorPath,
          kind: entry.kind,
          entryName: entry.entryName,
        }),
      ),
    );
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

function removeBlockedGlobalDiagnostics(diagnostics: LightExtensionDiagnostic[]): LightExtensionDiagnostic[] {
  return diagnostics.filter((item) => item.code !== 'blocked_global_api');
}

function removeBlockedGlobalDiagnosticsFromEntries(entries: LightExtensionEntryValidationResult[]): void {
  for (const entry of entries) {
    entry.diagnostics = removeBlockedGlobalDiagnostics(entry.diagnostics);
  }
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
