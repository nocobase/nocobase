import { loggingToken } from '@nocobase/app-server/logging';
import type { Application } from '@nocobase/app-server/application';
import type { JsonObject } from '@nocobase/app-plugin-scheduler/server';
import { schedulerServiceToken } from '@nocobase/app-plugin-scheduler/server/tokens';
import { ServiceProvider } from '@nocobase/service-provider';

interface Config extends JsonObject {
  readonly message: string;
}

export default class ScheduledLogJobProvider extends ServiceProvider<Application> {
  public readonly name = 'app/examples-scheduled-log-job';
  public override async boot(): Promise<void> {
    if (!this.app.container.has(schedulerServiceToken)) return;
    const scheduler = this.app.container.resolve(schedulerServiceToken);
    const logger = this.app.container.resolve(loggingToken).getLogger();
    scheduler.registerTarget<Config>({
      type: 'app.scheduled-log',
      title: '报时（服务端日志）',
      validate: (config) =>
        config !== null &&
        typeof config === 'object' &&
        typeof (config as { message?: unknown }).message === 'string'
          ? { valid: true }
          : { valid: false, reason: 'message-must-be-a-string' },
      async start(config, context) {
        const executedAt = new Date().toISOString();
        logger.info(
          {
            occurrenceId: context.occurrenceId,
            scheduleId: context.scheduleId,
            message: config.message,
            executedAt,
          },
          'Scheduled log target executed',
        );
        return {
          state: 'completed',
          outcome: 'succeeded',
          result: { message: config.message, executedAt },
        };
      },
    });
    scheduler.defineSchedule({
      key: 'example-test-job-every-5-minutes',
      title: '报时（服务端日志）',
      description:
        'Writes the current server time to the server log every five minutes.',
      schedule: { cron: '*/5 * * * *', timezone: 'Asia/Singapore' },
      target: {
        type: 'app.scheduled-log',
        config: { message: '报时' },
      },
    });
  }
}
