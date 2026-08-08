/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';

import { JsTemplateError } from '../../shared/errors';
import type { JsTemplateCreateJob, JsTemplateTreeEntryInput } from '../../shared/types';
import { JsTemplateCreateFromRemoteService } from './JsTemplateCreateFromRemoteService';
import { JsTemplateCreateJobStore, type JsTemplateCreateJobPayload } from './JsTemplateCreateJobStore';
import { JsTemplateProjectService, type JsTemplateServiceContext } from './JsTemplateProjectService';
import { JsTemplateCompileService } from './JsTemplateCompileService';
import { isStrictUtf8Text, parseJsTemplateSourceArchive } from './JsTemplateSourceArchive';

export class JsTemplateCreateJobExecutor {
  constructor(
    private readonly db: Database,
    private readonly projectService: JsTemplateProjectService,
    private readonly runtimeCompileService: JsTemplateCompileService,
    private readonly createFromRemoteService: JsTemplateCreateFromRemoteService,
    private readonly store: JsTemplateCreateJobStore,
  ) {}

  async execute(job: JsTemplateCreateJob, claimToken: string): Promise<string> {
    const existing = await this.projectService.findInternalProjectById(job.targetProjectId);
    if (existing) {
      if (existing.creationJobId === job.id && existing.healthStatus === 'ready' && existing.headCommitId) {
        return existing.id;
      }
      if (existing.creationJobId === job.id && existing.healthStatus !== 'ready') {
        await this.cleanup(job, claimToken);
      } else {
        throw new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', 'JS Template creation target already exists', {
          details: { projectId: job.targetProjectId },
        });
      }
    }

    const afterCleanup = await this.projectService.findInternalProjectById(job.targetProjectId);
    if (afterCleanup) {
      throw new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', 'JS Template creation target already exists', {
        details: { projectId: job.targetProjectId },
      });
    }

    const payload = requireJobPayload(job);
    const ctx: JsTemplateServiceContext = {
      actorUserId: job.actorUserId,
      requestId: job.requestId || `create-job:${job.id}`,
      requestSource: `js-template-create-job:${job.sourceType}`,
    };
    if (payload.sourceType === 'git') {
      const created = await this.createFromRemoteService.create(
        {
          name: job.name,
          title: job.title,
          description: job.description,
          provider: payload.provider,
          config: payload.config,
          authRef: payload.authRef,
        },
        ctx,
        {
          targetProjectId: job.targetProjectId,
          creationJobId: job.id,
          assertCurrentClaim: (transaction) =>
            this.store.assertCurrentClaim(job.id, job.applicationName, claimToken, transaction),
        },
      );
      return created.project.id;
    }

    const initialFiles =
      payload.sourceType === 'zip'
        ? await parseJsTemplateSourceArchive(payload.zipBase64, this.projectService.getValidator())
        : normalizeInitialFiles(payload.initialFiles);
    assertTextSourceFiles(initialFiles || []);
    return this.db.sequelize.transaction(async (transaction) => {
      await this.store.assertCurrentClaim(job.id, job.applicationName, claimToken, transaction);
      const transactionContext = { ...ctx, transaction };
      const project = await this.projectService.createProject(
        {
          name: job.name,
          title: job.title,
          description: job.description,
          ...(initialFiles ? { initialFiles } : {}),
          message: payload.message,
        },
        transactionContext,
        { projectId: job.targetProjectId, creationJobId: job.id },
      );
      if (!project.headCommitId) {
        throw new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', 'JS Template initial source commit is missing', {
          details: { projectId: project.id },
        });
      }
      const compiled = await this.runtimeCompileService.compileCurrentRuntime(project.id, project.headCommitId, {
        ...transactionContext,
        requestSource: ctx.requestSource,
      });
      return compiled.project.id;
    });
  }

  async cleanup(job: JsTemplateCreateJob, claimToken: string): Promise<boolean> {
    return this.db.sequelize.transaction(async (transaction) => {
      await this.store.assertCurrentClaim(job.id, job.applicationName, claimToken, transaction);
      const existing = await this.projectService.findInternalProjectById(job.targetProjectId, { transaction });
      if (!existing || existing.creationJobId !== job.id || existing.healthStatus === 'ready') {
        return false;
      }
      const locked = await this.projectService.lockInternalProjectForUpdate(job.targetProjectId, { transaction });
      if (locked.creationJobId !== job.id || locked.healthStatus === 'ready') {
        return false;
      }
      await this.projectService.deleteProject(
        { projectId: job.targetProjectId },
        {
          actorUserId: job.actorUserId,
          requestId: job.requestId || `create-job-cleanup:${job.id}`,
          requestSource: `js-template-create-job-cleanup:${job.sourceType}`,
          transaction,
        },
      );
      return true;
    });
  }
}

function requireJobPayload(job: JsTemplateCreateJob): JsTemplateCreateJobPayload {
  const payload = job.payload;
  if (!payload || payload.sourceType !== job.sourceType) {
    throw invalidPayload();
  }
  if (payload.sourceType === 'git') {
    if (payload.provider !== 'git' || !isRecord(payload.config)) {
      throw invalidPayload();
    }
    return {
      sourceType: 'git',
      provider: 'git',
      config: payload.config,
      authRef: normalizeAuthRef(payload.authRef),
    };
  }
  if (payload.sourceType === 'zip') {
    if (typeof payload.zipBase64 !== 'string' || typeof payload.message !== 'string') {
      throw invalidPayload();
    }
    return { sourceType: 'zip', zipBase64: payload.zipBase64, message: payload.message };
  }
  if (payload.sourceType === 'starter') {
    if (
      typeof payload.message !== 'string' ||
      (typeof payload.initialFiles !== 'undefined' && !Array.isArray(payload.initialFiles))
    ) {
      throw invalidPayload();
    }
    return {
      sourceType: 'starter',
      message: payload.message,
      ...(payload.initialFiles ? { initialFiles: payload.initialFiles } : {}),
    };
  }
  throw invalidPayload();
}

function normalizeInitialFiles(files: JsTemplateTreeEntryInput[] | undefined): JsTemplateTreeEntryInput[] | undefined {
  return files?.map((file, index) => {
    const path = requireString(file.path, `initialFiles[${index}].path`);
    const content = optionalString(file.content, `initialFiles[${index}].content`);
    const blobHash = optionalString(file.blobHash, `initialFiles[${index}].blobHash`);
    if (typeof content !== 'string' && !blobHash) {
      throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', `initialFiles[${index}] must include content or blobHash`);
    }
    return {
      path,
      ...(typeof content === 'string' ? { content } : {}),
      ...(blobHash ? { blobHash } : {}),
      ...(typeof file.size === 'number' ? { size: file.size } : {}),
      ...(typeof file.language === 'string' ? { language: file.language } : {}),
      ...(typeof file.mode === 'string' ? { mode: file.mode } : {}),
    };
  });
}

function assertTextSourceFiles(files: JsTemplateTreeEntryInput[]): void {
  for (const file of files) {
    if (typeof file.content === 'string' && !isStrictUtf8Text(file.content)) {
      throw new JsTemplateError(
        'JS_TEMPLATE_INVALID_INPUT',
        `Source file must be UTF-8 text without NUL bytes: ${file.path}`,
      );
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', `${label} is required`);
  }
  return value.trim();
}

function optionalString(value: unknown, label: string): string | undefined {
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', `${label} must be a string`);
  }
  return value;
}

function normalizeAuthRef(value: unknown): string | null {
  if (value === null) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  throw invalidPayload();
}

function invalidPayload(): JsTemplateError {
  return new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', 'Creation job payload is invalid');
}
