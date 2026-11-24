import { Flags } from '@oclif/core';
import type { Interfaces } from '@oclif/core';
import { createBackup } from '@nocobase/backup';
import type { CreateBackupResult } from '@nocobase/backup';
import { resolveAppBackupTarget } from '@nocobase/app-server';
import { AppCommand } from '../../context.ts';
import { runBackupCommand } from '../../lib/backup-command.ts';

export default class BackupCreate extends AppCommand {
  static override summary = 'Create a verified application backup.';
  static override flags: {
    output: Interfaces.OptionFlag<string>;
    offline: Interfaces.BooleanFlag<boolean>;
    'include-connection': Interfaces.OptionFlag<string[] | undefined>;
    'exclude-connection': Interfaces.OptionFlag<string[] | undefined>;
    'include-disk': Interfaces.OptionFlag<string[] | undefined>;
    'exclude-disk': Interfaces.OptionFlag<string[] | undefined>;
  } = {
    output: Flags.string({
      required: true,
      description: 'Path of the new tar.gz archive.',
    }),
    offline: Flags.boolean({
      description:
        'Require the application to be stopped before taking snapshots.',
    }),
    'include-connection': Flags.string({
      multiple: true,
      description: 'Include only these database connections.',
    }),
    'exclude-connection': Flags.string({
      multiple: true,
      description: 'Exclude these database connections.',
    }),
    'include-disk': Flags.string({
      multiple: true,
      description: 'Include only these Drive disks.',
    }),
    'exclude-disk': Flags.string({
      multiple: true,
      description: 'Exclude these Drive disks.',
    }),
  };

  public async run(): Promise<CreateBackupResult> {
    const { flags } = await this.parse(BackupCreate);
    const result = await runBackupCommand((signal) =>
      this.withApp(async ({ app }) =>
        createBackup(await resolveAppBackupTarget(app), {
          output: flags.output,
          online: !flags.offline,
          signal,
          includeConnections: flags['include-connection'],
          excludeConnections: flags['exclude-connection'],
          includeDisks: flags['include-disk'],
          excludeDisks: flags['exclude-disk'],
        }),
      ),
    );
    this.log(
      `Created ${result.file} (${result.size} bytes, SHA-256 ${result.sha256}).`,
    );
    return result;
  }
}
