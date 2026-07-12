/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { posix as pathPosix } from 'path';
import ts from 'typescript';

import {
  buildRunJSFilesHash,
  normalizePath,
  normalizeText,
  sha256Hex,
  type RunJSCompileDiagnostic,
  type RunJSCompileFailureCode,
  type RunJSCompileFile,
  type RunJSSourceAuthoringLegacyInfo,
  type RunJSSourceAuthoringInspector,
  type RunJSSourceLocator,
  type RunJSSurfaceStyle,
  type RunJSRuntimeArtifact,
} from '..';
import { inspectRunJSSourceWorkspace } from './source-inspection';

export * from './source-inspection';
export type { RunJSCompileFailureCode } from '..';

export type RunJSCompileFileInput = RunJSCompileFile;

export interface CompileRunJSSourceWorkspaceInput {
  files: RunJSCompileFileInput[];
  entry: string;
  runtimeVersion?: string;
  surfaceStyle: RunJSSurfaceStyle;
  locator?: RunJSSourceLocator;
  legacy?: RunJSSourceAuthoringLegacyInfo;
  inspectAuthoring?: RunJSSourceAuthoringInspector;
}

export interface CompileRunJSSourceWorkspaceResult {
  artifact: RunJSRuntimeArtifact;
  failureCode?: RunJSCompileFailureCode;
}

interface RunJSContentFile {
  path: string;
  content: string;
  language?: string;
  extension: string;
}

interface ImportBinding {
  specifier: string;
  start: number;
  targetPath?: string;
  defaultName?: string;
  named: NamedImportBinding[];
}

interface NamedImportBinding {
  imported: string;
  local: string;
}

interface RunJSModuleInfo {
  file: RunJSContentFile;
  sourceFile?: ts.SourceFile;
  imports: ImportBinding[];
  namedExports: Set<string>;
  hasDefaultExport: boolean;
  defaultExportSymbol: string;
  moduleSymbol: string;
  isJson: boolean;
}

interface RunJSTransformedLineMapping {
  generatedLine: number;
  source: string;
  sourceLine: number;
  sourceColumn?: number;
}

interface RunJSTransformedCode {
  code: string;
  mappings: RunJSTransformedLineMapping[];
}

interface RunJSEmittedLineMapping {
  generatedLine: number;
  transformedLine: number;
}

interface RunJSTranspiledCode {
  code: string;
  mappings: RunJSEmittedLineMapping[];
}

interface RunJSSourceMapPayload {
  version: 1;
  kind: 'runjs-line-map';
  sourceURL: string;
  entryPath: string;
  generatedCodeLineOffset: number;
  mappings: RunJSTransformedLineMapping[];
}

interface RunJSRuntimeCodeBuildResult {
  code: string;
  sourceMap: RunJSSourceMapPayload;
}

interface SourceFileWithParseDiagnostics extends ts.SourceFile {
  parseDiagnostics?: readonly ts.Diagnostic[];
}

type AsyncFunctionConstructor = new (...args: string[]) => (...args: unknown[]) => Promise<unknown>;

type ResolveImportResult =
  | {
      status: 'resolved';
      path: string;
    }
  | {
      status: 'blocked';
      path?: string;
      message: string;
    }
  | {
      status: 'notFound';
    };

const importableExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.json']);
const resolvableExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
const commonJSGlobalHosts = new Set(['globalThis', 'global', 'window']);
const commonJSRequireHosts = new Set(['globalThis', 'global', 'window', 'module']);
const runtimeVersionDefault = 'v2';
const runJSSourceURLPrefix = 'nocobase-runjs://bundle/';
const jsRunnerGeneratedCodeLineOffset = 2;
const asyncFunctionConstructor = Object.getPrototypeOf(async function runJSWorkflowSyntaxCheck() {})
  .constructor as AsyncFunctionConstructor;

export function compileRunJSSourceWorkspace(
  input: CompileRunJSSourceWorkspaceInput,
): CompileRunJSSourceWorkspaceResult {
  const entryPath = normalizePath(input.entry);
  const files = contentFilesFromChanges(input.files);
  const diagnostics: RunJSCompileDiagnostic[] = [];
  const modules = new Map<string, RunJSModuleInfo>();
  const orderedPaths: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const visit = (path: string, importer?: { sourceFile: ts.SourceFile; start: number }) => {
    if (visited.has(path)) {
      return;
    }
    if (visiting.has(path)) {
      diagnostics.push(
        diagnosticAt(importer?.sourceFile, importer?.start, {
          code: 'RUNJS_COMPILE_FAILED',
          path,
          message: `Circular import involving "${path}" is not supported`,
        }),
      );
      return;
    }

    const file = files.get(path);
    if (!file) {
      diagnostics.push({
        severity: 'error',
        code: importer ? 'RUNJS_IMPORT_NOT_FOUND' : 'RUNJS_ENTRY_NOT_FOUND',
        path,
        message: importer ? `Import "${path}" could not be resolved` : `Entry file "${path}" was not found`,
      });
      return;
    }
    if (!isImportableExtension(file.path)) {
      diagnostics.push({
        severity: 'error',
        code: 'RUNJS_IMPORT_NOT_ALLOWED',
        path,
        message: `File "${path}" cannot be compiled as RunJS`,
      });
      return;
    }

    visiting.add(path);
    const moduleInfo = analyzeModule(file, diagnostics, path === entryPath);
    modules.set(path, moduleInfo);

    for (const importBinding of moduleInfo.imports) {
      const resolved = resolveRelativeRunJSImport(file.path, importBinding.specifier, files);
      if (resolved.status === 'blocked') {
        diagnostics.push(
          diagnosticAt(moduleInfo.sourceFile, importBinding.start, {
            code: 'RUNJS_IMPORT_NOT_ALLOWED',
            path: file.path,
            message: resolved.message,
          }),
        );
        continue;
      }
      if (resolved.status === 'notFound') {
        diagnostics.push(
          diagnosticAt(moduleInfo.sourceFile, importBinding.start, {
            code: 'RUNJS_IMPORT_NOT_FOUND',
            path: file.path,
            message: `Import "${importBinding.specifier}" could not be resolved`,
          }),
        );
        continue;
      }

      importBinding.targetPath = resolved.path;
      visit(resolved.path, { sourceFile: moduleInfo.sourceFile as ts.SourceFile, start: importBinding.start });
    }

    visiting.delete(path);
    visited.add(path);
    orderedPaths.push(path);
  };

  visit(entryPath);
  validateImportBindings(modules, diagnostics);
  if (!hasErrorDiagnostic(diagnostics)) {
    diagnostics.push(
      ...inspectRunJSSourceWorkspace({
        files: input.files,
        entry: entryPath,
        surfaceStyle: input.surfaceStyle,
        locator: input.locator,
        legacy: input.legacy,
      }),
    );
  }

  const filesHash = buildRunJSFilesHash(input.files);
  let code = '';
  let sourceMap: string | undefined;
  if (!hasErrorDiagnostic(diagnostics)) {
    const runtimeCode = buildRuntimeCode(orderedPaths, modules, entryPath, diagnostics, {
      entryPath,
      sourceURL: buildRunJSSourceURL(filesHash),
    });
    code = appendRunJSSourceURL(runtimeCode.code, runtimeCode.sourceMap.sourceURL);
    sourceMap = JSON.stringify(runtimeCode.sourceMap);
  }
  if (!hasErrorDiagnostic(diagnostics)) {
    collectRuntimeSyntaxDiagnostics(code, entryPath, input.surfaceStyle, diagnostics);
  }
  if (!hasErrorDiagnostic(diagnostics) && input.surfaceStyle !== 'workflow' && input.inspectAuthoring) {
    diagnostics.push(
      ...input.inspectAuthoring({
        code,
        path: entryPath,
        runtimeVersion: input.runtimeVersion || runtimeVersionDefault,
        surfaceStyle: input.surfaceStyle,
        locator: input.locator,
        legacy: input.legacy,
      }),
    );
  }

  return {
    artifact: {
      code,
      sourceMap,
      version: resolveArtifactVersion(input.surfaceStyle, input.runtimeVersion),
      diagnostics,
      filesHash,
      entryPath,
      metadata: {
        entry: entryPath,
        runtimeVersion: resolveArtifactVersion(input.surfaceStyle, input.runtimeVersion),
        surfaceStyle: input.surfaceStyle,
      },
    },
    failureCode: getFailureCode(diagnostics),
  };
}

