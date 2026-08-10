/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Transaction } from '@nocobase/database';
import { posix as pathPosix } from 'path';
import { randomUUID } from 'crypto';

import { JS_TEMPLATE_COLLECTIONS } from '../../constants';
import { JsTemplateError } from '../../shared/errors';
import type { DeleteJsTemplateInput, DeleteJsTemplateResult, JsTemplate } from '../../shared/types';
import { JsTemplateAuditService } from './JsTemplateAuditService';
import type { JsTemplatePreparedSave } from './JsTemplateCompileService';
import { JsTemplateCompileService } from './JsTemplateCompileService';
import { JsTemplateFileService } from './JsTemplateFileService';
import { JsTemplatePermissionService } from './JsTemplatePermissionService';
import type { JsTemplateServiceContext } from './JsTemplateProjectService';
import { JsTemplateProjectService } from './JsTemplateProjectService';
import { JsTemplateService, templateFromModel } from './JsTemplateService';
import { JsTemplateUsageService } from './JsTemplateUsageService';
import { normalizeSourceWorkspacePath } from './sourceRelocation';

interface PreparedDeleteJsTemplate {
  template: JsTemplate;
  entryRoot: string;
  artifactHash: string | null;
  preparedSave: JsTemplatePreparedSave | null;
}

export class DeleteJsTemplateService {
  constructor(
    private readonly db: Database,
    private readonly projectService: JsTemplateProjectService,
    private readonly fileService: JsTemplateFileService,
    private readonly templateService: JsTemplateService,
    private readonly compileService: JsTemplateCompileService,
    private readonly usageService: JsTemplateUsageService,
    private readonly permissionService: JsTemplatePermissionService,
    private readonly auditService: JsTemplateAuditService,
  ) {}

  async deleteTemplate(
    input: DeleteJsTemplateInput,
    ctx: JsTemplateServiceContext = {},
  ): Promise<DeleteJsTemplateResult> {
    const templateId = requireTemplateId(input.templateId);
    await this.permissionService.assertActionAllowed({ action: 'delete', ctx });
    const template = await this.templateService.getTemplate(templateId, ctx);

    try {
      const prepared = await this.prepareDelete(template, ctx);
      return await this.db.sequelize.transaction(async (transaction) =>
        this.applyDelete(prepared, { ...ctx, transaction }, transaction),
      );
    } catch (error) {
      if (isUsageExistsError(error)) {
        await this.recordBlockedDelete(template, readUsageCount(error), ctx);
      }
      throw error;
    }
  }

