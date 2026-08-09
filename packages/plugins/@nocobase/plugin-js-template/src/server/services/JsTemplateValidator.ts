/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  JS_TEMPLATE_KEY_PATTERN,
  JS_TEMPLATE_SCHEMA_URI,
  JS_TEMPLATE_SCHEMA_VERSION,
  JS_TEMPLATE_SETTINGS_CONDITION_LIMITS,
  JS_TEMPLATE_SETTINGS_CONDITION_LOGICS,
  JS_TEMPLATE_SETTINGS_CONDITION_OPERATORS,
  JS_TEMPLATE_SETTINGS_SCHEMA_KEYWORDS,
  JS_TEMPLATE_SETTINGS_SCHEMA_TYPES,
  JS_TEMPLATE_X_COMPONENT_WHITELIST,
} from '@nocobase/js-template-sdk/schema';
import sdkPackageJson from '@nocobase/js-template-sdk/package.json';
import {
  createRunJSWorkspaceDiagnostic,
  getRunJSWorkspaceDiagnosticDetailsKey as stableDetailsKey,
  RunJSWorkspaceSchemaValidator,
  type RunJSWorkspaceDiagnostic,
} from '@nocobase/runjs-workspace/server';
import { posix as pathPosix } from 'path';
import {
  JS_TEMPLATE_DESCRIPTOR_FILE,
  JS_TEMPLATE_DESCRIPTOR_MAX_BYTES,
  JS_TEMPLATE_SUPPORTED_KINDS,
  type JsTemplateKind,
} from '../../constants';
import type {
  JsTemplateCapabilities,
  JsTemplateDiagnostic,
  JsTemplatePulledFile,
  JsTemplateValidationLimits,
} from '../../shared/types';
import { validateCodeFile } from './js-template-validator/forbiddenRuntimeApi';
import type {
  DiagnosticTarget,
  JsTemplateSourceFileInput,
  NormalizedSourceFile,
  ParsedTemplateDescriptor,
  TemplateBucket,
} from './js-template-validator/types';
import { jsTemplateV1SchemaSha256 } from '../jsTemplateSchema';
import {
  buildTemplateAllowedPaths,
  buildProjectAllowedPaths,
  classifySourcePath,
  collectTemplateBuckets,
  findTemplateIndexFile,
  isAllowedSharedFilePath,
  isCodeFile,
  isRemovedGenericRunJSSourcePath,
  normalizeFiles,
  normalizeSourcePath,
  validateDeleteSourcePath,
  validateZipBudget as validateWorkspaceZipBudget,
} from './js-template-validator/workspacePolicy';

export const JS_TEMPLATE_VALIDATOR_VERSION = 'js-template-validator-v4';
export const JS_TEMPLATE_SDK_TEMPLATE_VERSION = 'js-template-sdk-template-v3';

export const JS_TEMPLATE_VALIDATION_LIMITS: JsTemplateValidationLimits = {
  maxProjectFiles: 200,
  maxTemplateFiles: 30,
  maxFileBytes: 256 * 1024,
  maxTemplateDescriptorBytes: JS_TEMPLATE_DESCRIPTOR_MAX_BYTES,
  maxProjectBytes: 2 * 1024 * 1024,
  maxTemplates: 50,
  maxSyncBatchFiles: 100,
  maxZipBytes: 5 * 1024 * 1024,
  maxZipCompressionRatio: 20,
  maxJsonBytes: 64 * 1024,
  maxSettingsSchemaDepth: 6,
};

export type { JsTemplateSourceFileInput } from './js-template-validator/types';

export interface JsTemplateValidationResult {
  target: 'client';
  kind: JsTemplateKind;
  templateName: string;
  entryPath: string;
  descriptorPath: string;
  title: string | null;
  description: string | null;
  category: string | null;
  icon: string | null;
  tags: string[] | null;
  sort: number | null;
  settingsSchema: Record<string, unknown> | null;
  diagnostics: JsTemplateDiagnostic[];
}

