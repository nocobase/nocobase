/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model } from '@nocobase/database';
import { randomUUID } from 'crypto';
import { posix as pathPosix } from 'path';

import { JS_TEMPLATE_COLLECTIONS } from '../../constants';
import { JsTemplateError, isJsTemplateError } from '../../shared/errors';
import type {
  JsTemplateCompilePreviewArtifactSummary,
  JsTemplateCompilePreviewTemplateResult,
  JsTemplateCompilePreviewResult,
  JsTemplateDiagnostic,
  JsTemplate,
  JsTemplateWorkspacePreviewInput,
  JsTemplateWorkspacePreviewResult,
  JsTemplateKind,
} from '../../shared/types';
import { JsTemplateAuditService } from './JsTemplateAuditService';
import { compileJsTemplateValidatedTemplate, validateJsTemplateWorkspace } from './JsTemplateCompileContract';
import { templateFromModel } from './JsTemplateService';
import { JsTemplateFileService } from './JsTemplateFileService';
import { JsTemplatePermissionService } from './JsTemplatePermissionService';
import { JsTemplateProjectService, type JsTemplateServiceContext } from './JsTemplateProjectService';
import {
  JsTemplateValidationResult,
  JsTemplateValidator,
  type JsTemplateWorkspaceValidationResult,
  getWorkspaceLevelDiagnostics,
  hasErrorDiagnostic,
  sortDiagnostics,
  toValidatorFiles,
} from './JsTemplateValidator';
import { JsTemplateWorkspaceCompilerBridge } from './JsTemplateWorkspaceCompilerBridge';

export interface JsTemplateCompilePreviewInput {
  projectId: string;
  templateIds?: string[];
}

interface JsTemplateCompilePreviewTarget {
  templateId: string | null;
  projectId: string;
  target: 'client';
  kind?: JsTemplateKind;
  templateName: string;
  entryPath: string | null;
  validationTemplate?: JsTemplateValidationResult;
  diagnostics: JsTemplateDiagnostic[];
  missingReason?: 'template_missing' | 'template_not_found';
}

export class JsTemplateCompilePreviewService {
  constructor(
    private readonly db: Database,
    private readonly auditService: JsTemplateAuditService,
    private readonly fileService: JsTemplateFileService,
    private readonly projectService: JsTemplateProjectService,
    private readonly permissionService: JsTemplatePermissionService,
    private readonly compilerBridge: JsTemplateWorkspaceCompilerBridge,
    private readonly validator = new JsTemplateValidator(),
  ) {}

