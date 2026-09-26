import { parse } from '@oclif/core/parser';
import {
  INSTALL_ARGS,
  INSTALL_FLAGS,
  install,
  type CommandDeps,
  type CommandOutcome,
  type InstallInput,
} from './commands/install.ts';
import {
  ROLLBACK_FLAGS,
  rollback,
  type RollbackInput,
} from './commands/rollback.ts';
import { STATUS_FLAGS, status, type StatusInput } from './commands/status.ts';
import {
  UPGRADE_FLAGS,
  upgrade,
  type UpgradeInput,
} from './commands/upgrade.ts';
import { EXIT_INVALID, EXIT_OK, InstallerError } from './lib/errors.ts';
import { installInterruptHandlers } from './lib/interrupt.ts';
import { installerCommand } from './lib/invocation.ts';
import { MINIMUM_PM2_VERSION } from './lib/prechecks.ts';
import {
  createReporter,
  errorEnvelope,
  exitCodeOf,
  formatError,
  successEnvelope,
} from './lib/output.ts';
import { createPm2, type Pm2 } from './lib/pm2.ts';
import type { FetchLike } from './lib/registry.ts';
import type { RunCommand } from './lib/run-command.ts';

export interface RunInstallerOptions {
  argv: string[];
  version: string;
  stdout?: NodeJS.WritableStream;
  stderr?: NodeJS.WritableStream;
  cwd?: string;
  pm2?: Pm2;
  fetchImpl?: FetchLike;
  run?: RunCommand;
}

interface FlagHelp {
  description?: string;
  allowNo?: boolean;
  default?: unknown;
}

function describeFlags(flags: Record<string, FlagHelp>): string[] {
  return Object.entries(flags).map(([name, flag]) => {
    const label = flag.allowNo ? `--[no-]${name}` : `--${name}`;
    const value = flag.default;
    const fallback =
      typeof value === 'string' || typeof value === 'number' || value === true
        ? ` (default: ${String(value)})`
        : '';
    return `  ${label.padEnd(20)} ${flag.description ?? ''}${fallback}`;
  });
}

/** Every usage line and example is a command that runs as-is, the same way error suggestions are. */
export function formatHelp(): string {
  return [
    'Install and manage a NocoBase 3 Hub on a server without changing its source.',
    '',
    'USAGE',
    `  $ ${installerCommand('COMMAND [FLAGS]')}`,
    '',
    'COMMANDS',
    '  install DIRECTORY  Build a new Hub into DIRECTORY (or --dir DIRECTORY) and start it with pm2.',
    '  upgrade            Upgrade the Hub in --dir, the current directory by default, to --to (latest), or build the installed version again with --rebuild.',
    '  rollback           Return to the release the last upgrade came from, or to --to.',
    '  status             Report the version, endpoints, health, pm2 process and releases.',
    '',
    'INSTALL FLAGS',
    ...describeFlags(INSTALL_FLAGS),
    '',
    'UPGRADE FLAGS',
    ...describeFlags(UPGRADE_FLAGS),
    '',
    'ROLLBACK FLAGS',
    ...describeFlags(ROLLBACK_FLAGS),
    '',
    'STATUS FLAGS',
    ...describeFlags(STATUS_FLAGS),
    '',
    'EXAMPLES',
    `  $ ${installerCommand('install /srv/nocobase/hub --origin https://apps.example.com')}`,
    `  $ ${installerCommand('install /srv/nocobase/hub --dialect postgres --set database.connections.main.host=db.internal --set-from-env database.connections.main.password=HUB_DB_PASSWORD')}`,
    `  $ ${installerCommand('upgrade --dir /srv/nocobase/hub --yes')}`,
    `  $ ${installerCommand('rollback --dir /srv/nocobase/hub')}`,
    `  $ ${installerCommand('status --dir /srv/nocobase/hub --json')}`,
    '',
    'NOTES',
    `  Requires Node.js 24+, pnpm 11+ and, to start the Hub, pm2 ${MINIMUM_PM2_VERSION}+ installed globally.`,
    '  Packages come from https://npm.nocobase.ai by default; override with --registry or NOCOBASE_REGISTRY.',
    '  install and upgrade build the Hub on this machine and take several minutes.',
    '  To change the origin or port, edit hub.env in the Hub root, then run pm2 restart with the process name.',
  ].join('\n');
}

