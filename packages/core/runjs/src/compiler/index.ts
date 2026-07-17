/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { eachMapping, TraceMap } from '@jridgewell/trace-mapping';
import {
  build as esbuild,
  type Loader,
  type Message,
  type OnResolveArgs,
  type PartialMessage,
  type Plugin,
} from 'esbuild';
import ts from 'typescript';

import {
  buildRunJSFilesHash,
  normalizePath,
  sha256Hex,
  type RunJSCompileDiagnostic,
  type RunJSCompileFailureCode,
  type RunJSCompileFile,
  type RunJSRuntimeArtifact,
  type RunJSSourceAuthoringInspector,
  type RunJSSourceAuthoringLegacyInfo,
  type RunJSSourceLocator,
  type RunJSSurfaceStyle,
} from '..';
import { inspectRunJSSourceWorkspace } from './source-inspection';
import {
  isRunJSImportablePath,
  resolveRunJSBuiltInModule,
  resolveRunJSWorkspaceImport,
  RUNJS_BUILTIN_MODULES,
  runJSVirtualDirname,
  runJSVirtualExtname,
} from './portable';

export * from './source-inspection';
export * from './node-type-library';
export * from './portable';
export * from '../completion-catalog/generator';
export * from '../type-packs/generator';
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

interface RunJSEntryLineMapping {
  sourceLine: number;
  sourceColumn?: number;
}

interface RunJSEntryAdaptation {
  code: string;
  lineMappings: Map<number, RunJSEntryLineMapping>;
}

interface RunJSEntrySegment {
  code: string;
  mappings: Array<{
    generatedLine: number;
    sourceLine: number;
    sourceColumn?: number;
  }>;
}

interface RunJSSourceReplacement {
  start: number;
  end: number;
  content: string;
}

interface RunJSSourceMapPayload {
  version: 1;
  kind: 'runjs-line-map';
  sourceURL: string;
  entryPath: string;
  generatedCodeLineOffset: number;
  mappings: Array<{
    generatedLine: number;
    source: string;
    sourceLine: number;
    sourceColumn?: number;
  }>;
}

interface RunJSBundleOutput {
  code: string;
  sourceMap: RunJSSourceMapPayload;
  warnings: RunJSCompileDiagnostic[];
}

interface RunJSEsbuildMessageDetail {
  runjsDiagnostic: RunJSCompileDiagnostic;
}

type AsyncFunctionConstructor = new (...args: string[]) => (...args: unknown[]) => Promise<unknown>;

const sourceNamespace = 'runjs-source';
const launcherNamespace = 'runjs-launcher';
const launcherPath = '__runjs_launcher__.js';
const entryModuleSpecifier = '__runjs_entry_module__';
const commonJSGlobalHosts = new Set(['globalThis', 'global', 'window']);
const commonJSRequireHosts = new Set(['globalThis', 'global', 'window', 'module']);
const runtimeVersionDefault = 'v2';
const runJSSourceURLPrefix = 'nocobase-runjs://bundle/';
const jsRunnerGeneratedCodeLineOffset = 2;
const asyncFunctionConstructor = Object.getPrototypeOf(async function runJSWorkflowSyntaxCheck() {})
  .constructor as AsyncFunctionConstructor;