  async compilePreview(
    input: JsTemplateCompilePreviewInput,
    ctx: JsTemplateServiceContext = {},
  ): Promise<JsTemplateCompilePreviewResult> {
    const requestId = ctx.requestId || randomUUID();
    const previewContext = {
      ...ctx,
      requestId,
      requestSource: ctx.requestSource || 'js-template-compile-preview',
    };

    try {
      await this.permissionService.assertActionAllowed({
        action: 'compilePreview',
        ctx: previewContext,
      });
    } catch (error) {
      await this.recordPreviewPermissionDenied(input.projectId, previewContext, error);
      throw error;
    }

    const pull = await this.fileService.pull(
      {
        projectId: input.projectId,
        includeContent: 'all',
      },
      previewContext,
    );
    const validation = validateJsTemplateWorkspace(this.validator, toValidatorFiles(pull.files || []));
    const workspaceDiagnostics = getWorkspaceLevelDiagnostics(validation.diagnostics);
    const persistedTemplates = await this.listPersistedTemplates(input.projectId, previewContext);
    const targets = buildPreviewTargets(input, validation.templates, persistedTemplates);

    if (hasErrorDiagnostic(workspaceDiagnostics)) {
      const sortedWorkspaceDiagnostics = sortDiagnostics(workspaceDiagnostics);
      const templates = targets.map((target) =>
        buildWorkspaceBlockedTemplateResult(target, sortedWorkspaceDiagnostics),
      );
      const result = {
        project: pull.project,
        commitId: pull.commit?.id || null,
        accepted: false,
        diagnostics: sortUniqueDiagnostics([
          ...sortedWorkspaceDiagnostics,
          ...templates.flatMap((template) => template.diagnostics),
        ]),
        templates,
      };
      await this.recordPreviewResult(input.projectId, previewContext, result, 'validation_failed');
      return result;
    }

    const templates: JsTemplateCompilePreviewTemplateResult[] = [];
    for (const target of targets) {
      if (!target.validationTemplate || hasErrorDiagnostic(target.diagnostics)) {
        const failed = buildSkippedTemplateResult(target);
        templates.push(failed);
        continue;
      }

      const compiled = await compileJsTemplateValidatedTemplate(this.compilerBridge, {
        projectId: input.projectId,
        templateId: target.templateId,
        operation: 'compilePreview',
        template: target.validationTemplate,
        files: pull.files || [],
      });
      templates.push({
        templateId: target.templateId,
        projectId: input.projectId,
        target: 'client',
        kind: target.validationTemplate.kind,
        templateName: target.validationTemplate.templateName,
        entryPath: target.validationTemplate.entryPath,
        status: compiled.accepted ? 'success' : 'failed',
        accepted: compiled.accepted,
        diagnostics: sortDiagnostics([...target.diagnostics, ...compiled.diagnostics]),
        failureCode: compiled.failureCode,
        artifact: compiled.accepted
          ? summarizeArtifact(compiled.artifact, target.validationTemplate.entryPath)
          : undefined,
      });
    }

    const diagnostics = sortUniqueDiagnostics([
      ...workspaceDiagnostics,
      ...templates.flatMap((template) => template.diagnostics),
    ]);

    const result = {
      project: pull.project,
      commitId: pull.commit?.id || null,
      accepted: !hasErrorDiagnostic(diagnostics) && templates.every((template) => template.accepted),
      diagnostics,
      templates,
    };
    const failedTemplate = templates.find((template) => !template.accepted);
    await this.recordPreviewResult(
      input.projectId,
      previewContext,
      result,
      result.accepted
        ? undefined
        : failedTemplate?.failureCode
          ? classifyPreviewFailure(failedTemplate.failureCode)
          : 'validation_failed',
    );
    return result;
  }