async function parseCommand<T>(
  argv: string[],
  definition: {
    args?: Record<string, unknown>;
    flags: Record<string, unknown>;
  },
): Promise<T> {
  try {
    const parsed = await parse(argv, {
      args: definition.args as never,
      flags: definition.flags as never,
      strict: true,
    });
    return { ...(parsed.args as object), flags: parsed.flags } as T;
  } catch (error) {
    // oclif spreads one problem over several lines ("Missing 1 required arg:" then the argument); keep the first two.
    const message =
      error instanceof Error
        ? error.message
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line !== '' && !line.startsWith('See more help'))
            .slice(0, 2)
            .join(' ')
        : String(error);
    throw new InstallerError('INVALID_USAGE', message, {
      exitCode: EXIT_INVALID,
      cause: error,
      suggestions: [
        { message: 'See the usage:', run: installerCommand('--help') },
      ],
    });
  }
}

export async function runInstaller(
  options: RunInstallerOptions,
): Promise<number> {
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;
  const [command, ...rest] = options.argv;
  const json = options.argv.includes('--json');
  const reporter = createReporter(json, stderr);

  if (
    command === undefined ||
    command === '--help' ||
    command === '-h' ||
    command === 'help'
  ) {
    stdout.write(`${formatHelp()}\n`);
    return EXIT_OK;
  }
  if (command === '--version') {
    stdout.write(
      json
        ? `${JSON.stringify(successEnvelope(command, { version: options.version }, []))}\n`
        : `${options.version}\n`,
    );
    return EXIT_OK;
  }

  // `install --help` asks for help, not for a flag the command does not define.
  if (rest.includes('--help') || rest.includes('-h')) {
    stdout.write(`${formatHelp()}\n`);
    return EXIT_OK;
  }

  const deps: CommandDeps = {
    reporter,
    pm2: options.pm2 ?? createPm2('pm2', options.run),
    fetchImpl: options.fetchImpl,
    cwd: options.cwd,
    run: options.run,
  };

  const removeInterruptHandlers = installInterruptHandlers(stderr);
  try {
    let outcome: CommandOutcome;
    if (command === 'install') {
      outcome = await install(
        await parseCommand<InstallInput>(rest, {
          args: INSTALL_ARGS,
          flags: INSTALL_FLAGS,
        }),
        deps,
      );
    } else if (command === 'upgrade') {
      outcome = await upgrade(
        await parseCommand<UpgradeInput>(rest, { flags: UPGRADE_FLAGS }),
        deps,
      );
    } else if (command === 'rollback') {
      outcome = await rollback(
        await parseCommand<RollbackInput>(rest, { flags: ROLLBACK_FLAGS }),
        deps,
      );
    } else if (command === 'status') {
      outcome = await status(
        await parseCommand<StatusInput>(rest, { flags: STATUS_FLAGS }),
        deps,
      );
    } else {
      throw new InstallerError(
        'INVALID_USAGE',
        `Unknown command "${command}".`,
        {
          exitCode: EXIT_INVALID,
          suggestions: [
            { message: 'See the usage:', run: installerCommand('--help') },
          ],
        },
      );
    }
    stdout.write(
      json
        ? `${JSON.stringify(successEnvelope(command, outcome.result, reporter.warnings, outcome.status))}\n`
        : `${outcome.summary.join('\n')}\n`,
    );
    return EXIT_OK;
  } catch (error) {
    if (json) {
      stdout.write(
        `${JSON.stringify(errorEnvelope(command, error, reporter.warnings))}\n`,
      );
    } else {
      stderr.write(`${formatError(error)}\n`);
    }
    return exitCodeOf(error);
  } finally {
    removeInterruptHandlers();
  }
}
