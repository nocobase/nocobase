import { type Command, Flags } from '@oclif/core';
import type { Interfaces } from '@oclif/core';

import { CommandError } from '../../command/errors.ts';
import { AppCommand, appContextOf } from '../../context.ts';
import {
  runConfigCheck,
  type ConfigCheckConnectMode,
  type ConfigCheckResult,
} from '../../lib/config-check.ts';
import { ConfigInitError, configErrorCode } from '../../lib/config-init.ts';

/**
 * What `config check` reports, on success and, as `error.details`, on failure: every finding — warnings included —
 * each connection it tried, and what the browser receives.
 */
export type AppConfigCheckResult = Omit<ConfigCheckResult, 'ok'>;

export default class AppConfigCheck extends AppCommand {
  static override summary =
    'Check the configuration the way a start would read it.';
  static override description =
    'Loads the configuration through the application itself — its files, its environment and its code defaults — without starting it, and reports what would stop it from starting or quietly misbehave: a file that does not parse, a database driver that is not installed, secrets keys that are missing, weak or still the placeholder, a session key that is regenerated on every start, a section name that nothing reads, and a ${NAME} reference that is used as literal text. Databases other than SQLite are also connected to, one connection each, taken from the pool and handed straight back; no SQL runs and nothing is migrated. Use --connect to include SQLite, or --no-connect to stay offline. Exits non-zero when any error is found, and with --strict when any warning is.';

  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --json',
    '<%= config.bin %> <%= command.id %> --no-connect',
  ];

  static override flags: {
    connect: Interfaces.BooleanFlag<boolean | undefined>;
    strict: Interfaces.BooleanFlag<boolean>;
  } = {
    connect: Flags.boolean({
      allowNo: true,
      description:
        'Connect to every database, SQLite included; --no-connect connects to none. By default every database but SQLite is connected to.',
    }),
    strict: Flags.boolean({
      default: false,
      description: 'Treat warnings as failures.',
    }),
  };

  public async run(): Promise<AppConfigCheckResult> {
    const { flags } = await this.parse(AppConfigCheck);
    const connect: ConfigCheckConnectMode =
      flags.connect === undefined ? 'auto' : flags.connect ? 'always' : 'never';

    let checked: ConfigCheckResult;
    try {
      // The runtime is loaded here rather than through withAppRuntime, because a load that fails is a finding rather
      // than an error; runConfigCheck destroys the scope of one that loads.
      checked = await runConfigCheck({
        rootDir: this.rootDir,
        loadRuntime: () => appContextOf(this).loadRuntime(),
        connect,
      });
    } catch (error) {
      // Only an application that cannot be found at all ends up here; every problem with the configuration itself
      // is a finding.
      throw new CommandError(
        error instanceof Error ? error.message : String(error),
        {
          code:
            error instanceof ConfigInitError
              ? configErrorCode(error.reason)
              : 'CONFIG_CHECK_FAILED',
          exit: 2,
          cause: error,
        },
      );
    }

    const { ok, ...result } = checked;
    this.report(result);

    const errors = count(result, 'error');
    const warnings = count(result, 'warning');
    if (!ok) {
      throw new CommandError(
        `The configuration has ${plural(errors, 'error')} that would stop the application from starting.`,
        { code: 'CONFIG_INVALID', details: result },
      );
    }
    if (flags.strict && warnings > 0) {
      throw new CommandError(
        `The configuration has ${plural(warnings, 'warning')}, which --strict treats as failures.`,
        { code: 'CONFIG_INVALID', details: result },
      );
    }
    return result;
  }

  private report(result: AppConfigCheckResult): void {
    this.log(
      result.configFile
        ? `Checked ${result.configFile}`
        : 'Checked the configuration (no configuration file)',
    );
    for (const connection of result.connections) {
      if (connection.status === 'skipped') continue;
      this.log(
        `  ${connection.status === 'ok' ? '✓' : '✗'} database "${connection.name}" (${connection.dialect})`,
      );
    }
    const published = flattenPublic(result.public);
    if (published.length > 0) {
      this.log('Published to the browser (config.public):');
      for (const [path, value] of published) {
        this.log(`  ${path} = ${JSON.stringify(value)}`);
      }
    }
    if (result.findings.length === 0) {
      this.log('No problems found.');
      return;
    }
    for (const finding of result.findings) {
      this.log(
        `${finding.level === 'error' ? '✗' : '!'} ${finding.key ? `${finding.key}: ` : ''}${finding.message}`,
      );
      if (finding.fix) this.log(`    ${finding.fix}`);
    }
  }
}

function count(
  result: AppConfigCheckResult,
  level: 'error' | 'warning',
): number {
  return result.findings.filter((finding) => finding.level === level).length;
}

function plural(amount: number, noun: string): string {
  return `${amount} ${noun}${amount === 1 ? '' : 's'}`;
}

function flattenPublic(
  value: Readonly<Record<string, unknown>>,
  prefix = '',
): [string, unknown][] {
  return Object.entries(value).flatMap(([key, item]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof item === 'object' && item !== null && !Array.isArray(item)
      ? flattenPublic(item as Record<string, unknown>, path)
      : [[path, item] as [string, unknown]];
  });
}
