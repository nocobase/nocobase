import { loggingToken } from '../logging/token.js';
import {
  ServiceProvider,
  type ServiceContainer,
} from '@nocobase/service-provider';
import { createRealtimeService } from './service.js';
import { realtimeServiceToken } from './types.js';
import { realtimeServiceOptions, type AppRealtimeConfig } from './config.js';

export interface RealtimeProviderApplication {
  readonly container: ServiceContainer;
  readonly appName?: string;
  readonly config?: { get<T>(key: string): T | undefined };
}

export class RealtimeProvider<
  TApplication extends RealtimeProviderApplication =
    RealtimeProviderApplication,
> extends ServiceProvider<TApplication> {
  public readonly name: string = 'realtime';

  public override register(): void {
    this.app.container.singleton(realtimeServiceToken, () =>
      createRealtimeService({
        ...realtimeServiceOptions(
          this.app.config?.get<AppRealtimeConfig>('realtime'),
          this.app.config?.get<{ name?: string }>('app')?.name,
        ),
        logger: this.app.container.has(loggingToken)
          ? this.app.container.resolve(loggingToken).getLogger('realtime')
          : undefined,
      }),
    );
  }

  public override async start(): Promise<void> {
    await this.app.container.resolve(realtimeServiceToken).setup();
  }

  public override async shutdown(): Promise<void> {
    await this.app.container.resolveIfCreated(realtimeServiceToken)?.close();
  }
}