function contentFilesFromChanges(files: RunJSCompileFileInput[]): Map<string, RunJSContentFile> {
  const contentFiles = new Map<string, RunJSContentFile>();

  for (const file of files) {
    const normalizedPath = normalizePath(file.path);
    if (file.operation === 'delete') {
      contentFiles.delete(normalizedPath);
      continue;
    }
    if (typeof file.content !== 'string') {
      continue;
    }

    contentFiles.set(normalizedPath, {
      path: normalizedPath,
      content: file.content,
      language: file.language,
      extension: pathPosix.extname(normalizedPath),
    });
  }

  return contentFiles;
}

function analyzeModule(
  file: RunJSContentFile,
  diagnostics: RunJSCompileDiagnostic[],
  isEntry: boolean,
): RunJSModuleInfo {
  const defaultExportSymbol = buildInternalSymbol('__runjs_default', file.path);
  const moduleInfo: RunJSModuleInfo = {
    file,
    imports: [],
    namedExports: new Set<string>(),
    hasDefaultExport: file.extension === '.json',
    defaultExportSymbol,
    moduleSymbol: buildInternalSymbol('__runjs_module', file.path),
    isJson: file.extension === '.json',
  };

  if (file.extension === '.json') {
    collectJsonDiagnostics(file, diagnostics);
    return moduleInfo;
  }

  const sourceFile = ts.createSourceFile(
    file.path,
    file.content,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(file.path),
  );
  moduleInfo.sourceFile = sourceFile;
  diagnostics.push(
    ...getSourceFileParseDiagnostics(sourceFile).map((diagnostic) =>
      tsDiagnosticToRunJSDiagnostic(diagnostic, file.path),
    ),
  );
  collectDynamicImportDiagnostics(sourceFile, diagnostics);
  collectRequireImportDiagnostics(sourceFile, diagnostics);
  collectCommonJSExportDiagnostics(sourceFile, diagnostics);
  if (!isEntry) {
    collectNonEntryTopLevelReturnDiagnostics(sourceFile, diagnostics);
  }

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      collectImportDeclaration(statement, sourceFile, moduleInfo, diagnostics);
      continue;
    }
    if (ts.isImportEqualsDeclaration(statement)) {
      diagnostics.push(
        diagnosticAt(sourceFile, statement.getStart(sourceFile), {
          code: 'RUNJS_IMPORT_NOT_ALLOWED',
          path: file.path,
          message: 'TypeScript import equals declarations are not supported in RunJS modules',
        }),
      );
      continue;
    }
    collectExportDeclaration(statement, sourceFile, moduleInfo, diagnostics);
  }

  return moduleInfo;
}

function collectImportDeclaration(
  statement: ts.ImportDeclaration,
  sourceFile: ts.SourceFile,
  moduleInfo: RunJSModuleInfo,
  diagnostics: RunJSCompileDiagnostic[],
): void {
  if (!isRuntimeImportDeclaration(statement)) {
    return;
  }
  const specifier = getStringLiteralText(statement.moduleSpecifier);
  if (!specifier) {
    diagnostics.push(
      diagnosticAt(sourceFile, statement.getStart(sourceFile), {
        code: 'RUNJS_IMPORT_NOT_ALLOWED',
        path: moduleInfo.file.path,
        message: 'Dynamic import specifiers are not supported in RunJS modules',
      }),
    );
    return;
  }
  if (!isRelativeImportSpecifier(specifier)) {
    diagnostics.push(
      diagnosticAt(sourceFile, statement.moduleSpecifier.getStart(sourceFile), {
        code: 'RUNJS_IMPORT_NOT_ALLOWED',
        path: moduleInfo.file.path,
        message: `Import "${specifier}" is not allowed`,
      }),
    );
    return;
  }

  const importClause = statement.importClause;
  const importBinding: ImportBinding = {
    specifier,
    start: statement.moduleSpecifier.getStart(sourceFile),
    defaultName: importClause?.name?.text,
    named: [],
  };

  if (importClause?.namedBindings) {
    if (ts.isNamespaceImport(importClause.namedBindings)) {
      diagnostics.push(
        diagnosticAt(sourceFile, importClause.namedBindings.getStart(sourceFile), {
          code: 'RUNJS_IMPORT_NOT_ALLOWED',
          path: moduleInfo.file.path,
          message: 'Namespace imports are not supported in RunJS modules',
        }),
      );
      return;
    }

    for (const element of importClause.namedBindings.elements) {
      if (element.isTypeOnly) {
        continue;
      }
      const imported = element.propertyName?.text || element.name.text;
      const local = element.name.text;
      if (imported === 'default') {
        importBinding.defaultName = local;
      } else {
        importBinding.named.push({ imported, local });
      }
    }
  }

  moduleInfo.imports.push(importBinding);
}

