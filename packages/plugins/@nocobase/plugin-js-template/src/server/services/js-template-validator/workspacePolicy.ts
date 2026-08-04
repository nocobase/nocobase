/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { posix as pathPosix } from 'path';

import {
  JS_TEMPLATE_DESCRIPTOR_FILE,
  JS_TEMPLATE_KEY_PATTERN,
  JS_TEMPLATE_SUPPORTED_KINDS,
  type JsTemplateKind,
} from '../../../constants';
import type { JsTemplateDiagnostic, JsTemplateValidationLimits } from '../../../shared/types';
import { createRunJSWorkspaceDiagnostic, type RunJSWorkspaceDiagnostic } from '@nocobase/runjs-workspace/server';
import type { TemplateBucket, JsTemplateSourceFileInput, NormalizedSourceFile } from './types';

export interface TemplateFileRule {
  root: string;
  indexFiles: string[];
  metadataFiles: string[];
  allowedExtensions: string[];
}

const templateFileRules: Record<JsTemplateKind, TemplateFileRule> = {
  'js-block': {
    root: 'src/client/js-blocks',
    indexFiles: ['index.tsx', 'index.ts', 'index.jsx', 'index.js'],
    metadataFiles: [JS_TEMPLATE_DESCRIPTOR_FILE],
    allowedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'],
  },
  'js-page': {
    root: 'src/client/js-pages',
    indexFiles: ['index.tsx', 'index.ts', 'index.jsx', 'index.js'],
    metadataFiles: [JS_TEMPLATE_DESCRIPTOR_FILE],
    allowedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'],
  },
  'js-field': {
    root: 'src/client/js-fields',
    indexFiles: ['index.tsx', 'index.ts', 'index.jsx', 'index.js'],
    metadataFiles: [JS_TEMPLATE_DESCRIPTOR_FILE],
    allowedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'],
  },
  'js-action': {
    root: 'src/client/js-actions',
    indexFiles: ['index.tsx', 'index.ts', 'index.jsx', 'index.js'],
    metadataFiles: [JS_TEMPLATE_DESCRIPTOR_FILE],
    allowedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'],
  },
  'js-item': {
    root: 'src/client/js-items',
    indexFiles: ['index.tsx', 'index.ts', 'index.jsx', 'index.js'],
    metadataFiles: [JS_TEMPLATE_DESCRIPTOR_FILE],
    allowedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'],
  },
};

const allowedRepoRootFiles = new Set(['README.md', 'js-template.json', 'tsconfig.json']);
const removedGenericRunJSRoot = 'src/client/runjs';

export const sharedSourceRoot = 'src/shared';

const sharedAllowedExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md']);

export type SourcePathKind =
  | {
      status: 'enabled';
      kind: JsTemplateKind;
      templateName: string;
    }
  | {
      status: 'missingTemplateName';
      kind: JsTemplateKind;
    }
  | {
      status: 'shared';
    }
  | {
      status: 'unsupported' | 'ignored';
    };

