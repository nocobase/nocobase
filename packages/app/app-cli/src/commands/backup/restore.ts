import { Args, Flags } from '@oclif/core';
import type { Interfaces } from '@oclif/core';
import { restoreBackup } from '@nocobase/backup';
import type { RestoreBackupResult } from '@nocobase/backup';
import { resolveAppBackupTarget } from '@nocobase/app-server';
import { AppCommand } from '../../context.ts';
import { runBackupCommand } from '../../lib/backup-command.ts';

export default class BackupRestore extends AppCommand {
  static override summary =
    'Restore an application backup while the application is stopped.';
  static override args: { file: Interfaces.Arg<string> } = {
    file: Args.string({
      required: true,
      description: 'Application backup archive.',
    }),
  };
  static override flags: {
    sha256: Interfaces.OptionFlag<string | undefined>;
    connection: Interfaces.OptionFlag<string[] | undefined>;
    'allow-partial': Interfaces.BooleanFlag<boolean>;
    'files-only': Interfaces.BooleanFlag<boolean>;
    'postgres-target-owner': Interfaces.BooleanFlag<boolean>;
  } = {
    sha256: Flags.string({
      description: 'Expected SHA-256 of the complete archive.',
    }),
    connection: Flags.string({
      multiple: true,
      description: 'Restore only these database connections.',
    }),
    'allow-partial': Flags.boolean({
      description: 'Permit restoring only the selected database connections.',
    }),
    'files-only': Flags.boolean({
      description: 'Restore only local files and leave databases unchanged.',
    }),
    'postgres-target-owner': Flags.boolean({
      description:
        "Restore PostgreSQL objects as the target role and omit the source's grants.",
    }),
  };

  public async run(): Promise<RestoreBackupResult> {
    const { args, flags } = await this.parse(BackupRestore);
    const result = await runBackupCommand((signal) =>
      this.withApp(async ({ app }) =>
        restoreBackup(args.file, await resolveAppBackupTarget(app), {
          sha256: flags.sha256,
          connections: flags.connection,
          allowPartial: flags['allow-partial'],
          filesOnly: flags['files-only'],
          postgresTargetOwner: flags['postgres-target-owner'],
          signal,
        }),
      ),
    );
    for (const entry of result.connections)
      this.log(`Database ${entry.name}: ${entry.status}.`);
    for (const entry of result.disks)
      this.log(`Disk ${entry.name}: ${entry.status}.`);
    if (result.missingFiles.length) {
      this.setStatus('partial-success');
      for (const file of result.missingFiles)
        this.warn(`Referenced file is missing: ${file.disk}/${file.key}`);
    }
    return result;
  }
}