function collectExportDeclaration(
  statement: ts.Statement,
  sourceFile: ts.SourceFile,
  moduleInfo: RunJSModuleInfo,
  diagnostics: RunJSCompileDiagnostic[],
): void {
  if (ts.isExportDeclaration(statement)) {
    if (statement.isTypeOnly) {
      return;
    }
    diagnostics.push(
      diagnosticAt(sourceFile, statement.getStart(sourceFile), {
        code: 'RUNJS_COMPILE_FAILED',
        path: moduleInfo.file.path,
        message: 'Export lists and re-exports are not supported in RunJS modules',
      }),
    );
    return;
  }

  if (ts.isExportAssignment(statement)) {
    if (statement.isExportEquals) {
      diagnostics.push(
        diagnosticAt(sourceFile, statement.getStart(sourceFile), {
          code: 'RUNJS_COMPILE_FAILED',
          path: moduleInfo.file.path,
          message: 'CommonJS export assignments are not supported in RunJS modules',
        }),
      );
      return;
    }
    moduleInfo.hasDefaultExport = true;
    return;
  }

  if (!hasExportModifier(statement)) {
    return;
  }

  if (hasDefaultModifier(statement)) {
    if (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) {
      moduleInfo.hasDefaultExport = true;
      return;
    }
    diagnostics.push(
      diagnosticAt(sourceFile, statement.getStart(sourceFile), {
        code: 'RUNJS_COMPILE_FAILED',
        path: moduleInfo.file.path,
        message: 'Only default function, class, or expression exports are supported in RunJS modules',
      }),
    );
    return;
  }

  if (ts.isVariableStatement(statement)) {
    if (
      statement.declarationList.flags & ts.NodeFlags.Let ||
      (statement.declarationList.flags & ts.NodeFlags.Const) === 0
    ) {
      diagnostics.push(
        diagnosticAt(sourceFile, statement.declarationList.getStart(sourceFile), {
          code: 'RUNJS_COMPILE_FAILED',
          path: moduleInfo.file.path,
          message: 'Only exported const variable declarations are supported in RunJS modules',
        }),
      );
      return;
    }
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name)) {
        moduleInfo.namedExports.add(declaration.name.text);
        continue;
      }
      diagnostics.push(
        diagnosticAt(sourceFile, declaration.name.getStart(sourceFile), {
          code: 'RUNJS_COMPILE_FAILED',
          path: moduleInfo.file.path,
          message: 'Destructured exported variables are not supported in RunJS modules',
        }),
      );
    }
    return;
  }

  if (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement) || ts.isEnumDeclaration(statement)) {
    if (statement.name) {
      moduleInfo.namedExports.add(statement.name.text);
      return;
    }
  }

  if (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) {
    return;
  }

  diagnostics.push(
    diagnosticAt(sourceFile, statement.getStart(sourceFile), {
      code: 'RUNJS_COMPILE_FAILED',
      path: moduleInfo.file.path,
      message: 'This export form is not supported in RunJS modules',
    }),
  );
}

function collectDynamicImportDiagnostics(sourceFile: ts.SourceFile, diagnostics: RunJSCompileDiagnostic[]): void {
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      diagnostics.push(
        diagnosticAt(sourceFile, node.getStart(sourceFile), {
          code: 'RUNJS_DYNAMIC_IMPORT_UNSUPPORTED',
          path: sourceFile.fileName,
          message: 'Dynamic import(...) is not supported in RunJS modules',
        }),
      );
      return;
    }
    ts.forEachChild(node, visit);
  };

  ts.forEachChild(sourceFile, visit);
}

function collectRequireImportDiagnostics(sourceFile: ts.SourceFile, diagnostics: RunJSCompileDiagnostic[]): void {
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && isRequireCallExpression(node.expression)) {
      const specifier = node.arguments[0] ? getStringLiteralText(node.arguments[0]) : null;
      diagnostics.push(
        diagnosticAt(sourceFile, node.getStart(sourceFile), {
          code: 'RUNJS_IMPORT_NOT_ALLOWED',
          path: sourceFile.fileName,
          message: specifier
            ? `require("${specifier}") is not supported in RunJS modules`
            : 'require(...) is not supported in RunJS modules',
        }),
      );
      return;
    }
    if (isRequirePropertyAccess(node) || isRequireElementAccess(node) || isFreeRequireIdentifier(node)) {
      diagnostics.push(
        diagnosticAt(sourceFile, node.getStart(sourceFile), {
          code: 'RUNJS_IMPORT_NOT_ALLOWED',
          path: sourceFile.fileName,
          message: 'require is not supported in RunJS modules',
        }),
      );
      return;
    }
    ts.forEachChild(node, visit);
  };

  ts.forEachChild(sourceFile, visit);
}

function collectCommonJSExportDiagnostics(sourceFile: ts.SourceFile, diagnostics: RunJSCompileDiagnostic[]): void {
  const visit = (node: ts.Node) => {
    if (isCommonJSExportMutation(node) || isCommonJSExportRuntimeReference(node)) {
      diagnostics.push(
        diagnosticAt(sourceFile, node.getStart(sourceFile), {
          code: 'RUNJS_COMPILE_FAILED',
          path: sourceFile.fileName,
          message: 'CommonJS exports are not supported in RunJS modules',
        }),
      );
      return;
    }
    ts.forEachChild(node, visit);
  };

  ts.forEachChild(sourceFile, visit);
}

function collectNonEntryTopLevelReturnDiagnostics(
  sourceFile: ts.SourceFile,
  diagnostics: RunJSCompileDiagnostic[],
): void {
  const visit = (node: ts.Node) => {
    if (ts.isReturnStatement(node)) {
      diagnostics.push(
        diagnosticAt(sourceFile, node.getStart(sourceFile), {
          code: 'RUNJS_COMPILE_FAILED',
          path: sourceFile.fileName,
          message: 'Top-level return is only supported in the RunJS entry module',
        }),
      );
      return;
    }
    if (isFunctionLikeScope(node)) {
      return;
    }
    ts.forEachChild(node, visit);
  };

  for (const statement of sourceFile.statements) {
    visit(statement);
  }
}

function collectJsonDiagnostics(file: RunJSContentFile, diagnostics: RunJSCompileDiagnostic[]): void {
  try {
    JSON.parse(file.content);
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : 'Invalid JSON';
    diagnostics.push({
      severity: 'error',
      code: 'RUNJS_COMPILE_FAILED',
      path: file.path,
      ...jsonErrorLocation(file.content, message),
      message: `JSON file "${file.path}" is invalid: ${message}`,
    });
  }
}

