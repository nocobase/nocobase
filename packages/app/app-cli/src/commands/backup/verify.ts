import { Args, Flags } from '@oclif/core';
import type { Interfaces } from '@oclif/core';
import { BackupError, verifyBackup } from '@nocobase/backup';
import type { VerifyBackupResult } from '@nocobase/backup';
import { resolveAppBackupTarget } from '@nocobase/app-server';
import { AppCommand } from '../../context.ts';
import { runBackupCommand } from '../../lib/backup-command.ts';

export default class BackupVerify extends AppCommand {
  static override summary =
    'Check backup integrity and application compatibility.';
  static override args: { file: Interfaces.Arg<string> } = {
    file: Args.string({
      required: true,
      description: 'Application backup archive.',
    }),
  };
  static override flags: {
    sha256: Interfaces.OptionFlag<string | undefined>;
    'archive-only': Interfaces.BooleanFlag<boolean>;
  } = {
    sha256: Flags.string({
      description: 'Expected SHA-256 of the complete archive.',
    }),
    'archive-only': Flags.boolean({
      description:
        'Check the archive without comparing it with this application.',
    }),
  };

  public async run(): Promise<Extract<VerifyBackupResult, { ok: true }>> {
    const { args, flags } = await this.parse(BackupVerify);
    const result = await runBackupCommand(async (signal) => {
      const verified = flags['archive-only']
        ? await verifyBackup(args.file, { sha256: flags.sha256, signal })
        : await this.withApp(async ({ app }) =>
            verifyBackup(args.file, {
              target: await resolveAppBackupTarget(app),
              sha256: flags.sha256,
              signal,
            }),
          );
      if (!verified.ok) {
        const first = verified.problems[0];
        throw new BackupError(first.code, first.message, {
          problems: verified.problems,
        });
      }
      return verified;
    });
    this.log(`Verified ${args.file} (SHA-256 ${result.sha256}).`);
    return result;
  }
}
