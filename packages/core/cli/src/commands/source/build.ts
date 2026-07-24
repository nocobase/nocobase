/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { runNocoBaseCommand } from '../../lib/run-npm.js';
import {
  isCliManagedSourceApp,
  resolveLocalPluginWorkspaceSync,
  summarizePluginWorkspaceSync,
  syncPluginWorkspace,
} from '../../lib/plugin-workspace.js';
import { printInfo, printWarning } from '../../lib/ui.js';
import { setVerboseMode } from '../../lib/ui.js';

async function resolveTarballPaths(sourcePath: string, packageNames: string[]): Promise<string[]> {
  const tarballPaths: string[] = [];

  for (const packageName of packageNames) {
    const packageJsonPath = path.join(sourcePath, 'packages', 'plugins', ...packageName.split('/'), 'package.json');
    try {
      const packageJson = JSON.parse(await fsp.readFile(packageJsonPath, 'utf8')) as {
        name?: string;
        version?: string;
      };
      if (!packageJson.name || !packageJson.version) {
        continue;
      }
      tarballPaths.push(path.join(sourcePath, 'storage', 'tar', `${packageJson.name}-${packageJson.version}.tgz`));
    } catch {
      continue;
    }
  }

  return tarballPaths;
}

export default class SourceBuild extends Command {
  static override hidden = false;
  static override args = {
    /** Matches `nb source build @nocobase/acl @nocobase/actions` — zero or more package names. */
    packages: Args.string({
      description: 'package names to build',
      multiple: true,
      required: false,
    }),
  };
  static override description =
    'Run the legacy NocoBase build for the local source project (forwards to `npm run build` in the repo root)';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --build-dts',
    '<%= config.bin %> <%= command.id %> --sourcemap',
    '<%= config.bin %> <%= command.id %> --no-verbose',
    '<%= config.bin %> <%= command.id %> @nocobase/acl',
    '<%= config.bin %> <%= command.id %> @nocobase/acl @nocobase/actions',
  ];
  static override flags = {
    cwd: Flags.string({ description: 'Current working directory', char: 'c', required: false }),
    'build-dts': Flags.boolean({
      description: 'Generate TypeScript declaration files during the build',
      default: false,
    }),
    'no-dts': Flags.boolean({ description: 'not generate dts', hidden: true }),
    sourcemap: Flags.boolean({ description: 'generate sourcemap' }),
    tar: Flags.boolean({ description: 'Create plugin tarball artifacts after build' }),
    verbose: Flags.boolean({ description: 'Show detailed command output', default: true, allowNo: true }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(SourceBuild);
    setVerboseMode(flags.verbose);
    const packages = args.packages ?? [];
    const npmArgs = ['build', ...packages];
    const shouldBuildDts = Boolean(flags['build-dts']);
    if (!shouldBuildDts) {
      npmArgs.push('--no-dts');
    }
    if (flags.sourcemap) {
      npmArgs.push('--sourcemap');
    }
    if (flags.tar) {
      npmArgs.push('--tar');
    }
    try {
      const resolved = resolveLocalPluginWorkspaceSync({
        cwd: flags.cwd ?? process.cwd(),
        supportAppPath: false,
      });
      if (isCliManagedSourceApp(resolved)) {
        const syncResult = await syncPluginWorkspace({
          appPath: resolved.appPath,
          sourcePath: resolved.sourcePath,
          mode: packages.length > 0 ? 'targeted' : 'all',
          targetPackageNames: packages,
        });
        const summary = summarizePluginWorkspaceSync(syncResult);
        if (summary.length > 0) {
          printInfo(`Plugin workspace synced: ${summary.join('; ')}`);
        }
        for (const warning of syncResult.warnings) {
          printWarning(warning);
        }
      }
      await runNocoBaseCommand(npmArgs, {
        cwd: flags['cwd'],
        stdio: flags.verbose ? 'inherit' : 'ignore',
      });
      if (flags.tar) {
        const tarballPaths = await resolveTarballPaths(resolved.sourcePath, packages);
        if (tarballPaths.length > 0) {
          if (tarballPaths.length === 1) {
            printInfo(`Tarball created: ${tarballPaths[0]}`);
          } else {
            printInfo(`Tarballs created:\n${tarballPaths.map((item) => `- ${item}`).join('\n')}`);
          }
        } else {
          printInfo(`Tarball output directory: ${path.join(resolved.sourcePath, 'storage', 'tar')}`);
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(message);
    }
  }
}
