/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import ts from 'typescript';

import type { RunJSCompileDiagnostic, RunJSSourceAuthoringLegacyInfo, RunJSSourceLocator, RunJSSurfaceStyle } from '..';
import { normalizePath } from '..';
import {
  buildRunJSTypeScriptEnvironmentFiles,
  RUNJS_TYPESCRIPT_DECLARED_GLOBAL_NAMES,
  RUNJS_TYPESCRIPT_ES_LIB_PATH,
  RUNJS_TYPESCRIPT_LIB_FILE_NAMES,
  type RunJSTypeScriptEnvironmentFile,
  type RunJSTypeScriptLibSource,
} from '../typescript-environment';
import {
  buildRunJSTypeScriptContextDeclaration,
  createRunJSTypeScriptCompilerOptions,
  RUNJS_TYPESCRIPT_CONTEXT_PATH,
} from '../typescript-project';
import { collectRunJSTypeLibraryUsage } from '../typescript-library-usage';
import { loadNodeRunJSTypeLibraryFiles } from './node-type-library';

export const RUNJS_COMPILER_ALLOWED_GLOBALS = new Set([
  'ctx',
  'console',
  'window',
  'document',
  'navigator',
  'fetch',
  'localStorage',
  'sessionStorage',
  'XMLHttpRequest',
  'WebSocket',
  'Worker',
  'SharedWorker',
  'ServiceWorker',
  'BroadcastChannel',
  'EventSource',
  'indexedDB',
  'caches',
  'setTimeout',
  'clearTimeout',
  'setInterval',
  'clearInterval',
  'Array',
  'ArrayBuffer',
  'BigInt',
  'BigInt64Array',
  'BigUint64Array',
  'Boolean',
  'DataView',
  'Date',
  'Error',
  'EvalError',
  'FinalizationRegistry',
  'Float32Array',
  'Float64Array',
  'Int8Array',
  'Int16Array',
  'Int32Array',
  'Map',
  'Math',
  'Number',
  'Object',
  'Promise',
  'Proxy',
  'RangeError',
  'ReferenceError',
  'Reflect',
  'RegExp',
  'Set',
  'String',
  'Symbol',
  'SyntaxError',
  'TypeError',
  'URIError',
  'Uint8Array',
  'Uint8ClampedArray',
  'Uint16Array',
  'Uint32Array',
  'WeakMap',
  'WeakRef',
  'WeakSet',
  'Function',
  'eval',
  'globalThis',
  'Intl',
  'JSON',
  'Blob',
  'URL',
  'location',
  'decodeURI',
  'decodeURIComponent',
  'encodeURI',
  'encodeURIComponent',
  'isFinite',
  'isNaN',
  'parseFloat',
  'parseInt',
  'undefined',
  'NaN',
  'Infinity',
]);

const chartEventGlobals = new Set(['chart', 'params']);
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.json']);
const unknownNameDiagnosticCodes = new Set([2304, 2448, 2552, 2580]);
let cachedTypeScriptEnvironmentFiles: RunJSTypeScriptEnvironmentFile[] | undefined;

export interface InspectRunJSSourceWorkspaceInput {
  files: Array<{
    path: string;
    content?: string;
    operation?: 'upsert' | 'delete';
  }>;
  entry: string;
  surfaceStyle: RunJSSurfaceStyle;
  locator?: RunJSSourceLocator;
  legacy?: RunJSSourceAuthoringLegacyInfo;
  additionalAllowedGlobals?: Iterable<string>;
}

export interface InspectRunJSSourceCodeInput {
  code: string;
  path: string;
  surfaceStyle: RunJSSurfaceStyle;
  additionalAllowedGlobals?: Iterable<string>;
}

export function inspectRunJSSourceCode(input: InspectRunJSSourceCodeInput): RunJSCompileDiagnostic[] {
  const compilerPath = sourceExtensions.has(extensionOf(input.path)) ? input.path : `${input.path}.tsx`;
  return inspectRunJSSourceWorkspace({
    files: [{ path: compilerPath, content: input.code }],
    entry: compilerPath,
    surfaceStyle: input.surfaceStyle,
    additionalAllowedGlobals: input.additionalAllowedGlobals,
  }).map((diagnostic) => ({
    ...diagnostic,
    path: input.path,
  }));
}

export function inspectRunJSSourceWorkspace(input: InspectRunJSSourceWorkspaceInput): RunJSCompileDiagnostic[] {
  if (input.surfaceStyle === 'workflow') {
    return [];
  }

  const sourceFiles = collectSourceFiles(input.files);
  const entryPath = normalizePath(input.entry);
  const allowedGlobals = resolveAllowedGlobals(input);
  const diagnostics = collectTypeScriptDiagnostics(sourceFiles, allowedGlobals, input.legacy?.metadata?.modelUse);
  const entry = sourceFiles.get(entryPath);

  if (entry) {
    diagnostics.push(
      ...collectSurfaceContractDiagnostics(
        entryPath,
        entry,
        input.surfaceStyle,
        input.legacy?.metadata?.kind === 'runjs',
      ),
    );
  }

  return diagnostics.sort(compareDiagnostics);
}