  async compileWorkspacePreview(
    input: JsTemplateWorkspacePreviewInput,
    ctx: JsTemplateServiceContext = {},
  ): Promise<JsTemplateWorkspacePreviewResult> {
    const requestId = ctx.requestId || randomUUID();
    const previewContext = {
      ...ctx,
      requestId,
      requestSource: ctx.requestSource || 'js-template-workspace-preview',
    };

    try {
      await this.permissionService.assertActionAllowed({
        action: 'compilePreview',
        ctx: previewContext,
      });
    } catch (error) {
      await this.recordPreviewPermissionDenied(input.projectId, previewContext, error);
      throw error;
    }

    const project = await this.projectService.getProject(input.projectId, previewContext);
    if (typeof input.expectedHeadCommitId !== 'undefined') {
      if (project.headCommitId !== input.expectedHeadCommitId) {
        throw new JsTemplateError('JS_TEMPLATE_SOURCE_OUTDATED', 'JS Template source head is outdated', {
          details: {
            projectId: input.projectId,
            expectedHeadCommitId: input.expectedHeadCommitId,
            currentHeadCommitId: project.headCommitId,
          },
        });
      }
    }

    const previewFiles = input.files;
    const validation = validateJsTemplateWorkspace(this.validator, previewFiles);
    const targetKind = input.kind;
    const targetEntryPath = input.entryPath?.trim();
    if (!targetKind && !targetEntryPath) {
      return this.compileWholeWorkspacePreview(input, validation, previewFiles, previewContext);
    }
    if (!targetKind || !targetEntryPath) {
      const diagnostics = [
        {
          code: 'js_template_preview_target_incomplete',
          severity: 'error',
          message: 'JS Template workspace preview must include both kind and entryPath when targeting a template',
          path: input.entryPath,
          kind: input.kind,
        } satisfies JsTemplateDiagnostic,
      ];
      const result = {
        accepted: false,
        httpStatus: 422 as const,
        diagnostics,
        failureCode: 'JS_TEMPLATE_VALIDATION_FAILED',
      };
      await this.recordPreviewResult(input.projectId, previewContext, result, 'validation_failed');
      return result;
    }

    const workspaceDiagnostics = getWorkspaceLevelDiagnostics(validation.diagnostics);
    const normalizedEntryPath = normalizeSourcePath(targetEntryPath);
    const validationTemplate = validation.templates.find(
      (template) => template.kind === targetKind && normalizeSourcePath(template.entryPath) === normalizedEntryPath,
    );
    const templateDiagnostics = validationTemplate
      ? validationTemplate.diagnostics
      : [
          {
            code: 'template_not_found',
            severity: 'error',
            message: `JS Template source "${normalizedEntryPath}" was not found`,
            path: normalizedEntryPath,
            kind: targetKind,
            templateName: inferTemplateName(normalizedEntryPath),
          } satisfies JsTemplateDiagnostic,
        ];
    const validationDiagnostics = sortUniqueDiagnostics([...workspaceDiagnostics, ...templateDiagnostics]);
    if (!validationTemplate || hasErrorDiagnostic(validationDiagnostics)) {
      await this.recordCompileAuditBestEffort({
        projectId: input.projectId,
        templateId: input.templateId,
        target: 'client',
        kind: targetKind,
        name: validationTemplate?.templateName || inferTemplateName(normalizedEntryPath),
        entryPath: normalizedEntryPath,
        ctx: previewContext,
        result: 'blocked',
        reasonCode: validationTemplate ? 'validation_failed' : 'template_not_found',
        diagnostics: validationDiagnostics,
        message: 'JS Template workspace preview validation failed',
        details: {
          requestSource: previewContext.requestSource,
        },
      });
      return {
        accepted: false,
        httpStatus: 422,
        diagnostics: validationDiagnostics,
        failureCode: 'JS_TEMPLATE_VALIDATION_FAILED',
      };
    }

    const compiled = await compileJsTemplateValidatedTemplate(this.compilerBridge, {
      projectId: input.projectId,
      templateId: input.templateId,
      operation: 'compilePreview',
      template: validationTemplate,
      runtimeVersion: input.runtimeVersion,
      files: previewFiles,
    });
    const diagnostics = sortUniqueDiagnostics([...validationDiagnostics, ...compiled.diagnostics]);

    const accepted = compiled.accepted && !hasErrorDiagnostic(diagnostics);
    const result = {
      accepted,
      httpStatus: accepted ? (200 as const) : (422 as const),
      diagnostics,
      failureCode: compiled.failureCode,
      artifact: compiled.accepted
        ? {
            code: compiled.artifact.code,
            sourceMap: compiled.artifact.sourceMap,
            runtimeVersion: compiled.artifact.version,
            entryPath: compiled.artifact.entryPath || validationTemplate.entryPath,
            filesHash: compiled.artifact.filesHash,
            diagnostics,
            metadata: compiled.artifact.metadata,
          }
        : undefined,
    };
    await this.recordPreviewResult(
      input.projectId,
      previewContext,
      result,
      accepted ? undefined : classifyPreviewFailure(compiled.failureCode),
      {
        templateId: input.templateId,
        target: 'client',
        kind: targetKind,
        templateName: validationTemplate.templateName,
        entryPath: validationTemplate.entryPath,
      },
    );
    return result;
  }