export function validateSourcePath(path: string): JsTemplateDiagnostic[] {
  const diagnostics: JsTemplateDiagnostic[] = [];

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

export function validateDeleteSourcePath(path: string, existingPaths?: ReadonlySet<string>): JsTemplateDiagnostic[] {
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
    pathKind.status === 'enabled'
      ? {
          kind: pathKind.kind,
          templateName: pathKind.templateName,
        }
      : {};

  if (pathKind.status === 'unsupported') {
    diagnostics.push(
      diagnostic('workspace_path_not_allowed', 'error', 'Source file path is outside the allowed js-template roots', {
        path: normalizedPath,
      }),
    );
  } else if (pathKind.status === 'missingTemplateName') {
    diagnostics.push(
      diagnostic('template_name_required', 'error', 'JS Template name segment is required', {
        path: normalizedPath,
        kind: pathKind.kind,
      }),
    );
  } else if (pathKind.status === 'enabled' && !isValidTemplateName(pathKind.templateName)) {
    diagnostics.push(
      diagnostic('invalid_template_name', 'error', 'JS Template name must be a lowercase slug', {
        path: normalizedPath,
        ...pathTarget,
      }),
    );
  } else if (pathKind.status === 'enabled' && !isAllowedTemplateFilePath(normalizedPath)) {
    diagnostics.push(
      diagnostic('path_extension_not_allowed', 'error', 'Source file path is not allowed for JS Templates', {
        path: normalizedPath,
        ...pathTarget,
      }),
    );
  }

  return diagnostics;
}

export function normalizeSourcePath(path: string): string {
  return pathPosix.normalize(path.trim()).replace(/^\.\/+/, '');
}

export function classifySourcePath(path: string): SourcePathKind {
  if (allowedRepoRootFiles.has(path)) {
    return { status: 'ignored' };
  }
  if (isRemovedGenericRunJSSourcePath(path)) {
    return { status: 'ignored' };
  }
  if (path.startsWith(`${sharedSourceRoot}/`)) {
    return { status: 'shared' };
  }

  for (const kind of JS_TEMPLATE_SUPPORTED_KINDS) {
    const rule = templateFileRules[kind];
    const prefix = `${rule.root}/`;
    if (path === rule.root || path === `${rule.root}/`) {
      return { status: 'missingTemplateName', kind };
    }
    if (path.startsWith(prefix)) {
      const templateName = path.slice(prefix.length).split('/')[0] || '';
      if (!templateName) {
        return { status: 'missingTemplateName', kind };
      }
      return { status: 'enabled', kind, templateName };
    }
  }

  return { status: 'unsupported' };
}

export function isRemovedGenericRunJSSourcePath(path: string): boolean {
  return path === removedGenericRunJSRoot || path.startsWith(`${removedGenericRunJSRoot}/`);
}

export function getTemplateRootPath(kind: JsTemplateKind, templateName: string): string {
  return `${templateFileRules[kind].root}/${templateName}`;
}

export function findTemplateIndexFile(bucket: TemplateBucket): NormalizedSourceFile | undefined {
  const candidates = templateFileRules[bucket.kind].indexFiles.map((fileName) => `${bucket.rootPath}/${fileName}`);
  return candidates.map((candidate) => bucket.files.find((file) => file.path === candidate)).find(Boolean);
}

export function isCodeFile(path: string): boolean {
  return ['.ts', '.tsx', '.js', '.jsx'].includes(pathPosix.extname(path));
}

export function isAllowedTemplateFilePath(path: string): boolean {
  const pathKind = classifySourcePath(path);
  if (pathKind.status !== 'enabled') {
    return false;
  }
  const rule = templateFileRules[pathKind.kind];
  const fileName = pathPosix.basename(path);
  if (isForbiddenTemplateRootFile(path, pathKind.kind, pathKind.templateName)) {
    return false;
  }
  if (rule.metadataFiles.includes(fileName)) {
    return true;
  }

  return rule.allowedExtensions.includes(pathPosix.extname(path));
}

function isForbiddenTemplateRootFile(path: string, kind: JsTemplateKind, templateName: string): boolean {
  const rootPath = getTemplateRootPath(kind, templateName);
  return path === `${rootPath}/meta.json` || path === `${rootPath}/settings.json`;
}

export function isAllowedSharedFilePath(path: string): boolean {
  return path.startsWith(`${sharedSourceRoot}/`) && sharedAllowedExtensions.has(pathPosix.extname(path));
}

export function buildTemplateAllowedPaths(): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(templateFileRules).map(([kind, rule]) => [
      kind,
      [
        ...rule.indexFiles.map((fileName) => `${rule.root}/<templateName>/${fileName}`),
        ...rule.metadataFiles.map((fileName) => `${rule.root}/<templateName>/${fileName}`),
        `${rule.root}/<templateName>/**/*.{${rule.allowedExtensions.map((extension) => extension.slice(1)).join(',')}}`,
      ],
    ]),
  );
}

export function buildProjectAllowedPaths(): string[] {
  return JS_TEMPLATE_SUPPORTED_KINDS.map((kind) => `${templateFileRules[kind].root}/**`);
}

export function isValidTemplateName(value: string): boolean {
  return JS_TEMPLATE_KEY_PATTERN.test(value);
}