function collectSourceFiles(files: InspectRunJSSourceWorkspaceInput['files']): Map<string, string> {
  const sourceFiles = new Map<string, string>();

  for (const file of files) {
    const path = normalizePath(file.path);
    if (file.operation === 'delete') {
      sourceFiles.delete(path);
      continue;
    }
    if (typeof file.content !== 'string' || !sourceExtensions.has(extensionOf(path))) {
      continue;
    }
    sourceFiles.set(path, file.content);
  }

  return sourceFiles;
}

function resolveAllowedGlobals(input: InspectRunJSSourceWorkspaceInput): Set<string> {
  const allowedGlobals = new Set(RUNJS_COMPILER_ALLOWED_GLOBALS);
  const modelUse = input.legacy?.metadata?.modelUse;
  if (input.locator?.kind === 'chart.events' || modelUse === 'ChartEventsModel') {
    chartEventGlobals.forEach((name) => allowedGlobals.add(name));
  }
  for (const name of input.additionalAllowedGlobals || []) {
    if (name) {
      allowedGlobals.add(name);
    }
  }
  return allowedGlobals;
}

function collectTypeScriptDiagnostics(
  files: Map<string, string>,
  allowedGlobals: Set<string>,
  modelUse: unknown,
): RunJSCompileDiagnostic[] {
  if (!files.size) {
    return [];
  }

  const virtualFiles = new Map<string, string>();
  const rootNames = new Set<string>();
  for (const [path, source] of files) {
    const virtualPath = toVirtualPath(path);
    virtualFiles.set(virtualPath, maskTopLevelReturnKeywords(path, source));
    rootNames.add(virtualPath);
  }
  for (const file of getTypeScriptEnvironmentFiles()) {
    virtualFiles.set(file.path, file.content);
    rootNames.add(file.path);
  }
  virtualFiles.set(
    RUNJS_TYPESCRIPT_CONTEXT_PATH,
    [
      buildRunJSTypeScriptContextDeclaration(typeof modelUse === 'string' ? modelUse : undefined),
      buildAmbientDeclarations(allowedGlobals),
    ]
      .filter(Boolean)
      .join('\n'),
  );
  rootNames.add(RUNJS_TYPESCRIPT_CONTEXT_PATH);

  const usageRequests = collectRunJSTypeLibraryUsage(ts, {
    files: Array.from(files, ([path, content]) => ({ path, content })),
  });
  const typeLibraryFiles = loadNodeRunJSTypeLibraryFiles(usageRequests);
  for (const file of typeLibraryFiles.rootFiles) {
    virtualFiles.set(file.path, file.content);
    rootNames.add(file.path);
  }
  for (const file of typeLibraryFiles.dependencyFiles) {
    virtualFiles.set(file.path, file.content);
  }

  const compilerOptions = createRunJSTypeScriptCompilerOptions(ts);
  const host = createVirtualCompilerHost(virtualFiles, compilerOptions);
  const program = ts.createProgram({
    rootNames: [...rootNames],
    options: compilerOptions,
    host,
  });
  const diagnostics: RunJSCompileDiagnostic[] = [];
  const reported = new Set<string>();

  for (const diagnostic of [...program.getSyntacticDiagnostics(), ...program.getSemanticDiagnostics()]) {
    if (!diagnostic.file || diagnostic.start === undefined) {
      continue;
    }
    const path = fromVirtualPath(diagnostic.file.fileName);
    if (!files.has(path)) {
      continue;
    }
    const location = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    const identifier = unknownNameDiagnosticCodes.has(diagnostic.code)
      ? findIdentifierAt(diagnostic.file, diagnostic.start)
      : undefined;
    const key = `${path}:${diagnostic.start}:${diagnostic.code}:${message}`;
    if (reported.has(key)) {
      continue;
    }
    reported.add(key);
    diagnostics.push({
      severity: diagnostic.category === ts.DiagnosticCategory.Warning ? 'warning' : 'error',
      code: 'RUNJS_COMPILE_FAILED',
      ruleId: unknownNameDiagnosticCodes.has(diagnostic.code) ? 'runjs-global-unknown' : 'runjs-typescript',
      path,
      line: location.line + 1,
      column: location.character + 1,
      message,
      details: identifier ? { global: identifier.text } : { tsCode: diagnostic.code },
    });
  }

  return diagnostics;
}

