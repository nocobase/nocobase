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
  BACKUP_RUNTIME_COMMANDS,
  buildBackupEnvArgv,
  ensureBackupRuntimeCommands,
  resolveBackupRestoreFilePath,
  resolveBackupTargetEnv,
  resolveBackupWaitApiBaseUrl,
  runBackupCliCommand,
} from '../../lib/backup.js';
import { waitForAppReady } from '../../lib/app-health.js';
import { ensureCrossEnvConfirmed, hasExplicitEnvSelection } from '../../lib/env-guard.js';
import { confirm } from '../../lib/inquirer.ts';
import { announceTargetEnv, failTask, isInteractiveTerminal, startTask, stopTask, succeedTask } from '../../lib/ui.js';

async function confirmBackupRestore(envName: string, filePath: string, force: boolean): Promise<boolean> {
  if (force) {
    return true;
  }

  if (!isInteractiveTerminal()) {
    throw new Error(
      `\`nb backup restore\` needs confirmation. Re-run with \`--force\` to restore ${filePath} into "${envName}" in non-interactive mode.`,
    );
  }

  try {
    return await confirm({
      message: `Restore backup "${filePath}" into "${envName}"? This will overwrite application data.`,
      default: false,
    });
  } catch {
    return false;
  }
}

export default class BackupRestore extends Command {
  static override summary = 'Restore a backup file into the selected env';

  static override examples = [
    '<%= config.bin %> <%= command.id %> --file ./fixtures/base.nbdump --force',
    '<%= config.bin %> <%= command.id %> --env e2e --file ./fixtures/base.nbdump --yes --force',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name to restore into. Defaults to the current env when omitted',
    }),
    yes: Flags.boolean({
      char: 'y',
      description: 'Confirm using --env when it targets a different env than the current env',
      default: false,
    }),
    file: Flags.string({
      char: 'f',
      description: 'Local backup file to upload and restore',
      required: true,
    }),
    force: Flags.boolean({
      description: 'Confirm overwriting application data during restore',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(BackupRestore);
    const requestedEnv = flags.env?.trim() || undefined;
    const explicitEnvSelection = Boolean(requestedEnv && hasExplicitEnvSelection(this.argv));

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

    const filePath = await resolveBackupRestoreFilePath(flags.file);
    const { envName, env } = await resolveBackupTargetEnv(requestedEnv);
    const restoreConfirmed = await confirmBackupRestore(envName, filePath, flags.force);
    if (!restoreConfirmed) {
      return;
    }
    const envArgv = buildBackupEnvArgv({
      requestedEnv,
      explicitEnvSelection,
      yes: flags.yes,
    });

    announceTargetEnv(envName);
    await ensureBackupRuntimeCommands({
      envName,
      env,
      commandIds: [BACKUP_RUNTIME_COMMANDS.restoreUpload],
    });

    startTask(`Restoring backup for "${envName}" from ${filePath}...`);
    try {
      await runBackupCliCommand(
        ['api', 'backup', 'restore-upload', '--file', filePath, '--force', ...envArgv],
        { errorName: 'nb api backup restore-upload' },
      );
      stopTask();

      await waitForAppReady({
        envName,
        apiBaseUrl: resolveBackupWaitApiBaseUrl(env),
      });

      succeedTask(`Backup restored for "${envName}" from ${filePath}`);
    } catch (error) {
      stopTask();
      failTask(`Failed to restore backup for "${envName}".`);
      throw error;
    }
  }
}