export interface JsTemplateWorkspaceValidationResult {
  accepted: boolean;
  diagnostics: JsTemplateDiagnostic[];
  templates: JsTemplateValidationResult[];
  capabilities: JsTemplateCapabilities;
}

export class JsTemplateValidator {
  private readonly capabilities: JsTemplateCapabilities;

  private readonly schemaValidator: RunJSWorkspaceSchemaValidator;

  constructor(options: { limits?: Partial<JsTemplateValidationLimits> } = {}) {
    const limits = {
      ...JS_TEMPLATE_VALIDATION_LIMITS,
      ...(options.limits || {}),
    };
    this.capabilities = buildJsTemplateCapabilities(limits);
    this.schemaValidator = new RunJSWorkspaceSchemaValidator({
      schemaSubset: this.capabilities.schemaSubset,
      xComponentWhitelist: this.capabilities.xComponentWhitelist,
      conditions: this.capabilities.conditions,
      limits: {
        maxEntryDescriptorBytes: this.capabilities.limits.maxTemplateDescriptorBytes,
        maxJsonBytes: this.capabilities.limits.maxJsonBytes,
        maxSettingsSchemaDepth: this.capabilities.limits.maxSettingsSchemaDepth,
      },
    });
  }

  getCapabilities(): JsTemplateCapabilities {
    return {
      ...this.capabilities,
      allowedPaths: {
        project: [...this.capabilities.allowedPaths.project],
        templates: Object.fromEntries(
          Object.entries(this.capabilities.allowedPaths.templates).map(([kind, paths]) => [kind, [...paths]]),
        ),
      },
      schemaSubset: {
        allowedTypes: [...this.capabilities.schemaSubset.allowedTypes],
        allowedKeywords: [...this.capabilities.schemaSubset.allowedKeywords],
        maxDepth: this.capabilities.schemaSubset.maxDepth,
      },
      templateDescriptor: { ...this.capabilities.templateDescriptor },
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

  validateWorkspace(input: { files: JsTemplateSourceFileInput[] }): JsTemplateWorkspaceValidationResult {
    const diagnostics: JsTemplateDiagnostic[] = [];
    const normalizedFiles = normalizeFiles(input.files, diagnostics, this.capabilities.limits);
    const templateBuckets = collectTemplateBuckets(normalizedFiles, diagnostics, this.capabilities.limits);
    const templates = templateBuckets.map((bucket) => this.validateTemplate(bucket));
    diagnostics.push(...validateUniqueTemplateKeys(templates));
    diagnostics.push(...this.validateSharedFiles(normalizedFiles));
    attachDiagnosticsToTemplates(diagnostics, templates);
    removeBlockedGlobalDiagnosticsFromTemplates(templates);
    const allDiagnostics = sortDiagnostics(
      removeBlockedGlobalDiagnostics(
        uniqueDiagnostics([...diagnostics, ...templates.flatMap((template) => template.diagnostics)]),
      ),
    );

    return {
      accepted: !hasErrorDiagnostic(allDiagnostics),
      diagnostics: allDiagnostics,
      templates,
      capabilities: this.getCapabilities(),
    };
  }

  validateSyncBatch(input: {
    files: JsTemplateSourceFileInput[];
    existingPaths?: Iterable<string>;
    /** Keeps legacy generic RunJS files inert during remote import; direct authoring remains rejected. */
    allowRemovedGenericRunJSSource?: boolean;
  }): JsTemplateDiagnostic[] {
    const diagnostics: JsTemplateDiagnostic[] = [];
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
      const path = normalizeSourcePath(file.path);
      if (isRemovedGenericRunJSSourcePath(path) && !input.allowRemovedGenericRunJSSource) {
        diagnostics.push(
          diagnostic(
            'workspace_path_not_allowed',
            'error',
            'Source file path is outside the allowed js-template roots',
            { path },
          ),
        );
        continue;
      }
      if (file.operation === 'delete') {
        diagnostics.push(...validateDeleteSourcePath(file.path, existingPathSet));
        continue;
      }
      if (typeof file.content === 'string') {
        continue;
      }

      const pathKind = classifySourcePath(path);
      const pathTarget =
        pathKind.status === 'enabled'
          ? {
              kind: pathKind.kind,
              templateName: pathKind.templateName,
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
        templateName: pathKind.templateName,
      };
      if (isCodeFile(file.path)) {
        diagnostics.push(...validateCodeFile(file, target));
      } else if (pathPosix.basename(file.path) === JS_TEMPLATE_DESCRIPTOR_FILE) {
        const validation = this.validateTemplateDescriptor(file, target);
        diagnostics.push(...validation.diagnostics);
      }
    }

    return sortDiagnostics(removeBlockedGlobalDiagnostics(uniqueDiagnostics(diagnostics)));
  }

  validateInitialFiles(input: {
    files: JsTemplateSourceFileInput[];
    /** Keeps legacy generic RunJS files inert during remote import; direct authoring remains rejected. */
    allowRemovedGenericRunJSSource?: boolean;
  }): JsTemplateDiagnostic[] {
    const writeDiagnostics = this.validateSyncBatch(input);
    const workspaceValidation = this.validateWorkspace(input);
    return sortDiagnostics(uniqueDiagnostics([...writeDiagnostics, ...workspaceValidation.diagnostics]));
  }
  validateZipBudget(input: { compressedBytes: number; uncompressedBytes: number }): JsTemplateDiagnostic[] {
    return validateWorkspaceZipBudget(input, this.capabilities.limits);
  }

  private validateTemplate(bucket: TemplateBucket): JsTemplateValidationResult {
    const folderTarget = {
      kind: bucket.kind,
      templateName: bucket.templateName,
    };
    const diagnostics: JsTemplateDiagnostic[] = [];
    const descriptorPath = `${bucket.rootPath}/${JS_TEMPLATE_DESCRIPTOR_FILE}`;
    const indexFile = findTemplateIndexFile(bucket);
    const descriptorFile = bucket.files.find((file) => file.path === descriptorPath);
    const descriptorValidation = this.validateTemplateDescriptor(descriptorFile, folderTarget);
    const descriptor = descriptorValidation.descriptor;
    const templateName = descriptor?.key || bucket.templateName;
    const target = {
      kind: bucket.kind,
      templateName,
    };
    diagnostics.push(
      ...descriptorValidation.diagnostics.map((item) => ({
        ...item,
        templateName,
      })),
    );
    const codeFiles = bucket.files.filter((file) => isCodeFile(file.path));

    if (bucket.files.length > this.capabilities.limits.maxTemplateFiles) {
      diagnostics.push(
        diagnostic('template_file_count_exceeded', 'error', 'JS Template contains too many files', {
          ...target,
          details: {
            fileCount: bucket.files.length,
            maxFiles: this.capabilities.limits.maxTemplateFiles,
          },
        }),
      );
    }

    if (!indexFile) {
      diagnostics.push(
        diagnostic(
          'template_index_missing',
          'error',
          'JS Template must include index.tsx, index.ts, index.jsx, or index.js',
          {
            ...target,
            path: bucket.rootPath,
          },
        ),
      );
    }

    for (const file of codeFiles) {
      diagnostics.push(...validateCodeFile(file, target, 'template', bucket.rootPath));
    }

    return {
      target: 'client',
      kind: bucket.kind,
      templateName,
      entryPath: indexFile?.path || bucket.rootPath,
      descriptorPath,
      title: descriptor?.title || templateName,
      description: descriptor?.description || null,
      category: descriptor?.category || null,
      icon: descriptor?.icon || null,
      tags: descriptor?.tags || null,
      sort: descriptor?.sort ?? null,
      settingsSchema: descriptor?.settingsSchema || null,
      diagnostics,
    };
  }

  private validateSharedFiles(files: NormalizedSourceFile[]): JsTemplateDiagnostic[] {
    return files
      .filter((file) => classifySourcePath(file.path).status === 'shared')
      .flatMap((file) => this.validateSharedFile(file));
  }

  private validateSharedFile(file: NormalizedSourceFile): JsTemplateDiagnostic[] {
    if (!isCodeFile(file.path)) {
      return [];
    }

    return validateCodeFile(file, {}, 'shared');
  }

  private validateTemplateDescriptor(
    file: NormalizedSourceFile | undefined,
    target: Omit<DiagnosticTarget, 'path'>,
  ): { descriptor: ParsedTemplateDescriptor | null; diagnostics: JsTemplateDiagnostic[] } {
    const diagnostics: RunJSWorkspaceDiagnostic[] = [];
    let descriptor = this.schemaValidator.validateEntryDescriptor(file, diagnostics, {
      kind: target.kind,
      entryName: target.templateName,
    });
    if (file && descriptor) {
      let parsedDescriptor: unknown;
      try {
        parsedDescriptor = JSON.parse(file.content);
      } catch {
        parsedDescriptor = null;
      }
      if (
        parsedDescriptor &&
        typeof parsedDescriptor === 'object' &&
        !Array.isArray(parsedDescriptor) &&
        Object.prototype.hasOwnProperty.call(parsedDescriptor, 'settingsSchema')
      ) {
        diagnostics.push(
          createRunJSWorkspaceDiagnostic(
            'entry_descriptor_unknown_field',
            'error',
            'entry.json field "settingsSchema" is not supported',
            {
              kind: target.kind,
              entryName: target.templateName,
              path: file.path,
            },
          ),
        );
        descriptor = { ...descriptor, settingsSchema: null };
      }
    }

    return {
      descriptor,
      diagnostics: diagnostics.map(toJsTemplateDiagnostic),
    };
  }
}

export function buildJsTemplateCapabilities(limits: JsTemplateValidationLimits): JsTemplateCapabilities {
  return {
    templateDescriptor: {
      schemaVersion: JS_TEMPLATE_SCHEMA_VERSION,
      keyPattern: JS_TEMPLATE_KEY_PATTERN,
    },
    allowedPaths: {
      project: ['README.md', 'js-template.json', 'tsconfig.json', 'src/shared/**', ...buildProjectAllowedPaths()],
      templates: buildTemplateAllowedPaths(),
    },
    schemaSubset: {
      allowedTypes: [...JS_TEMPLATE_SETTINGS_SCHEMA_TYPES],
      allowedKeywords: [...JS_TEMPLATE_SETTINGS_SCHEMA_KEYWORDS],
      maxDepth: limits.maxSettingsSchemaDepth,
    },
    xComponentWhitelist: [...JS_TEMPLATE_X_COMPONENT_WHITELIST],
    conditions: {
      operators: [...JS_TEMPLATE_SETTINGS_CONDITION_OPERATORS],
      logic: [...JS_TEMPLATE_SETTINGS_CONDITION_LOGICS],
      limits: { ...JS_TEMPLATE_SETTINGS_CONDITION_LIMITS },
    },
    sdk: {
      packageName: sdkPackageJson.name,
      version: sdkPackageJson.version,
      templateSchemaUri: JS_TEMPLATE_SCHEMA_URI,
      templateSchemaSha256: jsTemplateV1SchemaSha256,
    },
    limits,
    writePolicy: {
      validateFinalWorkspaceOnPush: true,
      allowDeleteExistingInvalidPaths: true,
    },
    supportedKinds: [...JS_TEMPLATE_SUPPORTED_KINDS],
    validatorVersion: JS_TEMPLATE_VALIDATOR_VERSION,
    sdkTemplateVersion: JS_TEMPLATE_SDK_TEMPLATE_VERSION,
  };
}

export function hasErrorDiagnostic(diagnostics: JsTemplateDiagnostic[]): boolean {
  return diagnostics.some((item) => item.severity === 'error');
}

export function getWorkspaceLevelDiagnostics(diagnostics: JsTemplateDiagnostic[]): JsTemplateDiagnostic[] {
  return diagnostics.filter((item) => !item.kind || !item.templateName);
}

function validateUniqueTemplateKeys(templates: JsTemplateValidationResult[]): JsTemplateDiagnostic[] {
  const templateGroups = new Map<string, JsTemplateValidationResult[]>();
  for (const template of templates) {
    const key = `${template.target}:${template.kind}:${template.templateName}`;
    const group = templateGroups.get(key) || [];
    group.push(template);
    templateGroups.set(key, group);
  }

  return [...templateGroups.values()]
    .filter((group) => group.length > 1)
    .flatMap((group) =>
      group.map((template) =>
        diagnostic(
          'duplicate_template_key',
          'error',
          `JS Template key "${template.templateName}" must be unique for ${template.kind}`,
          {
            path: template.descriptorPath,
            kind: template.kind,
            templateName: template.templateName,
          },
        ),
      ),
    );
}

function attachDiagnosticsToTemplates(
  diagnostics: JsTemplateDiagnostic[],
  templates: JsTemplateValidationResult[],
): void {
  for (const template of templates) {
    const templateDiagnostics = diagnostics.filter(
      (item) => item.kind === template.kind && item.templateName === template.templateName,
    );
    template.diagnostics = sortDiagnostics(uniqueDiagnostics([...template.diagnostics, ...templateDiagnostics]));
  }
}

export function sortDiagnostics(diagnostics: JsTemplateDiagnostic[]): JsTemplateDiagnostic[] {
  return [...diagnostics].sort((left, right) => diagnosticSortKey(left).localeCompare(diagnosticSortKey(right)));
}

function uniqueDiagnostics(diagnostics: JsTemplateDiagnostic[]): JsTemplateDiagnostic[] {
  const seen = new Set<string>();
  const result: JsTemplateDiagnostic[] = [];

  for (const item of diagnostics) {
    const key = [
      item.code,
      item.severity,
      item.path || '',
      item.line || '',
      item.column || '',
      item.kind || '',
      item.templateName || '',
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

function removeBlockedGlobalDiagnostics(diagnostics: JsTemplateDiagnostic[]): JsTemplateDiagnostic[] {
  return diagnostics.filter((item) => item.code !== 'blocked_global_api');
}

function removeBlockedGlobalDiagnosticsFromTemplates(templates: JsTemplateValidationResult[]): void {
  for (const template of templates) {
    template.diagnostics = removeBlockedGlobalDiagnostics(template.diagnostics);
  }
}

function diagnosticSortKey(item: JsTemplateDiagnostic): string {
  return [
    item.path || '',
    item.kind || '',
    item.templateName || '',
    item.severity || '',
    item.code || '',
    String(item.line || 0).padStart(8, '0'),
    String(item.column || 0).padStart(8, '0'),
    item.message || '',
    stableDetailsKey(item.details),
  ].join('\u0000');
}

export function toValidatorFiles(files: JsTemplatePulledFile[]): JsTemplateSourceFileInput[] {
  return files.map((file) => ({
    path: file.path,
    content: file.content,
    size: file.size,
    language: file.language,
  }));
}

function diagnostic(
  code: string,
  severity: JsTemplateDiagnostic['severity'],
  message: string,
  extra: Partial<JsTemplateDiagnostic> = {},
): JsTemplateDiagnostic {
  const { templateName, ...runJSExtra } = extra;
  return toJsTemplateDiagnostic(
    createRunJSWorkspaceDiagnostic(code, severity, message, {
      ...runJSExtra,
      entryName: templateName,
    }),
  );
}

function toJsTemplateDiagnostic(input: RunJSWorkspaceDiagnostic): JsTemplateDiagnostic {
  const { entryName, ...diagnostic } = input;
  return {
    ...diagnostic,
    ...(entryName ? { templateName: entryName } : {}),
  };
}
