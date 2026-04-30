/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';
import { PublishArtifactMeta } from '../publish-artifact-service';
import { PublishAdapter, PublishAdapterCapabilities, PublishAdapterContext, PublishGenerateResult } from './types';

function getBackupPlugin(context: PublishAdapterContext) {
  const backupPlugin = context.ctx.app.pm.get('backups') as any;
  if (!backupPlugin?.backup || !backupPlugin?.restore) {
    throw new Error('@nocobase/plugin-backups is not enabled or does not expose backup/restore services');
  }
  return backupPlugin;
}

export class BackupPublishAdapter implements PublishAdapter {
  type = 'backup' as const;

  capabilities(): PublishAdapterCapabilities {
    return {
      generate: true,
      upload: true,
      execute: true,
      executeOptions: ['backupBeforeExecute', 'yes'],
    };
  }

  async generate(context: PublishAdapterContext, options: Record<string, any>): Promise<PublishGenerateResult> {
    const filePath = await getBackupPlugin(context).backup();
    const { artifactService } = context;
    return artifactService.createFromFile({
      type: this.type,
      filePath,
      fileName: path.basename(filePath),
      state: 'generated',
      sourceEnv: options.sourceEnv,
      createdById: context.createdById,
      metadata: {
        generatedBy: 'publishCommands',
      },
    });
  }

  async validateUpload(_context: PublishAdapterContext, meta: PublishArtifactMeta) {
    return meta;
  }

  async execute(context: PublishAdapterContext, meta: PublishArtifactMeta, options: Record<string, any>) {
    const { artifactService } = context;
    const filePath = await artifactService.getFilePath(meta);
    const nextMeta = await artifactService.updateMeta(meta.type, meta.artifactId, { state: 'executing' });
    let rollbackBackupName: string | undefined;

    if (options.backupBeforeExecute !== false) {
      const rollbackFilePath = await getBackupPlugin(context).backup();
      rollbackBackupName = path.basename(rollbackFilePath);
    }

    await getBackupPlugin(context).restore(filePath);

    return artifactService.updateMeta(nextMeta.type, nextMeta.artifactId, {
      state: 'executed',
      result: {
        rollbackBackupName,
      },
    });
  }
}
