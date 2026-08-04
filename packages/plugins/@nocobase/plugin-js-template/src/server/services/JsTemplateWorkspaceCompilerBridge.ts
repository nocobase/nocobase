/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { type RunJSCompileDiagnostic, type RunJSRuntimeArtifact } from '@nocobase/runjs';
import { buildRunJSFilesHash } from '@nocobase/runjs/server';
import type { CompileRunJSSourceWorkspaceResult, RunJSSourceWorkspaceInspector } from '@nocobase/runjs/compiler';
import { loadRunJSCompiler } from '@nocobase/runjs/compiler/loader';
import { createRequire } from 'node:module';
import { posix as pathPosix } from 'path';
import type { Expression, ImportDeclaration, SourceFile } from 'typescript';

import { JS_TEMPLATE_DESCRIPTOR_FILE, type JsTemplateKind } from '../../constants';
import type { JsTemplateDiagnostic } from '../../shared/types';
import {
  JS_TEMPLATE_COMPILER_BUILD_IDENTITY,
  JS_TEMPLATE_AUTHORING_SURFACES,
  type JsTemplateCompilerBuildIdentity,
  type JsTemplateAuthoringSurfaceSpec,
  type JsTemplateSurfaceStyle,
} from './JsTemplateCompileContract';
import { hasErrorDiagnostic, sortDiagnostics } from './JsTemplateValidator';

const allowedCompileSdkImports = new Set(['@nocobase/js-template-sdk/client', '@nocobase/js-template-sdk/shared']);
const allowedCompileSdkRuntimeHelpers = new Set(['defineSettings', 'assertSettings']);
const requireTypeScript = createRequire(__filename);
type TypeScriptModule = typeof import('typescript');
let typescriptModule: TypeScriptModule | undefined;

function getTypeScript(): TypeScriptModule {
  return (typescriptModule ||= requireTypeScript('typescript') as TypeScriptModule);
}

export interface JsTemplateWorkspaceCompileFileInput {
  path: string;
  content?: string;
  language?: string;
  operation?: 'upsert' | 'delete';
}

export interface JsTemplateWorkspaceCompileInput {
  projectId?: string;
  templateId?: string | null;
  operation?: 'compilePreview' | 'runtimeCompile';
  kind: JsTemplateKind;
  templateName?: string;
  entryPath: string;
  surfaceStyle?: JsTemplateSurfaceStyle;
  runtimeVersion?: string;
  files: JsTemplateWorkspaceCompileFileInput[];
}

export interface JsTemplateWorkspaceCompileResult {
  accepted: boolean;
  artifact: RunJSRuntimeArtifact;
  diagnostics: JsTemplateDiagnostic[];
  failureCode?: string;
  surface: JsTemplateAuthoringSurfaceSpec;
}

export interface JsTemplateWorkspaceCompileMetadata {
  target: 'client';
  projectId?: string;
  templateId?: string;
  kind: JsTemplateKind;
  templateName: string;
  modelUse: string;
  surface: string;
  surfaceStyle: JsTemplateSurfaceStyle;
  compilerSurfaceStyle: JsTemplateAuthoringSurfaceSpec['compilerSurfaceStyle'];
}

export interface JsTemplateWorkspaceCompilePreparation {
  accepted: boolean;
  diagnostics: JsTemplateDiagnostic[];
  failureCode?: string;
  surface: JsTemplateAuthoringSurfaceSpec;
  files: JsTemplateWorkspaceCompileFileInput[];
  runtimeVersion: string;
  metadata: JsTemplateWorkspaceCompileMetadata;
}

export interface JsTemplateWorkspaceCompileOptions {
  sourceInspector?: RunJSSourceWorkspaceInspector;
}

export class JsTemplateWorkspaceCompilerBridge {
  getCompilerBuildIdentity(): JsTemplateCompilerBuildIdentity {
    return JS_TEMPLATE_COMPILER_BUILD_IDENTITY;
  }

  prepareEntry(input: JsTemplateWorkspaceCompileInput): JsTemplateWorkspaceCompilePreparation {
    const surface = getSurfaceSpec(input.kind);
    const diagnostics = this.validateCompileInput(input, surface);
    return {
      accepted: !hasErrorDiagnostic(diagnostics),
      diagnostics,
      failureCode: diagnostics.length > 0 ? 'JS_TEMPLATE_COMPILE_DENIED' : undefined,
      surface,
      files: prepareJsTemplateCompileFiles(input.files, input.kind),
      runtimeVersion: input.runtimeVersion || 'v2',
      metadata: buildCompileMetadata(input, surface),
    };
  }

