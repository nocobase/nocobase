import { Flags } from '@oclif/core';
import path from 'node:path';
import { createOfflineBundle } from './lib/offline-bundle.ts';
import { SSH_FLAGS, runRemote, type RemoteFlags } from './lib/remote.ts';
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
import { installerCommand, installerCommandLine } from './lib/invocation.ts';
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
    'Install and manage a NocoBase 3 application on a server, from an npm application package or deployment archive.',
    '',
    'USAGE',
    `  $ ${installerCommand('COMMAND [FLAGS]')}`,
    '',
    'COMMANDS',
    '  bundle             Package this installer and its installed runtime dependencies: --out <file.tar.gz>.',
    '  deploy             With --ssh and --archive, install a new directory or upgrade an existing installation.',
    '  install DIRECTORY  Install into DIRECTORY (or --dir DIRECTORY) from --app or --archive, and start it with pm2.',
    '  upgrade            Upgrade the installation in --dir, the current directory by default, to the latest npm application or a new --archive.',
    '  rollback           Return to the release the last upgrade came from, or to --to.',
    '  status             Report the release, endpoints, health, pm2 process and releases on disk.',
    '',
    'SSH FLAGS (install, deploy, upgrade, rollback, status)',
    ...describeFlags(SSH_FLAGS),
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
    `  $ ${installerCommand('install /srv/nocobase/studio --app studio --origin https://studio.example.com')}`,
    `  $ ${installerCommand('upgrade --dir /srv/nocobase/studio --yes')}`,
    `  $ ${installerCommand('install /srv/nocobase/crm --archive /tmp/crm.tar.gz --origin https://apps.example.com')}`,
    `  $ ${installerCommand('upgrade --dir /srv/nocobase/crm --archive /tmp/crm.tar.gz --yes')}`,
    `  $ ${installerCommand('install /srv/nocobase/crm --archive /tmp/crm.tar.gz --dialect postgres --set database.connections.main.host=db.internal --set-from-env database.connections.main.password=CRM_DB_PASSWORD')}`,
    `  $ ${installerCommand('rollback --dir /srv/nocobase/crm')}`,
    `  $ ${installerCommand('status --dir /srv/nocobase/crm --json')}`,
    '',
    'NOTES',
    `  Requires Node.js 24+ and, to start the application, pm2 ${MINIMUM_PM2_VERSION}+ installed globally.`,
    '  Build an archive in the application project with pnpm build --target <platform> --node-version <major> --tar, matching this machine.',
    '  Suggested installer commands use https://registry.npmjs.org by default; override with --registry or NOCOBASE_REGISTRY.',
    '  To change the origin or port, edit app.env in the installation root, then run pm2 restart with the process name.',
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
        { message: 'See the usage:', run: installerCommandLine(['--help']) },
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
    const remoteDefinitions = {
      install: {
        args: INSTALL_ARGS,
        flags: { ...INSTALL_FLAGS, ...SSH_FLAGS },
      },
      deploy: { flags: { ...INSTALL_FLAGS, ...UPGRADE_FLAGS, ...SSH_FLAGS } },
      upgrade: { flags: { ...UPGRADE_FLAGS, ...SSH_FLAGS } },
      rollback: { flags: { ...ROLLBACK_FLAGS, ...SSH_FLAGS } },
      status: { flags: { ...STATUS_FLAGS, ...SSH_FLAGS } },
    };
    const wantsRemote =
      command === 'deploy' ||
      rest.some((arg) => arg === '--ssh' || arg.startsWith('--ssh='));
    if (command === 'bundle') {
      const parsed = await parseCommand<{
        flags: { out: string; json: boolean };
      }>(rest, {
        flags: {
          out: Flags.string({ required: true }),
          json: Flags.boolean({ default: false }),
        },
      });
      const out = path.resolve(options.cwd ?? process.cwd(), parsed.flags.out);
      await createOfflineBundle(out);
      outcome = {
        status: 'success',
        result: { archive: out, version: options.version },
        summary: [`Offline installer: ${out}`],
      };
    } else if (wantsRemote && command in remoteDefinitions) {
      const parsed = await parseCommand<{
        directory?: string;
        flags: RemoteFlags;
      }>(rest, remoteDefinitions[command as keyof typeof remoteDefinitions]);
      outcome = await runRemote(
        command,
        parsed.flags,
        parsed.directory,
        rest
          .filter((arg) => arg.startsWith('--'))
          .map((arg) => arg.slice(2).split('=')[0].replace(/^no-/u, '')),
        deps,
      );
    } else if (command === 'install') {
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
            {
              message: 'See the usage:',
              run: installerCommandLine(['--help']),
            },
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