function collectSurfaceContractDiagnostics(
  path: string,
  source: string,
  surfaceStyle: RunJSSurfaceStyle,
  allowDefaultExport: boolean,
): RunJSCompileDiagnostic[] {
  if (surfaceStyle === 'action') {
    return [];
  }

  const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, getScriptKind(path));
  const topLevelReturns: ts.ReturnStatement[] = [];
  const topLevelRenderCalls: ts.CallExpression[] = [];
  const allRenderCalls: ts.CallExpression[] = [];

  const visit = (node: ts.Node, functionDepth: number) => {
    const nextFunctionDepth = isFunctionLike(node) ? functionDepth + 1 : functionDepth;
    if (ts.isReturnStatement(node) && functionDepth === 0) {
      topLevelReturns.push(node);
    }
    if (ts.isCallExpression(node) && isCtxRenderCall(node)) {
      allRenderCalls.push(node);
      if (functionDepth === 0) {
        topLevelRenderCalls.push(node);
      }
    }
    ts.forEachChild(node, (child) => visit(child, nextFunctionDepth));
  };
  sourceFile.statements.forEach((statement) => visit(statement, 0));

  if (surfaceStyle === 'value') {
    const diagnostics: RunJSCompileDiagnostic[] = [];
    const renderCall = allRenderCalls[0];
    if (renderCall) {
      diagnostics.push(
        diagnosticAtNode(sourceFile, renderCall, {
          ruleId: 'runjs-value-render-forbidden',
          message: 'Value RunJS must return a value and cannot call ctx.render(...).',
        }),
      );
    }
    const hasDefaultExport = allowDefaultExport && sourceFile.statements.some(hasDefaultExportModifier);
    if (!topLevelReturns.length && !hasDefaultExport) {
      diagnostics.push(
        diagnosticAtNode(sourceFile, sourceFile, {
          ruleId: 'runjs-value-return-required',
          message: 'Value RunJS must include a top-level return or a default export.',
        }),
      );
    }
    return diagnostics;
  }

  const firstRender = topLevelRenderCalls.sort(byNodeStart)[0];
  const firstReturn = topLevelReturns.sort(byNodeStart)[0];
  if (firstRender && (!firstReturn || firstRender.getStart(sourceFile) < firstReturn.getStart(sourceFile))) {
    return [];
  }

  return [
    diagnosticAtNode(sourceFile, firstRender || sourceFile, {
      ruleId: firstRender ? 'runjs-render-unreachable' : 'runjs-render-required',
      message: firstRender
        ? 'Render RunJS must call ctx.render(...) before any top-level return.'
        : 'Render RunJS must call ctx.render(...) from directly executed code.',
    }),
  ];
}

function maskTopLevelReturnKeywords(path: string, source: string): string {
  const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, getScriptKind(path));
  const returnStarts: number[] = [];
  const visit = (node: ts.Node, functionDepth: number) => {
    const nextFunctionDepth = isFunctionLike(node) ? functionDepth + 1 : functionDepth;
    if (ts.isReturnStatement(node) && functionDepth === 0) {
      returnStarts.push(node.getStart(sourceFile));
      return;
    }
    ts.forEachChild(node, (child) => visit(child, nextFunctionDepth));
  };
  sourceFile.statements.forEach((statement) => visit(statement, 0));
  if (!returnStarts.length) {
    return source;
  }

  const characters = [...source];
  returnStarts.forEach((start) => {
    for (let index = start; index < start + 'return'.length; index += 1) {
      characters[index] = ' ';
    }
  });
  return characters.join('');
}

function createVirtualCompilerHost(files: Map<string, string>, options: ts.CompilerOptions): ts.CompilerHost {
  const baseHost = ts.createCompilerHost(options, true);
  const normalizedDirectories = new Set<string>(['/']);
  for (const path of files.keys()) {
    const segments = path.split('/').filter(Boolean);
    let directory = '';
    for (const segment of segments.slice(0, -1)) {
      directory += `/${segment}`;
      normalizedDirectories.add(directory);
    }
  }
  return {
    ...baseHost,
    directoryExists: (path) => normalizedDirectories.has(normalizeVirtualPath(path)),
    fileExists: (path) => files.has(path),
    getCanonicalFileName: (path) => path,
    getCurrentDirectory: () => '/',
    getDefaultLibFileName: () => RUNJS_TYPESCRIPT_ES_LIB_PATH,
    getNewLine: () => '\n',
    getSourceFile: (path, languageVersion) => {
      const source = files.get(path);
      return source === undefined
        ? undefined
        : ts.createSourceFile(path, source, languageVersion, true, getScriptKind(path));
    },
    readFile: (path) => files.get(path),
    realpath: (path) => path,
    useCaseSensitiveFileNames: () => true,
    writeFile: () => undefined,
  };
}

