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
  LIGHT_EXTENSION_ENTRY_DESCRIPTOR_FILE,
  LIGHT_EXTENSION_ENTRY_KEY_PATTERN,
  LIGHT_EXTENSION_SUPPORTED_KINDS,
  type LightExtensionKind,
} from '../../../constants';
import type { LightExtensionValidationLimits } from '../../../shared/types';
import { problem } from './problems';
import type {
  EntryBucket,
  LightExtensionSourceFileInput,
  LightExtensionValidatorProblem,
  NormalizedSourceFile,
} from './types';

export interface EntryFileRule {
  root: string;
  indexFiles: string[];
  metadataFiles: string[];
  allowedExtensions: string[];
}

const entryFileRules: Record<LightExtensionKind, EntryFileRule> = {
  'js-block': {
    root: 'src/client/js-blocks',
    indexFiles: ['index.tsx', 'index.ts', 'index.jsx', 'index.js'],
    metadataFiles: [LIGHT_EXTENSION_ENTRY_DESCRIPTOR_FILE],
    allowedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'],
  },
  'js-page': {
    root: 'src/client/js-pages',
    indexFiles: ['index.tsx', 'index.ts', 'index.jsx', 'index.js'],
    metadataFiles: [LIGHT_EXTENSION_ENTRY_DESCRIPTOR_FILE],
    allowedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'],
  },
  'js-field': {
    root: 'src/client/js-fields',
    indexFiles: ['index.tsx', 'index.ts', 'index.jsx', 'index.js'],
    metadataFiles: [LIGHT_EXTENSION_ENTRY_DESCRIPTOR_FILE],
    allowedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'],
  },
  'js-action': {
    root: 'src/client/js-actions',
    indexFiles: ['index.tsx', 'index.ts', 'index.jsx', 'index.js'],
    metadataFiles: [LIGHT_EXTENSION_ENTRY_DESCRIPTOR_FILE],
    allowedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'],
  },
  'js-item': {
    root: 'src/client/js-items',
    indexFiles: ['index.tsx', 'index.ts', 'index.jsx', 'index.js'],
    metadataFiles: [LIGHT_EXTENSION_ENTRY_DESCRIPTOR_FILE],
    allowedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'],
  },
  runjs: {
    root: 'src/client/runjs',
    indexFiles: ['index.tsx', 'index.ts', 'index.jsx', 'index.js'],
    metadataFiles: [LIGHT_EXTENSION_ENTRY_DESCRIPTOR_FILE],
    allowedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'],
  },
};

const allowedRepoRootFiles = new Set(['README.md', 'light-extension.json', 'tsconfig.json']);

export const sharedSourceRoot = 'src/shared';

const sharedAllowedExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md']);

