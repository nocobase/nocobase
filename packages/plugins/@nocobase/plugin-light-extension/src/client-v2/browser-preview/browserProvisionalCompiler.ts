/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  resolveRunJSBuiltInModule,
  resolveRunJSWorkspaceImport,
  RUNJS_BUILTIN_MODULES,
  runJSVirtualDirname,
  runJSVirtualExtname,
  type RunJSPortableCompileDiagnostic,
} from '@nocobase/runjs/compiler/portable';
import type { Loader, Message, OnResolveArgs, Plugin } from 'esbuild-wasm/esm/browser';
import * as esbuild from 'esbuild-wasm/esm/browser';
import ts from 'typescript';

import type { LightExtensionDiagnostic } from '../../shared/types';
import {
  LIGHT_EXTENSION_BROWSER_PREVIEW_COMPILER_BUILD_ID,
  type BrowserPreviewEntryContract,
  type BrowserPreviewFailureCode,
  type BrowserPreviewMetrics,
  type ProvisionalCompileResult,
} from './protocol';
import { BrowserPreviewVirtualFileSystem } from './virtualFileSystem';

const launcherNamespace = 'light-extension-preview-launcher';
const sourceNamespace = 'light-extension-preview-source';
const sdkNamespace = 'light-extension-preview-sdk';
const launcherPath = '__light_extension_preview_launcher__.js';
const entryModuleSpecifier = '__light_extension_preview_entry__';
const sdkModuleSpecifiers = new Set(['@nocobase/light-extension-sdk/client', '@nocobase/light-extension-sdk/shared']);

export class BrowserPreviewCompilerError extends Error {
  constructor(
    readonly code: BrowserPreviewFailureCode,
    message: string,
    readonly recoverable = true,
  ) {
    super(message);
    this.name = 'BrowserPreviewCompilerError';
  }
}

export class BrowserProvisionalCompiler {
  private initialized = false;
  private initializationMetrics: Pick<BrowserPreviewMetrics, 'wasmDownloadMs' | 'wasmInitializeMs'> = {};
  private buildCount = 0;

  async initialize(wasmURL: string): Promise<Pick<BrowserPreviewMetrics, 'wasmDownloadMs' | 'wasmInitializeMs'>> {
    if (this.initialized) {
      return { ...this.initializationMetrics };
    }

    const downloadStartedAt = performance.now();
    let response: Response;
    try {
      response = await fetch(wasmURL, { cache: 'force-cache', credentials: 'same-origin' });
    } catch (error) {
      throw new BrowserPreviewCompilerError(
        'PREVIEW_WASM_FETCH_FAILED',
        `Unable to fetch the provisional preview compiler: ${toErrorMessage(error)}`,
      );
    }
    if (!response.ok) {
      throw new BrowserPreviewCompilerError(
        'PREVIEW_WASM_FETCH_FAILED',
        `Unable to fetch the provisional preview compiler (HTTP ${response.status})`,
      );
    }
    const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
    if (contentType && contentType !== 'application/wasm' && contentType !== 'application/octet-stream') {
      throw new BrowserPreviewCompilerError(
        'PREVIEW_WASM_MIME_INVALID',
        `The provisional preview compiler has an unsupported MIME type: ${contentType}`,
      );
    }

    const bytes = await response.arrayBuffer();
    this.initializationMetrics.wasmDownloadMs = performance.now() - downloadStartedAt;
    let wasmModule: WebAssembly.Module;
    try {
      wasmModule = await WebAssembly.compile(bytes);
    } catch (error) {
      throw new BrowserPreviewCompilerError(
        'PREVIEW_WASM_COMPILE_FAILED',
        `Unable to compile the provisional preview WebAssembly module: ${toErrorMessage(error)}`,
      );
    }

    const initializeStartedAt = performance.now();
    try {
      await esbuild.initialize({ wasmModule, worker: false });
    } catch (error) {
      throw new BrowserPreviewCompilerError(
        'PREVIEW_WASM_INITIALIZE_FAILED',
        `Unable to initialize the provisional preview compiler: ${toErrorMessage(error)}`,
      );
    }
    this.initializationMetrics.wasmInitializeMs = performance.now() - initializeStartedAt;
    this.initialized = true;
    return { ...this.initializationMetrics };
  }

