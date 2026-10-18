import { realtimeServiceToken } from '@nocobase/app-server/realtime';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceProvider } from '@nocobase/service-provider';

import { CLOCK_TOPIC, startClockPublisher } from '../publishers/clock.js';

export type RealtimeExampleProviderApplication = AppPluginApplication;

export class RealtimeExampleProvider extends ServiceProvider<RealtimeExampleProviderApplication> {
  public readonly name: string = '@nocobase/app-plugin-realtime-example';

  private closeTopic: (() => void) | undefined;

  public override boot(): Promise<void> {
    this.closeTopic = this.app.container
      .resolve(realtimeServiceToken)
      .registerTopic(CLOCK_TOPIC, { audience: 'public' });
    return Promise.resolve();
  }

  private stopClockPublisher: (() => void) | undefined;

  public override start(): Promise<void> {
    const realtime = this.app.container.resolve(realtimeServiceToken);
    this.stopClockPublisher = startClockPublisher(realtime);
    return Promise.resolve();
  }

  public override shutdown(): Promise<void> {
    this.stopClockPublisher?.();
    this.stopClockPublisher = undefined;
    this.closeTopic?.();
    this.closeTopic = undefined;
    return Promise.resolve();
  }
}
