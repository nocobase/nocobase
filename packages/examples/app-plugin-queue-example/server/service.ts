import type { PublishReceipt, QueueService } from '@nocobase/queue';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

/** The logical queue this plugin publishes to and consumes. */
export const QUEUE_EXAMPLE_QUEUE: string = 'queue-example';
/** A greeting one handler answers. */
export const GREETING_CHANNEL: string = 'greeting';
/** A daily digest, published in batches. */
export const DIGEST_CHANNEL: string = 'digest';

/** Deliveries kept for the status route; older ones are dropped. */
const MAX_DELIVERIES = 50;

export interface GreetingMessage {
  readonly message: string;
  readonly requestedAt: string;
}

export interface DigestMessage {
  readonly day: string;
}

export interface QueueExampleDelivery {
  readonly handler: 'greeting' | 'audit';
  readonly channel: string;
  readonly message: unknown;
  readonly deliveredAt: string;
}

export interface QueueExampleStatus {
  readonly queue: string;
  /** The configuration key the plugin asked for; `undefined` follows `queue.default`. */
  readonly configKey: string | undefined;
  readonly deliveries: readonly QueueExampleDelivery[];
}

export interface QueueExampleService {
  /** `delay` holds the greeting back for that many milliseconds. */
  greet(message: string, delay?: number): Promise<PublishReceipt>;
  /** One digest per day, deduplicated by a job ID derived from the day. */
  publishDigests(days: readonly string[]): Promise<PublishReceipt[]>;
  record(delivery: Omit<QueueExampleDelivery, 'deliveredAt'>): void;
  status(): QueueExampleStatus;
}

export class DefaultQueueExampleService implements QueueExampleService {
  // Records live in memory: they are this example's view of what its handlers
  // received, so a restart clears them while the queue keeps pending jobs.
  private readonly deliveries: QueueExampleDelivery[] = [];

  public constructor(
    private readonly queue: QueueService,
    private readonly configKey: string | undefined,
  ) {}

  public greet(message: string, delay?: number): Promise<PublishReceipt> {
    const greeting: GreetingMessage = {
      message,
      requestedAt: new Date().toISOString(),
    };
    return this.queue
      .producer(QUEUE_EXAMPLE_QUEUE, this.configKey)
      .publish(GREETING_CHANNEL, greeting, delay ? { delay } : undefined);
  }

  public publishDigests(days: readonly string[]): Promise<PublishReceipt[]> {
    return this.queue.producer(QUEUE_EXAMPLE_QUEUE, this.configKey).publishMany(
      days.map((day) => ({
        channel: DIGEST_CHANNEL,
        message: { day } satisfies DigestMessage,
      })),
      {
        // A stable ID makes publishing the same day again add nothing while
        // the earlier job is still waiting or in the history.
        jobIdProducer: (_queue, channel, message) =>
          `${channel}-${(message as DigestMessage).day}`,
      },
    );
  }

  public record(delivery: Omit<QueueExampleDelivery, 'deliveredAt'>): void {
    this.deliveries.unshift({
      ...delivery,
      deliveredAt: new Date().toISOString(),
    });
    this.deliveries.length = Math.min(this.deliveries.length, MAX_DELIVERIES);
  }

  public status(): QueueExampleStatus {
    return {
      queue: QUEUE_EXAMPLE_QUEUE,
      configKey: this.configKey,
      deliveries: [...this.deliveries],
    };
  }
}

export const queueExampleServiceToken: ServiceToken<QueueExampleService> =
  createServiceToken<QueueExampleService>('@nocobase/app-plugin-queue-example');