  private async compileWholeWorkspacePreview(
    input: JsTemplateWorkspacePreviewInput,
    validation: JsTemplateWorkspaceValidationResult,
    files: JsTemplateWorkspacePreviewInput['files'],
    ctx: JsTemplateServiceContext,
  ): Promise<JsTemplateWorkspacePreviewResult> {
    const workspaceDiagnostics = getWorkspaceLevelDiagnostics(validation.diagnostics);
    const persistedTemplates = await this.listPersistedTemplates(input.projectId, ctx);
    const persistedTemplateIds = new Map(
      persistedTemplates.map((template) => [`${template.kind}:${template.templateName}`, template.id] as const),
    );
    const templates: JsTemplateCompilePreviewTemplateResult[] = [];

    for (const validationTemplate of validation.templates) {
      const validationDiagnostics = sortUniqueDiagnostics([...workspaceDiagnostics, ...validationTemplate.diagnostics]);
      const templateId =
        persistedTemplateIds.get(`${validationTemplate.kind}:${validationTemplate.templateName}`) || null;
      const persistedTemplate = persistedTemplates.find(
        (template) =>
          template.kind === validationTemplate.kind && template.templateName === validationTemplate.templateName,
      );
      if (hasErrorDiagnostic(validationDiagnostics)) {
        templates.push({
          templateId,
          projectId: input.projectId,
          target: 'client',
          kind: validationTemplate.kind,
          templateName: validationTemplate.templateName,
          entryPath: validationTemplate.entryPath,
          status: 'failed',
          accepted: false,
          diagnostics: validationDiagnostics,
          failureCode: 'JS_TEMPLATE_VALIDATION_FAILED',
        });
        continue;
      }

      const runtimeVersion = input.runtimeVersion || persistedTemplate?.runtimeVersion || 'v2';
      const compiled = await compileJsTemplateValidatedTemplate(this.compilerBridge, {
        projectId: input.projectId,
        templateId,
        operation: 'compilePreview',
        template: validationTemplate,
        runtimeVersion,
        files,
      });
      const diagnostics = sortUniqueDiagnostics([...validationDiagnostics, ...compiled.diagnostics]);
      const accepted = compiled.accepted && !hasErrorDiagnostic(diagnostics);
      templates.push({
        templateId,
        projectId: input.projectId,
        target: 'client',
        kind: validationTemplate.kind,
        templateName: validationTemplate.templateName,
        entryPath: validationTemplate.entryPath,
        status: compiled.accepted ? 'success' : 'failed',
        accepted,
        diagnostics,
        failureCode: compiled.failureCode,
        artifact: compiled.accepted ? summarizeArtifact(compiled.artifact, validationTemplate.entryPath) : undefined,
      });
    }

    const diagnostics = sortUniqueDiagnostics([
      ...workspaceDiagnostics,
      ...templates.flatMap((template) => template.diagnostics),
    ]);
    const accepted = !hasErrorDiagnostic(diagnostics) && templates.every((template) => template.accepted);
    const result = {
      accepted,
      httpStatus: accepted
        ? (200 as const)
        : templates.some((template) => template.accepted)
          ? (207 as const)
          : (422 as const),
      diagnostics,
      templates,
      failureCode: accepted
        ? undefined
        : templates.find((template) => !template.accepted)?.failureCode || 'JS_TEMPLATE_VALIDATION_FAILED',
    };
    await this.recordPreviewResult(
      input.projectId,
      ctx,
      result,
      accepted ? undefined : classifyPreviewFailure(result.failureCode),
    );
    return result;
  }

  private async listPersistedTemplates(projectId: string, ctx: JsTemplateServiceContext): Promise<JsTemplate[]> {
    const records = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.templates).find({
      filter: {
        projectId,
      },
      sort: ['target', 'kind', 'templateName'],
      transaction: ctx.transaction,
    });

