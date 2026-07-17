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
import { normalizePath, sha256Hex, stableSerialize } from '..';
import {
  buildRunJSTypeScriptEnvironmentFiles,
  RUNJS_TYPESCRIPT_DECLARED_GLOBAL_NAMES,
  RUNJS_TYPESCRIPT_LIB_FILE_NAMES,
  type RunJSTypeScriptEnvironmentFile,
  type RunJSTypeScriptLibSource,
} from '../typescript-environment';
import { buildRunJSTypeScriptContextDeclaration, RUNJS_TYPESCRIPT_CONTEXT_PATH } from '../typescript-project';
import { collectRunJSTypeLibraryUsage } from '../typescript-library-usage';
import {
  getDefaultNodeRunJSTypeLibraryRegistry,
  loadNodeRunJSTypeLibraryFiles,
  type NodeRunJSTypeLibraryRegistry,
} from './node-type-library';
import { RunJSTypeScriptProject, type RunJSTypeScriptProjectFile } from './typescript-project';

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
const unknownNameDiagnosticCodes = new Set([2304, 2448, 2552, 2580, 2591]);
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
  typeLibraryIds?: readonly string[];
  typeLibraryRegistry?: NodeRunJSTypeLibraryRegistry;
}

export interface InspectRunJSSourceCodeInput {
  code: string;
  path: string;
  surfaceStyle: RunJSSurfaceStyle;
  additionalAllowedGlobals?: Iterable<string>;
  typeLibraryIds?: readonly string[];
  typeLibraryRegistry?: NodeRunJSTypeLibraryRegistry;
}

export interface RunJSSourceWorkspaceInspectorDebugState {
  disposed: boolean;
  projectCreateCount: number;
  projectReuseCount: number;
  projectVersion: number;
  projectUpdateCount: number;
  structureFingerprint?: string;
}

interface PreparedRunJSTypeScriptProject {
  files: RunJSTypeScriptProjectFile[];
  sourceFiles: Map<string, string>;
  sourceVirtualPaths: string[];
  structureFingerprint: string;
}

export class RunJSSourceWorkspaceInspector {
  private project?: RunJSTypeScriptProject;

  private structureFingerprint?: string;

  private projectCreateCount = 0;

  private projectReuseCount = 0;

  private disposed = false;

  inspect(input: InspectRunJSSourceWorkspaceInput): RunJSCompileDiagnostic[] {
    this.assertActive();
    if (input.surfaceStyle === 'workflow') {
      return [];
    }

    const prepared = prepareTypeScriptProject(input);
    if (!this.project || this.structureFingerprint !== prepared.structureFingerprint) {
      this.project?.dispose();
      this.project = new RunJSTypeScriptProject();
      this.structureFingerprint = prepared.structureFingerprint;
      this.projectCreateCount += 1;
    } else {
      this.projectReuseCount += 1;
    }
    this.project.update(prepared.files);
    const diagnostics = typeScriptDiagnosticsToRunJS(
      this.project.getDiagnostics(prepared.sourceVirtualPaths),
      prepared.sourceFiles,
    );
    const entryPath = normalizePath(input.entry);
    const entry = prepared.sourceFiles.get(entryPath);
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

  getDebugState(): RunJSSourceWorkspaceInspectorDebugState {
    const projectState = this.project?.getDebugState();
    return {
      disposed: this.disposed,
      projectCreateCount: this.projectCreateCount,
      projectReuseCount: this.projectReuseCount,
      projectVersion: projectState?.projectVersion || 0,
      projectUpdateCount: projectState?.updateCount || 0,
      structureFingerprint: this.structureFingerprint,
    };
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.project?.dispose();
    this.project = undefined;
  }

  private assertActive(): void {
    if (this.disposed) {
      throw new Error('RunJS source workspace inspector has been disposed.');
    }
  }
}

export function inspectRunJSSourceCode(input: InspectRunJSSourceCodeInput): RunJSCompileDiagnostic[] {
  const compilerPath = sourceExtensions.has(extensionOf(input.path)) ? input.path : `${input.path}.tsx`;
  return inspectRunJSSourceWorkspace({
    files: [{ path: compilerPath, content: input.code }],
    entry: compilerPath,
    surfaceStyle: input.surfaceStyle,
    additionalAllowedGlobals: input.additionalAllowedGlobals,
    typeLibraryIds: input.typeLibraryIds,
    typeLibraryRegistry: input.typeLibraryRegistry,
  }).map((diagnostic) => ({
    ...diagnostic,
    path: input.path,
  }));
}

export function inspectRunJSSourceWorkspace(input: InspectRunJSSourceWorkspaceInput): RunJSCompileDiagnostic[] {
  const inspector = new RunJSSourceWorkspaceInspector();
  try {
    return inspector.inspect(input);
  } finally {
    inspector.dispose();
  }
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

function prepareTypeScriptProject(input: InspectRunJSSourceWorkspaceInput): PreparedRunJSTypeScriptProject {
  const sourceFiles = collectSourceFiles(input.files);
  const allowedGlobals = resolveAllowedGlobals(input);
  const modelUse = input.legacy?.metadata?.modelUse;
  const virtualFiles = new Map<string, string>();
  const rootNames = new Set<string>();
  for (const [path, source] of sourceFiles) {
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

  const registry = input.typeLibraryRegistry || getDefaultNodeRunJSTypeLibraryRegistry();
  const usageRequests = collectRunJSTypeLibraryUsage(ts, {
    files: Array.from(sourceFiles, ([path, content]) => ({ path, content })),
    libraries: registry.getUsageDefinitions(),
  });
  const typeLibraryFiles = loadNodeRunJSTypeLibraryFiles(usageRequests, {
    registry,
    typeLibraryIds: input.typeLibraryIds,
  });
  for (const file of typeLibraryFiles.rootFiles) {
    virtualFiles.set(file.path, file.content);
    rootNames.add(file.path);
  }
  for (const file of typeLibraryFiles.dependencyFiles) {
    virtualFiles.set(file.path, file.content);
  }

  const sourceVirtualPaths = [...sourceFiles.keys()].map(toVirtualPath).sort();
  const sourceVirtualPathSet = new Set(sourceVirtualPaths);
  const structureFiles = [...virtualFiles]
    .filter(([path]) => !sourceVirtualPathSet.has(path))
    .map(([path, content]) => ({ path, contentHash: sha256Hex(content), root: rootNames.has(path) }))
    .sort((left, right) => left.path.localeCompare(right.path));
  return {
    files: [...virtualFiles]
      .map(([path, content]) => ({ path, content, root: rootNames.has(path) }))
      .sort((left, right) => left.path.localeCompare(right.path)),
    sourceFiles,
    sourceVirtualPaths,
    structureFingerprint: sha256Hex(
      stableSerialize({
        files: structureFiles,
        typeLibraryIds: [...new Set(input.typeLibraryIds || [])].sort(),
      }),
    ),
  };
}

function typeScriptDiagnosticsToRunJS(
  typeScriptDiagnostics: readonly ts.Diagnostic[],
  sourceFiles: ReadonlyMap<string, string>,
): RunJSCompileDiagnostic[] {
  const diagnostics: RunJSCompileDiagnostic[] = [];
  const reported = new Set<string>();

  for (const diagnostic of typeScriptDiagnostics) {
    if (!diagnostic.file || diagnostic.start === undefined) {
      continue;
    }
    const path = fromVirtualPath(diagnostic.file.fileName);
    if (!sourceFiles.has(path)) {
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