function collectRuntimeSyntaxDiagnostics(
  code: string,
  entryPath: string,
  surfaceStyle: RunJSSurfaceStyle,
  diagnostics: RunJSCompileDiagnostic[],
): void {
  const syntaxSource = transpileArtifactForSyntaxCheck(code, entryPath, diagnostics);
  if (hasErrorDiagnostic(diagnostics)) {
    return;
  }

  try {
    parseFunctionBody(syntaxSource);
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : 'Invalid JavaScript syntax';
    diagnostics.push({
      severity: 'error',
      code: 'RUNJS_COMPILE_FAILED',
      path: entryPath,
      message: `${
        surfaceStyle === 'workflow' ? 'Workflow JavaScript' : 'RunJS'
      } artifact has invalid syntax: ${message}`,
    });
  }
}

function transpileArtifactForSyntaxCheck(source: string, path: string, diagnostics: RunJSCompileDiagnostic[]): string {
  const result = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      jsxFactory: 'ctx.React.createElement',
      jsxFragmentFactory: 'ctx.React.Fragment',
      module: ts.ModuleKind.None,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: getTranspileFileName(path),
    reportDiagnostics: true,
  });

  diagnostics.push(
    ...(result.diagnostics || [])
      .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
      .map((diagnostic) => tsDiagnosticToRunJSDiagnostic(diagnostic, path)),
  );

  return result.outputText;
}

function validateImportBindings(modules: Map<string, RunJSModuleInfo>, diagnostics: RunJSCompileDiagnostic[]): void {
  for (const moduleInfo of modules.values()) {
    for (const importBinding of moduleInfo.imports) {
      if (!importBinding.targetPath) {
        continue;
      }
      const target = modules.get(importBinding.targetPath);
      if (!target) {
        continue;
      }

      if (importBinding.defaultName && !target.hasDefaultExport) {
        diagnostics.push(
          diagnosticAt(moduleInfo.sourceFile, importBinding.start, {
            code: 'RUNJS_COMPILE_FAILED',
            path: moduleInfo.file.path,
            message: `Import "${importBinding.specifier}" does not provide a default export`,
          }),
        );
      }

      if (target.isJson) {
        continue;
      }
      for (const namedImport of importBinding.named) {
        if (target.namedExports.has(namedImport.imported)) {
          continue;
        }
        diagnostics.push(
          diagnosticAt(moduleInfo.sourceFile, importBinding.start, {
            code: 'RUNJS_COMPILE_FAILED',
            path: moduleInfo.file.path,
            message: `Import "${importBinding.specifier}" does not export "${namedImport.imported}"`,
          }),
        );
      }
    }
  }
}

function buildRuntimeCode(
  orderedPaths: string[],
  modules: Map<string, RunJSModuleInfo>,
  entryPath: string,
  diagnostics: RunJSCompileDiagnostic[],
  options: {
    entryPath: string;
    sourceURL: string;
  },
): RunJSRuntimeCodeBuildResult {
  const chunks: string[] = [];
  const mappings: RunJSTransformedLineMapping[] = [];
  let nextChunkStartLine = 1;

  for (const path of orderedPaths) {
    const moduleInfo = modules.get(path);
    if (!moduleInfo) {
      continue;
    }
    const transformed = transformModuleSource(moduleInfo, modules, path === entryPath);
    const transpiled = transpileRuntimeCode(transformed.code, moduleInfo.file.path, diagnostics);
    const chunk = transpiled.code.trim();
    if (!chunk) {
      continue;
    }
    if (chunks.length > 0) {
      nextChunkStartLine += 1;
    }
    const transformedMappings = new Map(
      transformed.mappings.map((mapping) => [mapping.generatedLine, mapping] as const),
    );
    for (const emittedMapping of transpiled.mappings) {
      const mapping = transformedMappings.get(emittedMapping.transformedLine);
      if (!mapping) {
        continue;
      }
      mappings.push({
        ...mapping,
        generatedLine: nextChunkStartLine + emittedMapping.generatedLine - 1,
      });
    }
    chunks.push(chunk);
    nextChunkStartLine += countLines(chunk);
  }

  return {
    code: chunks.filter(Boolean).join('\n\n'),
    sourceMap: {
      version: 1,
      kind: 'runjs-line-map',
      sourceURL: options.sourceURL,
      entryPath: options.entryPath,
      generatedCodeLineOffset: jsRunnerGeneratedCodeLineOffset,
      mappings,
    },
  };
}

function transformModuleSource(
  moduleInfo: RunJSModuleInfo,
  modules: Map<string, RunJSModuleInfo>,
  isEntry: boolean,
): RunJSTransformedCode {
  if (moduleInfo.isJson) {
    return transformJsonModuleSource(moduleInfo, isEntry);
  }

  const sourceFile = moduleInfo.sourceFile as ts.SourceFile;
  const body: RunJSTransformedCode[] = [createImportAliasDeclarations(moduleInfo, modules)];

  for (const statement of sourceFile.statements) {
    if (
      ts.isImportDeclaration(statement) ||
      ts.isImportEqualsDeclaration(statement) ||
      ts.isExportDeclaration(statement)
    ) {
      continue;
    }
    body.push(transformStatement(sourceFile, statement, moduleInfo));
  }

  if (isEntry) {
    return joinTransformedSegments(body);
  }

  const exportAssignments = createExportAssignments(moduleInfo);
  const bodyCode = joinTransformedSegments(body);
  return joinTransformedSegments([
    transformedGeneratedCode(`const ${moduleInfo.moduleSymbol} = (() => {`),
    transformedGeneratedCode('const __runjs_exports = {};'),
    indentTransformedCode(bodyCode),
    indentTransformedCode(transformedGeneratedCode(exportAssignments)),
    transformedGeneratedCode('return __runjs_exports;'),
    transformedGeneratedCode('})();'),
  ]);
}