    return records.map((record: Model) => templateFromModel(record));
  }

  private async recordPreviewPermissionDenied(
    projectId: string,
    ctx: JsTemplateServiceContext,
    error: unknown,
  ): Promise<void> {
    if (!isJsTemplateError(error)) {
      return;
    }

    await this.recordCompileAuditBestEffort({
      projectId,
      ctx,
      result: 'blocked',
      reasonCode: 'permission_denied',
      diagnostics: [
        {
          code: error.code,
          severity: 'error',
          message: error.message,
        },
      ],
      message: 'JS Template compile preview permission denied',
      details: {
        requestSource: ctx.requestSource,
      },
    });
  }

  private async recordPreviewResult(
    projectId: string,
    ctx: JsTemplateServiceContext,
    result: Pick<JsTemplateWorkspacePreviewResult, 'accepted' | 'diagnostics'> & {
      templates?: JsTemplateCompilePreviewTemplateResult[];
      failureCode?: string;
    },
    reasonCode?: string,
    target?: {
      templateId?: string | null;
      target: string;
      kind: string;
      templateName: string;
      entryPath: string;
    },
  ): Promise<void> {
    const template = target || (result.templates?.length === 1 ? result.templates[0] : undefined);
    await this.recordCompileAuditBestEffort({
      projectId,
      templateId: template?.templateId,
      target: template?.target,
      kind: template?.kind,
      name: template?.templateName,
      entryPath: template?.entryPath || undefined,
      ctx,
      result: result.accepted ? 'success' : 'blocked',
      reasonCode,
      diagnostics: result.diagnostics,
      message: result.accepted ? 'JS Template workspace preview compiled' : 'JS Template workspace preview rejected',
      details: {
        requestSource: ctx.requestSource,
        failureCode: result.failureCode,
        templateCount: result.templates?.length || (target ? 1 : 0),
        templates: result.templates?.map((item) => ({
          templateId: item.templateId,
          templateName: item.templateName,
          kind: item.kind,
          accepted: item.accepted,
          failureCode: item.failureCode,
        })),
      },
    });
  }

  private async recordCompileAuditBestEffort(input: {
    projectId: string;
    templateId?: string | null;
    target?: string;
    kind?: string;
    name?: string;
    entryPath?: string;
    ctx: JsTemplateServiceContext;
    result: 'success' | 'blocked';
    reasonCode?: string;
    diagnostics: JsTemplateDiagnostic[];
    message: string;
    details?: Record<string, unknown>;
  }): Promise<void> {
    try {
      const errorCount = input.diagnostics.filter((item) => item.severity === 'error').length;
      const warningCount = input.diagnostics.filter((item) => item.severity === 'warning').length;
      await this.auditService.recordCompileEvent({
        projectId: input.projectId,
        templateId: input.templateId,
        target: input.target,
        kind: input.kind,
        name: input.name,
        action: 'compilePreview',
        result: input.result,
        requestId: input.ctx.requestId || randomUUID(),
        actorUserId: input.ctx.actorUserId,
        entryPath: input.entryPath,
        diagnosticCount: input.diagnostics.length,
        errorCount,
        warningCount,
        diagnostics: input.diagnostics,
        reasonCode: input.reasonCode,
        message: input.message,
        details: input.details,
        transaction: input.ctx.transaction,
      });
    } catch {
      // Preview diagnostics must not depend on audit persistence availability.
    }
  }
}

function buildPreviewTargets(
  input: JsTemplateCompilePreviewInput,
  validationTemplates: JsTemplateValidationResult[],
  persistedTemplates: JsTemplate[],
): JsTemplateCompilePreviewTarget[] {
  const persistedById = new Map(persistedTemplates.map((template) => [template.id, template]));
  const persistedByKey = new Map(persistedTemplates.map((template) => [templateKey(template), template]));
  const validationByKey = new Map(validationTemplates.map((template) => [templateKey(template), template]));

  if (input.templateIds?.length) {
    return input.templateIds.map((templateId) => {
      const persisted = persistedById.get(templateId);
      if (!persisted) {
        return buildUnknownTemplateTarget(input.projectId, templateId);
      }

      const validationTemplate = validationByKey.get(templateKey(persisted));
      if (!validationTemplate) {
        return buildMissingPersistedTemplateTarget(persisted);
      }

      return buildValidationTemplateTarget(input.projectId, validationTemplate, persisted);
    });
  }

  const targets = validationTemplates.map((template) =>
    buildValidationTemplateTarget(input.projectId, template, persistedByKey.get(templateKey(template))),
  );
  const validationKeys = new Set(validationTemplates.map(templateKey));
  for (const persisted of persistedTemplates) {
    if (!validationKeys.has(templateKey(persisted))) {
      targets.push(buildMissingPersistedTemplateTarget(persisted));
    }
  }

  return targets.sort((left, right) =>
    [left.target, left.kind, left.templateName, left.templateId || '']
      .join('\u0000')
      .localeCompare([right.target, right.kind, right.templateName, right.templateId || ''].join('\u0000')),
  );
}

function buildValidationTemplateTarget(
  projectId: string,
  validationTemplate: JsTemplateValidationResult,
  persisted?: JsTemplate,
): JsTemplateCompilePreviewTarget {
  return {
    templateId: persisted?.id || null,
    projectId,
    target: 'client',
    kind: validationTemplate.kind,
    templateName: validationTemplate.templateName,
    entryPath: validationTemplate.entryPath,
    validationTemplate,
    diagnostics: validationTemplate.diagnostics,
  };
}