  async compileEntry(
    input: JsTemplateWorkspaceCompileInput,
    options: JsTemplateWorkspaceCompileOptions = {},
  ): Promise<JsTemplateWorkspaceCompileResult> {
    const preparation = this.prepareEntry(input);
    if (!preparation.accepted) {
      return this.buildBlockedResult(input, preparation);
    }
    const runtimeFiles = filterCurrentEntryDescriptor({ entryPath: input.entryPath, files: preparation.files });
    const { compileRunJSSourceWorkspace } = await loadRunJSCompiler();
    const compiled = await compileRunJSSourceWorkspace({
      files: runtimeFiles,
      entry: input.entryPath,
      runtimeVersion: preparation.runtimeVersion,
      surfaceStyle: preparation.surface.compilerSurfaceStyle,
      legacy: {
        version: preparation.runtimeVersion,
        surfaceStyle: preparation.surface.compilerSurfaceStyle,
        language: inferRunJSLanguage(input.entryPath),
        metadata: { ...preparation.metadata },
      },
      sourceInspector: options.sourceInspector,
    });
    return this.buildCompileResult(preparation, compiled);
  }

  private validateCompileInput(
    input: JsTemplateWorkspaceCompileInput,
    surface: JsTemplateAuthoringSurfaceSpec,
  ): JsTemplateDiagnostic[] {
    const diagnostics: JsTemplateDiagnostic[] = [];
    const entryPath = normalizeSourcePath(input.entryPath);

    if (input.surfaceStyle && input.surfaceStyle !== surface.surfaceStyle) {
      diagnostics.push({
        code: 'js_template_surface_mismatch',
        severity: 'error',
        message: `JS Template kind "${input.kind}" must use "${surface.surfaceStyle}" surface`,
        path: entryPath,
        kind: input.kind,
        templateName: input.templateName || inferTemplateName(entryPath),
        details: {
          requestedSurfaceStyle: input.surfaceStyle,
          expectedSurfaceStyle: surface.surfaceStyle,
        },
      });
    }
    if (!input.files.length) {
      diagnostics.push({
        code: 'js_template_compile_files_required',
        severity: 'error',
        message: 'JS Template compile input must include source files',
        path: entryPath,
        kind: input.kind,
        templateName: input.templateName || inferTemplateName(entryPath),
      });
    }

    return sortDiagnostics(diagnostics);
  }

  private buildCompileResult(
    preparation: JsTemplateWorkspaceCompilePreparation,
    compiled: CompileRunJSSourceWorkspaceResult,
  ): JsTemplateWorkspaceCompileResult {
    const diagnostics = sortDiagnostics(compiled.artifact.diagnostics.map((item) => toJsTemplateDiagnostic(item)));
    const artifact: RunJSRuntimeArtifact = {
      ...compiled.artifact,
      metadata: {
        ...compiled.artifact.metadata,
        ...preparation.metadata,
      },
    };

    return {
      accepted: !hasErrorDiagnostic(diagnostics),
      artifact,
      diagnostics,
      failureCode: compiled.failureCode,
      surface: preparation.surface,
    };
  }

  private buildBlockedResult(
    input: JsTemplateWorkspaceCompileInput,
    preparation: JsTemplateWorkspaceCompilePreparation,
  ): JsTemplateWorkspaceCompileResult {
    return {
      accepted: false,
      artifact: {
        code: '',
        version: preparation.runtimeVersion,
        diagnostics: preparation.diagnostics,
        filesHash: buildRunJSFilesHash(filterCurrentEntryDescriptor(input)),
        entryPath: input.entryPath,
        metadata: { ...preparation.metadata },
      },
      diagnostics: preparation.diagnostics,
      failureCode: preparation.failureCode,
      surface: preparation.surface,
    };
  }
}

function buildCompileMetadata(
  input: JsTemplateWorkspaceCompileInput,
  surface: JsTemplateAuthoringSurfaceSpec,
): JsTemplateWorkspaceCompileMetadata {
  return {
    target: 'client',
    projectId: input.projectId,
    templateId: input.templateId || undefined,
    kind: input.kind,
    templateName: input.templateName || inferTemplateName(input.entryPath),
    modelUse: surface.modelUse,
    surface: surface.surface,
    surfaceStyle: surface.surfaceStyle,
    compilerSurfaceStyle: surface.compilerSurfaceStyle,
  };
}

