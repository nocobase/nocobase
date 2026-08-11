/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';
import { UniqueConstraintError } from '@nocobase/database';
import { VscFileService, VscPermissionHookRegistry } from '@nocobase/runjs/workspace/server';
import { uid } from '@nocobase/utils';
import { randomUUID } from 'crypto';

import {
  JS_TEMPLATE_COLLECTIONS,
  JS_TEMPLATE_OWNER_TYPE,
  JS_TEMPLATE_PROJECT_LIFECYCLE_STATUSES,
  type JsTemplateAclAction,
} from '../../constants';
import { createDefaultJsTemplateTemplate } from '../../shared/default-template';
import { JsTemplateError, mapRemoteSyncErrorToJsTemplate } from '../../shared/errors';
import { RemoteSyncError } from '../vsc-file/remotes';
import type {
  JsTemplateChangeLifecycleInput,
  JsTemplateCreateProjectInput,
  JsTemplateDeleteProjectInput,
  JsTemplateProjectLifecycleStatus,
  JsTemplateProject,
  JsTemplateKind,
  JsTemplateTreeEntryInput,
  JsTemplateUpdateProjectInput,
} from '../../shared/types';
import { assertJsTemplateKind } from '../../shared/types';
import { JsTemplateAuditService } from './JsTemplateAuditService';
import { JsTemplatePermissionService, type JsTemplateCanFunction } from './JsTemplatePermissionService';
import type { JsTemplateUsageService } from './JsTemplateUsageService';
import { JsTemplateValidator, hasErrorDiagnostic } from './JsTemplateValidator';
import { normalizeVscBridgeError } from './errorContract';

export interface JsTemplateServiceContext {
  actorUserId?: string | null;
  can?: JsTemplateCanFunction;
  currentUser?: unknown;
  requestId?: string;
  requestSource?: string;
  state?: Record<string, unknown>;
  timezone?: string;
  transaction?: Transaction;
}

export interface JsTemplateProjectInternalRecord extends JsTemplateProject {
  vscRepoId: string;
  applicationName: string | null;
  creationJobId: string | null;
}

export interface JsTemplateRemoteSyncLifecycleGate {
  assertRepositoryIdle(repoId: string, transaction?: Transaction): Promise<void>;
}

export interface JsTemplateCreateMetadata {
  name: string;
  normalizedName: string;
  title: string | null | undefined;
  description: string | null | undefined;
}

export interface JsTemplateCreateProjectOptions {
  projectId?: string;
  creationJobId?: string;
}

export interface JsTemplateListProjectsOptions {
  includeTemplateSummary?: boolean;
}

export class JsTemplateProjectService {
  private vscFileService: VscFileService;

  private usageService?: JsTemplateUsageService;

  private remoteSyncLifecycleGate?: JsTemplateRemoteSyncLifecycleGate;

  constructor(
    private readonly db: Database,
    private readonly auditService: JsTemplateAuditService,
    private readonly permissionService: JsTemplatePermissionService,
    permissionHooks?: VscPermissionHookRegistry,
    private readonly validator = new JsTemplateValidator(),
    private readonly applicationName = 'main',
  ) {
    this.useVscPermissionHookRegistry(permissionHooks || createLocalJsTemplatePermissionRegistry(permissionService));
  }

  useVscPermissionHookRegistry(permissionHooks: VscPermissionHookRegistry): void {
    this.vscFileService = new VscFileService(this.db, permissionHooks);
  }

  useJsTemplateUsageService(usageService: JsTemplateUsageService): void {
    this.usageService = usageService;
  }

  useRemoteSyncLifecycleGate(gate: JsTemplateRemoteSyncLifecycleGate): void {
    this.remoteSyncLifecycleGate = gate;
  }

  getValidator(): JsTemplateValidator {
    return this.validator;
  }

  getCurrentApplicationName(): string {
    return this.requireApplicationName();
  }

  async createProject(
    input: JsTemplateCreateProjectInput,
    ctx: JsTemplateServiceContext = {},
    options: JsTemplateCreateProjectOptions = {},
  ): Promise<JsTemplateProject> {
    return this.createProjectInternal(input, ctx, options, true);
  }

  /** @internal Composite use cases own their single main audit record. */
  async createProjectForCompositeUseCase(
    input: JsTemplateCreateProjectInput,
    ctx: JsTemplateServiceContext = {},
    options: JsTemplateCreateProjectOptions = {},
  ): Promise<JsTemplateProject> {
    return this.createProjectInternal(input, ctx, options, false);
  }

