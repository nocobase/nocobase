/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fsp from 'node:fs/promises';
import path from 'node:path';
import { Args, Command, Flags } from '@oclif/core';
import { printInfo, printWarning } from '../../lib/ui.js';
import {
  isCliManagedSourceApp,
  resolveLocalPluginWorkspaceSync,
  syncPluginWorkspace,
} from '../../lib/plugin-workspace.js';
import { runNocoBaseCommand } from '../../lib/run-npm.ts';

const PLUGIN_TARGET_ROOT_ENV = 'NB_PLUGIN_TARGET_ROOT';

export default class ScaffoldPlugin extends Command {
  static override args = {
    pkg: Args.string({description: 'plugin package name', required: true}),
  }
  static override description = 'Generate a NocoBase plugin scaffold.';
  static override examples = [
    '<%= config.bin %> <%= command.id %> @nocobase-example/plugin-hello',
    '<%= config.bin %> <%= command.id %> @nocobase-example/plugin-hello --force-recreate',
  ]

  static override flags = {
    cwd: Flags.string({ description: 'Current working directory', char: 'c', required: false }),
    'force-recreate': Flags.boolean({description: 'Force recreate the plugin', char: 'f', required: false}),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(ScaffoldPlugin);
    const cwd = flags.cwd ?? process.cwd();
    try {
      const resolved = resolveLocalPluginWorkspaceSync({
        cwd,
        supportAppPath: true,
      });
      if (!isCliManagedSourceApp(resolved)) {
        const npmArgs = ['pm', 'create', args.pkg];
        if (flags['force-recreate']) {
          npmArgs.push('--force-recreate');
        }
        await runNocoBaseCommand(npmArgs, {
          cwd: resolved.sourcePath,
          env: { LOGGER_SILENT: 'true' },
        });
        return;
      }
      const pluginWorkspaceRoot = path.join(resolved.appPath, 'plugins');
      const packageSegments = args.pkg.split('/');
      const pluginWorkspacePath = path.join(pluginWorkspaceRoot, ...packageSegments);
      const sourceEntryPath = path.join(resolved.sourcePath, 'packages', 'plugins', ...packageSegments);
      const npmArgs = ['pm', 'create', args.pkg];

      try {
        const existing = await fsp.stat(pluginWorkspacePath);
        if (existing.isDirectory() && !flags['force-recreate']) {
          this.error(`[${args.pkg}] plugin already exists.`);
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }

      if (flags['force-recreate']) {
        await fsp.rm(pluginWorkspacePath, { recursive: true, force: true });
        npmArgs.push('--force-recreate');
      }

      await runNocoBaseCommand(npmArgs, {
        cwd: resolved.sourcePath,
        env: {
          LOGGER_SILENT: 'true',
          [PLUGIN_TARGET_ROOT_ENV]: pluginWorkspaceRoot,
        },
      });

      const syncResult = await syncPluginWorkspace({
        appPath: resolved.appPath,
        sourcePath: resolved.sourcePath,
        mode: 'targeted',
        targetPackageNames: [args.pkg],
        forceRecreate: flags['force-recreate'],
      });

      if (syncResult.changed) {
        const changes: string[] = [];
        if (syncResult.createdPluginWorkspace) {
          changes.push(`created ${pluginWorkspaceRoot}`);
        }
        if (syncResult.createdSourcePluginRoot) {
          changes.push(`created ${path.join(resolved.sourcePath, 'packages', 'plugins')}`);
        }
        if (syncResult.linked.length > 0) {
          changes.push(`linked ${sourceEntryPath} -> ${pluginWorkspacePath}`);
        }
        if (syncResult.relinked.length > 0) {
          changes.push(`relinked ${sourceEntryPath} -> ${pluginWorkspacePath}`);
        }
        if (syncResult.removedDangling.length > 0) {
          changes.push(`removed dangling entry for ${args.pkg}`);
        }
        printInfo(`Plugin workspace synced: ${changes.join('; ')}`);
      }

      for (const warning of syncResult.warnings) {
        printWarning(warning);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(message);
    }
  }
}
