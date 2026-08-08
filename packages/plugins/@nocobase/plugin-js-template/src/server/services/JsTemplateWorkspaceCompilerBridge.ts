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
import {
  buildJsTemplateSettingsAuthoringContractLookup,
  generateClientSettingsTypes,
  generateInlineClientSettingsTypes,
  isSettingsTypegenDescriptorPath,
  type JsTemplateSettingsTypegenDiagnostic,
  type JsTemplateSettingsTypegenResult,
} from '@nocobase/js-template-sdk/typegen';
import { posix as pathPosix } from 'path';

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
import {
  rewriteJsTemplateAuthoringImports,
  type JsTemplateAuthoringImportDiagnostic,
} from './conversion/jsTemplateAuthoringImports';

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
    const preparedFiles = prepareJsTemplateCompileFiles(input);
    const diagnostics = sortDiagnostics([
      ...this.validateCompileInput(input, surface),
      ...preparedFiles.settingsDiagnostics.map((diagnostic) =>
        toSettingsTypegenDiagnostic(diagnostic, input.kind, input.templateName),
      ),
      ...preparedFiles.diagnostics.map((diagnostic) =>
        toAuthoringImportDiagnostic(diagnostic, input.kind, input.templateName),
      ),
    ]);
    return {
      accepted: !hasErrorDiagnostic(diagnostics),
      diagnostics,
      failureCode: diagnostics.length > 0 ? 'JS_TEMPLATE_COMPILE_DENIED' : undefined,
      surface,
      files: preparedFiles.files,
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
    const runtimeFiles = filterSettingsTypegenDescriptors(preparation.files);
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
        filesHash: buildRunJSFilesHash(filterSettingsTypegenDescriptors(input.files)),
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

function prepareJsTemplateCompileFiles(input: JsTemplateWorkspaceCompileInput): {
  diagnostics: JsTemplateAuthoringImportDiagnostic[];
  files: JsTemplateWorkspaceCompileFileInput[];
  settingsDiagnostics: JsTemplateSettingsTypegenDiagnostic[];
} {
  const settingsTypegen = generateCompileSettingsTypes(input);
  const settingsContracts = buildJsTemplateSettingsAuthoringContractLookup(settingsTypegen.templates);
  const diagnostics: JsTemplateAuthoringImportDiagnostic[] = [];
  const preparedFiles = input.files.map((file) => {
    if (!file.content || !isCompileCodeFile(file.path)) {
      return file;
    }

    const rewritten = rewriteJsTemplateAuthoringImports(file.path, file.content, { settingsContracts });
    diagnostics.push(...rewritten.diagnostics);
    return {
      ...file,
      content: rewritten.content,
    };
  });
  return { diagnostics, files: preparedFiles, settingsDiagnostics: settingsTypegen.diagnostics };
}

function generateCompileSettingsTypes(input: JsTemplateWorkspaceCompileInput): JsTemplateSettingsTypegenResult {
  const files = input.files
    .filter((file) => file.operation !== 'delete')
    .map((file) => ({ path: file.path, content: file.content }));
  const entryRoot = pathPosix.dirname(normalizeSourcePath(input.entryPath));
  if (entryRoot === 'src/client') {
    return generateInlineClientSettingsTypes({
      descriptorPath: `${entryRoot}/${JS_TEMPLATE_DESCRIPTOR_FILE}`,
      files,
      kind: input.kind,
      sourceRoot: entryRoot,
    });
  }
  return generateClientSettingsTypes({ files });
}

function filterSettingsTypegenDescriptors(
  files: JsTemplateWorkspaceCompileFileInput[],
): JsTemplateWorkspaceCompileFileInput[] {
  return files.filter((file) => !isSettingsTypegenDescriptorPath(file.path));
}

function toAuthoringImportDiagnostic(
  diagnostic: JsTemplateAuthoringImportDiagnostic,
  kind: JsTemplateKind,
  templateName?: string,
): JsTemplateDiagnostic {
  return {
    ...diagnostic,
    kind,
    templateName: templateName || inferTemplateName(diagnostic.path),
  };
}

function toSettingsTypegenDiagnostic(
  diagnostic: JsTemplateSettingsTypegenDiagnostic,
  kind: JsTemplateKind,
  templateName?: string,
): JsTemplateDiagnostic {
  return {
    ...diagnostic,
    kind: diagnostic.kind || kind,
    templateName: diagnostic.templateName || templateName,
  };
}

function isCompileCodeFile(path: string): boolean {
  return ['.ts', '.tsx', '.js', '.jsx'].includes(pathPosix.extname(normalizeSourcePath(path)));
}