  private async createProjectInternal(
    input: JsTemplateCreateProjectInput,
    ctx: JsTemplateServiceContext,
    options: JsTemplateCreateProjectOptions,
    recordMainAudit: boolean,
  ): Promise<JsTemplateProject> {
    const requestId = getRequestId(ctx);
    const metadata = this.normalizeCreateMetadata(input);
    const projectId = options.projectId || `jtp_${uid()}`;
    const initialFiles = input.initialFiles?.length ? input.initialFiles : createDefaultJsTemplateTemplate();
    this.assertValidInitialFiles(initialFiles);

    return this.withTransaction(ctx.transaction, async (transaction) => {
      await this.assertProjectNameAvailable(metadata.name, metadata.normalizedName, transaction);

      const vscResult = await this.runVsc(projectId, () =>
        this.vscFileService.createRepository(
          {
            ownerType: JS_TEMPLATE_OWNER_TYPE,
            ownerId: projectId,
            name: 'source',
            initialFiles,
            message: input.message || 'Initial JS Template source',
            authorId: ctx.actorUserId || null,
            metadata: {
              jsTemplateProjectId: projectId,
              requestId,
            },
          },
          this.createVscContext({
            ctx,
            transaction,
            requestId,
            projectId,
            aclAction: 'create',
            reason: 'create js-template source repository',
            allowedActions: ['createRepository'],
          }),
        ),
      );

      const record = await this.createProjectRecord(
        {
          id: projectId,
          vscRepoId: vscResult.repository.id,
          applicationName: this.requireApplicationName(),
          name: metadata.name,
          normalizedName: metadata.normalizedName,
          title: metadata.title,
          description: metadata.description,
          headCommitId: vscResult.repository.headCommitId || null,
          creationJobId: options.creationJobId || null,
        },
        transaction,
      );
      const project = projectFromModel(record);

      if (recordMainAudit) {
        await this.auditService.recordLifecycleEvent({
          projectId: project.id,
          action: 'projectCreate',
          result: 'success',
          requestId,
          actorUserId: ctx.actorUserId,
          toStatus: project.lifecycleStatus,
          message: 'JS Template project created',
          details: {
            name: project.name,
            normalizedName: project.normalizedName,
            headCommitId: project.headCommitId,
          },
          transaction,
        });
      }

      return project;
    });
  }

  normalizeCreateMetadata(
    input: Pick<JsTemplateCreateProjectInput, 'name' | 'title' | 'description'>,
  ): JsTemplateCreateMetadata {
    const name = input.name.trim();
    return {
      name,
      normalizedName: normalizeProjectName(name),
      title: optionalTrim(input.title),
      description: optionalTrim(input.description),
    };
  }

  async assertCreateNameAvailable(name: string, normalizedName: string, transaction?: Transaction): Promise<void> {
    if (transaction) {
      await this.assertProjectNameAvailable(name, normalizedName, transaction);
      return;
    }
    await this.db.sequelize.transaction(async (currentTransaction) => {
      await this.assertProjectNameAvailable(name, normalizedName, currentTransaction);
    });
  }

  private assertValidInitialFiles(files: JsTemplateTreeEntryInput[] | undefined): void {
    if (!files) {
      return;
    }

    const diagnostics = this.validator.validateInitialFiles({ files });
    if (!hasErrorDiagnostic(diagnostics)) {
      return;
    }

    throw new JsTemplateError('JS_TEMPLATE_VALIDATION_FAILED', 'JS Template initial source is invalid', {
      status: 422,
      details: {
        diagnostics,
      },
    });
  }

