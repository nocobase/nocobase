/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Transaction } from '@nocobase/database';
import { buildRunJSFilesHash, type RunJSCompileDiagnostic, type RunJSRuntimeArtifact } from '@nocobase/runjs';
import { compileRunJSSourceWorkspace, type CompileRunJSSourceWorkspaceResult } from '@nocobase/runjs/compiler';
import { randomUUID } from 'crypto';
import { posix as pathPosix } from 'path';
import ts from 'typescript';

import { LIGHT_EXTENSION_ENTRY_DESCRIPTOR_FILE, type LightExtensionKind } from '../../constants';
import { isLightExtensionError } from '../../shared/errors';
import type { LightExtensionDiagnostic } from '../../shared/types';
import { LightExtensionAuditService } from './LightExtensionAuditService';
import {
  LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY,
  LIGHT_EXTENSION_AUTHORING_SURFACES,
  type LightExtensionCompilerBuildIdentity,
  type LightExtensionAuthoringSurfaceSpec,
  type LightExtensionSurfaceStyle,
} from './LightExtensionCompileContract';
import { LightExtensionPermissionService } from './LightExtensionPermissionService';
import type { LightExtensionServiceContext } from './LightExtensionRepoService';
import { hasErrorDiagnostic, sortDiagnostics } from './LightExtensionValidator';

const allowedCompileSdkImports = new Set([
  '@nocobase/light-extension-sdk/client',
  '@nocobase/light-extension-sdk/shared',
]);
const allowedCompileSdkRuntimeHelpers = new Set(['defineSettings', 'assertSettings']);

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

export interface LightExtensionPublishedRuntimeCompileAuditInput {
  repoId: string;
  entryId: string;
  kind: LightExtensionKind;
  entryName: string;
  entryPath: string;
  runtimeVersion: string;
  requestId: string;
  diagnostics: LightExtensionDiagnostic[];
  filesHash?: string;
  artifactEntryPath?: string;
}

export class LightExtensionWorkspaceCompilerBridge {
  constructor(
    private readonly auditService: LightExtensionAuditService,
    private readonly permissionService: LightExtensionPermissionService,
  ) {}

  getCompilerBuildIdentity(): LightExtensionCompilerBuildIdentity {
    return LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY;
  }

  async compileEntry(
    input: LightExtensionWorkspaceCompileInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionWorkspaceCompileResult> {
    const requestId = ctx.requestId || randomUUID();
    const surface = getSurfaceSpec(input.kind);

    if (getCompileOperation(input) === 'compilePreview') {
      try {
        await this.permissionService.assertActionAllowed({
          action: 'compilePreview',
          ctx,
        });
      } catch (error) {
        await this.recordPermissionDenied(input, ctx, requestId, error);
        throw error;
      }
    }

    const preflightDiagnostics = this.validateCompileInput(input, surface);
    if (preflightDiagnostics.length > 0) {
      const result = this.buildBlockedResult(input, surface, preflightDiagnostics, 'LIGHT_EXTENSION_COMPILE_DENIED');
      await this.recordCompileAudit(input, ctx, requestId, result, 'compile_denied');
      return result;
    }
    const compilerSurfaceStyle = surface.compilerSurfaceStyle;
    const runtimeFiles = filterCurrentEntryDescriptor(input);
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
    });
    const result = this.buildCompileResult(input, surface, compiled);
    if (!result.accepted || !ctx.deferSuccessfulCompileAudit) {
      await this.recordCompileAudit(input, ctx, requestId, result, classifyFailureReason(result, compiled.failureCode));
    }
    return result;
  }

  async recordPublishedRuntimeCompileAudit(
    input: LightExtensionPublishedRuntimeCompileAuditInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<void> {
    const surface = getSurfaceSpec(input.kind);
    await this.recordCompileAudit(
      {
        repoId: input.repoId,
        entryId: input.entryId,
        operation: 'runtimeCompile',
        kind: input.kind,
        entryName: input.entryName,
        entryPath: input.entryPath,
        runtimeVersion: input.runtimeVersion,
        files: [],
      },
      ctx,
      input.requestId,
      {
        accepted: true,
        artifact: {
          code: '',
          version: input.runtimeVersion,
          diagnostics: input.diagnostics,
          filesHash: input.filesHash,
          entryPath: input.artifactEntryPath || input.entryPath,
        },
        diagnostics: input.diagnostics,
        surface,
      },
    );
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

  private async recordPermissionDenied(
    input: LightExtensionWorkspaceCompileInput,
    ctx: LightExtensionServiceContext,
    requestId: string,
    error: unknown,
  ): Promise<void> {
    if (!isLightExtensionError(error)) {
      return;
    }

    await this.recordCompileAudit(
      input,
      ctx,
      requestId,
      this.buildBlockedResult(input, getSurfaceSpec(input.kind), [], error.code),
      'permission_denied',
    );
  }

  private async recordCompileAudit(
    input: LightExtensionWorkspaceCompileInput,
    ctx: LightExtensionServiceContext,
    requestId: string,
    result: LightExtensionWorkspaceCompileResult,
    reasonCode?: string,
  ): Promise<void> {
    try {
      const errorCount = result.diagnostics.filter((item) => item.severity === 'error').length;
      const warningCount = result.diagnostics.filter((item) => item.severity === 'warning').length;
      await this.auditService.recordCompileEvent({
        repoId: input.repoId,
        entryId: input.entryId,
        target: 'client',
        kind: input.kind,
        name: input.entryName || inferEntryName(input.entryPath),
        action: getCompileOperation(input),
        result: result.accepted ? 'success' : 'blocked',
        requestId,
        actorUserId: ctx.actorUserId,
        entryPath: input.entryPath,
        surfaceStyle: result.surface.surfaceStyle,
        runtimeVersion: result.artifact.version,
        diagnosticCount: result.diagnostics.length,
        errorCount,
        warningCount,
        diagnostics: result.diagnostics,
        message: result.accepted ? 'Light extension entry compiled' : 'Light extension entry compile rejected',
        reasonCode: result.accepted ? undefined : reasonCode,
        details: {
          failureCode: result.failureCode,
          filesHash: result.artifact.filesHash,
          artifactEntryPath: result.artifact.entryPath,
          requestSource: ctx.requestSource,
          surface: result.surface.surface,
          modelUse: result.surface.modelUse,
        },
        transaction: ctx.transaction as Transaction | undefined,
      });
    } catch {
      // Compile diagnostics must not depend on audit persistence availability.
    }
  }
}

function getCompileOperation(
  input: LightExtensionWorkspaceCompileInput,
): NonNullable<LightExtensionWorkspaceCompileInput['operation']> {
  return input.operation || 'compilePreview';
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

function classifyFailureReason(result: LightExtensionWorkspaceCompileResult, failureCode?: string): string | undefined {
  if (result.accepted) {
    return undefined;
  }
  if (
    failureCode === 'RUNJS_IMPORT_NOT_ALLOWED' ||
    failureCode === 'RUNJS_DYNAMIC_IMPORT_UNSUPPORTED' ||
    failureCode === 'RUNJS_IMPORT_NOT_FOUND'
  ) {
    return 'unsafe_import_denied';
  }
  if (result.failureCode === 'LIGHT_EXTENSION_COMPILE_DENIED') {
    return 'compile_denied';
  }

  return 'compile_failed';
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

function buildSdkImportReplacement(statement: ts.ImportDeclaration, sourceFile: ts.SourceFile): string | null {
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

function rewriteLightExtensionSettingsTypeImports(path: string, content: string, kind: LightExtensionKind): string {
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

function getStringLiteralImportSpecifier(node: ts.Expression): string | null {
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