function buildMissingPersistedTemplateTarget(template: JsTemplate): JsTemplateCompilePreviewTarget {
  const diagnostic = {
    code: 'template_missing',
    severity: 'error',
    message: 'JS Template source files were not found during compile preview',
    path: template.entryPath,
    kind: template.kind,
    templateName: template.templateName,
  } satisfies JsTemplateDiagnostic;

  return {
    templateId: template.id,
    projectId: template.projectId,
    target: 'client',
    kind: template.kind,
    templateName: template.templateName,
    entryPath: template.entryPath,
    diagnostics: [diagnostic],
    missingReason: 'template_missing',
  };
}

function buildUnknownTemplateTarget(projectId: string, templateId: string): JsTemplateCompilePreviewTarget {
  const diagnostic = {
    code: 'template_not_found',
    severity: 'error',
    message: `JS Template "${templateId}" was not found`,
    templateName: templateId,
  } satisfies JsTemplateDiagnostic;

  return {
    templateId,
    projectId,
    target: 'client',
    templateName: templateId,
    entryPath: null,
    diagnostics: [diagnostic],
    missingReason: 'template_not_found',
  };
}

function buildSkippedTemplateResult(target: JsTemplateCompilePreviewTarget): JsTemplateCompilePreviewTemplateResult {
  return {
    templateId: target.templateId,
    projectId: target.projectId,
    target: target.target,
    ...(target.kind ? { kind: target.kind } : {}),
    templateName: target.templateName,
    entryPath: target.entryPath,
    status: 'skipped',
    accepted: false,
    diagnostics: sortDiagnostics(target.diagnostics),
  };
}

function buildWorkspaceBlockedTemplateResult(
  target: JsTemplateCompilePreviewTarget,
  workspaceDiagnostics: JsTemplateDiagnostic[],
): JsTemplateCompilePreviewTemplateResult {
  return {
    templateId: target.templateId,
    projectId: target.projectId,
    target: target.target,
    ...(target.kind ? { kind: target.kind } : {}),
    templateName: target.templateName,
    entryPath: target.entryPath,
    status: target.validationTemplate ? 'failed' : 'skipped',
    accepted: false,
    diagnostics: sortDiagnostics([...target.diagnostics, ...workspaceDiagnostics]),
    failureCode: 'JS_TEMPLATE_VALIDATION_FAILED',
  };
}

function summarizeArtifact(
  input: {
    version: string;
    entryPath?: string;
    filesHash?: string;
    metadata?: Record<string, unknown>;
  },
  fallbackEntryPath: string,
): JsTemplateCompilePreviewArtifactSummary {
  return {
    runtimeVersion: input.version,
    entryPath: input.entryPath || fallbackEntryPath,
    filesHash: input.filesHash,
    metadata: input.metadata,
  };
}

function templateKey(template: { target?: string; kind: string; templateName: string }): string {
  return `${template.target || 'client'}:${template.kind}:${template.templateName}`;
}

function sortUniqueDiagnostics(diagnostics: JsTemplateDiagnostic[]): JsTemplateDiagnostic[] {
  const unique = new Map<string, JsTemplateDiagnostic>();
  for (const item of diagnostics) {
    unique.set(diagnosticKey(item), item);
  }

  return sortDiagnostics([...unique.values()]);
}

function diagnosticKey(input: JsTemplateDiagnostic): string {
  return [
    input.code,
    input.severity,
    input.path || '',
    input.kind || '',
    input.templateName || '',
    input.line || '',
    input.column || '',
  ].join('\u0000');
}

function normalizeSourcePath(path: string): string {
  return pathPosix.normalize(path.trim()).replace(/^\.\/+/, '');
}

function inferTemplateName(path: string): string {
  const normalized = normalizeSourcePath(path);
  const segments = normalized.split('/');
  return segments.length >= 2 ? segments[segments.length - 2] : normalized;
}

function classifyPreviewFailure(failureCode?: string): string {
  if (
    failureCode === 'RUNJS_IMPORT_NOT_ALLOWED' ||
    failureCode === 'RUNJS_DYNAMIC_IMPORT_UNSUPPORTED' ||
    failureCode === 'RUNJS_IMPORT_NOT_FOUND'
  ) {
    return 'unsafe_import_denied';
  }
  return failureCode === 'JS_TEMPLATE_COMPILE_DENIED' ? 'compile_denied' : 'compile_failed';
}