function transformJsonModuleSource(moduleInfo: RunJSModuleInfo, isEntry: boolean): RunJSTransformedCode {
  const parsed = JSON.parse(moduleInfo.file.content);
  const jsonLiteral = JSON.stringify(parsed, null, 2);
  const defaultDeclaration = `const ${moduleInfo.defaultExportSymbol} = ${jsonLiteral};`;
  if (isEntry) {
    return transformedSourceCode(defaultDeclaration, moduleInfo.file.path, 1, 1);
  }

  return joinTransformedSegments([
    transformedGeneratedCode(`const ${moduleInfo.moduleSymbol} = (() => {`),
    transformedGeneratedCode('const __runjs_exports = {};'),
    indentTransformedCode(transformedSourceCode(defaultDeclaration, moduleInfo.file.path, 1, 1)),
    indentTransformedCode(transformedGeneratedCode(`__runjs_exports.default = ${moduleInfo.defaultExportSymbol};`)),
    transformedGeneratedCode('return __runjs_exports;'),
    transformedGeneratedCode('})();'),
  ]);
}

function transformedGeneratedCode(code: string): RunJSTransformedCode {
  return {
    code,
    mappings: [],
  };
}

function transformedSourceCode(
  code: string,
  source: string,
  sourceLine: number,
  sourceColumn?: number,
): RunJSTransformedCode {
  return {
    code,
    mappings: code.split('\n').map((_, index) => ({
      generatedLine: index + 1,
      source,
      sourceLine: Math.max(1, sourceLine + index),
      sourceColumn: index === 0 ? sourceColumn : 1,
    })),
  };
}

function joinTransformedSegments(segments: RunJSTransformedCode[]): RunJSTransformedCode {
  const codeParts: string[] = [];
  const mappings: RunJSTransformedLineMapping[] = [];
  let nextLine = 1;

  for (const segment of segments) {
    if (!segment.code) {
      continue;
    }
    codeParts.push(segment.code);
    for (const mapping of segment.mappings) {
      mappings.push({
        ...mapping,
        generatedLine: nextLine + mapping.generatedLine - 1,
      });
    }
    nextLine += countLines(segment.code);
  }

  return {
    code: codeParts.join('\n'),
    mappings,
  };
}

function indentTransformedCode(input: RunJSTransformedCode): RunJSTransformedCode {
  return {
    code: indent(input.code),
    mappings: input.mappings,
  };
}

function transformStatement(
  sourceFile: ts.SourceFile,
  statement: ts.Statement,
  moduleInfo: RunJSModuleInfo,
): RunJSTransformedCode {
  const sourcePosition = sourceFile.getLineAndCharacterOfPosition(statement.getStart(sourceFile));
  if (ts.isExportAssignment(statement)) {
    return transformedSourceCode(
      `const ${moduleInfo.defaultExportSymbol} = ${statement.expression.getText(sourceFile)};`,
      moduleInfo.file.path,
      sourcePosition.line + 1,
      sourcePosition.character + 1,
    );
  }

  let code: string;
  if (hasExportModifier(statement)) {
    code = transformExportedStatement(sourceFile, statement, moduleInfo);
  } else {
    code = getStatementSource(sourceFile, statement);
  }

  return transformedSourceCode(code, moduleInfo.file.path, sourcePosition.line + 1, sourcePosition.character + 1);
}

function transformExportedStatement(
  sourceFile: ts.SourceFile,
  statement: ts.Statement,
  moduleInfo: RunJSModuleInfo,
): string {
  if (hasDefaultModifier(statement) && (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement))) {
    if (statement.name) {
      return [
        removeStatementModifiers(sourceFile, statement, [ts.SyntaxKind.ExportKeyword, ts.SyntaxKind.DefaultKeyword]),
        `const ${moduleInfo.defaultExportSymbol} = ${statement.name.text};`,
      ].join('\n');
    }

    return replaceAnonymousDefaultDeclaration(sourceFile, statement, moduleInfo.defaultExportSymbol);
  }

  return removeStatementModifiers(sourceFile, statement, [ts.SyntaxKind.ExportKeyword]);
}

function replaceAnonymousDefaultDeclaration(
  sourceFile: ts.SourceFile,
  statement: ts.FunctionDeclaration | ts.ClassDeclaration,
  defaultExportSymbol: string,
): string {
  const text = sourceFile.text.slice(statement.getStart(sourceFile), statement.end);
  if (ts.isFunctionDeclaration(statement)) {
    return `${text.replace(
      /^export\s+default\s+(async\s+)?function\b/,
      (_match: string, asyncModifier: string | undefined) =>
        `const ${defaultExportSymbol} = ${asyncModifier || ''}function`,
    )};`;
  }

  return `${text.replace(/^export\s+default\s+class\b/, `const ${defaultExportSymbol} = class`)};`;
}

function createImportAliasDeclarations(
  moduleInfo: RunJSModuleInfo,
  modules: Map<string, RunJSModuleInfo>,
): RunJSTransformedCode {
  const aliases: RunJSTransformedCode[] = [];
  const sourceFile = moduleInfo.sourceFile as ts.SourceFile | undefined;

  for (const importBinding of moduleInfo.imports) {
    if (!importBinding.targetPath) {
      continue;
    }
    const target = modules.get(importBinding.targetPath);
    if (!target) {
      continue;
    }
    const position =
      sourceFile && typeof importBinding.start === 'number'
        ? sourceFile.getLineAndCharacterOfPosition(importBinding.start)
        : null;
    const sourceLine = position ? position.line + 1 : 1;
    const sourceColumn = position ? position.character + 1 : 1;
    if (importBinding.defaultName) {
      aliases.push(
        transformedSourceCode(
          `const ${importBinding.defaultName} = ${target.moduleSymbol}.default;`,
          moduleInfo.file.path,
          sourceLine,
          sourceColumn,
        ),
      );
    }
    for (const namedImport of importBinding.named) {
      const access =
        target.isJson && namedImport.imported !== 'default'
          ? `${target.moduleSymbol}.default.${namedImport.imported}`
          : `${target.moduleSymbol}.${namedImport.imported}`;
      aliases.push(
        transformedSourceCode(
          `const ${namedImport.local} = ${access};`,
          moduleInfo.file.path,
          sourceLine,
          sourceColumn,
        ),
      );
    }
  }

  return joinTransformedSegments(aliases);
}

function createExportAssignments(moduleInfo: RunJSModuleInfo): string {
  const assignments = Array.from(moduleInfo.namedExports)
    .sort()
    .map((name) => `__runjs_exports.${name} = ${name};`);

  if (moduleInfo.hasDefaultExport) {
    assignments.push(`__runjs_exports.default = ${moduleInfo.defaultExportSymbol};`);
  }

  return assignments.join('\n');
}

