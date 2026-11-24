// Shared by the commands that run a development or build script against the application.
import {
  listCliPluginRegistrations,
  readCliPluginRegistrations,
} from '@nocobase/app-server/plugins';
import { Command } from '@oclif/core';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { applicationState } from '../runtime/command-store.ts';
import { runAppTool, type AppTool } from '../tools/run-tool.ts';
import { collectCliHooks } from './cli-hooks.ts';

export interface ToolCommandOptions {
  /** Hand the plugins' build and dev hooks to the script. */
  readonly hooks?: boolean;
  /**
   * Hand the script the packages `cli/plugins.ts` registers, read with the application's TypeScript, which the build
   * writes to `dist/cli/plugins.json` for a deployment that has neither.
   */
  readonly cliPluginRegistrations?: boolean;
  /** Node options for the script, such as a loader. */
  readonly execArgv?: readonly string[];
}

/**
 * A command that forwards its arguments untouched to one script.
 *
 * The scripts parse their own options — `build --target`, `dist retarget --node-version` — and print their own
 * usage, so the command does not declare flags it would only have to keep in step with them.
 */
export abstract class ToolCommand extends Command {
  static override strict = false;

  protected abstract readonly tool: AppTool;
  protected readonly toolOptions: ToolCommandOptions = {};

  override async run(): Promise<void> {
    const { location, loadPlugins } = applicationState();
    const env: Record<string, string> = {};
    if (this.toolOptions.hooks) {
      env['NOCOBASE_CLI_HOOKS'] = JSON.stringify(
        collectCliHooks(await loadPlugins()),
      );
    }
    if (this.toolOptions.cliPluginRegistrations) {
      const source = path.join(location.root, 'cli', 'plugins.ts');
      // One read answers both, so a save between them cannot pair an old list with a new hash.
      const sourceBytes = existsSync(source)
        ? await readFile(source)
        : undefined;
      const plugins =
        sourceBytes === undefined
          ? await readCliPluginRegistrations(location.root)
          : await listCliPluginRegistrations(sourceBytes.toString('utf8'), {
              appRoot: location.root,
            });
      if (plugins === undefined)
        this.error(
          'cli/plugins.ts is missing, so the CLI plugins this application registers cannot be listed.',
        );
      env['NOCOBASE_CLI_PLUGIN_REGISTRATIONS'] = JSON.stringify({
        plugins,
        // What the list was read from, so the build can tell when a hook changed it before it was compiled.
        sourceHash:
          sourceBytes === undefined
            ? null
            : createHash('sha256').update(sourceBytes).digest('hex'),
      });
    }
    const exitCode = await runAppTool(this.tool, {
      rootDir: location.root,
      args: this.argv,
      env,
      ...(this.toolOptions.execArgv === undefined
        ? {}
        : { execArgv: this.toolOptions.execArgv }),
    });
    if (exitCode !== 0) this.exit(exitCode);
  }
}