  async listProjects(
    ctx: JsTemplateServiceContext = {},
    options: JsTemplateListProjectsOptions = {},
  ): Promise<JsTemplateProject[]> {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      const records = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.projects).find({
        filter: { applicationName: this.requireApplicationName() },
        sort: ['name'],
        transaction,
      });
      if (options.includeTemplateSummary === false) {
        return records.map(projectFromModel);
      }
      const projectIds = records.map((record) => String(record.get('id')));
      const templateRecords = projectIds.length
        ? await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.templates).find({
            filter: { projectId: { $in: projectIds } },
            fields: ['projectId', 'kind', 'healthStatus'],
            transaction,
          })
        : [];
      const templateSummary = new Map<string, { count: number; kinds: Partial<Record<JsTemplateKind, number>> }>();
      for (const template of templateRecords) {
        if (template.get('healthStatus') === 'missing') {
          continue;
        }
        const projectId = String(template.get('projectId'));
        const kind = assertJsTemplateKind(template.get('kind'));
        const summary = templateSummary.get(projectId) || { count: 0, kinds: {} };
        summary.count += 1;
        summary.kinds[kind] = (summary.kinds[kind] || 0) + 1;
        templateSummary.set(projectId, summary);
      }

      return records.map((record) => {
        const project = projectFromModel(record);
        const summary = templateSummary.get(project.id);
        return {
          ...project,
          templateCount: summary?.count || 0,
          templateKinds: summary?.kinds || {},
        };
      });
    });
  }

  async assertApplicationOwnership(
    projectId: string,
    applicationName: string,
    ctx: JsTemplateServiceContext = {},
  ): Promise<void> {
    if (applicationName.trim() !== this.requireApplicationName()) {
      throw projectNotFoundError(projectId);
    }
    await this.getInternalProject(projectId, ctx);
  }

  async getProject(projectId: string, ctx: JsTemplateServiceContext = {}): Promise<JsTemplateProject> {
    return stripInternalProject(await this.getInternalProject(projectId, ctx));
  }

  async updateProject(
    input: JsTemplateUpdateProjectInput,
    ctx: JsTemplateServiceContext = {},
  ): Promise<JsTemplateProject> {
    const title = optionalTrim(input.title);
    if (!title) {
      throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', 'JS Template title is required');
    }
    const requestId = getRequestId(ctx);

    return this.withTransaction(ctx.transaction, async (transaction) => {
      const current = await this.lockInternalProjectForUpdate(input.projectId, { ...ctx, transaction });

      const description = optionalTrim(input.description);
      if (current.title === title && current.description === description) {
        return stripInternalProject(current);
      }
      const projectModel = this.db.getModel<Model<JsTemplateProjectInternalRecord>>(JS_TEMPLATE_COLLECTIONS.projects);
      await projectModel.update(
        {
          title,
          description,
        },
        {
          where: {
            id: input.projectId,
          },
          transaction,
        },
      );

      const next = await this.getInternalProject(input.projectId, { ...ctx, transaction });
      await this.auditService.recordLifecycleEvent({
        projectId: input.projectId,
        action: 'projectUpdate',
        result: 'success',
        requestId,
        actorUserId: ctx.actorUserId,
        message: 'JS Template project metadata updated',
        details: {
          titleChanged: current.title !== next.title,
          descriptionChanged: current.description !== next.description,
        },
        transaction,
      });

      return stripInternalProject(next);
    });
  }

  async getInternalProject(
    projectId: string,
    ctx: JsTemplateServiceContext = {},
  ): Promise<JsTemplateProjectInternalRecord> {
    const record = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.projects).findOne({
      filterByTk: projectId,
      transaction: ctx.transaction,
    });

    if (!record) {
      throw projectNotFoundError(projectId);
    }
    this.assertProjectApplicationOwnership(record);
    return internalProjectFromModel(record);
  }

  async findInternalProjectById(
    projectId: string,
    ctx: JsTemplateServiceContext = {},
  ): Promise<JsTemplateProjectInternalRecord | null> {
    return this.findInternalProject(projectId, ctx);
  }

  async changeLifecycle(
    input: JsTemplateChangeLifecycleInput,
    ctx: JsTemplateServiceContext = {},
  ): Promise<JsTemplateProject> {
    assertLifecycleStatus(input.lifecycleStatus, 'lifecycleStatus');
    const requestId = getRequestId(ctx);
    return this.withTransaction(ctx.transaction, async (transaction) => {
      const current = await this.lockInternalProjectForUpdate(input.projectId, { ...ctx, transaction });

      if (current.lifecycleStatus === input.lifecycleStatus) {
        await this.auditService.recordLifecycleEvent({
          projectId: input.projectId,
          action: 'projectLifecycleChange',
          result: 'success',
          requestId,
          actorUserId: ctx.actorUserId,
          fromStatus: current.lifecycleStatus,
          toStatus: current.lifecycleStatus,
          message: 'JS Template lifecycle status already matches the requested status',
          details: {
            unchanged: true,
          },
          transaction,
        });

        return stripInternalProject(current);
      }

      const projectModel = this.db.getModel<Model<JsTemplateProjectInternalRecord>>(JS_TEMPLATE_COLLECTIONS.projects);
      await projectModel.update(
        {
          lifecycleStatus: input.lifecycleStatus,
        },
        {
          where: {
            id: input.projectId,
          },
          transaction,
        },
      );

      const next = await this.getInternalProject(input.projectId, { ...ctx, transaction });
      await this.usageService?.refreshUsagesForProject(
        input.projectId,
        {
          ...ctx,
          transaction,
          requestId,
        },
        'project_lifecycle_change',
      );
      await this.auditService.recordLifecycleEvent({
        projectId: input.projectId,
        action: 'projectLifecycleChange',
        result: 'success',
        requestId,
        actorUserId: ctx.actorUserId,
        fromStatus: current.lifecycleStatus,
        toStatus: next.lifecycleStatus,
        message: 'JS Template lifecycle status changed',
        transaction,
      });

      return stripInternalProject(next);
    });
  }

  async deleteProject(
    input: JsTemplateDeleteProjectInput,
    ctx: JsTemplateServiceContext = {},
  ): Promise<JsTemplateProject> {
    const requestId = getRequestId(ctx);

    try {
      return await this.withTransaction(ctx.transaction, async (transaction) => {
        const project = await this.lockInternalProjectForUpdate(input.projectId, { ...ctx, transaction });
        await this.assertRemoteSyncIdle(project.vscRepoId, transaction);
        const usageCount = await this.countBlockingProjectUsages(input.projectId, transaction);

        if (usageCount > 0) {
          throw usageExistsError(input.projectId, usageCount);
        }

        await this.runVsc(project.id, () =>
          this.vscFileService.archiveRepository(
            {
              repoId: project.vscRepoId,
            },
            this.createVscContext({
              ctx,
              transaction,
              requestId,
              projectId: project.id,
              aclAction: 'delete',
              reason: 'delete js-template project metadata',
              allowedActions: ['archiveRepository'],
            }),
          ),
        );
        await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.templates).destroy({
          filter: {
            projectId: input.projectId,
          },
          transaction,
        });
        const finalUsageCount = await this.countBlockingProjectUsages(input.projectId, transaction);
        if (finalUsageCount > 0) {
          throw usageExistsError(input.projectId, finalUsageCount);
        }

        await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.usages).destroy({
          filter: {
            projectId: input.projectId,
            resolvedStatus: 'owner_missing',
          },
          transaction,
        });

        await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.projects).destroy({
          filterByTk: input.projectId,
          transaction,
        });

        await this.auditService.recordLifecycleEvent({
          projectId: input.projectId,
          action: 'projectDelete',
          result: 'success',
          requestId,
          actorUserId: ctx.actorUserId,
          fromStatus: project.lifecycleStatus,
          message: 'JS Template project metadata deleted after archiving source storage',
          transaction,
        });

        return stripInternalProject(project);
      });
    } catch (error) {
      if (error instanceof JsTemplateError && error.code === 'JS_TEMPLATE_USAGE_EXISTS') {
        const project = await this.getInternalProject(input.projectId, ctx);
        const usageCount = await this.countBlockingProjectUsages(input.projectId, ctx.transaction);
        await this.recordDeleteBlockedByUsages(
          input.projectId,
          requestId,
          ctx,
          project.lifecycleStatus,
          usageCount,
          ctx.transaction,
        );
        throw error;
      }
      if (isUsageConstraintError(error)) {
        const usageCount = await this.countBlockingProjectUsages(input.projectId);
        await this.recordDeleteBlockedByUsages(input.projectId, requestId, ctx, null, usageCount, ctx.transaction);
        throw usageExistsError(input.projectId, usageCount);
      }

      throw error;
    }
  }

  private async assertProjectNameAvailable(
    name: string,
    normalizedName: string,
    transaction: Transaction,
  ): Promise<void> {
    const conflict = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.projects).findOne({
      filter: {
        applicationName: this.requireApplicationName(),
        $or: [{ name }, { normalizedName }],
      },
      transaction,
    });

    if (!conflict) {
      return;
    }

    throw projectConflictError(name, normalizedName);
  }

  private async createProjectRecord(
    values: {
      id: string;
      vscRepoId: string;
      applicationName: string;
      name: string;
      normalizedName: string;
      title?: string | null;
      description?: string | null;
      headCommitId: string | null;
      creationJobId: string | null;
    },
    transaction: Transaction,
  ): Promise<Model> {
    try {
      return await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.projects).create({
        values,
        transaction,
      });
    } catch (error) {
      if (error instanceof UniqueConstraintError && isProjectNameConstraintError(error)) {
        throw projectConflictError(values.name, values.normalizedName);
      }

      throw error;
    }
  }

  private async findInternalProject(
    projectId: string,
    ctx: JsTemplateServiceContext = {},
  ): Promise<JsTemplateProjectInternalRecord | null> {
    const record = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.projects).findOne({
      filterByTk: projectId,
      transaction: ctx.transaction,
    });
    if (record) {
      this.assertProjectApplicationOwnership(record);
    }
    return record ? internalProjectFromModel(record) : null;
  }

  async lockInternalProjectForUpdate(
    projectId: string,
    ctx: JsTemplateServiceContext,
  ): Promise<JsTemplateProjectInternalRecord> {
    const transaction = ctx.transaction;
    const projectModel = this.db.getModel<Model<JsTemplateProjectInternalRecord>>(JS_TEMPLATE_COLLECTIONS.projects);
    const record = await projectModel.findByPk(projectId, {
      transaction,
      lock: transaction?.LOCK.UPDATE,
    });

    if (!record) {
      throw projectNotFoundError(projectId);
    }
    this.assertProjectApplicationOwnership(record);
    return internalProjectFromModel(record);
  }

  private requireApplicationName(): string {
    const applicationName = this.applicationName.trim();
    if (!applicationName) {
      throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', 'Application identity is required');
    }
    return applicationName;
  }

  private assertProjectApplicationOwnership(record: Model): void {
    const applicationName = record.get('applicationName');
    if (applicationName === this.requireApplicationName()) {
      return;
    }
    throw projectNotFoundError(String(record.get('id')));
  }

  private async countBlockingProjectUsages(projectId: string, transaction?: Transaction): Promise<number> {
    return this.db.getRepository(JS_TEMPLATE_COLLECTIONS.usages).count({
      filter: {
        projectId,
        resolvedStatus: { $ne: 'owner_missing' },
      },
      transaction,
    });
  }

  private async recordDeleteBlockedByUsages(
    projectId: string,
    requestId: string,
    ctx: JsTemplateServiceContext,
    lifecycleStatus: string | null,
    usageCount: number,
    transaction?: Transaction,
  ): Promise<void> {
    await this.auditService.recordLifecycleEvent({
      projectId,
      action: 'projectDelete',
      result: 'blocked',
      requestId,
      actorUserId: ctx.actorUserId,
      fromStatus: lifecycleStatus,
      reasonCode: 'usages_exist',
      message: 'JS Template project delete rejected because usages exist',
      details: {
        usageCount,
      },
      transaction,
    });
  }

  private createVscContext(input: {
    ctx: JsTemplateServiceContext;
    transaction: Transaction;
    requestId: string;
    projectId: string;
    reason: string;
    allowedActions: Parameters<JsTemplatePermissionService['createInternalVscRequestContext']>[0]['allowedActions'];
    aclAction: JsTemplateAclAction;
  }) {
    return {
      transaction: input.transaction,
      authorId: input.ctx.actorUserId || null,
      request: this.permissionService.createInternalVscRequestContext({
        requestId: input.requestId,
        reason: input.reason,
        allowedActions: input.allowedActions,
        actorUserId: input.ctx.actorUserId,
        jsTemplateProjectId: input.projectId,
        aclAction: input.aclAction,
        requestSource: input.ctx.requestSource,
      }),
    };
  }

  private async runVsc<T>(projectId: string, run: () => Promise<T>): Promise<T> {
    try {
      return await run();
    } catch (error) {
      throw normalizeVscBridgeError(error, projectId);
    }
  }

  private async assertRemoteSyncIdle(vscRepoId: string, transaction: Transaction): Promise<void> {
    if (!this.remoteSyncLifecycleGate) {
      return;
    }
    try {
      await this.remoteSyncLifecycleGate.assertRepositoryIdle(vscRepoId, transaction);
    } catch (error) {
      if (error instanceof RemoteSyncError) {
        throw mapRemoteSyncErrorToJsTemplate(error);
      }
      throw error;
    }
  }

  private async withTransaction<T>(
    transaction: Transaction | undefined,
    run: (transaction: Transaction) => Promise<T>,
  ): Promise<T> {
    if (transaction) {
      return run(transaction);
    }

    return this.db.sequelize.transaction(run);
  }
}

