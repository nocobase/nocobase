/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';

import { LightExtensionError } from '../../shared/errors';
import type { LightExtensionCreateJobRecord, LightExtensionTreeEntryInput } from '../../shared/types';
import { LightExtensionCreateFromRemoteService } from './LightExtensionCreateFromRemoteService';
import type { LightExtensionCreateJobPayload } from './LightExtensionCreateJobStore';
import { LightExtensionRepoService, type LightExtensionServiceContext } from './LightExtensionRepoService';
import { LightExtensionRuntimeCompileService } from './LightExtensionRuntimeCompileService';
import { isStrictUtf8Text, parseLightExtensionSourceArchive } from './LightExtensionSourceArchive';

export class LightExtensionCreateJobExecutor {
  constructor(
    private readonly db: Database,
    private readonly repoService: LightExtensionRepoService,
    private readonly runtimeCompileService: LightExtensionRuntimeCompileService,
    private readonly createFromRemoteService: LightExtensionCreateFromRemoteService,
  ) {}

  async execute(job: LightExtensionCreateJobRecord): Promise<string> {
    const existing = await this.repoService.findInternalRepoById(job.targetRepoId);
    if (existing) {
      throw new LightExtensionError('LIGHT_EXTENSION_SOURCE_ERROR', 'Light extension creation target already exists', {
        details: { repoId: job.targetRepoId },
      });
    }

    const payload = requireJobPayload(job);
    const ctx: LightExtensionServiceContext = {
      actorUserId: job.actorUserId,
      requestId: job.requestId || `create-job:${job.id}`,
      requestSource: `light-extension-create-job:${job.sourceType}`,
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
        { targetRepoId: job.targetRepoId },
      );
      return created.repo.id;
    }

    const initialFiles =
      payload.sourceType === 'zip'
        ? await parseLightExtensionSourceArchive(payload.zipBase64, this.repoService.getValidator())
        : normalizeInitialFiles(payload.initialFiles);
    assertTextSourceFiles(initialFiles || []);
    return this.db.sequelize.transaction(async (transaction) => {
      const transactionContext = { ...ctx, transaction };
      const repo = await this.repoService.createRepo(
        {
          name: job.name,
          title: job.title,
          description: job.description,
          ...(initialFiles ? { initialFiles } : {}),
          message: payload.message,
        },
        transactionContext,
        { repoId: job.targetRepoId },
      );
      if (!repo.headCommitId) {
        throw new LightExtensionError(
          'LIGHT_EXTENSION_SOURCE_ERROR',
          'Light extension initial source commit is missing',
          { details: { repoId: repo.id } },
        );
      }
      const compiled = await this.runtimeCompileService.compileCurrentRuntime(repo.id, repo.headCommitId, {
        ...transactionContext,
        requestSource: ctx.requestSource,
      });
      return compiled.repo.id;
    });
  }

  async cleanup(job: LightExtensionCreateJobRecord): Promise<void> {
    const existing = await this.repoService.findInternalRepoById(job.targetRepoId);
    if (!existing) {
      return;
    }
    await this.repoService.deleteRepo(
      { repoId: job.targetRepoId },
      {
        actorUserId: job.actorUserId,
        requestId: job.requestId || `create-job-cleanup:${job.id}`,
        requestSource: `light-extension-create-job-cleanup:${job.sourceType}`,
      },
    );
  }
}

function requireJobPayload(job: LightExtensionCreateJobRecord): LightExtensionCreateJobPayload {
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
  if (payload.sourceType === 'template') {
    if (
      typeof payload.message !== 'string' ||
      (typeof payload.initialFiles !== 'undefined' && !Array.isArray(payload.initialFiles))
    ) {
      throw invalidPayload();
    }
    return {
      sourceType: 'template',
      message: payload.message,
      ...(payload.initialFiles ? { initialFiles: payload.initialFiles } : {}),
    };
  }
  throw invalidPayload();
}

function normalizeInitialFiles(
  files: LightExtensionTreeEntryInput[] | undefined,
): LightExtensionTreeEntryInput[] | undefined {
  return files?.map((file, index) => {
    const path = requireString(file.path, `initialFiles[${index}].path`);
    const content = optionalString(file.content, `initialFiles[${index}].content`);
    const blobHash = optionalString(file.blobHash, `initialFiles[${index}].blobHash`);
    if (typeof content !== 'string' && !blobHash) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_INVALID_INPUT',
        `initialFiles[${index}] must include content or blobHash`,
      );
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

function assertTextSourceFiles(files: LightExtensionTreeEntryInput[]): void {
  for (const file of files) {
    if (typeof file.content === 'string' && !isStrictUtf8Text(file.content)) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_INVALID_INPUT',
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
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', `${label} is required`);
  }
  return value.trim();
}

function optionalString(value: unknown, label: string): string | undefined {
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', `${label} must be a string`);
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

function invalidPayload(): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'Creation job payload is invalid');
}
