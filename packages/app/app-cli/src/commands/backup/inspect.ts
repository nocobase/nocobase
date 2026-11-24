import { Args } from '@oclif/core';
import type { Interfaces } from '@oclif/core';
import { inspectBackup } from '@nocobase/backup';
import type { BackupManifest } from '@nocobase/backup';
import { AppCommand } from '../../context.ts';
import {
  printBackupManifest,
  runBackupCommand,
} from '../../lib/backup-command.ts';

export default class BackupInspect extends AppCommand {
  static override summary = 'Show the contents of an application backup.';
  static override args: { file: Interfaces.Arg<string> } = {
    file: Args.string({
      required: true,
      description: 'Application backup archive.',
    }),
  };

  public async run(): Promise<BackupManifest> {
    const { args } = await this.parse(BackupInspect);
    const manifest = await runBackupCommand((signal) =>
      inspectBackup(args.file, { signal }),
    );
    printBackupManifest(manifest, (message) => this.log(message));
    return manifest;
  }
}
