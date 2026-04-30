/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'fs';
import fsPromises from 'fs/promises';
import os from 'os';
import path from 'path';
import { PublishArtifactMeta } from '../publish-artifact-service';
import { PublishAdapter, PublishAdapterCapabilities, PublishAdapterContext, PublishGenerateResult } from './types';

const MIGRATION_CHECK_CACHE_PREFIX = 'migration-manager:temp-upload';

function getMigrationTmpDir() {
  return path.resolve(process.cwd(), 'storage', 'tmp');
}

function createInternalActionContext(
  ctx: any,
  actionName: string,
  params: Record<string, any>,
  extra: Record<string, any> = {},
) {
  const action = ctx.app.resourceManager.getAction('migrationFiles', actionName).clone();
  action.actionName = actionName;
  action.resourceName = 'migrationFiles';
  action.mergeParams(params);

  const actionCtx = {
    app: ctx.app,
    auth: ctx.auth,
    t: typeof ctx.t === 'function' ? ctx.t.bind(ctx) : (text: string) => text,
    action,
    body: undefined,
    status: 200,
    throw(status: number, message: string) {
      const error = new Error(message || `Request failed with status ${status}`) as Error & { status?: number };
      error.status = status;
      throw error;
    },
    attachment() {},
    set() {},
    ...extra,
  };

  action.setContext(actionCtx);
  return actionCtx;
}

async function callMigrationFilesAction(
  ctx: any,
  actionName: string,
  params: Record<string, any> = {},
  extra: Record<string, any> = {},
) {
  const actionCtx = createInternalActionContext(ctx, actionName, params, extra);
  await actionCtx.action.getHandler()(actionCtx, async () => {});

  if (actionCtx.status >= 400) {
    throw new Error(actionCtx.body?.message || `migrationFiles:${actionName} failed`);
  }

  return actionCtx.body;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForMigrationFile(ctx: any, fileName: string, timeoutMs = 10 * 60 * 1000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const fileStatus = await callMigrationFilesAction(ctx, 'get', { filterByTk: fileName });
    if (fileStatus?.status === 'ok') {
      return fileStatus;
    }
    if (fileStatus?.status !== 'in_progress') {
      throw new Error(`Migration file ${fileName} is not available`);
    }
    await sleep(1000);
  }

  throw new Error(`Timed out waiting for migration file ${fileName}`);
}

async function writeStreamToFile(stream: fs.ReadStream, filePath: string) {
  await fsPromises.mkdir(path.dirname(filePath), { recursive: true });
  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(filePath);
    stream.on('error', reject);
    output.on('error', reject);
    output.on('finish', resolve);
    stream.pipe(output);
  });
}

async function downloadMigrationFile(ctx: any, fileName: string, filePath: string) {
  const stream = await callMigrationFilesAction(ctx, 'download', { filterByTk: fileName });
  if (!stream?.pipe) {
    throw new Error(`Migration file ${fileName} download did not return a stream`);
  }
  await writeStreamToFile(stream, filePath);
}

async function checkMigrationFile(ctx: any, filePath: string) {
  await fsPromises.mkdir(getMigrationTmpDir(), { recursive: true });
  return callMigrationFilesAction(ctx, 'check', {}, { file: { path: filePath } });
}

async function cleanupMigrationCheckTask(ctx: any, taskId?: string) {
  if (!taskId) {
    return;
  }
  const cacheKey = `${MIGRATION_CHECK_CACHE_PREFIX}:${taskId}`;
  const tmpFilePath = await ctx.app.cache.get(cacheKey).catch(() => undefined);
  if (tmpFilePath) {
    await fsPromises.unlink(tmpFilePath).catch(() => {});
  }
  await ctx.app.cache.del(cacheKey).catch(() => {});
}

export class MigrationPublishAdapter implements PublishAdapter {
  type = 'migration' as const;

  capabilities(): PublishAdapterCapabilities {
    return {
      generate: true,
      upload: true,
      execute: true,
      executeOptions: ['skipBackup', 'envTexts'],
    };
  }

  async generate(context: PublishAdapterContext, options: Record<string, any>): Promise<PublishGenerateResult> {
    const ruleId = options.ruleId;
    if (!ruleId) {
      throw new Error('Migration rule ID is required');
    }

    const { ctx, artifactService } = context;
    const title = options.title || 'migration';
    const createResult = await callMigrationFilesAction(ctx, 'create', {
      values: {
        ruleId,
        title,
      },
    });
    const fileName = createResult?.data?.fileName;

    if (!fileName) {
      throw new Error('Migration file creation did not return a file name');
    }

    await waitForMigrationFile(ctx, fileName);
    const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'nocobase-publish-migration-'));
    const tempFilePath = path.join(tempDir, fileName);

    try {
      await downloadMigrationFile(ctx, fileName, tempFilePath);
      return artifactService.createFromFile({
        type: this.type,
        filePath: tempFilePath,
        fileName,
        state: 'generated',
        sourceEnv: options.sourceEnv,
        createdById: context.createdById,
        metadata: {
          ruleId,
          title,
        },
      });
    } finally {
      await fsPromises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  async validateUpload(context: PublishAdapterContext, meta: PublishArtifactMeta) {
    const filePath = await context.artifactService.getFilePath(meta);
    const checkBody = await checkMigrationFile(context.ctx, filePath);
    await cleanupMigrationCheckTask(context.ctx, checkBody?.taskId);
    const checkResult = checkBody?.checkResult || { pass: false };
    const nextState = checkResult.pass ? 'ready' : 'failed';
    return context.artifactService.updateMeta(meta.type, meta.artifactId, {
      state: nextState,
      metadata: {
        ...(meta.metadata || {}),
        checkResult,
      },
      error: checkResult.pass ? undefined : 'Migration file check failed',
    });
  }

  async execute(context: PublishAdapterContext, meta: PublishArtifactMeta, options: Record<string, any>) {
    const filePath = await context.artifactService.getFilePath(meta);
    const envTexts = options.envTexts ?? [];
    const checkBody = await checkMigrationFile(context.ctx, filePath);
    const checkResult = checkBody?.checkResult;
    if (!checkResult?.pass) {
      await cleanupMigrationCheckTask(context.ctx, checkBody?.taskId);
      throw new Error('Migration file check failed');
    }

    await context.artifactService.updateMeta(meta.type, meta.artifactId, { state: 'executing' });
    const runBody = await callMigrationFilesAction(context.ctx, 'runTask', {
      values: {
        taskId: checkBody.taskId,
        envTexts,
        skipBackup: options.skipBackup,
      },
    });
    const result = runBody?.result || { success: false };
    return context.artifactService.updateMeta(meta.type, meta.artifactId, {
      state: result.success ? 'executed' : 'failed',
      result,
      error: result.success ? undefined : 'Migration execution failed',
    });
  }
}
