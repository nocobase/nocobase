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
import { createRequire } from 'node:module';
import { posix as pathPosix } from 'path';
import type { Expression, ImportDeclaration, SourceFile } from 'typescript';

import { LIGHT_EXTENSION_ENTRY_DESCRIPTOR_FILE, type LightExtensionKind } from '../../constants';
import type { LightExtensionDiagnostic } from '../../shared/types';
import {
  LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY,
  LIGHT_EXTENSION_AUTHORING_SURFACES,
  type LightExtensionCompilerBuildIdentity,
  type LightExtensionAuthoringSurfaceSpec,
  type LightExtensionSurfaceStyle,
} from './LightExtensionCompileContract';
import { hasErrorDiagnostic, sortDiagnostics } from './LightExtensionValidator';

const allowedCompileSdkImports = new Set([
  '@nocobase/light-extension-sdk/client',
  '@nocobase/light-extension-sdk/shared',
]);
const allowedCompileSdkRuntimeHelpers = new Set(['defineSettings', 'assertSettings']);
const requireTypeScript = createRequire(__filename);
type TypeScriptModule = typeof import('typescript');
let typescriptModule: TypeScriptModule | undefined;

function getTypeScript(): TypeScriptModule {
  return (typescriptModule ||= requireTypeScript('typescript') as TypeScriptModule);
}

export interface LightExtensionWorkspaceCompileFileInput {
  path: string;
  content?: string;
  language?: string;
  operation?: 'upsert' | 'delete';
}

export interface LightExtensionWorkspaceCompileInput {
  repoId?: string;
  entryId?: string | null;
  operation?: 'compilePreview' | 'runtimeCompile';
  kind: LightExtensionKind;
  entryName?: string;
  entryPath: string;
  surfaceStyle?: LightExtensionSurfaceStyle;
  runtimeVersion?: string;
  files: LightExtensionWorkspaceCompileFileInput[];
}

export interface LightExtensionWorkspaceCompileResult {
  accepted: boolean;
  artifact: RunJSRuntimeArtifact;
  diagnostics: LightExtensionDiagnostic[];
  failureCode?: string;
  surface: LightExtensionAuthoringSurfaceSpec;
}

export interface LightExtensionWorkspaceCompileOptions {
  sourceInspector?: RunJSSourceWorkspaceInspector;
}

export class LightExtensionWorkspaceCompilerBridge {
  getCompilerBuildIdentity(): LightExtensionCompilerBuildIdentity {
    return LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY;
  }

  async compileEntry(
    input: LightExtensionWorkspaceCompileInput,
    options: LightExtensionWorkspaceCompileOptions = {},
  ): Promise<LightExtensionWorkspaceCompileResult> {
    const surface = getSurfaceSpec(input.kind);

    const preflightDiagnostics = this.validateCompileInput(input, surface);
    if (preflightDiagnostics.length > 0) {
      return this.buildBlockedResult(input, surface, preflightDiagnostics, 'LIGHT_EXTENSION_COMPILE_DENIED');
    }
    const compilerSurfaceStyle = surface.compilerSurfaceStyle;
    const runtimeFiles = filterCurrentEntryDescriptor(input);
    const { compileRunJSSourceWorkspace } = await import('@nocobase/runjs/compiler');
    const compiled = await compileRunJSSourceWorkspace({
      files: prepareLightExtensionCompileFiles(runtimeFiles, input.kind),
      entry: input.entryPath,
      runtimeVersion: input.runtimeVersion || 'v2',
      surfaceStyle: compilerSurfaceStyle,
      legacy: {
        version: input.runtimeVersion || 'v2',
        surfaceStyle: compilerSurfaceStyle,
        language: inferRunJSLanguage(input.entryPath),
        metadata: {
          target: 'client',
          kind: input.kind,
          entryName: input.entryName || inferEntryName(input.entryPath),
          modelUse: surface.modelUse,
          surface: surface.surface,
        },
      },
      sourceInspector: options.sourceInspector,
    });
    return this.buildCompileResult(input, surface, compiled);
  }

  private validateCompileInput(
    input: LightExtensionWorkspaceCompileInput,
    surface: LightExtensionAuthoringSurfaceSpec,
  ): LightExtensionDiagnostic[] {
    const diagnostics: LightExtensionDiagnostic[] = [];
    const entryPath = normalizeSourcePath(input.entryPath);

    if (input.surfaceStyle && input.surfaceStyle !== surface.surfaceStyle) {
      diagnostics.push({
        code: 'light_extension_surface_mismatch',
        severity: 'error',
        message: `Light extension kind "${input.kind}" must use "${surface.surfaceStyle}" surface`,
        path: entryPath,
        kind: input.kind,
        entryName: input.entryName || inferEntryName(entryPath),
        details: {
          requestedSurfaceStyle: input.surfaceStyle,
          expectedSurfaceStyle: surface.surfaceStyle,
        },
      });
    }
    if (!input.files.length) {
      diagnostics.push({
        code: 'light_extension_compile_files_required',
        severity: 'error',
        message: 'Light extension compile input must include source files',
        path: entryPath,
        kind: input.kind,
        entryName: input.entryName || inferEntryName(entryPath),
      });
    }

    return sortDiagnostics(diagnostics);
  }