function transpileRuntimeCode(
  source: string,
  path: string,
  diagnostics: RunJSCompileDiagnostic[],
): RunJSTranspiledCode {
  const result = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.Preserve,
      module: ts.ModuleKind.None,
      sourceMap: true,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: getTranspileFileName(path),
    reportDiagnostics: true,
  });

  diagnostics.push(
    ...(result.diagnostics || [])
      .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
      .map((diagnostic) => tsDiagnosticToRunJSDiagnostic(diagnostic, path)),
  );

  return {
    code: removeTranspileSourceMapComment(result.outputText),
    mappings: parseTranspiledLineMappings(result.sourceMapText),
  };
}

function removeTranspileSourceMapComment(code: string): string {
  return code.replace(/\n?\/\/# sourceMappingURL=[^\n]*\s*$/, '');
}

function parseTranspiledLineMappings(sourceMapText: string | undefined): RunJSEmittedLineMapping[] {
  if (!sourceMapText) {
    return [];
  }

  let sourceMap: unknown;
  try {
    sourceMap = JSON.parse(sourceMapText);
  } catch {
    return [];
  }
  if (!sourceMap || typeof sourceMap !== 'object' || Array.isArray(sourceMap)) {
    return [];
  }

  const mappings = (sourceMap as Record<string, unknown>).mappings;
  if (typeof mappings !== 'string') {
    return [];
  }

  const result: RunJSEmittedLineMapping[] = [];
  let previousSource = 0;
  let previousOriginalLine = 0;

  for (const [generatedLineIndex, line] of mappings.split(';').entries()) {
    let selectedTransformedLine: number | undefined;

    for (const encodedSegment of line.split(',')) {
      if (!encodedSegment) {
        continue;
      }
      const segment = decodeSourceMapVlqSegment(encodedSegment);
      if (!segment || segment.length < 4) {
        continue;
      }

      previousSource += segment[1];
      previousOriginalLine += segment[2];

      if (selectedTransformedLine === undefined && previousSource === 0) {
        selectedTransformedLine = previousOriginalLine + 1;
      }
    }

    if (selectedTransformedLine !== undefined) {
      result.push({
        generatedLine: generatedLineIndex + 1,
        transformedLine: selectedTransformedLine,
      });
    }
  }

  return result;
}

function decodeSourceMapVlqSegment(encoded: string): number[] | null {
  const values: number[] = [];
  let value = 0;
  let shift = 0;

  for (const character of encoded) {
    const digit = sourceMapBase64Value(character);
    if (digit < 0) {
      return null;
    }

    value += (digit & 31) << shift;
    if (digit & 32) {
      shift += 5;
      continue;
    }

    const negative = (value & 1) === 1;
    const decoded = value >> 1;
    values.push(negative ? -decoded : decoded);
    value = 0;
    shift = 0;
  }

  return shift === 0 ? values : null;
}

function sourceMapBase64Value(character: string): number {
  const code = character.charCodeAt(0);
  if (code >= 65 && code <= 90) {
    return code - 65;
  }
  if (code >= 97 && code <= 122) {
    return code - 97 + 26;
  }
  if (code >= 48 && code <= 57) {
    return code - 48 + 52;
  }
  if (character === '+') {
    return 62;
  }
  if (character === '/') {
    return 63;
  }
  return -1;
}

function resolveRelativeRunJSImport(
  fromPath: string,
  specifier: string,
  files: Map<string, RunJSContentFile>,
): ResolveImportResult {
  if (!isRelativeImportSpecifier(specifier)) {
    return {
      status: 'blocked',
      message: `Import "${specifier}" is not allowed`,
    };
  }

  const directory = pathPosix.dirname(fromPath);
  const rawJoinedPath = pathPosix.join(directory === '.' ? '' : directory, specifier);
  let joinedPath: string;
  try {
    joinedPath = normalizePath(pathPosix.normalize(rawJoinedPath));
  } catch {
    return {
      status: 'blocked',
      message: `Import "${specifier}" escapes the RunJS workspace`,
    };
  }

  const exactFile = files.get(joinedPath);
  if (exactFile && !isImportableExtension(exactFile.path)) {
    return {
      status: 'blocked',
      path: exactFile.path,
      message: `Import "${specifier}" targets unsupported file "${exactFile.path}"`,
    };
  }
  if (exactFile) {
    return {
      status: 'resolved',
      path: exactFile.path,
    };
  }

  if (pathPosix.extname(joinedPath)) {
    return {
      status: 'notFound',
    };
  }

  for (const extension of resolvableExtensions) {
    const candidate = `${joinedPath}${extension}`;
    if (files.has(candidate)) {
      return {
        status: 'resolved',
        path: candidate,
      };
    }
  }
  for (const extension of resolvableExtensions) {
    const candidate = pathPosix.join(joinedPath, `index${extension}`);
    if (files.has(candidate)) {
      return {
        status: 'resolved',
        path: candidate,
      };
    }
  }

  return {
    status: 'notFound',
  };
}

function isRequireCallExpression(expression: ts.Expression): boolean {
  return (
    (ts.isIdentifier(expression) && expression.text === 'require') ||
    isRequirePropertyAccess(expression) ||
    isRequireElementAccess(expression)
  );
}

function isRequirePropertyAccess(node: ts.Node): node is ts.PropertyAccessExpression {
  return (
    ts.isPropertyAccessExpression(node) &&
    node.name.text === 'require' &&
    (isCommonJSRequireHost(node.expression) || node.expression.kind === ts.SyntaxKind.ThisKeyword)
  );
}

function isRequireElementAccess(node: ts.Node): node is ts.ElementAccessExpression {
  return (
    ts.isElementAccessExpression(node) &&
    getStringLiteralText(node.argumentExpression) === 'require' &&
    (isCommonJSRequireHost(node.expression) || node.expression.kind === ts.SyntaxKind.ThisKeyword)
  );
}

function isCommonJSExportMutation(node: ts.Node): boolean {
  if (ts.isBinaryExpression(node)) {
    return isAssignmentOperator(node.operatorToken.kind) && isCommonJSExportTarget(node.left);
  }
  if (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) {
    return isCommonJSExportTarget(node.operand);
  }

  return false;
}

function isCommonJSExportRuntimeReference(node: ts.Node): boolean {
  if (isTypeOnlyRequireReference(node)) {
    return false;
  }
  if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
    return isCommonJSExportTarget(node) || isCommonJSExportObject(node) || isCommonJSModuleObject(node);
  }

  return isFreeCommonJSIdentifier(node, 'exports') || isFreeCommonJSIdentifier(node, 'module');
}