function getSurfaceSpec(kind: JsTemplateKind): JsTemplateAuthoringSurfaceSpec {
  return JS_TEMPLATE_AUTHORING_SURFACES[kind];
}

function toJsTemplateDiagnostic(input: RunJSCompileDiagnostic): JsTemplateDiagnostic {
  return {
    code: input.code || input.ruleId || 'RUNJS_COMPILE_FAILED',
    severity: input.severity === 'warning' ? 'warning' : 'error',
    message: input.message,
    path: input.path,
    line: input.line,
    column: input.column,
    details: {
      ruleId: input.ruleId,
      ...(input.details || {}),
    },
  };
}

function inferRunJSLanguage(path: string): 'typescript' | 'javascript' | 'tsx' | 'jsx' {
  const extension = pathPosix.extname(normalizeSourcePath(path));
  if (extension === '.tsx') {
    return 'tsx';
  }
  if (extension === '.jsx') {
    return 'jsx';
  }
  if (extension === '.js') {
    return 'javascript';
  }

  return 'typescript';
}

function inferTemplateName(path: string): string {
  const normalized = normalizeSourcePath(path);
  const segments = normalized.split('/');
  return segments.length >= 2 ? segments[segments.length - 2] : normalized;
}

function normalizeSourcePath(path: string): string {
  return pathPosix.normalize(path.trim()).replace(/^\.\/+/, '');
}

function prepareJsTemplateCompileFiles(
  files: JsTemplateWorkspaceCompileFileInput[],
  kind: JsTemplateKind,
): JsTemplateWorkspaceCompileFileInput[] {
  return files.map((file) => {
    if (!file.content || !isCompileCodeFile(file.path)) {
      return file;
    }

    return {
      ...file,
      content: rewriteJsTemplateSettingsTypeImports(
        file.path,
        rewriteJsTemplateSdkRuntimeImports(file.path, file.content),
        kind,
      ),
    };
  });
}

function filterCurrentEntryDescriptor(
  input: Pick<JsTemplateWorkspaceCompileInput, 'entryPath' | 'files'>,
): JsTemplateWorkspaceCompileFileInput[] {
  const entryRoot = pathPosix.dirname(normalizeSourcePath(input.entryPath));
  const descriptorPath = `${entryRoot}/${JS_TEMPLATE_DESCRIPTOR_FILE}`;
  return input.files.filter((file) => normalizeSourcePath(file.path) !== descriptorPath);
}

export function rewriteJsTemplateSdkRuntimeImports(path: string, content: string): string {
  const ts = getTypeScript();
  const sourceFile = ts.createSourceFile(
    path,
    content,
    ts.ScriptTarget.Latest,
    true,
    path.endsWith('.tsx') ? ts.ScriptKind.TSX : path.endsWith('.jsx') ? ts.ScriptKind.JSX : ts.ScriptKind.TS,
  );
  let cursor = 0;
  let changed = false;
  let output = '';

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) {
      continue;
    }
    const specifier = getStringLiteralImportSpecifier(statement.moduleSpecifier);
    if (!specifier || !allowedCompileSdkImports.has(specifier)) {
      continue;
    }
    const replacement = buildSdkImportReplacement(statement, sourceFile);
    if (!replacement) {
      continue;
    }

    output += content.slice(cursor, statement.getStart(sourceFile));
    output += replacement;
    cursor = statement.end;
    changed = true;
  }

  if (!changed) {
    return content;
  }

  return `${output}${content.slice(cursor)}`;
}

function buildSdkImportReplacement(statement: ImportDeclaration, sourceFile: SourceFile): string | null {
  const ts = getTypeScript();
  const importClause = statement.importClause;
  if (!importClause || importClause.name || !importClause.namedBindings) {
    return null;
  }
  if (ts.isNamespaceImport(importClause.namedBindings)) {
    return null;
  }

  const typeDeclarations: string[] = [];
  const helperDeclarations: string[] = [];
  for (const element of importClause.namedBindings.elements) {
    const importedName = element.propertyName?.text || element.name.text;
    if (importClause.isTypeOnly || element.isTypeOnly) {
      const declaration = buildSdkTypeDeclaration(importedName, element.name.text);
      if (!declaration) {
        return null;
      }
      typeDeclarations.push(declaration);
      continue;
    }
    if (!allowedCompileSdkRuntimeHelpers.has(importedName)) {
      return null;
    }
    helperDeclarations.push(`function ${element.name.text}(value) { return value; }`);
  }

  if (!typeDeclarations.length && !helperDeclarations.length) {
    return null;
  }

  const replacement: string[] = [];
  replacement.push(...typeDeclarations);
  replacement.push(...helperDeclarations);

  return preserveStatementLineCount(
    replacement.join(' '),
    sourceFile.text.slice(statement.getStart(sourceFile), statement.end),
  );
}

