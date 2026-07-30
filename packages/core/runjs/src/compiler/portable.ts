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
});

const runJSRuntimeLauncherPattern =
  /^\/\/ runjs-launcher:__runjs_launcher__\.js\nvar __runjs_entry__ = \([A-Za-z_$][\w$]*\(\), __toCommonJS\([A-Za-z_$][\w$]*\)\);\nreturn __runjs_entry__\.default\(\);\n\/\/# sourceURL=nocobase-runjs:\/\/bundle\/[a-f0-9]{16}\.js$/u;

export function buildRunJSRuntimeRequirePreamble(): string {
  const cases = Object.entries(RUNJS_BUILTIN_MODULES)
    .map(([specifier, ctxLibName]) => `    case ${JSON.stringify(specifier)}: return ctx.libs.${ctxLibName};`)
    .join('\n');
  return [
    'const __runjs_require__ = (specifier) => {',
    '  switch (specifier) {',
    cases,
    '    default: throw new Error(`RunJS module "${specifier}" is not available`);',
    '  }',
    '};',
    'const require = __runjs_require__;',
  ].join('\n');
}

export function isRunJSRuntimeArtifact(code: unknown): code is string {
  if (typeof code !== 'string' || !code.startsWith(`${buildRunJSRuntimeRequirePreamble()}\n`)) {
    return false;
  }
  const launcherMarker = '// runjs-launcher:__runjs_launcher__.js';
  const launcherIndex = code.lastIndexOf(launcherMarker);
  if (launcherIndex <= 0 || code.indexOf(launcherMarker) !== launcherIndex) {
    return false;
  }
  return runJSRuntimeLauncherPattern.test(code.slice(launcherIndex));
}

export function prepareRunJSRuntimeArtifactForInspection(code: unknown): string | undefined {
  if (!isRunJSRuntimeArtifact(code)) {
    return undefined;
  }
  const executeMatches = Array.from(code.matchAll(/\nasync function (__runjs_execute_[a-f0-9]{12})\(\) \{/gu));
  if (executeMatches.length !== 1) {
    return undefined;
  }
  const launcherCall = 'return __runjs_entry__.default();';
  const launcherIndex = code.lastIndexOf('// runjs-launcher:__runjs_launcher__.js');
  const launcherCallIndex = code.indexOf(launcherCall, launcherIndex);
  if (launcherCallIndex < 0) {
    return undefined;
  }
  const directExecuteCall = `${executeMatches[0][1]}();`;
  return `${code.slice(0, launcherCallIndex)}${directExecuteCall}${code.slice(
    launcherCallIndex + launcherCall.length,
  )}`;
}

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