function isAssignmentOperator(kind: ts.SyntaxKind): boolean {
  return (
    kind === ts.SyntaxKind.EqualsToken ||
    kind === ts.SyntaxKind.PlusEqualsToken ||
    kind === ts.SyntaxKind.MinusEqualsToken ||
    kind === ts.SyntaxKind.AsteriskEqualsToken ||
    kind === ts.SyntaxKind.AsteriskAsteriskEqualsToken ||
    kind === ts.SyntaxKind.SlashEqualsToken ||
    kind === ts.SyntaxKind.PercentEqualsToken ||
    kind === ts.SyntaxKind.LessThanLessThanEqualsToken ||
    kind === ts.SyntaxKind.GreaterThanGreaterThanEqualsToken ||
    kind === ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken ||
    kind === ts.SyntaxKind.AmpersandEqualsToken ||
    kind === ts.SyntaxKind.BarEqualsToken ||
    kind === ts.SyntaxKind.CaretEqualsToken ||
    kind === ts.SyntaxKind.BarBarEqualsToken ||
    kind === ts.SyntaxKind.AmpersandAmpersandEqualsToken ||
    kind === ts.SyntaxKind.QuestionQuestionEqualsToken
  );
}

function isFreeRequireIdentifier(node: ts.Node): node is ts.Identifier {
  if (!ts.isIdentifier(node) || node.text !== 'require') {
    return false;
  }
  const parent = node.parent;
  if (!parent) {
    return true;
  }
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) {
    return false;
  }
  if (ts.isElementAccessExpression(parent) && parent.argumentExpression === node) {
    return false;
  }
  if (ts.isPropertyAssignment(parent) && parent.name === node) {
    return false;
  }
  if (ts.isShorthandPropertyAssignment(parent)) {
    return true;
  }
  if (isDeclarationName(node) || isTypeOnlyRequireReference(node)) {
    return false;
  }

  return true;
}

function isCommonJSRequireHost(expression: ts.Expression): boolean {
  return ts.isIdentifier(expression) && commonJSRequireHosts.has(expression.text);
}

function isCommonJSExportTarget(expression: ts.Expression): boolean {
  if (ts.isPropertyAccessExpression(expression)) {
    return isModuleExportsExpression(expression) || isCommonJSExportObject(expression.expression);
  }
  if (ts.isElementAccessExpression(expression)) {
    return isModuleExportsElementAccess(expression) || isCommonJSExportObject(expression.expression);
  }

  return false;
}

function isCommonJSExportObject(expression: ts.Expression): boolean {
  return isCommonJSExportsObject(expression) || isCommonJSModuleExportsObject(expression);
}

function isCommonJSExportsObject(expression: ts.Expression): boolean {
  if (ts.isIdentifier(expression)) {
    return expression.text === 'exports';
  }
  if (ts.isPropertyAccessExpression(expression)) {
    return isCommonJSGlobalPropertyAccess(expression, 'exports');
  }
  if (ts.isElementAccessExpression(expression)) {
    return isCommonJSGlobalElementAccess(expression, 'exports');
  }

  return false;
}

function isCommonJSModuleObject(expression: ts.Expression): boolean {
  if (ts.isIdentifier(expression)) {
    return expression.text === 'module';
  }
  if (ts.isPropertyAccessExpression(expression)) {
    return isCommonJSGlobalPropertyAccess(expression, 'module');
  }
  if (ts.isElementAccessExpression(expression)) {
    return isCommonJSGlobalElementAccess(expression, 'module');
  }

  return false;
}

function isCommonJSModuleExportsObject(expression: ts.Expression): boolean {
  if (ts.isPropertyAccessExpression(expression)) {
    return isModuleExportsExpression(expression);
  }
  if (ts.isElementAccessExpression(expression)) {
    return isModuleExportsElementAccess(expression);
  }

  return false;
}

function isModuleExportsExpression(expression: ts.PropertyAccessExpression): boolean {
  return expression.name.text === 'exports' && isCommonJSModuleObject(expression.expression);
}

function isModuleExportsElementAccess(expression: ts.ElementAccessExpression): boolean {
  return (
    getStringLiteralText(expression.argumentExpression) === 'exports' && isCommonJSModuleObject(expression.expression)
  );
}

function isCommonJSGlobalPropertyAccess(expression: ts.PropertyAccessExpression, property: string): boolean {
  return expression.name.text === property && isCommonJSGlobalHost(expression.expression);
}

function isCommonJSGlobalElementAccess(expression: ts.ElementAccessExpression, property: string): boolean {
  return (
    getStringLiteralText(expression.argumentExpression) === property && isCommonJSGlobalHost(expression.expression)
  );
}

function isCommonJSGlobalHost(expression: ts.Expression): boolean {
  return (
    (ts.isIdentifier(expression) && commonJSGlobalHosts.has(expression.text)) ||
    expression.kind === ts.SyntaxKind.ThisKeyword
  );
}

function isFunctionLikeScope(node: ts.Node): boolean {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isConstructorDeclaration(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node)
  );
}

function isFreeCommonJSIdentifier(node: ts.Node, text: 'exports' | 'module'): boolean {
  if (!ts.isIdentifier(node) || node.text !== text) {
    return false;
  }
  if (isDeclarationName(node) || isTypeOnlyRequireReference(node)) {
    return false;
  }
  const parent = node.parent;
  if (
    parent &&
    ((ts.isPropertyAccessExpression(parent) && parent.name === node) ||
      (ts.isElementAccessExpression(parent) && parent.argumentExpression === node) ||
      (ts.isPropertyAssignment(parent) && parent.name === node))
  ) {
    return false;
  }

  return true;
}

function isDeclarationName(node: ts.Identifier): boolean {
  const parent = node.parent;
  return Boolean(
    (ts.isVariableDeclaration(parent) && parent.name === node) ||
      (ts.isParameter(parent) && parent.name === node) ||
      (ts.isFunctionDeclaration(parent) && parent.name === node) ||
      (ts.isClassDeclaration(parent) && parent.name === node) ||
      (ts.isInterfaceDeclaration(parent) && parent.name === node) ||
      (ts.isTypeAliasDeclaration(parent) && parent.name === node),
  );
}

function isTypeOnlyRequireReference(node: ts.Node): boolean {
  let current: ts.Node | undefined = node;
  while (current) {
    if (
      ts.isTypeNode(current) ||
      ts.isTypeAliasDeclaration(current) ||
      ts.isInterfaceDeclaration(current) ||
      ts.isImportTypeNode(current)
    ) {
      return true;
    }
    current = current.parent;
  }

  return false;
}