export function projectFromModel(record: Model): JsTemplateProject {
  return stripInternalProject(internalProjectFromModel(record));
}

export function internalProjectFromModel(record: Model): JsTemplateProjectInternalRecord {
  return {
    id: record.get('id') as string,
    vscRepoId: record.get('vscRepoId') as string,
    applicationName: (record.get('applicationName') as string | null) || null,
    creationJobId: (record.get('creationJobId') as string | null) || null,
    name: record.get('name') as string,
    normalizedName: record.get('normalizedName') as string,
    title: (record.get('title') as string | null) || null,
    description: (record.get('description') as string | null) || null,
    lifecycleStatus: record.get('lifecycleStatus') as JsTemplateProjectLifecycleStatus,
    healthStatus: record.get('healthStatus') as JsTemplateProject['healthStatus'],
    headCommitId: (record.get('headCommitId') as string | null) || null,
    lastCompiledAt: normalizeRecordDate(record.get('lastCompiledAt')),
    createdAt: normalizeRecordDate(record.get('createdAt')),
    updatedAt: normalizeRecordDate(record.get('updatedAt')),
  };
}

export function stripInternalProject(project: JsTemplateProjectInternalRecord): JsTemplateProject {
  const {
    vscRepoId: _vscRepoId,
    applicationName: _applicationName,
    creationJobId: _creationJobId,
    ...publicProject
  } = project;
  return publicProject;
}

