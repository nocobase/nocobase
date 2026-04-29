/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PublishArtifactMeta } from '../publish-artifact-service';
import { PublishAdapter, PublishAdapterCapabilities, PublishAdapterContext, PublishGenerateResult } from './types';

async function createMigrationFileManager(app: any) {
  const { MigrationFileManager } = await import(
    '@nocobase/plugin-migration-manager/dist/server/services/migration-file-manager.js'
  );
  return new MigrationFileManager(app);
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
    const fileName = `migration_${Date.now()}.nbdata`;
    const title = options.title || 'migration';
    const fileManager = await createMigrationFileManager(ctx.app);
    const migrationRule = await ctx.app.db.getRepository('migrationRules').findOne({
      filterByTk: ruleId,
    });

    if (!migrationRule) {
      throw new Error(`Migration rule ${ruleId} not found`);
    }

    try {
      const result = await fileManager.createMigrationFile(migrationRule.toJSON(), { title }, { fileName });
      return artifactService.createFromFile({
        type: this.type,
        filePath: result.filePath,
        fileName: result.fileName,
        state: 'generated',
        sourceEnv: options.sourceEnv,
        createdById: context.createdById,
        metadata: {
          ruleId,
          title,
        },
      });
    } catch (error) {
      await fileManager.deleteFile(fileName).catch(() => {});
      await fileManager.finalizeMigrationFile(fileName).catch(() => {});
      throw error;
    }
  }

  async validateUpload(context: PublishAdapterContext, meta: PublishArtifactMeta) {
    const fileManager = await createMigrationFileManager(context.ctx.app);
    const filePath = await context.artifactService.getFilePath(meta);
    const checkResult = await fileManager.checkUploadedFile(filePath);
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
    const fileManager = await createMigrationFileManager(context.ctx.app);
    await context.artifactService.updateMeta(meta.type, meta.artifactId, { state: 'executing' });
    const envTexts = options.envTexts ?? [];
    if (envTexts.length) {
      const envService: any = context.ctx.app.pm.get('environment-variables');
      if (!envService) {
        throw new Error('Environment service not found');
      }
      await envService.validateTexts(envTexts);
    }

    const result = await fileManager.executeMigrationFile(filePath, {
      envTexts,
      skipBackup: options.skipBackup,
    });
    return context.artifactService.updateMeta(meta.type, meta.artifactId, {
      state: result.success ? 'executed' : 'failed',
      result,
      error: result.success ? undefined : 'Migration execution failed',
    });
  }
}
