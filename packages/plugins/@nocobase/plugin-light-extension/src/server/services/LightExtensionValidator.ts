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
} from '@nocobase/light-extension-sdk/schema';
import sdkPackageJson from '@nocobase/light-extension-sdk/package.json';
import { posix as pathPosix } from 'path';
import {
  LIGHT_EXTENSION_ENTRY_DESCRIPTOR_FILE,
  LIGHT_EXTENSION_ENTRY_DESCRIPTOR_MAX_BYTES,
  LIGHT_EXTENSION_SUPPORTED_KINDS,
  type LightExtensionKind,
} from '../../constants';
import type {
  LightExtensionCapabilities,
  LightExtensionProblem,
  LightExtensionPulledFile,
  LightExtensionValidationLimits,
} from '../../shared/types';
import {
  createLightExtensionProblemFactory,
  sortLightExtensionProblems,
  uniqueLightExtensionProblems,
} from '../../shared/problems';
import { problem, stableProblemDetailsKey } from './light-extension-validator/problems';
import { validateCodeFile } from './light-extension-validator/forbiddenRuntimeApi';
import { LightExtensionSchemaValidator } from './light-extension-validator/schemaPolicy';
import type {
  EntryBucket,
  LightExtensionSourceFileInput,
  LightExtensionValidatorProblem,
  NormalizedSourceFile,
} from './light-extension-validator/types';
import { lightExtensionEntryV1SchemaSha256 } from '../lightExtensionEntrySchema';
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

export const LIGHT_EXTENSION_VALIDATOR_VERSION = 'light-extension-validator-v4';
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
  problems: LightExtensionProblem[];
}

export interface LightExtensionWorkspaceValidationResult {
  snapshotId: string;
  requestId: string;
  accepted: boolean;
  problems: LightExtensionProblem[];
  entries: LightExtensionEntryValidationResult[];
  capabilities: LightExtensionCapabilities;
}

export interface LightExtensionValidationContext {
  snapshotId: string;
  requestId: string;
}

interface LightExtensionEntryValidationDraftResult extends Omit<LightExtensionEntryValidationResult, 'problems'> {
  problems: LightExtensionValidatorProblem[];
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

  validateWorkspace(
    input: { files: LightExtensionSourceFileInput[] } & LightExtensionValidationContext,
  ): LightExtensionWorkspaceValidationResult {
    const problems: LightExtensionValidatorProblem[] = [];
    const normalizedFiles = normalizeFiles(input.files, problems, this.capabilities.limits);
    const entryBuckets = collectEntryBuckets(normalizedFiles, problems, this.capabilities.limits);
    const entryDrafts = entryBuckets.map((bucket) => this.validateEntry(bucket));
    problems.push(...validateUniqueEntryKeys(entryDrafts));
    problems.push(...this.validateSharedFiles(normalizedFiles));
    attachProblemsToEntries(problems, entryDrafts);
    removeBlockedGlobalProblemsFromEntries(entryDrafts);
    const allProblemDrafts = sortValidatorProblems(
      removeBlockedGlobalProblems(
        uniqueValidatorProblems([...problems, ...entryDrafts.flatMap((entry) => entry.problems)]),
      ),
    );
    const allProblems = finalizeValidatorProblems(allProblemDrafts, input);
    const entries = entryDrafts.map((entry) => ({
      ...entry,
      problems: finalizeValidatorProblems(entry.problems, input),
    }));

    return {
      snapshotId: input.snapshotId,
      requestId: input.requestId,
      accepted: !hasErrorProblem(allProblems),
      problems: allProblems,
      entries,
      capabilities: this.getCapabilities(),
    };
  }