  private async prepareDelete(template: JsTemplate, ctx: JsTemplateServiceContext): Promise<PreparedDeleteJsTemplate> {
    await this.projectService.getProject(template.projectId, ctx);
    await this.assertNoEffectiveUsages(template, ctx);

    const source = await this.fileService.pull(
      {
        projectId: template.projectId,
        includeContent: 'none',
      },
      ctx,
    );
    const entryRoot = resolveEntryRoot(template);
    const files = (source.files || [])
      .filter((file) => file.path.startsWith(`${entryRoot}/`))
      .map((file) => ({ path: file.path, operation: 'delete' as const }));
    const descriptorExists = files.some((file) => file.path === normalizeSourceWorkspacePath(template.descriptorPath));
    if (!descriptorExists && template.healthStatus !== 'missing') {
      throw new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', 'JS Template entry descriptor is missing from source', {
        details: { projectId: template.projectId, templateId: template.id },
      });
    }

    const preparedSave = files.length
      ? await this.compileService.prepareSaveSource(
          {
            projectId: template.projectId,
            expectedHeadCommitId: source.commit?.id || null,
            message: `Delete JS Template ${template.templateName}`.slice(0, 200),
            files,
          },
          {
            ...ctx,
            requestSource: ctx.requestSource || 'js-template-delete',
          },
        )
      : null;
    return {
      template,
      entryRoot,
      artifactHash: template.artifactHash || null,
      preparedSave,
    };
  }

  private async applyDelete(
    prepared: PreparedDeleteJsTemplate,
    ctx: JsTemplateServiceContext,
    transaction: Transaction,
  ): Promise<DeleteJsTemplateResult> {
    await this.projectService.lockInternalProjectForUpdate(prepared.template.projectId, ctx);
    const currentRecord = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.templates).findOne({
      filterByTk: prepared.template.id,
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!currentRecord) {
      throw new JsTemplateError('JS_TEMPLATE_NOT_FOUND', `JS Template "${prepared.template.id}" was not found`);
    }
    const current = templateFromModel(currentRecord);
    assertSameTemplateSnapshot(prepared.template, current, prepared.entryRoot);
    await this.assertNoEffectiveUsages(current, ctx);

    if (prepared.preparedSave) {
      await this.compileService.commitPreparedSave(prepared.preparedSave, ctx);
    }
    await this.assertNoEffectiveUsages(current, ctx);
    await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.usages).destroy({
      filter: {
        templateId: current.id,
        resolvedStatus: 'owner_missing',
      },
      transaction,
    });
    await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.templates).destroy({
      filterByTk: current.id,
      transaction,
    });
    await this.deleteUnreferencedArtifact(prepared.artifactHash, transaction);
    await this.auditService.recordLifecycleEvent({
      projectId: current.projectId,
      action: 'templateDelete',
      result: 'success',
      requestId: ctx.requestId || randomUUID(),
      actorUserId: ctx.actorUserId,
      message: 'JS Template entry deleted',
      details: { templateId: current.id, kind: current.kind },
      transaction,
    });
    const project = await this.projectService.getProject(current.projectId, ctx);
    return {
      project,
      templateId: current.id,
    };
  }

  private async assertNoEffectiveUsages(template: JsTemplate, ctx: JsTemplateServiceContext): Promise<void> {
    const usageCount = await this.usageService.countEffectiveUsages(template.id, ctx);
    if (usageCount > 0) {
      throw usageExistsError(template.id, usageCount);
    }
  }

  private async deleteUnreferencedArtifact(artifactHash: string | null, transaction: Transaction): Promise<void> {
    if (!artifactHash) {
      return;
    }
    const artifactRepository = this.db.getRepository(JS_TEMPLATE_COLLECTIONS.artifacts);
    const artifact = await artifactRepository.findOne({
      filterByTk: artifactHash,
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!artifact) {
      return;
    }
    const referenceCount = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.templates).count({
      filter: { artifactHash },
      transaction,
    });
    if (referenceCount === 0) {
      await artifactRepository.destroy({
        filterByTk: artifactHash,
        transaction,
      });
    }
  }

  private async recordBlockedDelete(
    template: JsTemplate,
    usageCount: number,
    ctx: JsTemplateServiceContext,
  ): Promise<void> {
    try {
      await this.auditService.recordLifecycleEvent({
        projectId: template.projectId,
        action: 'templateDelete',
        result: 'blocked',
        requestId: ctx.requestId || randomUUID(),
        actorUserId: ctx.actorUserId,
        reasonCode: 'usage_exists',
        message: 'JS Template entry delete rejected because usages exist',
        details: { templateId: template.id, usageCount },
        transaction: ctx.transaction,
      });
    } catch {
      // The authoritative delete conflict must not depend on audit persistence availability.
    }
  }
}

function requireTemplateId(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', 'templateId must be a non-empty string');
  }
  return value.trim();
}

function resolveEntryRoot(template: JsTemplate): string {
  const descriptorPath = normalizeSourceWorkspacePath(template.descriptorPath);
  const entryPath = normalizeSourceWorkspacePath(template.entryPath);
  const entryRoot = pathPosix.dirname(descriptorPath);
  if (
    pathPosix.basename(descriptorPath) !== 'entry.json' ||
    entryRoot === '.' ||
    (entryPath !== entryRoot && !entryPath.startsWith(`${entryRoot}/`))
  ) {
    throw new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', 'JS Template entry paths are inconsistent', {
      details: { projectId: template.projectId, templateId: template.id },
    });
  }
  return entryRoot;
}

function assertSameTemplateSnapshot(expected: JsTemplate, current: JsTemplate, entryRoot: string): void {
  if (
    current.projectId !== expected.projectId ||
    current.kind !== expected.kind ||
    current.templateName !== expected.templateName ||
    current.entryPath !== expected.entryPath ||
    current.descriptorPath !== expected.descriptorPath ||
    current.healthStatus !== expected.healthStatus ||
    current.compiledCommitId !== expected.compiledCommitId ||
    current.artifactHash !== expected.artifactHash ||
    resolveEntryRoot(current) !== entryRoot
  ) {
    throw new JsTemplateError('JS_TEMPLATE_SOURCE_OUTDATED', 'JS Template changed before it could be deleted', {
      details: { projectId: expected.projectId, templateId: expected.id },
    });
  }
}

function usageExistsError(templateId: string, usageCount: number): JsTemplateError {
  return new JsTemplateError('JS_TEMPLATE_USAGE_EXISTS', 'JS Template is used and cannot be deleted', {
    details: { templateId, usageCount },
  });
}

function isUsageExistsError(error: unknown): error is JsTemplateError {
  return error instanceof JsTemplateError && error.code === 'JS_TEMPLATE_USAGE_EXISTS';
}

function readUsageCount(error: JsTemplateError): number {
  const usageCount = error.details?.usageCount;
  return typeof usageCount === 'number' && Number.isFinite(usageCount) && usageCount > 0 ? usageCount : 0;
}
