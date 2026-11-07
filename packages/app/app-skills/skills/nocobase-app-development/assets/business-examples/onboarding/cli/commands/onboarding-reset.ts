import { AppCommand, CommandError } from '@nocobase/app-cli';
import { Flags } from '@oclif/core';

export default class OnboardingReset extends AppCommand {
  static override summary =
    'Clear onboarding cases and their lifecycle history in a disposable development application.';
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
        'Confirm deletion of every onboarding request in this development database.',
      default: false,
    }),
  };
  async run(): Promise<{
    cases: number;
    documents: number;
    employees: number;
    dryRun: boolean;
  }> {
    const { flags } = await this.parse(OnboardingReset);
    if (process.env.NODE_ENV === 'production')
      throw new CommandError(
        'Onboarding reset is available only in disposable development applications.',
        { code: 'DEVELOPMENT_ONLY' },
      );
    if (!flags['dry-run'] && !flags.force)
      throw new CommandError(
        'Preview the onboarding deletion plan, then confirm the disposable database.',
        {
          code: 'FORCE_REQUIRED',
          exit: 2,
          suggestions: [
            {
              message: 'Preview the plan.',
              run: this.cliCommand([
                'app',
                'onboarding-reset',
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
      const { resetOnboarding } =
        await import('../../server/providers/onboarding-reset.js');
      return resetOnboarding(
        app.container.resolve(databaseManagerToken).connection(),
        flags['dry-run'],
      );
    });
    if (flags['dry-run']) this.setStatus('success-noop');
    this.log(
      `Onboarding cases: ${result.cases}; documents: ${result.documents}; employees: ${result.employees}.`,
    );
    return result;
  }
}
