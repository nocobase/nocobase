/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import {
  BACKUP_CREATE_TIMEOUT_MS,
  BACKUP_POLL_INTERVAL_MS,
  BACKUP_RUNTIME_COMMANDS,
  buildBackupEnvArgv,
  ensureBackupRuntimeCommands,
  resolveBackupCreateOutputPath,
  resolveBackupTargetEnv,
  runBackupCliJsonCommand,
  sleep,
} from '../../lib/backup.js';
import { ensureCrossEnvConfirmed, hasExplicitEnvSelection } from '../../lib/env-guard.js';
import { announceTargetEnv, failTask, startTask, succeedTask, updateTask } from '../../lib/ui.js';

type BackupCreateResponse = {
  data?: {
    name?: string;
    inProgress?: boolean;
  };
};

type BackupStatusResponse = {
  data?: Record<string, { inProgress?: boolean }>;
};

type BackupDownloadResponse = {
  data?: {
    output?: string;
  };
};

type BackupCreateResult = {
  env: string;
  name: string;
  output: string;
};

function formatBackupCreateTimeoutError(envName: string, name: string) {
  return [
    `Backup "${name}" did not finish in time for "${envName}".`,
    `Waited ${Math.floor(BACKUP_CREATE_TIMEOUT_MS / 1000)}s but it still reports \`inProgress: true\`.`,
  ].join(' ');
}

function readBackupCreateResult(response: BackupCreateResponse) {
  const name = String(response.data?.name ?? '').trim();
  if (!name) {
    throw new Error('Backup creation did not return a backup name.');
  }

  return {
    name,
    inProgress: Boolean(response.data?.inProgress),
  };
}

function readBackupInProgress(response: BackupStatusResponse, name: string) {
  const status = response.data?.[name];
  if (!status || typeof status !== 'object') {
    throw new Error(`Backup status did not include "${name}".`);
  }

  return Boolean(status.inProgress);
}

function readDownloadOutput(response: BackupDownloadResponse) {
  const output = String(response.data?.output ?? '').trim();
  return output || undefined;
}

export default class BackupCreate extends Command {
  static override summary = 'Create a backup through the selected env and download it locally';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --output ./fixtures/base.nbdump',
    '<%= config.bin %> <%= command.id %> --env e2e --output ./fixtures',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name to back up. Defaults to the current env when omitted',
    }),
    yes: Flags.boolean({
      char: 'y',
      description: 'Confirm using --env when it targets a different env than the current env',
      default: false,
    }),
    output: Flags.string({
      char: 'o',
      description: 'Download path. When omitted, save to the current directory using the remote backup filename',
    }),
    'json-output': Flags.boolean({
      char: 'j',
      description: 'Print the final backup result as JSON',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(BackupCreate);
    const requestedEnv = flags.env?.trim() || undefined;
    const explicitEnvSelection = Boolean(requestedEnv && hasExplicitEnvSelection(this.argv));
    const jsonOutput = Boolean(flags['json-output']);

    if (explicitEnvSelection) {
      const confirmed = await ensureCrossEnvConfirmed({
        command: this,
        requestedEnv,
        yes: flags.yes,
      });
      if (!confirmed) {
        return;
      }
    }

    const { envName, env } = await resolveBackupTargetEnv(requestedEnv);
    const envArgv = buildBackupEnvArgv({
      requestedEnv,
      explicitEnvSelection,
      yes: flags.yes,
    });

    if (!jsonOutput) {
      announceTargetEnv(envName);
    }
    await ensureBackupRuntimeCommands({
      envName,
      env,
      commandIds: [
        BACKUP_RUNTIME_COMMANDS.create,
        BACKUP_RUNTIME_COMMANDS.status,
        BACKUP_RUNTIME_COMMANDS.download,
      ],
      quiet: jsonOutput,
    });

    try {
      if (!jsonOutput) {
        startTask(`Creating backup for "${envName}"...`);
      }
      const createResponse = await runBackupCliJsonCommand<BackupCreateResponse>(
        ['api', 'backup', 'create', ...envArgv],
        { errorName: 'nb api backup create' },
      );
      const { name, inProgress } = readBackupCreateResult(createResponse);
      const outputPath = await resolveBackupCreateOutputPath(flags.output, name);
      const startedAt = Date.now();
      let pending = inProgress;

      while (pending) {
        const now = Date.now();
        const elapsedMs = now - startedAt;
        if (elapsedMs >= BACKUP_CREATE_TIMEOUT_MS) {
          throw new Error(formatBackupCreateTimeoutError(envName, name));
        }

        const elapsedSeconds = Math.max(1, Math.floor(elapsedMs / 1000));
        if (!jsonOutput) {
          updateTask(`Waiting for backup "${name}" to finish for "${envName}"... (${elapsedSeconds}s elapsed)`);
        }
        await sleep(BACKUP_POLL_INTERVAL_MS);

        const statusResponse = await runBackupCliJsonCommand<BackupStatusResponse>(
          ['api', 'backup', 'status', '--name', name, ...envArgv],
          { errorName: 'nb api backup status' },
        );
        pending = readBackupInProgress(statusResponse, name);
      }

      if (!jsonOutput) {
        updateTask(`Downloading backup "${name}" for "${envName}"...`);
      }
      const downloadResponse = await runBackupCliJsonCommand<BackupDownloadResponse>(
        ['api', 'backup', 'download', '--name', name, '--output', outputPath, ...envArgv],
        { errorName: 'nb api backup download' },
      );
      const savedPath = readDownloadOutput(downloadResponse) ?? outputPath;
      const result: BackupCreateResult = {
        env: envName,
        name,
        output: savedPath,
      };

      if (jsonOutput) {
        this.log(JSON.stringify(result, null, 2));
        return;
      }

      succeedTask(`Backup saved to ${savedPath}`);
    } catch (error) {
      if (!jsonOutput) {
        failTask(`Failed to create backup for "${envName}".`);
      }
      throw error;
    }
  }
}