  async build(
    vfs: BrowserPreviewVirtualFileSystem,
    entry: BrowserPreviewEntryContract,
    workerRestartCount: number,
  ): Promise<ProvisionalCompileResult> {
    if (!this.initialized) {
      throw new BrowserPreviewCompilerError(
        'PREVIEW_WASM_INITIALIZE_FAILED',
        'The provisional preview compiler is not initialized',
      );
    }
    if (!vfs.has(entry.entryPath)) {
      return this.buildRejectedResult(vfs, entry, workerRestartCount, [
        {
          code: 'RUNJS_ENTRY_NOT_FOUND',
          severity: 'error',
          message: `Entry file "${entry.entryPath}" was not found`,
          path: entry.entryPath,
        },
      ]);
    }

    const buildStartedAt = performance.now();
    try {
      const result = await esbuild.build({
        absWorkingDir: '/',
        banner: { js: buildRuntimeRequirePreamble() },
        bundle: true,
        charset: 'utf8',
        entryPoints: [launcherPath],
        format: 'cjs',
        jsx: 'transform',
        jsxFactory: 'ctx.React.createElement',
        jsxFragment: 'ctx.React.Fragment',
        legalComments: 'none',
        logLevel: 'silent',
        metafile: true,
        outfile: '/light-extension-provisional-preview.js',
        platform: 'neutral',
        plugins: [createWorkspacePlugin(vfs, entry.entryPath)],
        sourcemap: 'external',
        sourcesContent: true,
        target: 'es2020',
        treeShaking: true,
        write: false,
      });
      const elapsedMs = performance.now() - buildStartedAt;
      const metrics = this.buildMetrics(vfs, workerRestartCount, elapsedMs);
      const javascript = result.outputFiles?.find((file) => file.path.endsWith('.js'))?.text;
      const sourceMap = result.outputFiles?.find((file) => file.path.endsWith('.js.map'))?.text;
      if (typeof javascript !== 'string') {
        throw new BrowserPreviewCompilerError(
          'PREVIEW_BUILD_FAILED',
          'The provisional preview compiler did not produce JavaScript output',
        );
      }
      const diagnostics = result.warnings.map((message) => toDiagnostic(message, entry.entryPath, 'warning'));

      return {
        provisional: true,
        accepted: !diagnostics.some((diagnostic) => diagnostic.severity === 'error'),
        artifact: {
          code: removeSourceMapComment(javascript).trimEnd(),
          sourceMap,
          version: entry.runtimeVersion,
          entryPath: entry.entryPath,
          diagnostics,
          metadata: {
            provisional: true,
            trust: 'client-advisory',
            compilerBuildId: LIGHT_EXTENSION_BROWSER_PREVIEW_COMPILER_BUILD_ID,
            canonical: false,
            surfaceStyle: entry.surfaceStyle,
            kind: entry.kind,
          },
        },
        diagnostics,
        metafile: result.metafile as unknown as Record<string, unknown>,
        metrics,
      };
    } catch (error) {
      if (error instanceof BrowserPreviewCompilerError) {
        throw error;
      }
      const diagnostics = isBuildFailure(error)
        ? error.errors.map((message) => toDiagnostic(message, entry.entryPath, 'error'))
        : [
            {
              code: 'PREVIEW_BUILD_FAILED',
              severity: 'error' as const,
              message: toErrorMessage(error),
              path: entry.entryPath,
              details: { provisional: true },
            },
          ];
      return this.buildRejectedResult(vfs, entry, workerRestartCount, diagnostics, performance.now() - buildStartedAt);
    }
  }

  dispose(): void {
    esbuild.stop();
    this.initialized = false;
    this.buildCount = 0;
  }

  private buildRejectedResult(
    vfs: BrowserPreviewVirtualFileSystem,
    entry: BrowserPreviewEntryContract,
    workerRestartCount: number,
    diagnostics: LightExtensionDiagnostic[],
    elapsedMs = 0,
  ): ProvisionalCompileResult {
    return {
      provisional: true,
      accepted: false,
      artifact: {
        code: '',
        version: entry.runtimeVersion,
        entryPath: entry.entryPath,
        diagnostics,
        metadata: {
          provisional: true,
          trust: 'client-advisory',
          compilerBuildId: LIGHT_EXTENSION_BROWSER_PREVIEW_COMPILER_BUILD_ID,
          canonical: false,
          surfaceStyle: entry.surfaceStyle,
          kind: entry.kind,
        },
      },
      diagnostics,
      metrics: {
        ...this.buildMetrics(vfs, workerRestartCount, elapsedMs),
        previewFailureCode: diagnostics[0]?.code || 'PREVIEW_BUILD_FAILED',
      },
    };
  }