export async function compileRunJSSourceWorkspace(
  input: CompileRunJSSourceWorkspaceInput,
): Promise<CompileRunJSSourceWorkspaceResult> {
  const entryPath = normalizePath(input.entry);
  const files = contentFilesFromChanges(input.files);
  const filesHash = buildRunJSFilesHash(input.files);
  const sourceURL = buildRunJSSourceURL(filesHash);
  const diagnostics: RunJSCompileDiagnostic[] = [];
  const entry = files.get(entryPath);

  if (!entry) {
    diagnostics.push({
      severity: 'error',
      code: 'RUNJS_ENTRY_NOT_FOUND',
      path: entryPath,
      message: `Entry file "${entryPath}" was not found`,
    });
  } else if (!isImportableExtension(entry.path)) {
    diagnostics.push({
      severity: 'error',
      code: 'RUNJS_IMPORT_NOT_ALLOWED',
      path: entryPath,
      message: `File "${entryPath}" cannot be compiled as RunJS`,
    });
  }

  let bundled: RunJSBundleOutput | undefined;
  if (!hasErrorDiagnostic(diagnostics) && entry) {
    const entryAdaptation = adaptRunJSEntry(entry);
    try {
      bundled = await buildRunJSBundle(files, entryPath, entryAdaptation, sourceURL);
      diagnostics.push(...bundled.warnings);
    } catch (error) {
      diagnostics.push(...esbuildFailureToDiagnostics(error, entryPath, entryAdaptation));
    }
  }

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

  let code = '';
  let sourceMap: string | undefined;
  if (!hasErrorDiagnostic(diagnostics) && bundled) {
    code = appendRunJSSourceURL(bundled.code, sourceURL);
    sourceMap = JSON.stringify(bundled.sourceMap);
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

  const version = resolveArtifactVersion(input.surfaceStyle, input.runtimeVersion);
  return {
    artifact: {
      code,
      sourceMap,
      version,
      diagnostics,
      filesHash,
      entryPath,
      metadata: {
        entry: entryPath,
        runtimeVersion: version,
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
      extension: runJSVirtualExtname(normalizedPath),
    });
  }

  return contentFiles;
}

async function buildRunJSBundle(
  files: Map<string, RunJSContentFile>,
  entryPath: string,
  entryAdaptation: RunJSEntryAdaptation,
  sourceURL: string,
): Promise<RunJSBundleOutput> {
  const result = await esbuild({
    absWorkingDir: '/',
    banner: {
      js: buildRuntimeRequirePreamble(),
    },
    bundle: true,
    charset: 'utf8',
    entryPoints: [launcherPath],
    format: 'cjs',
    jsx: 'transform',
    jsxFactory: 'ctx.React.createElement',
    jsxFragment: 'ctx.React.Fragment',
    legalComments: 'none',
    logLevel: 'silent',
    outfile: '/runjs-bundle.js',
    platform: 'neutral',
    plugins: [createRunJSWorkspacePlugin(files, entryPath, entryAdaptation)],
    sourcemap: 'external',
    sourcesContent: true,
    target: 'es2020',
    treeShaking: true,
    write: false,
  });

  const outputFiles = result.outputFiles || [];
  const javascript = outputFiles.find((file) => file.path.endsWith('.js'))?.text;
  const standardSourceMap = outputFiles.find((file) => file.path.endsWith('.js.map'))?.text;
  if (typeof javascript !== 'string' || typeof standardSourceMap !== 'string') {
    throw new Error('esbuild did not produce the expected RunJS bundle outputs');
  }

  return {
    code: removeSourceMapComment(javascript).trimEnd(),
    sourceMap: convertSourceMap(standardSourceMap, files, entryPath, entryAdaptation, sourceURL),
    warnings: result.warnings.map((warning) => ({
      ...esbuildMessageToDiagnostic(warning, entryPath, entryAdaptation),
      severity: 'warning',
    })),
  };
}

function createRunJSWorkspacePlugin(
  files: Map<string, RunJSContentFile>,
  entryPath: string,
  entryAdaptation: RunJSEntryAdaptation,
): Plugin {
  return {
    name: 'nocobase-runjs-workspace',
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        if (args.kind === 'entry-point') {
          return { path: launcherPath, namespace: launcherNamespace };
        }
        if (args.namespace === launcherNamespace && args.path === entryModuleSpecifier) {
          return { path: entryPath, namespace: sourceNamespace };
        }
        if (args.namespace !== sourceNamespace) {
          return undefined;
        }

        return resolveWorkspaceImport(args, files, entryPath);
      });

      build.onLoad({ filter: /.*/, namespace: launcherNamespace }, () => ({
        contents: `const __runjs_entry__ = require(${JSON.stringify(
          entryModuleSpecifier,
        )});\nreturn __runjs_entry__.default();`,
        loader: 'js',
        resolveDir: '/',
      }));

      build.onLoad({ filter: /.*/, namespace: sourceNamespace }, (args) => {
        const file = files.get(args.path);
        if (!file) {
          return {
            errors: [
              diagnosticToEsbuildMessage({
                severity: 'error',
                code: 'RUNJS_IMPORT_NOT_FOUND',
                path: args.path,
                message: `Import "${args.path}" could not be resolved`,
              }),
            ],
          };
        }

        const policyDiagnostics = collectModulePolicyDiagnostics(file, file.path === entryPath);
        if (policyDiagnostics.length) {
          return {
            errors: policyDiagnostics.map(diagnosticToEsbuildMessage),
          };
        }

        return {
          contents: file.path === entryPath ? entryAdaptation.code : normalizeModuleSource(file),
          loader: loaderForPath(file.path),
          resolveDir: `/${runJSVirtualDirname(file.path)}`,
        };
      });
    },
  };
}

