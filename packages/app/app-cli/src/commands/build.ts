import { createDefaultCommandContext } from '../default-context.ts';
import { withAppRuntime } from '../command/lifecycle.ts';
import { applicationState } from '../runtime/command-store.ts';
import {
  inspectDatabaseDrivers,
  assertDatabaseDrivers,
} from '../lib/database-driver-dependencies.ts';
import { formatCommandLine } from '@nocobase/cli-envelope';
import type { Command } from '@oclif/core';

import type { AppTool } from '../tools/run-tool.ts';
import { ToolCommand, type ToolCommandOptions } from '../lib/tool-command.ts';

export default class Build extends ToolCommand {
  static override summary =
    'Build the client, server, CLI and production dependencies into dist/.';
  static override description = `Runs the registered plugins' build hooks at their stages.

Checks configured database drivers against production dependencies before building, without opening connections.

Options are passed to the build:
  --target <target>       Deployment platform, such as linux-x64 or linux-arm64-musl (default: current).
  --node-version <major>  Target Node major for an explicit platform target (default: 24).
  --tar                   Also create storage/exports/dist.tar.gz after a successful build.

dist retarget and dist check rerun those two steps on a dist/ that is already built.`;
  static override examples: Command.Example[] = [
    '<%= config.bin %> build',
    '<%= config.bin %> build --target linux-x64 --node-version 24 --tar',
  ];

  override async run(): Promise<void> {
    if (!this.argv.some((arg) => arg === '--help' || arg === '-h')) {
      const context = createDefaultCommandContext({
        rootDir: applicationState().location.root,
      });
      await withAppRuntime(
        {
          loadRuntime: () =>
            context.loadRuntime({ prepareDatabaseDrivers: false }),
        },
        async (runtime) => {
          const retry = formatCommandLine({
            command: 'pnpm',
            args: ['nocobase', 'build', ...this.argv],
          });
          const { findings, available } = inspectDatabaseDrivers(
            runtime,
            'source',
            retry,
            true,
          );
          assertDatabaseDrivers(findings);
          if (available.length)
            this.logToStderr(
              `Production database drivers: ${available.join(', ')}`,
            );
        },
      );
    }
    await super.run();
  }

  protected readonly tool: AppTool = 'build';
  protected override readonly toolOptions: ToolCommandOptions = {
    hooks: true,
  };
}
