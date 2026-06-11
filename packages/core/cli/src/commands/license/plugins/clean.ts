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
import { ensureCrossEnvConfirmed, hasExplicitEnvSelection } from '../../../lib/env-guard.js';
import {
  createLicenseEnvFlag,
  licenseJsonFlag,
  licensePkgUrlFlag,
  licenseYesFlag,
  requireLicenseRuntime,
} from '../shared.js';
import { cleanLicensedPlugins } from './shared.js';
import { resolvePluginStoragePath } from '../../../lib/plugin-storage.js';
import { announceTargetEnv } from '../../../lib/ui.js';

function formatActionLabel(action: 'removed' | 'skipped') {
  switch (action) {
    case 'removed':
      return pc.yellow('removed');
    case 'skipped':
      return pc.dim('skipped');
  }
}

export default class LicensePluginsClean extends Command {
  static override summary = 'Remove downloaded commercial plugins for the selected env';
  static override description =
    'Remove local commercial plugin downloads for the selected env without changing license activation.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --env app1',
    '<%= config.bin %> <%= command.id %> --env app1 --dry-run',
    '<%= config.bin %> <%= command.id %> --env app1 --verbose',
    '<%= config.bin %> <%= command.id %> --env app1 --json',
  ];
  static override flags = {
    env: createLicenseEnvFlag('CLI env name to clean licensed plugins for. Defaults to the current env when omitted'),
    json: licenseJsonFlag,
    'pkg-url': licensePkgUrlFlag,
    'dry-run': Flags.boolean({
      description: 'Preview which commercial plugins would be removed without deleting anything',
      default: false,
    }),
    verbose: Flags.boolean({
      description: 'Show detailed per-plugin clean logs',
      default: false,
    }),
    yes: licenseYesFlag,
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(LicensePluginsClean);
    const requestedEnv = flags.env?.trim() || undefined;
    const explicitEnvSelection = Boolean(requestedEnv && hasExplicitEnvSelection(this.argv ?? []));
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

    const runtime = await requireLicenseRuntime(flags.env);
    if (!flags.json) {
      announceTargetEnv(runtime.envName);
    }
    const shouldStreamLogs = !flags.json && Boolean(flags.verbose);
    const pluginStoragePath = resolvePluginStoragePath(runtime.env.storagePath);

    if (!flags.json) {
      this.log(
        pc.bold(
          flags['dry-run']
            ? `Commercial plugin clean preview for env "${runtime.envName}"`
            : `Commercial plugin clean for env "${runtime.envName}"`,
        ),
      );
      this.log(pc.dim(`Plugin storage path: ${pluginStoragePath}`));
    }

    const result = await cleanLicensedPlugins(runtime, {
      pkgUrl: flags['pkg-url'],
      dryRun: Boolean(flags['dry-run']),
      onProgress: shouldStreamLogs
        ? async (detail) => {
          this.log(`${formatActionLabel(detail.action)} ${pc.bold(detail.packageName)}`);
          this.log(pc.dim(`  output: ${detail.outputDir}`));
          if (detail.action === 'removed') {
            this.log(pc.dim(`  symlink: ${detail.removedSymlink ? 'removed' : 'not found'}`));
          }
        }
        : undefined,
    });

    const payload = {
      ok: true,
      env: runtime.envName,
      kind: runtime.kind,
      dryRun: Boolean(flags['dry-run']),
      ...result,
    };

    if (flags.json) {
      this.log(JSON.stringify(payload, null, 2));
      return;
    }

    if (!flags.verbose) {
      const changes = [];
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
      this.log(`Summary: ${result.removed.length} removed, ${result.skipped.length} skipped`);
    }
  }
}