function resolveWorkspaceImport(args: OnResolveArgs, files: Map<string, RunJSContentFile>, entryPath: string) {
  const importer = normalizeVirtualSourcePath(args.importer);
  const location = findModuleSpecifierLocation(files.get(importer), args.path);

  if (args.kind === 'dynamic-import') {
    return {
      errors: [
        diagnosticToEsbuildMessage({
          severity: 'error',
          code: 'RUNJS_DYNAMIC_IMPORT_UNSUPPORTED',
          path: importer,
          ...location,
          message: 'Dynamic import(...) is not supported in RunJS modules',
        }),
      ],
    };
  }

  if (!isRelativeImportSpecifier(args.path)) {
    const ctxLibName = resolveRunJSBuiltInModule(args.path);
    if (ctxLibName) {
      return { path: args.path, external: true };
    }
    return {
      errors: [
        diagnosticToEsbuildMessage({
          severity: 'error',
          code: 'RUNJS_IMPORT_NOT_ALLOWED',
          path: importer,
          ...location,
          message: `Import "${args.path}" is not allowed`,
        }),
      ],
    };
  }

  const resolved = resolveRelativeRunJSImport(importer, args.path, files);
  if (resolved.status === 'blocked') {
    return {
      errors: [
        diagnosticToEsbuildMessage({
          severity: 'error',
          code: 'RUNJS_IMPORT_NOT_ALLOWED',
          path: importer,
          ...location,
          message: resolved.message,
        }),
      ],
    };
  }
  if (resolved.status === 'notFound') {
    return {
      errors: [
        diagnosticToEsbuildMessage({
          severity: 'error',
          code: 'RUNJS_IMPORT_NOT_FOUND',
          path: importer,
          ...location,
          message: `Import "${args.path}" could not be resolved`,
        }),
      ],
    };
  }
  if (resolved.path === entryPath) {
    return {
      errors: [
        diagnosticToEsbuildMessage({
          severity: 'error',
          code: 'RUNJS_IMPORT_NOT_ALLOWED',
          path: importer,
          ...location,
          message: `Import "${args.path}" cannot target the executable RunJS entry`,
        }),
      ],
    };
  }

  return { path: resolved.path, namespace: sourceNamespace };
}

function adaptRunJSEntry(file: RunJSContentFile): RunJSEntryAdaptation {
  if (file.extension === '.json') {
    const executeSymbol = buildInternalSymbol('__runjs_execute', file.path);
    return joinEntrySegments([
      generatedEntrySegment(`async function ${executeSymbol}() {`),
      sourceEntrySegment(`return ${file.content};`, 1, 1),
      generatedEntrySegment('}'),
      generatedEntrySegment(`export default ${executeSymbol};`),
    ]);
  }

  const sourceFile = ts.createSourceFile(
    file.path,
    file.content,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(file.path),
  );
  const executeSymbol = buildInternalSymbol('__runjs_execute', file.path);
  const defaultSymbol = buildInternalSymbol('__runjs_default', file.path);
  const hoistedSegments: RunJSEntrySegment[] = [];
  const replacements: RunJSSourceReplacement[] = [];

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      const position = sourceFile.getLineAndCharacterOfPosition(statement.getStart(sourceFile));
      const specifier = getStringLiteralText(statement.moduleSpecifier);
      const source =
        specifier && isEmptyRuntimeImport(statement)
          ? `import ${JSON.stringify(specifier)};`
          : sourceFile.text.slice(statement.getStart(sourceFile), statement.end);
      hoistedSegments.push(sourceEntrySegment(source, position.line + 1, position.character + 1));
      replacements.push(blankReplacement(sourceFile, statement));
      continue;
    }
    if (ts.isImportEqualsDeclaration(statement)) {
      replacements.push(blankReplacement(sourceFile, statement));
      continue;
    }
    if (ts.isExportDeclaration(statement)) {
      if (statement.moduleSpecifier) {
        const specifier = getStringLiteralText(statement.moduleSpecifier);
        if (specifier) {
          const position = sourceFile.getLineAndCharacterOfPosition(statement.getStart(sourceFile));
          hoistedSegments.push(
            sourceEntrySegment(`import ${JSON.stringify(specifier)};`, position.line + 1, position.character + 1),
          );
        }
      }
      replacements.push(blankReplacement(sourceFile, statement));
      continue;
    }
    if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
      const original = sourceFile.text.slice(statement.getStart(sourceFile), statement.end);
      const replacement = `const ${defaultSymbol} = ${statement.expression.getText(sourceFile)};`;
      replacements.push({
        start: statement.getStart(sourceFile),
        end: statement.end,
        content: preserveLineCount(original, replacement),
      });
      continue;
    }
    if (!hasExportModifier(statement)) {
      continue;
    }

    if (
      hasDefaultModifier(statement) &&
      (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) &&
      !statement.name
    ) {
      const original = sourceFile.text.slice(statement.getStart(sourceFile), statement.end);
      const replacement = ts.isFunctionDeclaration(statement)
        ? original.replace(
            /^export\s+default\s+(async\s+)?function\b/u,
            (_match, asyncModifier: string | undefined) => `const ${defaultSymbol} = ${asyncModifier || ''}function`,
          )
        : original.replace(/^export\s+default\s+class\b/u, `const ${defaultSymbol} = class`);
      replacements.push({
        start: statement.getStart(sourceFile),
        end: statement.end,
        content: preserveLineCount(original, replacement),
      });
      continue;
    }

    const modifiers = ts.canHaveModifiers(statement) ? ts.getModifiers(statement) : undefined;
    for (const modifier of modifiers || []) {
      if (modifier.kind !== ts.SyntaxKind.ExportKeyword && modifier.kind !== ts.SyntaxKind.DefaultKeyword) {
        continue;
      }
      const original = sourceFile.text.slice(modifier.getStart(sourceFile), modifier.end);
      replacements.push({
        start: modifier.getStart(sourceFile),
        end: modifier.end,
        content: preserveNewlines(original),
      });
    }
  }

  const body = applySourceReplacements(file.content, replacements);
  return joinEntrySegments([
    ...hoistedSegments,
    generatedEntrySegment(`async function ${executeSymbol}() {`),
    sourceEntrySegment(body, 1, 1),
    generatedEntrySegment('}'),
    generatedEntrySegment(`export default ${executeSymbol};`),
  ]);
}