  private buildMetrics(
    vfs: BrowserPreviewVirtualFileSystem,
    workerRestartCount: number,
    elapsedMs: number,
  ): BrowserPreviewMetrics {
    const stats = vfs.stats();
    const buildMetric = this.buildCount === 0 ? { firstBuildMs: elapsedMs } : { warmBuildMs: elapsedMs };
    this.buildCount += 1;
    return {
      ...this.initializationMetrics,
      ...buildMetric,
      workerRestartCount,
      inputFileCount: stats.fileCount,
      inputBytes: stats.inputBytes,
      estimatedMemoryBytes: stats.estimatedMemoryBytes,
    };
  }
}

function createWorkspacePlugin(vfs: BrowserPreviewVirtualFileSystem, entryPath: string): Plugin {
  return {
    name: 'nocobase-light-extension-provisional-preview',
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => resolveWorkspaceModule(args, vfs, entryPath));
      build.onLoad({ filter: /.*/, namespace: launcherNamespace }, () => ({
        contents: `globalThis.__nocobaseProvisionalPreviewRun__ = async () => { const __preview_entry__ = require(${JSON.stringify(
          entryModuleSpecifier,
        )}); return __preview_entry__.default(); };`,
        loader: 'js',
        resolveDir: '/',
      }));
      build.onLoad({ filter: /.*/, namespace: sdkNamespace }, () => ({
        contents: 'export const defineSettings = (value) => value; export const assertSettings = (value) => value;',
        loader: 'js',
      }));
      build.onLoad({ filter: /.*/, namespace: sourceNamespace }, (args) => {
        const file = vfs.get(args.path);
        if (!file) {
          return { errors: [{ text: `Import "${args.path}" could not be resolved` }] };
        }
        return {
          contents: file.path === entryPath ? adaptRunJSEntry(file.path, file.content) : file.content,
          loader: loaderForPath(file.path),
          resolveDir: `/${runJSVirtualDirname(file.path)}`,
        };
      });
    },
  };
}

function resolveWorkspaceModule(args: OnResolveArgs, vfs: BrowserPreviewVirtualFileSystem, entryPath: string) {
  if (args.kind === 'entry-point') {
    return { path: launcherPath, namespace: launcherNamespace };
  }
  if (args.namespace === launcherNamespace && args.path === entryModuleSpecifier) {
    return { path: entryPath, namespace: sourceNamespace };
  }
  if (args.namespace !== sourceNamespace) {
    return undefined;
  }
  if (args.kind === 'dynamic-import') {
    return { errors: [{ text: 'Dynamic import(...) is not supported in provisional RunJS preview' }] };
  }
  if (!args.path.startsWith('.')) {
    if (resolveRunJSBuiltInModule(args.path)) {
      return { path: args.path, external: true };
    }
    if (sdkModuleSpecifiers.has(args.path)) {
      return { path: args.path, namespace: sdkNamespace };
    }
    return { errors: [{ text: `Import "${args.path}" is not allowed` }] };
  }

  const importer = normalizeEsbuildPath(args.importer);
  const resolution = resolveRunJSWorkspaceImport(importer, args.path, vfs.paths());
  if (resolution.status === 'resolved') {
    if (resolution.path === entryPath) {
      return { errors: [{ text: `Import "${args.path}" cannot target the executable RunJS entry` }] };
    }
    return { path: resolution.path, namespace: sourceNamespace };
  }
  return {
    errors: [
      {
        text: resolution.status === 'blocked' ? resolution.message : `Import "${args.path}" could not be resolved`,
      },
    ],
  };
}