function isRuntimeImportDeclaration(statement: ts.ImportDeclaration): boolean {
  const importClause = statement.importClause;
  if (!importClause) {
    return true;
  }
  if (importClause.isTypeOnly) {
    return false;
  }
  const namedBindings = importClause.namedBindings;
  if (!importClause.name && namedBindings && ts.isNamedImports(namedBindings)) {
    return namedBindings.elements.length === 0 || namedBindings.elements.some((element) => !element.isTypeOnly);
  }

  return true;
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

  return ts.ScriptKind.TS;
}

function getTranspileFileName(path: string): string {
  if (path.endsWith('.json')) {
    return `${path}.ts`;
  }

  return path;
}

function getStringLiteralText(node: ts.Expression): string | null {
  if (ts.isStringLiteral(node) || isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }

  return null;
}

function isNoSubstitutionTemplateLiteral(node: ts.Node): node is ts.NoSubstitutionTemplateLiteral {
  return node.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral;
}

function getSourceFileParseDiagnostics(sourceFile: ts.SourceFile): readonly ts.Diagnostic[] {
  return (sourceFile as SourceFileWithParseDiagnostics).parseDiagnostics || [];
}

function parseFunctionBody(source: string): (...args: unknown[]) => Promise<unknown> {
  return new asyncFunctionConstructor(source);
}

function isRelativeImportSpecifier(specifier: string): boolean {
  return specifier.startsWith('./') || specifier.startsWith('../');
}

function isImportableExtension(path: string): boolean {
  return importableExtensions.has(pathPosix.extname(path));
}

function hasExportModifier(statement: ts.Statement): boolean {
  return hasModifier(statement, ts.SyntaxKind.ExportKeyword);
}

function hasDefaultModifier(statement: ts.Statement): boolean {
  return hasModifier(statement, ts.SyntaxKind.DefaultKeyword);
}

function hasModifier(statement: ts.Statement, kind: ts.SyntaxKind): boolean {
  return Boolean(
    ts.canHaveModifiers(statement) && ts.getModifiers(statement)?.some((modifier) => modifier.kind === kind),
  );
}

function removeStatementModifiers(
  sourceFile: ts.SourceFile,
  statement: ts.Statement,
  modifierKinds: ts.SyntaxKind[],
): string {
  if (!ts.canHaveModifiers(statement)) {
    return getStatementSource(sourceFile, statement);
  }

  const modifiers = ts.getModifiers(statement) || [];
  const ranges = modifiers
    .filter((modifier) => modifierKinds.includes(modifier.kind))
    .map((modifier) => ({
      start: modifier.getStart(sourceFile),
      end: modifier.end,
    }));

  return removeSourceRanges(sourceFile.text, statement.getStart(sourceFile), statement.end, ranges);
}

function removeSourceRanges(
  source: string,
  start: number,
  end: number,
  ranges: Array<{ start: number; end: number }>,
): string {
  let cursor = start;
  let output = '';
  for (const range of ranges.sort((left, right) => left.start - right.start)) {
    output += source.slice(cursor, range.start);
    cursor = range.end;
  }
  output += source.slice(cursor, end);

  return output;
}

function getStatementSource(sourceFile: ts.SourceFile, statement: ts.Statement): string {
  return sourceFile.text.slice(statement.getStart(sourceFile), statement.end);
}

function diagnosticAt(
  sourceFile: ts.SourceFile | undefined,
  start: number | undefined,
  input: Pick<RunJSCompileDiagnostic, 'code' | 'path' | 'message'>,
): RunJSCompileDiagnostic {
  const lineAndColumn =
    sourceFile && typeof start === 'number' ? sourceFile.getLineAndCharacterOfPosition(start) : null;

  return {
    severity: 'error',
    code: input.code,
    path: input.path,
    line: lineAndColumn ? lineAndColumn.line + 1 : undefined,
    column: lineAndColumn ? lineAndColumn.character + 1 : undefined,
    message: input.message,
  };
}

function tsDiagnosticToRunJSDiagnostic(diagnostic: ts.Diagnostic, fallbackPath: string): RunJSCompileDiagnostic {
  const position =
    diagnostic.file && typeof diagnostic.start === 'number'
      ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
      : null;

  return {
    severity: 'error',
    code: 'RUNJS_COMPILE_FAILED',
    path: fallbackPath,
    line: position ? position.line + 1 : undefined,
    column: position ? position.character + 1 : undefined,
    message: ts.flattenDiagnosticMessageText(diagnostic.messageText, ' '),
  };
}

function jsonErrorLocation(content: string, message: string): Pick<RunJSCompileDiagnostic, 'line' | 'column'> {
  const match = message.match(/position\s+(\d+)/i);
  if (!match) {
    return {};
  }
  const position = Number(match[1]);
  if (!Number.isFinite(position) || position < 0) {
    return {};
  }

  const before = normalizeText(content.slice(0, position));
  const lines = before.split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

function buildInternalSymbol(prefix: string, path: string): string {
  return `${prefix}_${sha256Hex(path).slice(0, 12)}`;
}

function resolveArtifactVersion(surfaceStyle: RunJSSurfaceStyle, runtimeVersion?: string): string {
  if (surfaceStyle === 'workflow') {
    return 'workflow-js';
  }

  return runtimeVersion || runtimeVersionDefault;
}

function hasErrorDiagnostic(diagnostics: RunJSCompileDiagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === 'error');
}

function getFailureCode(diagnostics: RunJSCompileDiagnostic[]): RunJSCompileFailureCode | undefined {
  const firstError = diagnostics.find((diagnostic) => diagnostic.severity === 'error');
  if (!firstError) {
    return undefined;
  }
  if (
    firstError.code === 'RUNJS_ENTRY_NOT_FOUND' ||
    firstError.code === 'RUNJS_IMPORT_NOT_ALLOWED' ||
    firstError.code === 'RUNJS_IMPORT_NOT_FOUND' ||
    firstError.code === 'RUNJS_DYNAMIC_IMPORT_UNSUPPORTED'
  ) {
    return firstError.code;
  }

  return 'RUNJS_COMPILE_FAILED';
}

function countLines(content: string): number {
  if (!content) {
    return 0;
  }

  return content.split('\n').length;
}

function buildRunJSSourceURL(filesHash: string): string {
  return `${runJSSourceURLPrefix}${sha256Hex(filesHash).slice(0, 16)}.js`;
}

function appendRunJSSourceURL(code: string, sourceURL: string): string {
  if (!code) {
    return code;
  }

  return `${code}\n//# sourceURL=${sourceURL}`;
}

function indent(content: string): string {
  if (!content) {
    return '';
  }

  return content
    .split('\n')
    .map((line) => (line ? `  ${line}` : line))
    .join('\n');
}
