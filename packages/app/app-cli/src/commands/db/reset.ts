import { AppCommand, appContextOf } from '../../context.ts';
import { type Command, Flags } from '@oclif/core';
import type { Interfaces } from '@oclif/core';

import {
  databaseRunChangedNothing,
  collectionsRefreshAllowed,
  runDatabaseApplyCommand,
  type DatabaseCommandResult,
} from '../../database-command.ts';

export default class AppDbReset extends AppCommand {
  static override summary =
    'Delete every managed schema object, then apply all migrations and seeds.';
  static override description =
    'Destructive. All selected managed schemas are dropped before any migration or seed runs, so every row in a managed table is lost. There is no cross-connection rollback: if a later reset, preparation hook or migration fails, earlier resets remain applied. Prompts before doing anything, and requires --force in CI or a non-interactive terminal; --dry-run shows which connections would be reset, and what would run again, without touching them. External connections are skipped. Use "db apply" to run only what is pending.';

  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %> --dry-run --json',
    '<%= config.bin %> <%= command.id %> --all --dry-run --json',
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --connection analytics',
  ];

  static override flags: {
    all: Interfaces.BooleanFlag<boolean>;
    connection: Interfaces.OptionFlag<string | undefined>;
    collections: Interfaces.BooleanFlag<boolean>;
    force: Interfaces.BooleanFlag<boolean>;
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
    force: Flags.boolean({
      default: false,
      description: 'Skip the confirmation prompt.',
    }),
    'dry-run': Flags.boolean({
      default: false,
      description:
        'Report what would run, as a plan, without changing anything.',
    }),
  };

  public async run(): Promise<DatabaseCommandResult> {
    const { flags } = await this.parse(AppDbReset);
    const result = await runDatabaseApplyCommand(
      this,
      {
        ...flags,
        dryRun: flags['dry-run'],
        fresh: true,
        collections: flags.collections && collectionsRefreshAllowed(),
      },
      appContextOf(this),
    );
    if (databaseRunChangedNothing(result)) this.setStatus('success-noop');
    return result;
  }
}
