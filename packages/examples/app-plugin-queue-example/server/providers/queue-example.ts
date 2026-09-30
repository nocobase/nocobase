import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { queueServiceToken } from '@nocobase/app-server/queue';
import { withChannel, type UnregisterHandler } from '@nocobase/queue';
import { ServiceProvider } from '@nocobase/service-provider';

import {
  DefaultQueueExampleService,
  DIGEST_CHANNEL,
  GREETING_CHANNEL,
  QUEUE_EXAMPLE_QUEUE,
  queueExampleServiceToken,
  type GreetingMessage,
} from '../service.js';

/** The plugin's settings: `queue` names the queue configuration key it runs on. */
export interface QueueExampleConfig {
  readonly queue?: string;
}

export class QueueExampleProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-queue-example';
  private readonly unregisters: UnregisterHandler[] = [];

  public override register(): void {
    this.app.container.singleton(
      queueExampleServiceToken,
      (container) =>
        new DefaultQueueExampleService(
          container.resolve(queueServiceToken),
          this.configKey(),
        ),
    );
  }

  public override async boot(): Promise<void> {
    const queue = this.app.container.resolve(queueServiceToken);
    const service = this.app.container.resolve(queueExampleServiceToken);
    const configKey = this.configKey();
    // Before setup this changes what the queue opens with; the configuration
    // key keeps every other setting.
    await queue.manager(QUEUE_EXAMPLE_QUEUE, configKey).configure({
      concurrency: 2,
      attempts: 3,
      backoff: { type: 'exponential', delay: 200 },
    });
    const consumer = queue.consumer(QUEUE_EXAMPLE_QUEUE, configKey);
    // Two handlers on one queue: every job runs through both, and each picks
    // the channels it handles. A job either one skips still completes.
    this.unregisters.push(
      consumer.consume<GreetingMessage>(
        withChannel(GREETING_CHANNEL, async (channel, message, signal) => {
          signal.throwIfAborted();
          service.record({ handler: 'greeting', channel, message });
          await Promise.resolve();
        }),
      ),
      consumer.consume(
        withChannel(
          [GREETING_CHANNEL, DIGEST_CHANNEL],
          async (channel, message) => {
            service.record({ handler: 'audit', channel, message });
            await Promise.resolve();
          },
        ),
      ),
    );
  }

  public override async shutdown(): Promise<void> {
    // Wait for calls already running before anything they use goes away.
    await Promise.all(
      this.unregisters.splice(0).map((unregister) => unregister()),
    );
  }

  private configKey(): string | undefined {
    return this.app.config.get<QueueExampleConfig>('queueExample')?.queue;
  }
}
