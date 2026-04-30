/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import pc from 'picocolors';
import { licenseEnvFlag, licenseJsonFlag, requireLicenseRuntime } from '../shared.js';
import { syncLicensedPlugins } from './shared.js';
import { resolvePluginStoragePath } from '../../../lib/plugin-storage.js';
import { startTask, stopTask, succeedTask, updateTask } from '../../../lib/ui.js';

const SYNC_LOADING_DELAY_MS = 1200;
const SYNC_LOADING_UPDATE_MS = 5000;

function formatActionLabel(action: 'installed' | 'updated' | 'removed' | 'skipped') {
  switch (action) {
    case 'installed':
      return pc.green('installed');
    case 'updated':
      return pc.cyan('updated');
    case 'removed':
      return pc.yellow('removed');
    case 'skipped':
      return pc.dim('skipped');
  }
}

export default class LicensePluginsSync extends Command {
  static override summary = 'Synchronize commercial plugins for the selected env';
  static override description =
    'Synchronize the commercial plugins allowed by the current saved license key.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --env app1',
    '<%= config.bin %> <%= command.id %> --env app1 --dry-run',
    '<%= config.bin %> <%= command.id %> --env app1 --json',
  ];
  static override flags = {
    env: licenseEnvFlag,
    json: licenseJsonFlag,
    'dry-run': Flags.boolean({
      description: 'Preview plugin changes without installing, upgrading, or removing anything',
      default: false,
    }),
    version: Flags.string({
      description: 'Registry version or dist-tag to synchronize. Defaults to the current workspace version.',
    }),
    verbose: Flags.boolean({
      char: 'V',
      description: 'Show detailed per-plugin sync logs',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(LicensePluginsSync);
    const runtime = await requireLicenseRuntime(flags.env);
    const version = String(flags.version ?? this.config.pjson.version ?? 'latest').trim() || 'latest';
    const shouldStreamLogs = !flags.json && Boolean(flags.verbose);
    const pluginStoragePath = resolvePluginStoragePath(runtime.env.storagePath);
    const shouldShowLoading = !flags.json && !flags.verbose;

    if (!flags.json) {
      this.log(
        pc.bold(
          flags['dry-run']
            ? `Commercial plugin sync preview for env "${runtime.envName}"`
            : `Commercial plugin sync for env "${runtime.envName}"`,
        ),
      );
      this.log(pc.dim(`Version: ${version}`));
      this.log(pc.dim(`Plugin storage path: ${pluginStoragePath}`));
    }

    let loadingStarted = false;
    let loadingTimer: ReturnType<typeof setTimeout> | undefined;
    let updateTimer: ReturnType<typeof setInterval> | undefined;
    let elapsedSeconds = 0;

    if (shouldShowLoading) {
      loadingTimer = setTimeout(() => {
        loadingStarted = true;
        elapsedSeconds = Math.floor(SYNC_LOADING_DELAY_MS / 1000);
        startTask(
          flags['dry-run']
            ? 'Preparing commercial plugin sync preview. Please wait...'
            : 'Synchronizing commercial plugins. Please wait...',
        );
        updateTimer = setInterval(() => {
          elapsedSeconds += Math.floor(SYNC_LOADING_UPDATE_MS / 1000);
          updateTask(
            flags['dry-run']
              ? `Preparing commercial plugin sync preview. Still working... (${elapsedSeconds}s elapsed)`
              : `Synchronizing commercial plugins. Still working... (${elapsedSeconds}s elapsed)`,
          );
        }, SYNC_LOADING_UPDATE_MS);
      }, SYNC_LOADING_DELAY_MS);
    }

    let result;
    try {
      result = await syncLicensedPlugins(runtime, {
        version,
        dryRun: Boolean(flags['dry-run']),
        onProgress: shouldStreamLogs
          ? async (detail) => {
            this.log(`${formatActionLabel(detail.action)} ${pc.bold(detail.packageName)}`);
            this.log(pc.dim(`  output: ${detail.outputDir}`));
            if (detail.warning) {
              this.log(pc.yellow(`  warning: ${detail.warning}`));
            }
          }
          : undefined,
      });
    } finally {
      if (loadingTimer) {
        clearTimeout(loadingTimer);
      }
      if (updateTimer) {
        clearInterval(updateTimer);
      }
      if (loadingStarted) {
        stopTask();
      }
    }
    const payload = {
      ok: true,
      env: runtime.envName,
      kind: runtime.kind,
      dryRun: Boolean(flags['dry-run']),
      version,
      ...result,
    };

    if (flags.json) {
      this.log(JSON.stringify(payload, null, 2));
      return;
    }

    if (loadingStarted) {
      succeedTask(
        flags['dry-run']
          ? 'Commercial plugin sync preview is ready.'
          : 'Commercial plugin sync completed.',
      );
    }

    if (!flags.verbose) {
      const changes = [];
      if (result.installed.length > 0) {
        changes.push(pc.green(`${result.installed.length} installed`));
      }
      if (result.updated.length > 0) {
        changes.push(pc.cyan(`${result.updated.length} updated`));
      }
      if (result.removed.length > 0) {
        changes.push(pc.yellow(`${result.removed.length} removed`));
      }
      if (result.skipped.length > 0) {
        changes.push(pc.dim(`${result.skipped.length} skipped`));
      }
      if (changes.length === 0) {
        changes.push(pc.dim('no plugin changes'));
      }
      this.log(`Result: ${changes.join(', ')}`);
    } else {
      this.log(
        `Summary: ${result.installed.length} installed, ${result.updated.length} updated, ${result.removed.length} removed, ${result.skipped.length} skipped, ${result.warnings.length} warnings`,
      );
    }

    if (result.warnings.length > 0 && !flags.verbose) {
      for (const warning of result.warnings) {
        this.log(pc.yellow(`Warning: ${warning}`));
      }
    }
  }
}