function generatedEntrySegment(code: string): RunJSEntrySegment {
  return { code, mappings: [] };
}

function sourceEntrySegment(code: string, sourceLine: number, sourceColumn?: number): RunJSEntrySegment {
  return {
    code,
    mappings: code.split('\n').map((_, index) => ({
      generatedLine: index + 1,
      sourceLine: sourceLine + index,
      sourceColumn: index === 0 ? sourceColumn : 1,
    })),
  };
}

function joinEntrySegments(segments: RunJSEntrySegment[]): RunJSEntryAdaptation {
  const code: string[] = [];
  const lineMappings = new Map<number, RunJSEntryLineMapping>();
  let nextLine = 1;

  for (const segment of segments) {
    if (!segment.code) {
      continue;
    }
    code.push(segment.code);
    for (const mapping of segment.mappings) {
      lineMappings.set(nextLine + mapping.generatedLine - 1, {
        sourceLine: mapping.sourceLine,
        sourceColumn: mapping.sourceColumn,
      });
    }
    nextLine += countLines(segment.code);
  }

  return {
    code: code.join('\n'),
    lineMappings,
  };
}

function blankReplacement(sourceFile: ts.SourceFile, node: ts.Node): RunJSSourceReplacement {
  const start = node.getStart(sourceFile);
  const original = sourceFile.text.slice(start, node.end);
  return {
    start,
    end: node.end,
    content: preserveNewlines(original),
  };
}

function preserveNewlines(value: string): string {
  return value.replace(/[^\n]/gu, ' ');
}

function preserveLineCount(original: string, replacement: string): string {
  const missingLines = countLines(original) - countLines(replacement);
  if (missingLines <= 0) {
    return replacement;
  }
  return `${replacement}${'\n'.repeat(missingLines)}`;
}

function applySourceReplacements(source: string, replacements: RunJSSourceReplacement[]): string {
  let output = source;
  for (const replacement of [...replacements].sort((left, right) => right.start - left.start)) {
    output = `${output.slice(0, replacement.start)}${replacement.content}${output.slice(replacement.end)}`;
  }
  return output;
}

function normalizeModuleSource(file: RunJSContentFile): string {
  if (file.extension === '.json') {
    return file.content;
  }
  const sourceFile = ts.createSourceFile(
    file.path,
    file.content,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(file.path),
  );
  const replacements: RunJSSourceReplacement[] = [];
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !isEmptyRuntimeImport(statement)) {
      continue;
    }
    const specifier = getStringLiteralText(statement.moduleSpecifier);
    if (!specifier) {
      continue;
    }
    const original = sourceFile.text.slice(statement.getStart(sourceFile), statement.end);
    replacements.push({
      start: statement.getStart(sourceFile),
      end: statement.end,
      content: preserveLineCount(original, `import ${JSON.stringify(specifier)};`),
    });
  }
  return applySourceReplacements(file.content, replacements);
}

