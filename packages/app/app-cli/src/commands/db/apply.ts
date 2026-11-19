import { AppCommand, appContextOf } from '../../context.ts';
import { type Command, Flags } from '@oclif/core';
import { prepareRuntimeDatabaseDrivers } from '@nocobase/app-server/runtime';
import { formatCommandLine } from '@nocobase/cli-envelope';
import {
  inspectDatabaseDrivers,
  assertDatabaseDrivers,
} from '../../lib/database-driver-dependencies.ts';
import { appAt } from '../../runtime/location.ts';
import type { Interfaces } from '@oclif/core';

import {
  databaseRunChangedNothing,
  collectionsRefreshAllowed,
  runDatabaseApplyCommand,
  type DatabaseCommandResult,
} from '../../database-command.ts';

export default class AppDbApply extends AppCommand {
  static override summary = 'Apply pending database migrations and seeds.';
  static override description =
    'Runs both in one plan, the same order startup runs them: each connection is migrated, then seeded. Checks production driver dependencies for every configured connection before opening the application. Only pending tasks run, so repeating it is safe. Runs the default connection unless --connection or --all is specified. Plugins belong to the default connection. Stops on the first failure. --dry-run lists what would run without running it or taking the lock. To discard the current schema and start over, use "db reset".';

  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --dry-run --json',
    '<%= config.bin %> <%= command.id %> --connection analytics --json',
    '<%= config.bin %> <%= command.id %> --all',
  ];

  static override flags: {
    all: Interfaces.BooleanFlag<boolean>;
    connection: Interfaces.OptionFlag<string | undefined>;
    collections: Interfaces.BooleanFlag<boolean>;
    'dry-run': Interfaces.BooleanFlag<boolean>;
  } = {
    all: Flags.boolean({
      default: false,
      exclusive: ['connection'],
      description:
        'Run all managed connections; report external connections as skipped.',
    }),
    connection: Flags.string({
      exclusive: ['all'],
      description: 'Target a named managed connection, regardless of autoRun.',
    }),
    collections: Flags.boolean({
      default: true,
      allowNo: true,
      description:
        'Refresh the gitignored Collection cache under database/<connection>/collections/ for each connection whose migrations changed. Use --no-collections to skip it. Never written in a built dist/.',
    }),
    'dry-run': Flags.boolean({
      default: false,
      description:
        'Report what would run, as a plan, without changing anything.',
    }),
  };

  public async run(): Promise<DatabaseCommandResult> {
    const { flags } = await this.parse(AppDbApply);
    const context = appContextOf(this);
    const invocation = this.cliCommand(['db', 'apply', ...this.argv]);
    const retry = formatCommandLine(invocation);
    const result = await runDatabaseApplyCommand(
      this,
      {
        ...flags,
        dryRun: flags['dry-run'],
        collections: flags.collections && collectionsRefreshAllowed(),
      },
      {
        ...context,
        loadRuntime: () =>
          context.loadRuntime({ prepareDatabaseDrivers: false }),
        createApp: async (runtime) => {
          const mode =
            appAt(context.rootDir).kind === 'deployment'
              ? 'deployment'
              : 'source';
          const report = inspectDatabaseDrivers(runtime, mode, retry);
          assertDatabaseDrivers(report.findings);
          await prepareRuntimeDatabaseDrivers(runtime.config);
          return context.createApp(runtime);
        },
      },
    );
    if (databaseRunChangedNothing(result)) this.setStatus('success-noop');
    return result;
  }
}