function preserveStatementLineCount(replacement: string, original: string): string {
  const originalLineBreaks = (original.match(/\n/g) || []).length;
  return `${replacement}${'\n'.repeat(originalLineBreaks)}`;
}

function buildSdkTypeDeclaration(importedName: string, localName: string): string | null {
  if (importedName === 'JsTemplate') {
    return `type ${localName} = Record<string, unknown>;`;
  }
  if (importedName === 'JSPageRuntimeFacade') {
    return `type ${localName} = { readonly uid: string; readonly active: boolean; refresh(): Promise<void>; setDocumentTitle(title: string): void };`;
  }
  if (importedName === 'JSFieldContext' || importedName === 'JSItemContext') {
    return `type ${localName}<TSettings = Record<string, unknown>, TValue = unknown> = typeof ctx & { settings: TSettings; value?: TValue };`;
  }
  if (importedName === 'RunJSContext') {
    return `type ${localName}<TSettings = Record<string, unknown>, TInput = unknown> = typeof ctx & { settings: TSettings; input?: TInput };`;
  }
  if (
    importedName === 'JsTemplateSettingsContext' ||
    importedName === 'JsTemplateDataContext' ||
    importedName === 'JSBlockContext' ||
    importedName === 'JSPageContext' ||
    importedName === 'JSActionContext'
  ) {
    return `type ${localName}<TSettings = Record<string, unknown>> = typeof ctx & { settings: TSettings };`;
  }
  return null;
}

export function rewriteJsTemplateSettingsTypeImports(path: string, content: string, kind: JsTemplateKind): string {
  const ts = getTypeScript();
  const sourceFile = ts.createSourceFile(
    path,
    content,
    ts.ScriptTarget.Latest,
    true,
    path.endsWith('.tsx') ? ts.ScriptKind.TSX : path.endsWith('.jsx') ? ts.ScriptKind.JSX : ts.ScriptKind.TS,
  );
  const prefix = `js-template:settings/client/${kind}/`;
  const replacements: Array<{ start: number; end: number; value: string }> = [];

  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      !statement.moduleSpecifier.text.startsWith(prefix)
    ) {
      continue;
    }
    const importClause = statement.importClause;
    if (!importClause?.isTypeOnly || !importClause.namedBindings || !ts.isNamedImports(importClause.namedBindings)) {
      continue;
    }
    const declarations: string[] = [];
    let supported = true;
    for (const element of importClause.namedBindings.elements) {
      const importedName = element.propertyName?.text || element.name.text;
      if (importedName === 'Context' || importedName === 'SettingsContext') {
        declarations.push(`type ${element.name.text} = typeof ctx & { settings: Record<string, unknown> };`);
      } else if (importedName === 'Settings' || importedName === 'SettingsSchemaSummary') {
        declarations.push(`type ${element.name.text} = Record<string, unknown>;`);
      } else {
        supported = false;
        break;
      }
    }
    if (!supported) {
      continue;
    }
    replacements.push({
      start: statement.getStart(sourceFile),
      end: statement.end,
      value: preserveStatementLineCount(
        declarations.join(' '),
        sourceFile.text.slice(statement.getStart(sourceFile), statement.end),
      ),
    });
  }

  return replacements
    .sort((left, right) => right.start - left.start)
    .reduce(
      (current, replacement) =>
        `${current.slice(0, replacement.start)}${replacement.value}${current.slice(replacement.end)}`,
      content,
    );
}

function getStringLiteralImportSpecifier(node: Expression): string | null {
  const ts = getTypeScript();
  if (ts.isStringLiteral(node)) {
    return node.text;
  }
  if (node.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
    return node.getText().slice(1, -1);
  }

  return null;
}

function isCompileCodeFile(path: string): boolean {
  return ['.ts', '.tsx', '.js', '.jsx'].includes(pathPosix.extname(normalizeSourcePath(path)));
}