function collectModulePolicyDiagnostics(file: RunJSContentFile, isEntry: boolean): RunJSCompileDiagnostic[] {
  if (file.extension === '.json') {
    return [];
  }

  const sourceFile = ts.createSourceFile(
    file.path,
    file.content,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(file.path),
  );
  const diagnostics: RunJSCompileDiagnostic[] = [];
  if (isEntry) {
    diagnostics.push(...collectEntryImportBindingCollisionDiagnostics(sourceFile));
  }
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      diagnostics.push(
        diagnosticAt(sourceFile, node.getStart(sourceFile), {
          code: 'RUNJS_DYNAMIC_IMPORT_UNSUPPORTED',
          path: file.path,
          message: 'Dynamic import(...) is not supported in RunJS modules',
        }),
      );
      return;
    }
    if (ts.isImportEqualsDeclaration(node)) {
      diagnostics.push(
        diagnosticAt(sourceFile, node.getStart(sourceFile), {
          code: 'RUNJS_IMPORT_NOT_ALLOWED',
          path: file.path,
          message: 'TypeScript import equals declarations are not supported in RunJS modules',
        }),
      );
      return;
    }
    if (ts.isExportAssignment(node) && node.isExportEquals) {
      diagnostics.push(
        diagnosticAt(sourceFile, node.getStart(sourceFile), {
          code: 'RUNJS_COMPILE_FAILED',
          path: file.path,
          message: 'CommonJS export assignments are not supported in RunJS modules',
        }),
      );
      return;
    }
    if (ts.isCallExpression(node) && isRequireCallExpression(node.expression)) {
      const specifier = node.arguments[0] ? getStringLiteralText(node.arguments[0]) : null;
      diagnostics.push(
        diagnosticAt(sourceFile, node.getStart(sourceFile), {
          code: 'RUNJS_IMPORT_NOT_ALLOWED',
          path: file.path,
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
          path: file.path,
          message: 'require is not supported in RunJS modules',
        }),
      );
      return;
    }
    if (isCommonJSExportRuntimeReference(node)) {
      diagnostics.push(
        diagnosticAt(sourceFile, node.getStart(sourceFile), {
          code: 'RUNJS_COMPILE_FAILED',
          path: file.path,
          message: 'CommonJS exports are not supported in RunJS modules',
        }),
      );
      return;
    }
    ts.forEachChild(node, visit);
  };

  sourceFile.statements.forEach(visit);
  return deduplicateDiagnostics(diagnostics);
}

function collectEntryImportBindingCollisionDiagnostics(sourceFile: ts.SourceFile): RunJSCompileDiagnostic[] {
  const importedNames = new Set<string>();
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || statement.importClause?.isTypeOnly) {
      continue;
    }
    const importClause = statement.importClause;
    if (importClause?.name) {
      importedNames.add(importClause.name.text);
    }
    if (importClause?.namedBindings && ts.isNamespaceImport(importClause.namedBindings)) {
      importedNames.add(importClause.namedBindings.name.text);
    }
    if (importClause?.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
      for (const element of importClause.namedBindings.elements) {
        if (!element.isTypeOnly) {
          importedNames.add(element.name.text);
        }
      }
    }
  }

  const diagnostics: RunJSCompileDiagnostic[] = [];
  for (const name of importedNames) {
    for (const statement of sourceFile.statements) {
      if (ts.isImportDeclaration(statement)) {
        continue;
      }
      const binding =
        findDirectTopLevelRuntimeBinding(statement, name) || findFunctionScopedVarBinding(statement, name);
      if (!binding) {
        continue;
      }
      diagnostics.push(
        diagnosticAt(sourceFile, binding.getStart(sourceFile), {
          code: 'RUNJS_COMPILE_FAILED',
          path: sourceFile.fileName,
          message: `Identifier "${name}" has already been declared`,
        }),
      );
      break;
    }
  }
  return diagnostics;
}