export function validateZipBudget(
  input: { compressedBytes: number; uncompressedBytes: number },
  limits: JsTemplateValidationLimits,
): JsTemplateDiagnostic[] {
  const diagnostics: JsTemplateDiagnostic[] = [];

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

export function normalizeFiles(
  files: JsTemplateSourceFileInput[],
  diagnostics: JsTemplateDiagnostic[],
  limits: JsTemplateValidationLimits,
): NormalizedSourceFile[] {
  const normalizedFiles: NormalizedSourceFile[] = [];
  let totalBytes = 0;

  if (files.length > limits.maxProjectFiles) {
    diagnostics.push(
      diagnostic('project_file_count_exceeded', 'error', 'JS Template project contains too many source files', {
        details: {
          fileCount: files.length,
          maxFiles: limits.maxProjectFiles,
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
      pathKind.status === 'enabled'
        ? {
            kind: pathKind.kind,
            templateName: pathKind.templateName,
          }
        : {};
    if (size > limits.maxFileBytes) {
      diagnostics.push(
        diagnostic('file_size_limit_exceeded', 'error', 'Source file is too large', {
          path,
          ...pathTarget,
          details: {
            size,
            maxFileBytes: limits.maxFileBytes,
          },
        }),
      );
    }
    if (pathKind.status === 'unsupported') {
      diagnostics.push(
        diagnostic('workspace_path_not_allowed', 'error', 'Source file path is outside the allowed js-template roots', {
          path,
        }),
      );
    } else if (pathKind.status === 'shared' && !isAllowedSharedFilePath(path)) {
      diagnostics.push(
        diagnostic('path_extension_not_allowed', 'error', 'Source file path is not allowed for shared helpers', {
          path,
        }),
      );
    } else if (pathKind.status === 'missingTemplateName') {
      diagnostics.push(
        diagnostic('template_name_required', 'error', 'JS Template name segment is required', {
          path,
          kind: pathKind.kind,
        }),
      );
    }
    if (pathKind.status === 'enabled' && !isAllowedTemplateFilePath(path)) {
      diagnostics.push(
        diagnostic(
          isForbiddenTemplateRootFile(path, pathKind.kind, pathKind.templateName)
            ? 'workspace_path_not_allowed'
            : 'path_extension_not_allowed',
          'error',
          'Source file path is not allowed for JS Templates',
          {
            path,
            kind: pathKind.kind,
            templateName: pathKind.templateName,
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

  if (totalBytes > limits.maxProjectBytes) {
    diagnostics.push(
      diagnostic('project_budget_limit_exceeded', 'error', 'JS Template project source budget is exceeded', {
        details: {
          totalBytes,
          maxProjectBytes: limits.maxProjectBytes,
        },
      }),
    );
  }

  return normalizedFiles;
}

export function collectTemplateBuckets(
  files: NormalizedSourceFile[],
  diagnostics: JsTemplateDiagnostic[],
  limits: JsTemplateValidationLimits,
): TemplateBucket[] {
  const buckets = new Map<string, TemplateBucket>();

  for (const file of files) {
    const pathKind = classifySourcePath(file.path);
    if (pathKind.status !== 'enabled') {
      continue;
    }

    if (!isValidTemplateName(pathKind.templateName)) {
      diagnostics.push(
        diagnostic('invalid_template_name', 'error', 'JS Template name must be a lowercase slug', {
          path: file.path,
          kind: pathKind.kind,
          templateName: pathKind.templateName,
        }),
      );
      continue;
    }

    const key = `${pathKind.kind}:${pathKind.templateName}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.files.push(file);
      continue;
    }

    buckets.set(key, {
      kind: pathKind.kind,
      templateName: pathKind.templateName,
      rootPath: getTemplateRootPath(pathKind.kind, pathKind.templateName),
      files: [file],
    });
  }

  if (buckets.size > limits.maxTemplates) {
    diagnostics.push(
      diagnostic('template_count_limit_exceeded', 'error', 'JS Template project contains too many templates', {
        details: {
          templateCount: buckets.size,
          maxTemplates: limits.maxTemplates,
        },
      }),
    );
  }

  return [...buckets.values()].sort((left, right) =>
    `${left.kind}:${left.templateName}`.localeCompare(`${right.kind}:${right.templateName}`),
  );
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
  const { entryName, ...runJSDiagnostic } = input;
  return {
    ...runJSDiagnostic,
    ...(entryName ? { templateName: entryName } : {}),
  };
}
