import { AppCommand, CommandError } from '@nocobase/app-cli';
import { Args, Flags, type Interfaces } from '@oclif/core';
import type { DemoDataStatus } from '../shared/data.js';

type Result =
  | Pick<
      DemoDataStatus,
      | 'available'
      | 'datasetId'
      | 'present'
      | 'state'
      | 'language'
      | 'counts'
      | 'failure'
    >
  | { operation: string; language?: string; actor?: string; dryRun: true };

/** Uses the same dataset service as HTTP and the daily reset; no server listener is needed. */
export default class DemoData extends AppCommand {
  static override summary =
    'Inspect, import, clear or reset the application’s demo dataset.';
  static override args: {
    operation: Interfaces.Arg<string, Interfaces.CustomOptions>;
  } = {
    operation: Args.string({
      description: 'The operation to perform.',
      options: ['status', 'import', 'clear', 'reset'],
      default: 'status',
    }),
  };
  static override flags: {
    actor: Interfaces.OptionFlag<string | undefined>;
    language: Interfaces.OptionFlag<string | undefined>;
    force: Interfaces.BooleanFlag<boolean>;
    'dry-run': Interfaces.BooleanFlag<boolean>;
  } = {
    actor: Flags.string({
      description:
        'The importing administrator’s user ID (required for import and clear).',
    }),
    language: Flags.string({
      description:
        'Dataset language. Reset keeps the current language when omitted.',
    }),
    force: Flags.boolean({
      default: false,
      description: 'Confirm that the demo dataset may be changed.',
    }),
    'dry-run': Flags.boolean({
      default: false,
      description:
        'Describe the operation without starting the application or changing data.',
    }),
  };

  public async run(): Promise<Result> {
    const { args, flags } = await this.parse(DemoData);
    const operation = args.operation;
    const plan = {
      operation,
      actor: flags.actor,
      language: flags.language,
      dryRun: true as const,
    };
    if (flags['dry-run']) {
      this.setStatus('success-noop');
      this.log(JSON.stringify(plan));
      return plan;
    }
    if (operation !== 'status' && !flags.force)
      throw new CommandError(
        'Confirm the demo data change with --force after reviewing --dry-run.',
        {
          code: 'FORCE_REQUIRED',
          exit: 2,
          details: plan,
          suggestions: [
            'Review this operation with --dry-run, then repeat it with --force.',
          ],
        },
      );
    if ((operation === 'import' || operation === 'clear') && !flags.actor)
      throw new CommandError('--actor is required for import and clear.', {
        code: 'INVALID_USAGE',
        exit: 2,
      });
    const { demoDataToken } = await import('../server/tokens.js');
    return this.withApp(async ({ app }) => {
      await app.start();
      const service = app.container.resolve(demoDataToken);
      try {
        const status =
          operation === 'import'
            ? await service.importNow(flags.actor!, flags.language)
            : operation === 'clear'
              ? await service.clear(flags.actor!)
              : operation === 'reset'
                ? await service.reset(flags.actor, flags.language, {
                    wait: true,
                  })
                : await service.status();
        const result = {
          available: status.available,
          datasetId: status.datasetId,
          present: status.present,
          state: status.state,
          language: status.language,
          counts: status.counts,
          failure: status.failure,
        };
        this.log(JSON.stringify(result));
        return result;
      } catch (cause) {
        throw new CommandError('The demo data operation did not complete.', {
          code:
            (cause as { reason?: string } | null)?.reason ?? 'DEMO_DATA_FAILED',
          cause,
        });
      }
    });
  }
}
