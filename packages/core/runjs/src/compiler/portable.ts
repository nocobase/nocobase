/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const RUNJS_PORTABLE_COMPILER_CONTRACT_VERSION = 1;

export const RUNJS_IMPORTABLE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json']);

export const RUNJS_RESOLVABLE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json'] as const;

export const RUNJS_BUILTIN_MODULES: Readonly<Record<string, string>> = Object.freeze({
  react: 'React',
  'react-dom/client': 'ReactDOM',
  antd: 'antd',
  '@ant-design/icons': 'antdIcons',
  dayjs: 'dayjs',
  lodash: 'lodash',
  mathjs: 'math',
  '@formulajs/formulajs': 'formula',
  '@nocobase/sdk/client': 'clientSdk',
});

export type RunJSPortableDiagnosticSeverity = 'error' | 'warning' | 'info';

export interface RunJSPortableCompileDiagnostic {
  code: string;
  severity: RunJSPortableDiagnosticSeverity;
  message: string;
  path?: string;
  line?: number;
  column?: number;
  details?: Record<string, unknown>;
}

export interface RunJSPortableCompileFile {
  path: string;
  content: string;
  language?: string;
}

export interface RunJSPortableCompileInput {
  files: RunJSPortableCompileFile[];
  entryPath: string;
  runtimeVersion: string;
  surfaceStyle: 'render' | 'action' | 'value';
}

export interface RunJSPortableCompileOutput {
  code: string;
  sourceMap?: string;
  diagnostics: RunJSPortableCompileDiagnostic[];
  entryPath: string;
  runtimeVersion: string;
  metadata?: Record<string, unknown>;
}

export type RunJSWorkspaceImportResolution =
  | { status: 'resolved'; path: string }
  | { status: 'blocked'; message: string }
  | { status: 'notFound' };

const windowsDrivePrefix = /^[A-Za-z]:\//u;

export function normalizeRunJSVirtualPath(value: string): string {
  const normalized = String(value || '')
    .replace(/\\/gu, '/')
    .replace(/^\/+|\/+$/gu, '')
    .replace(/\/+/gu, '/');
  const segments: string[] = [];
  for (const segment of normalized.split('/')) {
    if (!segment || segment === '.') {
      continue;
    }
    if (segment === '..') {
      if (segments.length === 0) {
        return `../${normalized}`;
      }
      segments.pop();
      continue;
    }
    segments.push(segment);
  }
  return segments.join('/');
}

export function runJSVirtualDirname(path: string): string {
  const normalized = normalizeRunJSVirtualPath(path);
  const separatorIndex = normalized.lastIndexOf('/');
  return separatorIndex < 0 ? '.' : normalized.slice(0, separatorIndex) || '.';
}

export function runJSVirtualExtname(path: string): string {
  const normalized = normalizeRunJSVirtualPath(path);
  const baseName = normalized.slice(normalized.lastIndexOf('/') + 1);
  const extensionIndex = baseName.lastIndexOf('.');
  return extensionIndex <= 0 ? '' : baseName.slice(extensionIndex);
}

export function runJSVirtualJoin(...paths: string[]): string {
  const segments: string[] = [];
  let escaped = 0;
  for (const rawPath of paths) {
    const normalized = String(rawPath || '').replace(/\\/gu, '/');
    for (const segment of normalized.split('/')) {
      if (!segment || segment === '.') {
        continue;
      }
      if (segment === '..') {
        if (segments.length > 0) {
          segments.pop();
        } else {
          escaped += 1;
        }
        continue;
      }
      segments.push(segment);
    }
  }
  return `${'../'.repeat(escaped)}${segments.join('/')}`.replace(/\/$/u, '');
}

export function resolveRunJSBuiltInModule(specifier: string): string | undefined {
  return Object.prototype.hasOwnProperty.call(RUNJS_BUILTIN_MODULES, specifier)
    ? RUNJS_BUILTIN_MODULES[specifier]
    : undefined;
}

export function isRunJSImportablePath(path: string): boolean {
  return RUNJS_IMPORTABLE_EXTENSIONS.has(runJSVirtualExtname(path));
}

export function resolveRunJSWorkspaceImport(
  fromPath: string,
  specifier: string,
  availablePaths: Pick<ReadonlySet<string>, 'has'>,
): RunJSWorkspaceImportResolution {
  const directory = runJSVirtualDirname(fromPath);
  const joinedPath = runJSVirtualJoin(directory === '.' ? '' : directory, specifier);
  if (
    specifier.startsWith('/') ||
    windowsDrivePrefix.test(specifier) ||
    joinedPath === '..' ||
    joinedPath.startsWith('../')
  ) {
    return {
      status: 'blocked',
      message: `Import "${specifier}" escapes the RunJS workspace`,
    };
  }

  if (availablePaths.has(joinedPath)) {
    return isRunJSImportablePath(joinedPath)
      ? { status: 'resolved', path: joinedPath }
      : {
          status: 'blocked',
          message: `Import "${specifier}" targets unsupported file "${joinedPath}"`,
        };
  }
  if (runJSVirtualExtname(joinedPath)) {
    return { status: 'notFound' };
  }

  for (const extension of RUNJS_RESOLVABLE_EXTENSIONS) {
    const candidate = `${joinedPath}${extension}`;
    if (availablePaths.has(candidate)) {
      return { status: 'resolved', path: candidate };
    }
  }
  for (const extension of RUNJS_RESOLVABLE_EXTENSIONS) {
    const candidate = runJSVirtualJoin(joinedPath, `index${extension}`);
    if (availablePaths.has(candidate)) {
      return { status: 'resolved', path: candidate };
    }
  }

  return { status: 'notFound' };
}
