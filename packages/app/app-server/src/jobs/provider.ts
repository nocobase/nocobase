import {
  createJobExecutorService,
  type ManagedJobExecutorService,
  type ScheduleFallbackEvent,
  type ScheduleLogger,
} from '@nocobase/jobs';
import {
  ServiceProvider,
  type ServiceResolver,
} from '@nocobase/service-provider';

import { loggingToken } from '../logging/index.js';
import type { AppPluginApplication } from '../plugins/index.js';
import type { AppJobsConfig } from './config.js';
import { jobExecutorServiceToken } from './token.js';

export interface JobExecutorServiceProviderOptions {
  /** The application's `NODE_ENV`; the memory fallback is only reported outside development. */
  readonly nodeEnv?: string;
}

const DEVELOPMENT_ENVIRONMENTS: ReadonlySet<string> = new Set([
  'develop',
  'development',
]);

/**
 * Composes the schedule service from the `jobs` section, filling in what
 * only the application knows: its name as the default namespace and its
 * storage directory for the built-in memory configuration. Executors belong
 * to the consumers that ask for them, which set them up and shut them down;
 * this provider shuts down whatever they left running.
 */
export class JobExecutorServiceProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-server/jobs';
  private service: ManagedJobExecutorService | undefined;

  public constructor(
    app: AppPluginApplication,
    private readonly options: JobExecutorServiceProviderOptions = {},
  ) {
    super(app);
  }

  public override register(): void {
    this.app.container.singleton(jobExecutorServiceToken, (container) =>
      this.create(container),
    );
  }

  public override async shutdown(): Promise<void> {
    await this.service?.shutdown();
  }

  private create(container: ServiceResolver): ManagedJobExecutorService {
    const logger: ScheduleLogger | undefined = container.has(loggingToken)
      ? container
          .resolve(loggingToken)
          .getLogger('jobs')
          .child({ module: 'jobs' })
      : undefined;
    const reportFallback = !DEVELOPMENT_ENVIRONMENTS.has(
      this.options.nodeEnv ?? '',
    );
    this.service = createJobExecutorService(
      this.app.config.get<AppJobsConfig>('jobs'),
      {
        appName: this.app.appName,
        storagePath: this.app.paths.storage('jobs'),
        ...(logger ? { logger } : {}),
        onFallback: (event: ScheduleFallbackEvent) => {
          if (!reportFallback) return;
          const message = `Scope "${event.scope}" runs on the built-in memory jobs configuration: its jobs live in this process and reach storage only when it shuts down, and every other process or instance would run its own copy. Set jobs.default to a redis configuration to run more than one.`;
          if (logger) logger.warn({ scope: event.scope }, message);
          else console.warn(message);
        },
      },
    );
    return this.service;
  }
}
