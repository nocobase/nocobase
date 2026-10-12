import {
  SendingManager,
  SendingRegistry,
  registerBuiltInSendingProviders,
  type SendingConfig,
} from '@nocobase/sending';
import { ServiceProvider } from '@nocobase/service-provider';
import type { AppPluginApplication } from '../plugins/index.js';
import { loggingToken } from '../logging/index.js';
import { resolveSendingConfig } from './config.js';
import { sendingServiceToken, sendingExtensionRegistryToken } from './token.js';
export class SendingProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-server/sending';
  public override register(): void {
    const registry = new SendingRegistry();
    registerBuiltInSendingProviders(registry);
    this.app.container.instance(sendingExtensionRegistryToken, registry);
    this.app.container.singleton(
      sendingServiceToken,
      (container) =>
        new SendingManager({
          registry,
          logger: container.resolve(loggingToken).getLogger('sending'),
          config: () =>
            resolveSendingConfig(
              this.app.config.get<SendingConfig>('sending'),
              this.app.config.get<SendingConfig>('notification'),
            ),
        }),
    );
  }
  public override async boot(): Promise<void> {
    const legacy = this.app.config.get<SendingConfig>('notification');
    if (
      Object.values(legacy?.channels ?? {}).some(
        (config) => config.provider !== 'in-app',
      )
    )
      this.app.container
        .resolve(loggingToken)
        .getLogger('sending')
        .warn(
          {},
          'External notification.channels are deprecated; use sending.channels.',
        );
  }
  public override async start(): Promise<void> {
    this.app.container
      .resolve(sendingExtensionRegistryToken)
      .validate(this.app.container.resolve(sendingServiceToken).config());
  }
  public override async shutdown(): Promise<void> {
    await this.app.container.resolveIfCreated(sendingServiceToken)?.close();
  }
}
