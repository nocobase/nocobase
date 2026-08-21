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
import { run } from '../../lib/run-npm.js';
import { printInfo, printWarning } from '../../lib/ui.js';
import {
  generatePluginScaffold,
  isValidPluginPackageName,
  resolvePluginScaffoldTargetPath,
} from '../../scaffolds/plugin/index.js';
import {
  isCliManagedSourceApp,
  resolveLocalPluginWorkspaceSync,
  syncPluginWorkspace,
} from '../../lib/plugin-workspace.js';

type EntryKind = 'missing' | 'directory' | 'symlink' | 'other';

async function getEntryKind(candidate: string): Promise<EntryKind> {
  try {
    const stat = await fsp.lstat(candidate);
    if (stat.isSymbolicLink()) {
      return 'symlink';
    }
    if (stat.isDirectory()) {
      return 'directory';
    }
    return 'other';
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return 'missing';
    }
    throw error;
  }
}

async function cleanupDanglingSymlink(candidate: string): Promise<boolean> {
  if ((await getEntryKind(candidate)) !== 'symlink') {
    return false;
  }

  try {
    await fsp.realpath(candidate);
    return false;
  } catch {
    await fsp.rm(candidate, { recursive: true, force: true });
    return true;
  }
}

async function assertPluginTargetAvailable(targetPath: string, packageName: string, forceRecreate: boolean): Promise<void> {
  const entryKind = await getEntryKind(targetPath);
  if (entryKind === 'missing') {
    return;
  }
  if (forceRecreate) {
    await fsp.rm(targetPath, { recursive: true, force: true });
    return;
  }
  throw new Error(`[${packageName}] plugin already exists.`);
}

async function assertSourceEntryReady(params: {
  sourceEntryPath: string;
  packageName: string;
  forceRecreate: boolean;
}): Promise<void> {
  const sourceEntryKind = await getEntryKind(params.sourceEntryPath);
  if (sourceEntryKind === 'missing') {
    return;
  }
  if (sourceEntryKind === 'symlink') {
    try {
      await fsp.realpath(params.sourceEntryPath);
      if (params.forceRecreate) {
        return;
      }
    } catch {
      return;
    }
  }

  if (params.forceRecreate) {
    return;
  }

  throw new Error(
    [
      `[${params.packageName}] plugin already exists.`,
      `Source entry already exists at ${params.sourceEntryPath}.`,
      `Remove the conflicting source entry or rerun with --force-recreate if you want to rebuild it.`,
    ].join('\n'),
  );
}

function formatSyncSummary(params: {
  pluginWorkspaceRoot: string;
  sourcePath: string;
  sourceEntryPath: string;
  pluginWorkspacePath: string;
  packageName: string;
  createdPluginWorkspace: boolean;
  createdSourcePluginRoot: boolean;
  linked: string[];
  relinked: string[];
  removedDangling: string[];
}): string[] {
  const changes: string[] = [];
  if (params.createdPluginWorkspace) {
    changes.push(`created ${params.pluginWorkspaceRoot}`);
  }
  if (params.createdSourcePluginRoot) {
    changes.push(`created ${path.join(params.sourcePath, 'packages', 'plugins')}`);
  }
  if (params.linked.length > 0) {
    changes.push(`linked ${params.sourceEntryPath} -> ${params.pluginWorkspacePath}`);
  }
  if (params.relinked.length > 0) {
    changes.push(`relinked ${params.sourceEntryPath} -> ${params.pluginWorkspacePath}`);
  }
  if (params.removedDangling.length > 0) {
    changes.push(`removed dangling entry for ${params.packageName}`);
  }
  return changes;
}

async function runPostinstall(sourcePath: string): Promise<void> {
  await run('yarn', ['postinstall'], {
    cwd: sourcePath,
    env: { LOGGER_SILENT: 'true' },
    errorName: 'yarn postinstall',
  });
}

export default class ScaffoldPlugin extends Command {
  static override args = {
    pkg: Args.string({ description: 'plugin package name', required: true }),
  };

  static override description = 'Generate a NocoBase plugin scaffold.';

  static override examples = [
    '<%= config.bin %> <%= command.id %> @nocobase-example/plugin-hello',
    '<%= config.bin %> <%= command.id %> @nocobase-example/plugin-hello --force-recreate',
  ];

  static override flags = {
    cwd: Flags.string({ description: 'Current working directory', char: 'c', required: false }),
    'force-recreate': Flags.boolean({ description: 'Force recreate the plugin', char: 'f', required: false }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(ScaffoldPlugin);
    const cwd = flags.cwd ?? process.cwd();
    const packageName = String(args.pkg).trim();

    try {
      if (!isValidPluginPackageName(packageName)) {
        this.error(`Invalid plugin package name: ${packageName}`);
      }

      const resolved = resolveLocalPluginWorkspaceSync({
        cwd,
        supportAppPath: true,
      });

      const cliManagedSourceApp = isCliManagedSourceApp(resolved);
      const targetRoot = cliManagedSourceApp
        ? path.join(resolved.appPath, 'plugins')
        : path.join(resolved.sourcePath, 'packages', 'plugins');
      const scaffoldTargetPath = resolvePluginScaffoldTargetPath(targetRoot, packageName);

      await assertPluginTargetAvailable(scaffoldTargetPath, packageName, Boolean(flags['force-recreate']));

      if (!cliManagedSourceApp) {
        await generatePluginScaffold({
          packageName,
          sourcePath: resolved.sourcePath,
          targetRoot,
        });
        printInfo(`The plugin folder is in ${scaffoldTargetPath}`);
        await runPostinstall(resolved.sourcePath);
        return;
      }

      const pluginWorkspaceRoot = path.join(resolved.appPath, 'plugins');
      const pluginWorkspacePath = resolvePluginScaffoldTargetPath(pluginWorkspaceRoot, packageName);
      const sourceEntryPath = path.join(resolved.sourcePath, 'packages', 'plugins', ...packageName.split('/'));

      await cleanupDanglingSymlink(sourceEntryPath);
      await assertSourceEntryReady({
        sourceEntryPath,
        packageName,
        forceRecreate: Boolean(flags['force-recreate']),
      });

      await generatePluginScaffold({
        packageName,
        sourcePath: resolved.sourcePath,
        targetRoot: pluginWorkspaceRoot,
      });
      printInfo(`The plugin folder is in ${pluginWorkspacePath}`);

      const syncResult = await syncPluginWorkspace({
        appPath: resolved.appPath,
        sourcePath: resolved.sourcePath,
        mode: 'targeted',
        targetPackageNames: [packageName],
        forceRecreate: flags['force-recreate'],
      });

      await runPostinstall(resolved.sourcePath);

      if (syncResult.changed) {
        const changes = formatSyncSummary({
          pluginWorkspaceRoot,
          sourcePath: resolved.sourcePath,
          sourceEntryPath,
          pluginWorkspacePath,
          packageName,
          createdPluginWorkspace: syncResult.createdPluginWorkspace,
          createdSourcePluginRoot: syncResult.createdSourcePluginRoot,
          linked: syncResult.linked,
          relinked: syncResult.relinked,
          removedDangling: syncResult.removedDangling,
        });
        if (changes.length > 0) {
          printInfo(`Plugin workspace synced: ${changes.join('; ')}`);
        }
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