function getRequestId(ctx: JsTemplateServiceContext): string {
  return ctx.requestId || randomUUID();
}

function normalizeProjectName(name: string): string {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!normalized) {
    throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', 'Project name is required');
  }

  return normalized;
}

function projectConflictError(name: string, normalizedName: string): JsTemplateError {
  return new JsTemplateError('JS_TEMPLATE_PROJECT_CONFLICT', 'JS Template project name already exists', {
    details: {
      name,
      normalizedName,
    },
  });
}

function projectNotFoundError(projectId: string): JsTemplateError {
  return new JsTemplateError('JS_TEMPLATE_PROJECT_NOT_FOUND', `JS Template project "${projectId}" was not found`);
}

export function isProjectNameConstraintError(error: UniqueConstraintError): boolean {
  const constraintNames = [error, error.parent, error.original].flatMap((value) => [
    readStringProperty(value, 'constraint'),
    readStringProperty(value, 'index'),
  ]);
  if (constraintNames.includes('jst_project_application_normalized_uq')) {
    return true;
  }

  const fields = new Set<string>();
  if (Array.isArray(error.fields)) {
    for (const field of error.fields) {
      if (typeof field === 'string') {
        fields.add(field);
      }
    }
  } else {
    for (const field of Object.keys(error.fields || {})) {
      fields.add(field);
    }
  }
  for (const validationError of error.errors) {
    if (validationError.path) {
      fields.add(validationError.path);
    }
  }
  return (
    (fields.size === 1 && fields.has('jst_project_application_normalized_uq')) ||
    (fields.size === 2 && fields.has('applicationName') && fields.has('normalizedName'))
  );
}