function buildAmbientDeclarations(allowedGlobals: Set<string>): string {
  const declarations = [...allowedGlobals]
    .filter((name) => !RUNJS_TYPESCRIPT_DECLARED_GLOBAL_NAMES.has(name))
    .filter((name) => /^[A-Za-z_$][\w$]*$/u.test(name))
    .map((name) => `declare const ${name}: RunJSPermissiveGlobal;`);
  if (!declarations.length) {
    return '';
  }

  return [
    'interface RunJSPermissiveGlobal {',
    '  readonly [key: string]: RunJSPermissiveGlobal;',
    '  (...args: unknown[]): RunJSPermissiveGlobal;',
    '  new (...args: unknown[]): RunJSPermissiveGlobal;',
    '}',
    ...declarations,
  ].join('\n');
}

function getTypeScriptEnvironmentFiles(): RunJSTypeScriptEnvironmentFile[] {
  if (cachedTypeScriptEnvironmentFiles) {
    return cachedTypeScriptEnvironmentFiles;
  }

  const defaultLibPath = ts.getDefaultLibFilePath({ target: ts.ScriptTarget.ES2020 });
  const separatorIndex = Math.max(defaultLibPath.lastIndexOf('/'), defaultLibPath.lastIndexOf('\\'));
  const libDirectory = defaultLibPath.slice(0, separatorIndex + 1);
  const sources: RunJSTypeScriptLibSource[] = RUNJS_TYPESCRIPT_LIB_FILE_NAMES.map((fileName) => {
    const content = ts.sys.readFile(`${libDirectory}${fileName}`);
    if (typeof content !== 'string') {
      throw new Error(`Unable to read TypeScript standard library: ${fileName}`);
    }
    return { fileName, content };
  });
  cachedTypeScriptEnvironmentFiles = buildRunJSTypeScriptEnvironmentFiles(sources);
  return cachedTypeScriptEnvironmentFiles;
}

function findIdentifierAt(sourceFile: ts.SourceFile, position: number): ts.Identifier | undefined {
  let found: ts.Identifier | undefined;
  const visit = (node: ts.Node) => {
    if (position < node.getFullStart() || position >= node.getEnd()) {
      return;
    }
    if (ts.isIdentifier(node)) {
      found = node;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return found;
}

function isCtxRenderCall(node: ts.CallExpression): boolean {
  const expression = node.expression;
  return (
    ts.isPropertyAccessExpression(expression) &&
    ts.isIdentifier(expression.expression) &&
    expression.expression.text === 'ctx' &&
    expression.name.text === 'render'
  );
}

function hasDefaultExportModifier(statement: ts.Statement): boolean {
  if (ts.isExportAssignment(statement)) {
    return !statement.isExportEquals;
  }
  if (!ts.canHaveModifiers(statement)) {
    return false;
  }
  const modifiers = ts.getModifiers(statement) || [];
  return (
    modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) &&
    modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword)
  );
}

function isFunctionLike(node: ts.Node): boolean {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node) ||
    ts.isConstructorDeclaration(node)
  );
}

function diagnosticAtNode(
  sourceFile: ts.SourceFile,
  node: ts.Node,
  input: Pick<RunJSCompileDiagnostic, 'message' | 'ruleId'>,
): RunJSCompileDiagnostic {
  const location = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return {
    severity: 'error',
    code: 'RUNJS_COMPILE_FAILED',
    path: sourceFile.fileName,
    line: location.line + 1,
    column: location.character + 1,
    ...input,
  };
}

function getScriptKind(path: string): ts.ScriptKind {
  if (path.endsWith('.tsx')) {
    return ts.ScriptKind.TSX;
  }
  if (path.endsWith('.jsx')) {
    return ts.ScriptKind.JSX;
  }
  if (path.endsWith('.js')) {
    return ts.ScriptKind.JS;
  }
  if (path.endsWith('.json')) {
    return ts.ScriptKind.JSON;
  }
  return ts.ScriptKind.TS;
}

function extensionOf(path: string): string {
  const index = path.lastIndexOf('.');
  return index < 0 ? '' : path.slice(index).toLowerCase();
}

function toVirtualPath(path: string): string {
  return `/${normalizePath(path)}`;
}

function fromVirtualPath(path: string): string {
  return normalizePath(path.replace(/^\/+/, ''));
}

function normalizeVirtualPath(path: string): string {
  const normalized = path.replace(/\\/gu, '/').replace(/\/+$/u, '');
  return normalized || '/';
}

function byNodeStart(left: ts.Node, right: ts.Node): number {
  return left.getStart() - right.getStart();
}

function compareDiagnostics(left: RunJSCompileDiagnostic, right: RunJSCompileDiagnostic): number {
  return (
    String(left.path || '').localeCompare(String(right.path || '')) ||
    (left.line || 0) - (right.line || 0) ||
    (left.column || 0) - (right.column || 0) ||
    String(left.ruleId || '').localeCompare(String(right.ruleId || ''))
  );
}