  validateSyncBatch(
    input: {
      files: LightExtensionSourceFileInput[];
      existingPaths?: Iterable<string>;
    } & LightExtensionValidationContext,
  ): LightExtensionProblem[] {
    const problems: LightExtensionValidatorProblem[] = [];
    const existingPathSet = input.existingPaths
      ? new Set([...input.existingPaths].map(normalizeSourcePath))
      : undefined;
    if (input.files.length > this.capabilities.limits.maxSyncBatchFiles) {
      problems.push(
        problem('sync_batch_too_large', 'error', 'Sync batch contains too many files', {
          details: {
            fileCount: input.files.length,
            maxFiles: this.capabilities.limits.maxSyncBatchFiles,
          },
        }),
      );
    }
    for (const file of input.files) {
      if (file.operation === 'delete') {
        problems.push(...validateDeleteSourcePath(file.path, existingPathSet));
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
      problems.push(
        problem('source_content_required', 'error', 'Source file content is required for validation', {
          path,
          ...pathTarget,
        }),
      );
    }
    const normalizedFiles = normalizeFiles(
      input.files.filter((file) => file.operation !== 'delete'),
      problems,
      this.capabilities.limits,
    );
    for (const file of normalizedFiles) {
      const pathKind = classifySourcePath(file.path);
      if (pathKind.status !== 'enabled') {
        if (pathKind.status === 'shared') {
          problems.push(...this.validateSharedFile(file));
        }
        continue;
      }

      const target = {
        kind: pathKind.kind,
        entryName: pathKind.entryName,
      };
      if (isCodeFile(file.path)) {
        problems.push(...validateCodeFile(file, target));
      } else if (pathPosix.basename(file.path) === LIGHT_EXTENSION_ENTRY_DESCRIPTOR_FILE) {
        this.schemaValidator.validateEntryDescriptor(file, problems, target);
      }
    }

    return finalizeValidatorProblems(
      sortValidatorProblems(removeBlockedGlobalProblems(uniqueValidatorProblems(problems))),
      input,
    );
  }

  validateInitialFiles(
    input: { files: LightExtensionSourceFileInput[] } & LightExtensionValidationContext,
  ): LightExtensionProblem[] {
    const writeProblems = this.validateSyncBatch(input);
    const workspaceValidation = this.validateWorkspace(input);
    return uniqueLightExtensionProblems([...writeProblems, ...workspaceValidation.problems]);
  }

  validateZipBudget(
    input: { compressedBytes: number; uncompressedBytes: number } & LightExtensionValidationContext,
  ): LightExtensionProblem[] {
    return finalizeValidatorProblems(validateWorkspaceZipBudget(input, this.capabilities.limits), input);
  }

  private validateEntry(bucket: EntryBucket): LightExtensionEntryValidationDraftResult {
    const folderTarget = {
      kind: bucket.kind,
      entryName: bucket.entryName,
    };
    const problems: LightExtensionValidatorProblem[] = [];
    const descriptorPath = `${bucket.rootPath}/${LIGHT_EXTENSION_ENTRY_DESCRIPTOR_FILE}`;
    const indexFile = findEntryIndexFile(bucket);
    const descriptorFile = bucket.files.find((file) => file.path === descriptorPath);
    const descriptorProblems: LightExtensionValidatorProblem[] = [];
    const descriptor = this.schemaValidator.validateEntryDescriptor(descriptorFile, descriptorProblems, folderTarget);
    const entryName = descriptor?.key || bucket.entryName;
    const target = {
      kind: bucket.kind,
      entryName,
    };
    problems.push(
      ...descriptorProblems.map((item) => ({
        ...item,
        entryName,
      })),
    );
    const codeFiles = bucket.files.filter((file) => isCodeFile(file.path));

    if (bucket.files.length > this.capabilities.limits.maxEntryFiles) {
      problems.push(
        problem('entry_file_count_exceeded', 'error', 'Entry contains too many files', {
          ...target,
          details: {
            fileCount: bucket.files.length,
            maxFiles: this.capabilities.limits.maxEntryFiles,
          },
        }),
      );
    }

    if (!indexFile) {
      problems.push(
        problem('entry_index_missing', 'error', 'Entry must include index.tsx, index.ts, index.jsx, or index.js', {
          ...target,
          path: bucket.rootPath,
        }),
      );
    }

    for (const file of codeFiles) {
      problems.push(...validateCodeFile(file, target, 'entry', bucket.rootPath));
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
      problems,
    };
  }

  private validateSharedFiles(files: NormalizedSourceFile[]): LightExtensionValidatorProblem[] {
    return files
      .filter((file) => classifySourcePath(file.path).status === 'shared')
      .flatMap((file) => this.validateSharedFile(file));
  }

  private validateSharedFile(file: NormalizedSourceFile): LightExtensionValidatorProblem[] {
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
        'src/client/js-pages/**',
        'src/client/js-fields/**',
        'src/client/js-actions/**',
        'src/client/js-items/**',
        'src/client/runjs/**',
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
      entrySchemaSha256: lightExtensionEntryV1SchemaSha256,
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

export function hasErrorProblem(problems: readonly LightExtensionProblem[]): boolean {
  return problems.some((item) => item.severity === 'error');
}

export function getWorkspaceLevelProblems(problems: readonly LightExtensionProblem[]): LightExtensionProblem[] {
  return problems.filter((item) => !item.kind || !item.entryName);
}

function validateUniqueEntryKeys(
  entries: LightExtensionEntryValidationDraftResult[],
): LightExtensionValidatorProblem[] {
  const entryGroups = new Map<string, LightExtensionEntryValidationDraftResult[]>();
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
        problem('duplicate_entry_key', 'error', `Entry key "${entry.entryName}" must be unique for ${entry.kind}`, {
          path: entry.descriptorPath,
          kind: entry.kind,
          entryName: entry.entryName,
        }),
      ),
    );
}

function attachProblemsToEntries(
  problems: LightExtensionValidatorProblem[],
  entries: LightExtensionEntryValidationDraftResult[],
): void {
  for (const entry of entries) {
    const entryProblems = problems.filter((item) => item.kind === entry.kind && item.entryName === entry.entryName);
    entry.problems = sortValidatorProblems(uniqueValidatorProblems([...entry.problems, ...entryProblems]));
  }
}

function uniqueValidatorProblems(problems: LightExtensionValidatorProblem[]): LightExtensionValidatorProblem[] {
  const seen = new Set<string>();
  const result: LightExtensionValidatorProblem[] = [];

  for (const item of problems) {
    const key = [
      item.code,
      item.severity,
      item.path || '',
      item.range?.start.line || '',
      item.range?.start.column || '',
      item.kind || '',
      item.entryName || '',
      item.message,
      stableProblemDetailsKey(item.details),
    ].join('\u0000');
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(item);
  }

  return result;
}

function removeBlockedGlobalProblems(problems: LightExtensionValidatorProblem[]): LightExtensionValidatorProblem[] {
  return problems.filter((item) => item.code !== 'blocked_global_api');
}

function removeBlockedGlobalProblemsFromEntries(entries: LightExtensionEntryValidationDraftResult[]): void {
  for (const entry of entries) {
    entry.problems = removeBlockedGlobalProblems(entry.problems);
  }
}

function sortValidatorProblems(problems: LightExtensionValidatorProblem[]): LightExtensionValidatorProblem[] {
  return [...problems].sort((left, right) => problemSortKey(left).localeCompare(problemSortKey(right)));
}

function problemSortKey(item: LightExtensionValidatorProblem): string {
  return [
    item.path || '',
    item.kind || '',
    item.entryName || '',
    item.severity || '',
    item.code || '',
    String(item.range?.start.line || 0).padStart(8, '0'),
    String(item.range?.start.column || 0).padStart(8, '0'),
    item.message || '',
    stableProblemDetailsKey(item.details),
  ].join('\u0000');
}

function finalizeValidatorProblems(
  problems: LightExtensionValidatorProblem[],
  context: LightExtensionValidationContext,
): LightExtensionProblem[] {
  const createProblem = createLightExtensionProblemFactory({
    snapshotId: context.snapshotId,
    requestId: context.requestId,
    source: 'validator',
  });
  return sortLightExtensionProblems(problems.map((item) => createProblem(item)));
}

export function toValidatorFiles(files: LightExtensionPulledFile[]): LightExtensionSourceFileInput[] {
  return files.map((file) => ({
    path: file.path,
    content: file.content,
    size: file.size,
    language: file.language,
  }));
}