function adaptRunJSEntry(path: string, content: string): string {
  if (runJSVirtualExtname(path) === '.json') {
    return `async function __runjs_preview_execute__() { return ${content}; }\nexport default __runjs_preview_execute__;`;
  }
  const sourceFile = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true, scriptKind(path));
  const imports: string[] = [];
  const replacements: Array<{ start: number; end: number; value: string }> = [];
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      imports.push(content.slice(statement.getStart(sourceFile), statement.end));
      replacements.push({
        start: statement.getStart(sourceFile),
        end: statement.end,
        value: preserveNewlines(content.slice(statement.getStart(sourceFile), statement.end)),
      });
      continue;
    }
    if (ts.isExportDeclaration(statement)) {
      if (statement.moduleSpecifier) {
        imports.push(`import ${statement.moduleSpecifier.getText(sourceFile)};`);
      }
      replacements.push({
        start: statement.getStart(sourceFile),
        end: statement.end,
        value: preserveNewlines(content.slice(statement.getStart(sourceFile), statement.end)),
      });
      continue;
    }
    if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
      const original = content.slice(statement.getStart(sourceFile), statement.end);
      replacements.push({
        start: statement.getStart(sourceFile),
        end: statement.end,
        value: preserveLineCount(original, `return ${statement.expression.getText(sourceFile)};`),
      });
      continue;
    }
    const modifiers = ts.canHaveModifiers(statement) ? ts.getModifiers(statement) : undefined;
    for (const modifier of modifiers || []) {
      if (modifier.kind !== ts.SyntaxKind.ExportKeyword && modifier.kind !== ts.SyntaxKind.DefaultKeyword) {
        continue;
      }
      replacements.push({
        start: modifier.getStart(sourceFile),
        end: modifier.end,
        value: preserveNewlines(content.slice(modifier.getStart(sourceFile), modifier.end)),
      });
    }
  }
  let body = content;
  for (const replacement of replacements.sort((left, right) => right.start - left.start)) {
    body = `${body.slice(0, replacement.start)}${replacement.value}${body.slice(replacement.end)}`;
  }
  return `${imports.join(
    '\n',
  )}\nasync function __runjs_preview_execute__() {\n${body}\n}\nexport default __runjs_preview_execute__;`;
}

function buildRuntimeRequirePreamble(): string {
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

function loaderForPath(path: string): Loader {
  switch (runJSVirtualExtname(path)) {
    case '.tsx':
      return 'tsx';
    case '.jsx':
      return 'jsx';
    case '.js':
      return 'js';
    case '.json':
      return 'json';
    default:
      return 'ts';
  }
}

function scriptKind(path: string): ts.ScriptKind {
  switch (runJSVirtualExtname(path)) {
    case '.tsx':
      return ts.ScriptKind.TSX;
    case '.jsx':
      return ts.ScriptKind.JSX;
    case '.js':
      return ts.ScriptKind.JS;
    default:
      return ts.ScriptKind.TS;
  }
}

function toDiagnostic(message: Message, fallbackPath: string, severity: 'error' | 'warning'): LightExtensionDiagnostic {
  return {
    code: inferDiagnosticCode(message.text),
    severity,
    message: message.text,
    path: normalizeEsbuildPath(message.location?.file || fallbackPath),
    line: message.location?.line,
    column: message.location ? message.location.column + 1 : undefined,
    details: { provisional: true },
  };
}

function inferDiagnosticCode(message: string): string {
  if (message.includes('not allowed') || message.includes('escapes the RunJS workspace')) {
    return 'RUNJS_IMPORT_NOT_ALLOWED';
  }
  if (message.includes('could not be resolved')) {
    return 'RUNJS_IMPORT_NOT_FOUND';
  }
  if (message.includes('Dynamic import')) {
    return 'RUNJS_DYNAMIC_IMPORT_UNSUPPORTED';
  }
  return 'PREVIEW_BUILD_FAILED';
}

function normalizeEsbuildPath(path: string): string {
  return String(path || '').replace(/^\/+|\\/gu, '');
}

function preserveNewlines(value: string): string {
  return value.replace(/[^\n]/gu, ' ');
}

function preserveLineCount(original: string, replacement: string): string {
  const originalLines = original.split('\n').length;
  const replacementLines = replacement.split('\n').length;
  return replacementLines >= originalLines
    ? replacement
    : `${replacement}${'\n'.repeat(originalLines - replacementLines)}`;
}

function removeSourceMapComment(code: string): string {
  return code.replace(/\n?\/\/# sourceMappingURL=[^\n]*\s*$/u, '');
}

function isBuildFailure(error: unknown): error is { errors: Message[] } {
  return Boolean(error) && typeof error === 'object' && Array.isArray((error as { errors?: unknown }).errors);
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function toPortableDiagnostics(diagnostics: LightExtensionDiagnostic[]): RunJSPortableCompileDiagnostic[] {
  return diagnostics.map((diagnostic) => ({
    code: diagnostic.code,
    severity: diagnostic.severity,
    message: diagnostic.message,
    path: diagnostic.path,
    line: diagnostic.line,
    column: diagnostic.column,
    details: diagnostic.details,
  }));
}
