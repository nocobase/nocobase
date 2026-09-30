import {
  createQueueService,
  type QueueLogger,
  type QueueService,
} from '@nocobase/queue';
import {
  ServiceProvider,
  type ServiceResolver,
} from '@nocobase/service-provider';

import { loggingToken } from '../logging/index.js';
import type { AppPluginApplication } from '../plugins/index.js';
import type { AppQueueConfig } from './config.js';
import { queueServiceToken } from './token.js';

export interface QueueServiceProviderOptions {
  /** The application's `NODE_ENV`; the memory fallback is only reported outside development. */
  readonly nodeEnv?: string;
}

const DEVELOPMENT_ENVIRONMENTS: ReadonlySet<string> = new Set([
  'develop',
  'development',
]);

const FALLBACK_WARNING =
  'Queues run on the built-in memory configuration: jobs live in this process and reach storage only when it shuts down. Set queue.default to a redis configuration to run more than one instance.';

/**
 * Creates the application's queue service from the `queue` section, filling
 * in what only the application knows: its name as the default namespace, its
 * storage directory for memory state files, and its logger. Register it
 * before the plugin providers that resolve `queueServiceToken`: `start()`
 * sets the service up once every provider has booted and registered its
 * handlers, and `shutdown()` releases it after they have shut down.
 */
export class QueueServiceProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-server/queue';

  public constructor(
    app: AppPluginApplication,
    private readonly options: QueueServiceProviderOptions = {},
  ) {
    super(app);
  }

  public override register(): void {
    this.app.container.singleton(queueServiceToken, (container) =>
      this.create(container),
    );
  }

  public override async start(): Promise<void> {
    await this.app.container.resolve(queueServiceToken).setup();
  }

  public override async shutdown(): Promise<void> {
    await this.app.container.resolveIfCreated(queueServiceToken)?.shutdown();
  }

  private create(container: ServiceResolver): QueueService {
    const logger: QueueLogger | undefined = container.has(loggingToken)
      ? container
          .resolve(loggingToken)
          .getLogger('queue')
          .child({ module: 'queue' })
      : undefined;
    const reportFallback = !DEVELOPMENT_ENVIRONMENTS.has(
      this.options.nodeEnv ?? '',
    );
    return createQueueService(this.app.config.get<AppQueueConfig>('queue'), {
      appName: this.app.appName,
      storagePath: this.app.paths.storage('queue'),
      ...(logger ? { logger } : {}),
      onFallback: () => {
        if (!reportFallback) return;
        if (logger) logger.warn({}, FALLBACK_WARNING);
        else console.warn(FALLBACK_WARNING);
      },
    });
  }
}
