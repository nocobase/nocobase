import { z } from 'zod';

/** Longest delay the greeting route accepts, in milliseconds. */
export const MAX_DELAY_MS = 600_000;

/** The body is optional: a greeting without one is published at once. */
export const GreetInput: z.ZodObject<
  { delay: z.ZodOptional<z.ZodNumber> },
  z.core.$strict
> = z.strictObject({
  delay: z.number().int().min(0).max(MAX_DELAY_MS).optional(),
});

export type GreetInput = z.infer<typeof GreetInput>;

/** What `POST /queueExample/greet` answers: the queue accepted the job, which its handlers run afterwards. */
export interface GreetingReceipt {
  readonly jobId: string;
  readonly queue: string;
  readonly channel: string;
}
export const GreetingReceipt: z.ZodType<GreetingReceipt> = z
  .object({
    jobId: z.string().meta({ description: 'The id the queue gave the job.' }),
    queue: z
      .string()
      .meta({ description: 'The logical queue the job was published to.' }),
    channel: z
      .string()
      .meta({ description: 'The channel the handlers subscribe to.' }),
  })
  .meta({ ref: 'QueueExampleGreetingReceipt' });

/** One published digest. Publishing the same day again answers the earlier job's id rather than adding a job. */
export interface DigestReceipt {
  readonly jobId: string;
}
export const DigestReceipt: z.ZodType<DigestReceipt> = z
  .object({
    jobId: z.string().meta({
      description:
        'Derived from the channel and the day, such as `digest-2026-10-04-morning`.',
    }),
  })
  .meta({ ref: 'QueueExampleDigestReceipt' });

/** One message a handler received. */
export interface QueueExampleDeliveryBody {
  readonly handler: 'greeting' | 'audit';
  readonly channel: string;
  readonly message?: unknown;
  readonly deliveredAt: string;
}
const QueueExampleDelivery: z.ZodType<QueueExampleDeliveryBody> = z
  .object({
    handler: z
      .enum(['greeting', 'audit'])
      .meta({ description: 'The handler that received the message.' }),
    channel: z.string(),
    message: z
      .unknown()
      .meta({ description: 'The message as it was published.' }),
    deliveredAt: z.iso.datetime().meta({ description: 'When it arrived.' }),
  })
  .meta({ ref: 'QueueExampleDelivery' });

/** What `GET /queueExample/status` answers. */
export interface QueueExampleStatusBody {
  readonly queue: string;
  readonly configKey?: string | undefined;
  readonly deliveries: readonly QueueExampleDeliveryBody[];
}
export const QueueExampleStatus: z.ZodType<QueueExampleStatusBody> = z
  .object({
    queue: z.string().meta({ description: 'The logical queue.' }),
    configKey: z.string().optional().meta({
      description:
        'The queue configuration the plugin publishes through; absent when it follows `queue.default`.',
    }),
    deliveries: z.array(QueueExampleDelivery).meta({
      description:
        'What the handlers received since the application started, newest first.',
    }),
  })
  .meta({ ref: 'QueueExampleStatus' });