export type SourcePathKind =
  | {
      status: 'enabled';
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

export function validateSourcePath(path: string): LightExtensionValidatorProblem[] {
  const problems: LightExtensionValidatorProblem[] = [];

  if (!path || typeof path !== 'string') {
    return [problem('path_required', 'error', 'Source file path is required')];
  }

  const rawPath = path.trim();

  if (rawPath.includes('\\')) {
    problems.push(problem('path_backslash_not_allowed', 'error', 'Source file path must use "/" separators', { path }));
  }

  if (rawPath.startsWith('/')) {
    problems.push(
      problem('path_absolute_not_allowed', 'error', 'Source file path must be repository relative', { path }),
    );
  }

  const rawSegments = rawPath.split('/');
  if (rawSegments.includes('..')) {
    problems.push(
      problem('path_traversal_not_allowed', 'error', 'Source file path cannot traverse directories', { path }),
    );
  }

  if (rawSegments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    problems.push(problem('path_segment_invalid', 'error', 'Source file path contains an invalid segment', { path }));
  }

  const normalizedPath = normalizeSourcePath(rawPath);
  if (!normalizedPath || normalizedPath === '.') {
    problems.push(problem('path_required', 'error', 'Source file path is required', { path }));
  }

  if (normalizedPath.startsWith('../') || normalizedPath.includes('/../')) {
    problems.push(
      problem('path_traversal_not_allowed', 'error', 'Source file path cannot traverse directories', { path }),
    );
  }

  if (normalizedPath.split('/').some((segment) => segment === '' || segment === '.')) {
    problems.push(problem('path_segment_invalid', 'error', 'Source file path contains an invalid segment', { path }));
  }

  if (normalizedPath.length > 240) {
    problems.push(problem('path_too_long', 'error', 'Source file path is too long', { path }));
  }

  return problems;
}

export function validateDeleteSourcePath(
  path: string,
  existingPaths?: ReadonlySet<string>,
): LightExtensionValidatorProblem[] {
  const problems = validateSourcePath(path);
  if (problems.some((item) => item.severity === 'error')) {
    return problems;
  }

  const normalizedPath = normalizeSourcePath(path);
  if (existingPaths?.has(normalizedPath)) {
    return problems;
  }

  const pathKind = classifySourcePath(normalizedPath);
  const pathTarget =
    pathKind.status === 'enabled'
      ? {
          kind: pathKind.kind,
          entryName: pathKind.entryName,
        }
      : {};

  if (pathKind.status === 'unsupported') {
    problems.push(
      problem('workspace_path_not_allowed', 'error', 'Source file path is outside the allowed light-extension roots', {
        path: normalizedPath,
      }),
    );
  } else if (pathKind.status === 'missingEntryName') {
    problems.push(
      problem('entry_name_required', 'error', 'Entry name segment is required', {
        path: normalizedPath,
        kind: pathKind.kind,
      }),
    );
  } else if (pathKind.status === 'enabled' && !isValidEntryName(pathKind.entryName)) {
    problems.push(
      problem('invalid_entry_name', 'error', 'Entry name must be a lowercase slug', {
        path: normalizedPath,
        ...pathTarget,
      }),
    );
  } else if (pathKind.status === 'enabled' && !isAllowedEntryFilePath(normalizedPath)) {
    problems.push(
      problem('path_extension_not_allowed', 'error', 'Source file path is not allowed for light-extension entries', {
        path: normalizedPath,
        ...pathTarget,
      }),
    );
  }

  return problems;
}

export function normalizeSourcePath(path: string): string {
  return pathPosix.normalize(path.trim()).replace(/^\.\/+/, '');
}

export function classifySourcePath(path: string): SourcePathKind {
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
      return { status: 'enabled', kind, entryName };
    }
  }

  return { status: 'unsupported' };
}

export function getEntryRootPath(kind: LightExtensionKind, entryName: string): string {
  return `${entryFileRules[kind].root}/${entryName}`;
}

export function findEntryIndexFile(bucket: EntryBucket): NormalizedSourceFile | undefined {
  const candidates = entryFileRules[bucket.kind].indexFiles.map((fileName) => `${bucket.rootPath}/${fileName}`);
  return candidates.map((candidate) => bucket.files.find((file) => file.path === candidate)).find(Boolean);
}

export function isCodeFile(path: string): boolean {
  return ['.ts', '.tsx', '.js', '.jsx'].includes(pathPosix.extname(path));
}

export function isAllowedEntryFilePath(path: string): boolean {
  const pathKind = classifySourcePath(path);
  if (pathKind.status !== 'enabled') {
    return false;
  }
  const rule = entryFileRules[pathKind.kind];
  const fileName = pathPosix.basename(path);
  if (isForbiddenEntryRootFile(path, pathKind.kind, pathKind.entryName)) {
    return false;
  }
  if (rule.metadataFiles.includes(fileName)) {
    return true;
  }

  return rule.allowedExtensions.includes(pathPosix.extname(path));
}

function isForbiddenEntryRootFile(path: string, kind: LightExtensionKind, entryName: string): boolean {
  const rootPath = getEntryRootPath(kind, entryName);
  return path === `${rootPath}/meta.json` || path === `${rootPath}/settings.json`;
}

export function isAllowedSharedFilePath(path: string): boolean {
  return path.startsWith(`${sharedSourceRoot}/`) && sharedAllowedExtensions.has(pathPosix.extname(path));
}