  private buildCompileResult(
    input: LightExtensionWorkspaceCompileInput,
    surface: LightExtensionAuthoringSurfaceSpec,
    compiled: CompileRunJSSourceWorkspaceResult,
  ): LightExtensionWorkspaceCompileResult {
    const diagnostics = sortDiagnostics(compiled.artifact.diagnostics.map((item) => toLightExtensionDiagnostic(item)));
    const artifact: RunJSRuntimeArtifact = {
      ...compiled.artifact,
      metadata: {
        ...compiled.artifact.metadata,
        target: 'client',
        repoId: input.repoId,
        entryId: input.entryId || undefined,
        kind: input.kind,
        entryName: input.entryName || inferEntryName(input.entryPath),
        modelUse: surface.modelUse,
        surface: surface.surface,
        surfaceStyle: surface.surfaceStyle,
        compilerSurfaceStyle: surface.compilerSurfaceStyle,
      },
    };

    return {
      accepted: !hasErrorDiagnostic(diagnostics),
      artifact,
      diagnostics,
      failureCode: compiled.failureCode,
      surface,
    };
  }

  private buildBlockedResult(
    input: LightExtensionWorkspaceCompileInput,
    surface: LightExtensionAuthoringSurfaceSpec,
    diagnostics: LightExtensionDiagnostic[],
    failureCode: string,
  ): LightExtensionWorkspaceCompileResult {
    return {
      accepted: false,
      artifact: {
        code: '',
        version: input.runtimeVersion || 'v2',
        diagnostics,
        filesHash: buildRunJSFilesHash(filterCurrentEntryDescriptor(input)),
        entryPath: input.entryPath,
        metadata: {
          target: 'client',
          repoId: input.repoId,
          entryId: input.entryId || undefined,
          kind: input.kind,
          entryName: input.entryName || inferEntryName(input.entryPath),
          modelUse: surface.modelUse,
          surface: surface.surface,
          surfaceStyle: surface.surfaceStyle,
          compilerSurfaceStyle: surface.compilerSurfaceStyle,
        },
      },
      diagnostics,
      failureCode,
      surface,
    };
  }
}

function getSurfaceSpec(kind: LightExtensionKind): LightExtensionAuthoringSurfaceSpec {
  return LIGHT_EXTENSION_AUTHORING_SURFACES[kind];
}

function toLightExtensionDiagnostic(input: RunJSCompileDiagnostic): LightExtensionDiagnostic {
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

function inferEntryName(path: string): string {
  const normalized = normalizeSourcePath(path);
  const segments = normalized.split('/');
  return segments.length >= 2 ? segments[segments.length - 2] : normalized;
}

function normalizeSourcePath(path: string): string {
  return pathPosix.normalize(path.trim()).replace(/^\.\/+/, '');
}

function prepareLightExtensionCompileFiles(
  files: LightExtensionWorkspaceCompileFileInput[],
  kind: LightExtensionKind,
): LightExtensionWorkspaceCompileFileInput[] {
  return files.map((file) => {
    if (!file.content || !isCompileCodeFile(file.path)) {
      return file;
    }

    return {
      ...file,
      content: rewriteLightExtensionSettingsTypeImports(
        file.path,
        rewriteLightExtensionSdkRuntimeImports(file.path, file.content),
        kind,
      ),
    };
  });
}

function filterCurrentEntryDescriptor(
  input: Pick<LightExtensionWorkspaceCompileInput, 'entryPath' | 'files'>,
): LightExtensionWorkspaceCompileFileInput[] {
  const entryRoot = pathPosix.dirname(normalizeSourcePath(input.entryPath));
  const descriptorPath = `${entryRoot}/${LIGHT_EXTENSION_ENTRY_DESCRIPTOR_FILE}`;
  return input.files.filter((file) => normalizeSourcePath(file.path) !== descriptorPath);
}

export function rewriteLightExtensionSdkRuntimeImports(path: string, content: string): string {
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
  if (importedName === 'LightExtensionRecord') {
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
    importedName === 'LightExtensionSettingsContext' ||
    importedName === 'LightExtensionDataContext' ||
    importedName === 'JSBlockContext' ||
    importedName === 'JSPageContext' ||
    importedName === 'JSActionContext'
  ) {
    return `type ${localName}<TSettings = Record<string, unknown>> = typeof ctx & { settings: TSettings };`;
  }
  return null;
}

export function rewriteLightExtensionSettingsTypeImports(
  path: string,
  content: string,
  kind: LightExtensionKind,
): string {
  const ts = getTypeScript();
  const sourceFile = ts.createSourceFile(
    path,
    content,
    ts.ScriptTarget.Latest,
    true,
    path.endsWith('.tsx') ? ts.ScriptKind.TSX : path.endsWith('.jsx') ? ts.ScriptKind.JSX : ts.ScriptKind.TS,
  );
  const prefix = `light-extension:settings/client/${kind}/`;
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
