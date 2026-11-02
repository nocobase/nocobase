import { ServiceProvider } from '@nocobase/service-provider';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { loggingToken } from '@nocobase/app-server/logging';
import { ManagedConcurrencyService } from '../services/concurrency.js';
import { concurrencyServiceToken } from '../tokens.js';
import type { ConcurrencyLogEvent } from '../../shared/types.js';

export interface ConcurrencyServiceProviderOptions {
  readonly nodeEnv?: string;
}
const LOCAL_WARNING =
  'Concurrency locks are local to this application process. Configure Redis before running multiple instances.';
const RELOAD_WARNING =
  'Concurrency configuration changed; restart the application to apply it. Existing and lazy configurations retain the startup snapshot.';

export class ConcurrencyServiceProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-concurrency';
  private service?: ManagedConcurrencyService;
  private unsubscribe?: () => void;

  public constructor(
    app: AppPluginApplication,
    private readonly options: ConcurrencyServiceProviderOptions = {},
  ) {
    super(app);
  }

  public override register(): void {
    this.app.container.singleton(concurrencyServiceToken, () => {
      const logger = this.app.container.has(loggingToken)
        ? this.app.container
            .resolve(loggingToken)
            .getLogger('concurrency')
            .child({ module: 'concurrency' })
        : undefined;
      this.service = new ManagedConcurrencyService({
        appName: this.app.appName,
        nodeEnv: this.options.nodeEnv ?? this.app.nodeEnv,
        report: (event: ConcurrencyLogEvent) => {
          const message =
            event.phase === 'local'
              ? LOCAL_WARNING
              : event.phase === 'reload'
                ? RELOAD_WARNING
                : 'Concurrency operation reported a diagnostic.';
          if (logger)
            logger.warn(
              {
                phase: event.phase,
                configKey: event.configKey,
                adapter: event.adapter,
                namespace: event.namespace,
              },
              message,
            );
          else console.warn(message);
        },
      });
      return this.service;
    });
  }
  public override boot(): Promise<void> {
    this.app.container.resolve(concurrencyServiceToken);
    this.service!.boot(this.app.config.get('concurrency'));
    this.unsubscribe = this.app.config.subscribe('concurrency', () =>
      this.service!.configurationChanged(),
    );
    return Promise.resolve();
  }
  public override async start(): Promise<void> {
    await this.service!.start();
  }
  public override async shutdown(): Promise<void> {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    await this.service?.shutdown();
  }
}