export function buildEntryAllowedPaths(): Record<string, string[]> {
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

export function isValidEntryName(value: string): boolean {
  return LIGHT_EXTENSION_ENTRY_KEY_PATTERN.test(value);
}

export function validateZipBudget(
  input: { compressedBytes: number; uncompressedBytes: number },
  limits: LightExtensionValidationLimits,
): LightExtensionValidatorProblem[] {
  const problems: LightExtensionValidatorProblem[] = [];

  if (input.compressedBytes > limits.maxZipBytes) {
    problems.push(
      problem('zip_too_large', 'error', 'ZIP archive is too large', {
        details: {
          compressedBytes: input.compressedBytes,
          maxZipBytes: limits.maxZipBytes,
        },
      }),
    );
  }

  const ratio = input.compressedBytes > 0 ? input.uncompressedBytes / input.compressedBytes : Infinity;
  if (ratio > limits.maxZipCompressionRatio) {
    problems.push(
      problem('zip_compression_ratio_too_high', 'error', 'ZIP archive compression ratio is too high', {
        details: {
          compressedBytes: input.compressedBytes,
          uncompressedBytes: input.uncompressedBytes,
          ratio,
          maxRatio: limits.maxZipCompressionRatio,
        },
      }),
    );
  }

  return problems;
}

export function normalizeFiles(
  files: LightExtensionSourceFileInput[],
  problems: LightExtensionValidatorProblem[],
  limits: LightExtensionValidationLimits,
): NormalizedSourceFile[] {
  const normalizedFiles: NormalizedSourceFile[] = [];
  let totalBytes = 0;

  if (files.length > limits.maxRepoFiles) {
    problems.push(
      problem('repo_file_count_exceeded', 'error', 'Repository contains too many source files', {
        details: {
          fileCount: files.length,
          maxFiles: limits.maxRepoFiles,
        },
      }),
    );
  }

  for (const file of files) {
    const pathDiagnostics = validateSourcePath(file.path);
    problems.push(...pathDiagnostics);
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
            entryName: pathKind.entryName,
          }
        : {};
    if (size > limits.maxFileBytes) {
      problems.push(
        problem('file_size_limit_exceeded', 'error', 'Source file is too large', {
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
      problems.push(
        problem(
          'workspace_path_not_allowed',
          'error',
          'Source file path is outside the allowed light-extension roots',
          {
            path,
          },
        ),
      );
    } else if (pathKind.status === 'shared' && !isAllowedSharedFilePath(path)) {
      problems.push(
        problem('path_extension_not_allowed', 'error', 'Source file path is not allowed for shared helpers', {
          path,
        }),
      );
    } else if (pathKind.status === 'missingEntryName') {
      problems.push(
        problem('entry_name_required', 'error', 'Entry name segment is required', {
          path,
          kind: pathKind.kind,
        }),
      );
    }
    if (pathKind.status === 'enabled' && !isAllowedEntryFilePath(path)) {
      problems.push(
        problem(
          isForbiddenEntryRootFile(path, pathKind.kind, pathKind.entryName)
            ? 'workspace_path_not_allowed'
            : 'path_extension_not_allowed',
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

  if (totalBytes > limits.maxRepoBytes) {
    problems.push(
      problem('repo_budget_limit_exceeded', 'error', 'Repository source budget is exceeded', {
        details: {
          totalBytes,
          maxRepoBytes: limits.maxRepoBytes,
        },
      }),
    );
  }

  return normalizedFiles;
}

export function collectEntryBuckets(
  files: NormalizedSourceFile[],
  problems: LightExtensionValidatorProblem[],
  limits: LightExtensionValidationLimits,
): EntryBucket[] {
  const buckets = new Map<string, EntryBucket>();

  for (const file of files) {
    const pathKind = classifySourcePath(file.path);
    if (pathKind.status !== 'enabled') {
      continue;
    }

    if (!isValidEntryName(pathKind.entryName)) {
      problems.push(
        problem('invalid_entry_name', 'error', 'Entry name must be a lowercase slug', {
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

  if (buckets.size > limits.maxEntries) {
    problems.push(
      problem('entry_count_limit_exceeded', 'error', 'Repository contains too many entries', {
        details: {
          entryCount: buckets.size,
          maxEntries: limits.maxEntries,
        },
      }),
    );
  }

  return [...buckets.values()].sort((left, right) =>
    `${left.kind}:${left.entryName}`.localeCompare(`${right.kind}:${right.entryName}`),
  );
}
