import { AppCommand, CommandError } from '@nocobase/app-cli';
import { Flags } from '@oclif/core';

export default class ProcurementReset extends AppCommand {
  static override summary =
    'Clear procurement requests and their lifecycle history in a disposable development application.';
  static override examples = [
    '<%= config.bin %> <%= command.id %> --dry-run --json',
  ];
  static override flags = {
    'dry-run': Flags.boolean({
      description: 'Count records without deleting them.',
      default: false,
    }),
    force: Flags.boolean({
      description:
        'Confirm deletion of every procurement request in this development database.',
      default: false,
    }),
  };
  async run(): Promise<{ requests: number; lines: number; dryRun: boolean }> {
    const { flags } = await this.parse(ProcurementReset);
    if (process.env.NODE_ENV === 'production')
      throw new CommandError(
        'Procurement reset is available only in disposable development applications.',
        { code: 'DEVELOPMENT_ONLY' },
      );
    if (!flags['dry-run'] && !flags.force)
      throw new CommandError(
        'Preview the procurement deletion plan, then confirm the disposable database.',
        {
          code: 'FORCE_REQUIRED',
          exit: 2,
          suggestions: [
            {
              message: 'Preview the plan.',
              run: this.cliCommand([
                'app',
                'procurement-reset',
                '--dry-run',
                '--json',
              ]),
            },
          ],
        },
      );
    const result = await this.withApp(async ({ app }) => {
      app.registerProviders();
      const { databaseManagerToken } = await import('@nocobase/db');
      const { resetProcurement } =
        await import('../../server/providers/procurement-reset.js');
      return resetProcurement(
        app.container.resolve(databaseManagerToken).connection(),
        flags['dry-run'],
      );
    });
    if (flags['dry-run']) this.setStatus('success-noop');
    this.log(
      `Procurement requests: ${result.requests}; lines: ${result.lines}.`,
    );
    return result;
  }
}
