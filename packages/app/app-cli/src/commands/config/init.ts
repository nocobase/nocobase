import { type Command, Flags } from '@oclif/core';
import type { Interfaces } from '@oclif/core';

import {
  OFFICIAL_DIALECTS,
  type OfficialDialect,
} from '@nocobase/app-server/database';

import { CommandError } from '../../command/errors.ts';
import { withAppRuntime } from '../../command/lifecycle.ts';
import { AppCommand, appContextOf } from '../../context.ts';
import {
  ConfigInitError,
  configErrorCode,
  runConfigInit,
  type ConfigInitResult,
} from '../../lib/config-init.ts';
import {
  confirmWriteAnyway,
  PromptCancelledError,
  promptConnection,
  selectDialect,
} from '../../lib/prompts.ts';

/**
 * What `config init` reports: everything but whether it wrote the file, which is the envelope's `status` — `success`
 * when it did, `success-noop` when the application was already configured.
 */
export type AppConfigInitResult = Omit<ConfigInitResult, 'status'>;

export default class AppConfigInit extends AppCommand {
  static override summary =
    'Write the configuration file this application starts from.';
  static override description =
    "Generates config.yml from the application's config.example.yml, keeping its comments, generating the first secrets key (secrets.keys, version 1), and pointing database.connections.main at the selected dialect. It never installs anything: the database driver decides which dialects this application can run on, so install it first with pnpm add and run this afterwards. Connection settings are generated with placeholder values for the selected dialect; edit them for the target database before starting. Everything is checked before anything is written, so a run that reports a problem leaves the directory untouched and can simply be repeated. Not for applications hosted by a Hub, which receive their configuration from it.";

  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --dialect postgres',
    '<%= config.bin %> <%= command.id %> --dialect sqlite --json',
  ];

  static override flags: {
    dialect: Interfaces.OptionFlag<string | undefined>;
    config: Interfaces.OptionFlag<string | undefined>;
    force: Interfaces.BooleanFlag<boolean>;
  } = {
    dialect: Flags.string({
      options: [...OFFICIAL_DIALECTS],
      description:
        'Dialect for the main connection. Defaults to the installed driver when there is exactly one; required when there is no terminal to ask on.',
    }),
    config: Flags.string({
      description:
        'Write to this path instead of the default, resolved the same way as APP_CONFIG_FILE.',
    }),
    force: Flags.boolean({
      default: false,
      description: 'Replace an existing configuration file.',
    }),
  };

  public async run(): Promise<AppConfigInitResult> {
    const { flags } = await this.parse(AppConfigInit);
    const interactive = !this.jsonEnabled() && process.stdin.isTTY === true;
    let outcome: ConfigInitResult;

    try {
      outcome = await runConfigInit({
        rootDir: this.rootDir,
        dialect: flags.dialect,
        // Not an appPath(): like APP_CONFIG_FILE, a relative --config names a path inside the application.
        configPath: flags.config,
        force: flags.force,
        selectDialect: interactive
          ? (available: readonly OfficialDialect[]) => selectDialect(available)
          : undefined,
        readConfiguredDialect: () => this.readConfiguredDialect(),
        askConnection: interactive
          ? (dialect, defaults) => promptConnection(dialect, defaults)
          : undefined,
        onConnectionTested: interactive
          ? async (tested) => {
              if (tested.status === 'ok') {
                this.log(`✓ Connected to the ${tested.dialect} database.`);
                return true;
              }
              this.log(
                `✗ Could not connect: ${tested.reason ?? 'unknown error'}`,
              );
              return confirmWriteAnyway();
            }
          : undefined,
      });
    } catch (error) {
      throw toCommandError(error);
    }

    const { status, ...result } = outcome;
    if (status === 'unchanged') {
      this.setStatus('success-noop');
      this.log(
        `Already configured: ${result.configFile}. Edit it with pnpm nocobase config set, or run with --force to replace it.`,
      );
      return result;
    }
    this.log(`Wrote ${result.configFile} for ${result.dialect}.`);
    if (result.requiredSettings.length > 0) {
      this.log(
        `Set these for your database before starting: ${result.requiredSettings.join(', ')}.`,
      );
      this.log(
        '  For example: pnpm nocobase config set database.connections.main.host=<host>, and pnpm nocobase config set --from-env database.connections.main.password=<VARIABLE>',
      );
    }
    if (result.overriddenByEnvironment.length > 0) {
      // Environment values are applied after the file, so the secrets just written are not the ones that will be used.
      this.log(
        `Note: ${result.overriddenByEnvironment.join(' and ')} are set in this environment and override the file.`,
      );
    }
    return result;
  }

  /**
   * The dialect the existing configuration uses, read through the application rather than from the file, so a dialect
   * that only its code defaults set is seen too. Unknown when the configuration does not load.
   */
  private async readConfiguredDialect(): Promise<string | undefined> {
    return withAppRuntime(
      appContextOf(this),
      async (runtime) => {
        const database = runtime.config.get<{
          default?: string;
          connections?: Record<string, { dialect?: unknown }>;
        }>('database');
        const name = database?.default ?? 'main';
        const dialect = database?.connections?.[name]?.dialect;
        return typeof dialect === 'string' ? dialect : undefined;
      },
      { onCleanupFailure: (error) => this.warn(error.message) },
    );
  }
}

/**
 * A refusal becomes a `CommandError` named after its reason, such as `DRIVER_MISSING`, carrying the command that gets
 * past it and the details the refusal holds. Input problems exit 2 and operational ones exit 1, matching the create
 * command.
 */
function toCommandError(error: unknown): CommandError {
  if (error instanceof ConfigInitError) {
    return new CommandError(error.message, {
      code: configErrorCode(error.reason),
      exit: error.reason === 'unknown-dialect' ? 2 : 1,
      suggestions: error.suggestion ? [error.suggestion] : [],
      details: error.details,
      cause: error,
    });
  }
  if (error instanceof PromptCancelledError) {
    return new CommandError(error.message, { code: 'CANCELLED', cause: error });
  }
  return new CommandError(
    error instanceof Error ? error.message : String(error),
    { code: 'CONFIG_INIT_FAILED', cause: error },
  );
}