function readStringProperty(value: unknown, property: string): string | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const propertyValue = (value as Record<string, unknown>)[property];
  return typeof propertyValue === 'string' ? propertyValue : null;
}

function usageExistsError(projectId: string, usageCount: number): JsTemplateError {
  return new JsTemplateError('JS_TEMPLATE_USAGE_EXISTS', 'JS Template project is used and cannot be deleted', {
    details: {
      projectId,
      usageCount,
    },
  });
}

function isUsageConstraintError(error: unknown): boolean {
  return error instanceof Error && error.name === 'SequelizeForeignKeyConstraintError';
}

function optionalTrim(value: string | null | undefined): string | null | undefined {
  if (typeof value === 'undefined' || value === null) {
    return value;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function assertLifecycleStatus(value: string, label: string): asserts value is JsTemplateProjectLifecycleStatus {
  if (!(JS_TEMPLATE_PROJECT_LIFECYCLE_STATUSES as readonly string[]).includes(value)) {
    throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', `Invalid ${label}`);
  }
}

function normalizeRecordDate(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return typeof value === 'string' ? value : null;
}

function createLocalJsTemplatePermissionRegistry(
  permissionService: JsTemplatePermissionService,
): VscPermissionHookRegistry {
  const permissionHooks = new VscPermissionHookRegistry();
  permissionHooks.register(permissionService.createVscPermissionHook());

  return permissionHooks;
}