function deduplicateDiagnostics(diagnostics: RunJSCompileDiagnostic[]): RunJSCompileDiagnostic[] {
  const seen = new Set<string>();
  return diagnostics.filter((diagnostic) => {
    const key = `${diagnostic.code}:${diagnostic.path}:${diagnostic.line}:${diagnostic.column}:${diagnostic.message}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function resolveRelativeRunJSImport(
  fromPath: string,
  specifier: string,
  files: Map<string, RunJSContentFile>,
): ReturnType<typeof resolveRunJSWorkspaceImport> {
  return resolveRunJSWorkspaceImport(fromPath, specifier, files);
}

function findModuleSpecifierLocation(
  file: RunJSContentFile | undefined,
  specifier: string,
): Pick<RunJSCompileDiagnostic, 'line' | 'column'> {
  if (!file || file.extension === '.json') {
    return {};
  }
  const sourceFile = ts.createSourceFile(
    file.path,
    file.content,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(file.path),
  );
  for (const statement of sourceFile.statements) {
    if (
      (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) &&
      statement.moduleSpecifier &&
      getStringLiteralText(statement.moduleSpecifier) === specifier
    ) {
      const position = sourceFile.getLineAndCharacterOfPosition(statement.moduleSpecifier.getStart(sourceFile));
      return { line: position.line + 1, column: position.character + 1 };
    }
    if (
      ts.isImportEqualsDeclaration(statement) &&
      ts.isExternalModuleReference(statement.moduleReference) &&
      statement.moduleReference.expression &&
      getStringLiteralText(statement.moduleReference.expression) === specifier
    ) {
      const position = sourceFile.getLineAndCharacterOfPosition(
        statement.moduleReference.expression.getStart(sourceFile),
      );
      return { line: position.line + 1, column: position.character + 1 };
    }
  }
  return {};
}

function convertSourceMap(
  standardSourceMap: string,
  files: Map<string, RunJSContentFile>,
  entryPath: string,
  entryAdaptation: RunJSEntryAdaptation,
  sourceURL: string,
): RunJSSourceMapPayload {
  const traceMap = new TraceMap(standardSourceMap);
  const mappings: RunJSSourceMapPayload['mappings'] = [];
  const mappedGeneratedLines = new Set<number>();

  eachMapping(traceMap, (mapping) => {
    if (
      mappedGeneratedLines.has(mapping.generatedLine) ||
      !mapping.source ||
      mapping.originalLine === null ||
      mapping.originalColumn === null
    ) {
      return;
    }
    const source = normalizeVirtualSourcePath(mapping.source);
    if (!files.has(source)) {
      return;
    }

    const entryMapping = source === entryPath ? entryAdaptation.lineMappings.get(mapping.originalLine) : undefined;
    if (source === entryPath && !entryMapping) {
      return;
    }
    mappings.push({
      generatedLine: mapping.generatedLine,
      source,
      sourceLine: entryMapping?.sourceLine || mapping.originalLine,
      sourceColumn: entryMapping?.sourceColumn || mapping.originalColumn + 1,
    });
    mappedGeneratedLines.add(mapping.generatedLine);
  });

  return {
    version: 1,
    kind: 'runjs-line-map',
    sourceURL,
    entryPath,
    generatedCodeLineOffset: jsRunnerGeneratedCodeLineOffset,
    mappings,
  };
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

function diagnosticToEsbuildMessage(diagnostic: RunJSCompileDiagnostic): PartialMessage {
  return {
    text: diagnostic.message,
    detail: { runjsDiagnostic: diagnostic } satisfies RunJSEsbuildMessageDetail,
    location:
      diagnostic.path && diagnostic.line && diagnostic.column
        ? {
            file: diagnostic.path,
            line: diagnostic.line,
            column: diagnostic.column - 1,
            length: 1,
            lineText: '',
          }
        : undefined,
  };
}

function esbuildFailureToDiagnostics(
  error: unknown,
  fallbackPath: string,
  entryAdaptation: RunJSEntryAdaptation,
): RunJSCompileDiagnostic[] {
  if (isEsbuildFailure(error)) {
    return error.errors.map((message) => esbuildMessageToDiagnostic(message, fallbackPath, entryAdaptation));
  }
  const message = error instanceof Error && error.message ? error.message : 'RunJS bundling failed';
  return [
    {
      severity: 'error',
      code: 'RUNJS_COMPILE_FAILED',
      path: fallbackPath,
      message,
    },
  ];
}

function isEsbuildFailure(error: unknown): error is { errors: Message[] } {
  return Boolean(error) && typeof error === 'object' && Array.isArray((error as { errors?: unknown }).errors);
}

function esbuildMessageToDiagnostic(
  message: Message,
  fallbackPath: string,
  entryAdaptation?: RunJSEntryAdaptation,
): RunJSCompileDiagnostic {
  const detail = message.detail;
  if (isRunJSEsbuildMessageDetail(detail)) {
    return detail.runjsDiagnostic;
  }

  const source = normalizeVirtualSourcePath(message.location?.file || fallbackPath);
  const entryMapping =
    source === fallbackPath ? entryAdaptation?.lineMappings.get(message.location?.line || 0) : undefined;
  return {
    severity: 'error',
    code: 'RUNJS_COMPILE_FAILED',
    path: filesafeDiagnosticPath(source, fallbackPath),
    line: entryMapping?.sourceLine || message.location?.line,
    column: entryMapping?.sourceColumn || (message.location ? message.location.column + 1 : undefined),
    message: message.text,
  };
}

function isRunJSEsbuildMessageDetail(value: unknown): value is RunJSEsbuildMessageDetail {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const diagnostic = (value as { runjsDiagnostic?: unknown }).runjsDiagnostic;
  return (
    Boolean(diagnostic) &&
    typeof diagnostic === 'object' &&
    typeof (diagnostic as { message?: unknown }).message === 'string'
  );
}

function filesafeDiagnosticPath(path: string, fallbackPath: string): string {
  if (!path || path === launcherPath || path === entryModuleSpecifier) {
    return fallbackPath;
  }
  return path;
}

function collectRuntimeSyntaxDiagnostics(
  code: string,
  entryPath: string,
  surfaceStyle: RunJSSurfaceStyle,
  diagnostics: RunJSCompileDiagnostic[],
): void {
  try {
    new asyncFunctionConstructor(code);
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

function loaderForPath(path: string): Loader {
  if (path.endsWith('.tsx')) return 'tsx';
  if (path.endsWith('.jsx')) return 'jsx';
  if (path.endsWith('.js')) return 'js';
  if (path.endsWith('.json')) return 'json';
  return 'ts';
}

function getScriptKind(path: string): ts.ScriptKind {
  if (path.endsWith('.tsx')) return ts.ScriptKind.TSX;
  if (path.endsWith('.jsx')) return ts.ScriptKind.JSX;
  if (path.endsWith('.js')) return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

function normalizeVirtualSourcePath(path: string): string {
  const withoutNamespace = path.startsWith(`${sourceNamespace}:`) ? path.slice(sourceNamespace.length + 1) : path;
  const withoutRoot = withoutNamespace.replace(/^\/+/, '');
  try {
    return decodeURIComponent(withoutRoot);
  } catch {
    return withoutRoot;
  }
}

function removeSourceMapComment(code: string): string {
  return code.replace(/\n?\/\/# sourceMappingURL=[^\n]*\s*$/u, '');
}

function isRelativeImportSpecifier(specifier: string): boolean {
  return specifier.startsWith('./') || specifier.startsWith('../');
}

function isImportableExtension(path: string): boolean {
  return isRunJSImportablePath(path);
}

function getStringLiteralText(node: ts.Expression): string | null {
  return ts.isStringLiteral(node) || node.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral
    ? (node as ts.StringLiteralLike).text
    : null;
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

function isEmptyRuntimeImport(statement: ts.ImportDeclaration): boolean {
  const importClause = statement.importClause;
  return Boolean(
    importClause &&
      !importClause.isTypeOnly &&
      !importClause.name &&
      importClause.namedBindings &&
      ts.isNamedImports(importClause.namedBindings) &&
      importClause.namedBindings.elements.length === 0,
  );
}

function findDirectTopLevelRuntimeBinding(statement: ts.Statement, name: string): ts.Node | undefined {
  if (ts.isVariableStatement(statement)) {
    for (const declaration of statement.declarationList.declarations) {
      const binding = findBindingIdentifier(declaration.name, name);
      if (binding) return binding;
    }
    return undefined;
  }
  if (
    (ts.isFunctionDeclaration(statement) ||
      ts.isClassDeclaration(statement) ||
      ts.isEnumDeclaration(statement) ||
      ts.isModuleDeclaration(statement)) &&
    statement.name &&
    ts.isIdentifier(statement.name) &&
    statement.name.text === name
  ) {
    return statement.name;
  }
  return undefined;
}

function findFunctionScopedVarBinding(node: ts.Node, name: string): ts.Identifier | undefined {
  if (
    isFunctionLikeScope(node) ||
    ts.isClassDeclaration(node) ||
    ts.isClassExpression(node) ||
    ts.isModuleDeclaration(node)
  ) {
    return undefined;
  }
  if (ts.isVariableDeclarationList(node) && !(node.flags & ts.NodeFlags.BlockScoped)) {
    for (const declaration of node.declarations) {
      const binding = findBindingIdentifier(declaration.name, name);
      if (binding) return binding;
    }
  }

  let binding: ts.Identifier | undefined;
  ts.forEachChild(node, (child) => {
    binding ||= findFunctionScopedVarBinding(child, name);
  });
  return binding;
}

function findBindingIdentifier(bindingName: ts.BindingName, name: string): ts.Identifier | undefined {
  if (ts.isIdentifier(bindingName)) {
    return bindingName.text === name ? bindingName : undefined;
  }
  for (const element of bindingName.elements) {
    if (ts.isOmittedExpression(element)) continue;
    const binding = findBindingIdentifier(element.name, name);
    if (binding) return binding;
  }
  return undefined;
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

function diagnosticAt(
  sourceFile: ts.SourceFile,
  start: number,
  input: Pick<RunJSCompileDiagnostic, 'code' | 'path' | 'message'>,
): RunJSCompileDiagnostic {
  const position = sourceFile.getLineAndCharacterOfPosition(start);
  return {
    severity: 'error',
    code: input.code,
    path: input.path,
    line: position.line + 1,
    column: position.character + 1,
    message: input.message,
  };
}

function buildInternalSymbol(prefix: string, path: string): string {
  return `${prefix}_${sha256Hex(path).slice(0, 12)}`;
}

function resolveArtifactVersion(surfaceStyle: RunJSSurfaceStyle, runtimeVersion?: string): string {
  return surfaceStyle === 'workflow' ? 'workflow-js' : runtimeVersion || runtimeVersionDefault;
}

function hasErrorDiagnostic(diagnostics: RunJSCompileDiagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === 'error');
}

function getFailureCode(diagnostics: RunJSCompileDiagnostic[]): RunJSCompileFailureCode | undefined {
  const firstError = diagnostics.find((diagnostic) => diagnostic.severity === 'error');
  if (!firstError) return undefined;
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
  return content ? content.split('\n').length : 0;
}

function buildRunJSSourceURL(filesHash: string): string {
  return `${runJSSourceURLPrefix}${sha256Hex(filesHash).slice(0, 16)}.js`;
}

function appendRunJSSourceURL(code: string, sourceURL: string): string {
  return code ? `${code}\n//# sourceURL=${sourceURL}` : code;
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

function isFreeRequireIdentifier(node: ts.Node): node is ts.Identifier {
  if (!ts.isIdentifier(node) || node.text !== 'require') return false;
  const parent = node.parent;
  if (!parent) return true;
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) return false;
  if (ts.isElementAccessExpression(parent) && parent.argumentExpression === node) return false;
  if (ts.isPropertyAssignment(parent) && parent.name === node) return false;
  if (isDeclarationName(node) || isTypeOnlyReference(node)) return false;
  return true;
}

function isCommonJSRequireHost(expression: ts.Expression): boolean {
  return ts.isIdentifier(expression) && commonJSRequireHosts.has(expression.text);
}

function isCommonJSExportRuntimeReference(node: ts.Node): boolean {
  if (isTypeOnlyReference(node)) return false;
  if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
    return isCommonJSExportTarget(node) || isCommonJSExportObject(node) || isCommonJSModuleObject(node);
  }
  return isFreeCommonJSIdentifier(node, 'exports') || isFreeCommonJSIdentifier(node, 'module');
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
  if (ts.isIdentifier(expression)) return expression.text === 'exports';
  if (ts.isPropertyAccessExpression(expression)) return isCommonJSGlobalPropertyAccess(expression, 'exports');
  if (ts.isElementAccessExpression(expression)) return isCommonJSGlobalElementAccess(expression, 'exports');
  return false;
}

function isCommonJSModuleObject(expression: ts.Expression): boolean {
  if (ts.isIdentifier(expression)) return expression.text === 'module';
  if (ts.isPropertyAccessExpression(expression)) return isCommonJSGlobalPropertyAccess(expression, 'module');
  if (ts.isElementAccessExpression(expression)) return isCommonJSGlobalElementAccess(expression, 'module');
  return false;
}

function isCommonJSModuleExportsObject(expression: ts.Expression): boolean {
  if (ts.isPropertyAccessExpression(expression)) return isModuleExportsExpression(expression);
  if (ts.isElementAccessExpression(expression)) return isModuleExportsElementAccess(expression);
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

function isFreeCommonJSIdentifier(node: ts.Node, text: 'exports' | 'module'): boolean {
  if (!ts.isIdentifier(node) || node.text !== text) return false;
  if (isDeclarationName(node) || isTypeOnlyReference(node)) return false;
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

function isTypeOnlyReference(node: ts.Node): boolean {
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
