import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createQueueService,
  type QueueAdapter,
  type QueueService,
} from '@nocobase/queue';

const redisPort = process.env.NOCOBASE_MAIL_TEST_REDIS_PORT;
export const mailQueueBackends: readonly QueueAdapter[] = [
  'inMemory',
  ...(redisPort ? (['redis'] as const) : []),
];

export interface MailTestQueue {
  readonly hostQueue: QueueService;
  setup(): Promise<void>;
  close(): Promise<void>;
}

/** The fixture owns the host queue; Mail may only release its subscriptions. */
export async function createMailTestQueue(
  backend: QueueAdapter,
  sharedNamespace?: string,
): Promise<MailTestQueue> {
  const path = await mkdtemp(join(tmpdir(), 'mail-queue-test-'));
  const namespace = sharedNamespace ?? `mail-test-${randomUUID()}`;
  const hostQueue = createQueueService(
    {
      default: 'test',
      test: {
        adapter: backend,
        namespace,
        ...(backend === 'redis'
          ? { connection: { host: '127.0.0.1', port: Number(redisPort) } }
          : { persistence: { path } }),
        shutdownTimeoutMs: 1000,
        cancellationGraceMs: 1000,
      },
    },
    {
      appName: namespace,
      storagePath: path,
      logger: {
        debug() {},
        info() {},
        warn() {},
        error() {},
      },
    },
  );
  return {
    hostQueue,
    setup: () => hostQueue.setup(),
    async close() {
      try {
        await hostQueue.shutdown();
      } finally {
        await rm(path, { recursive: true, force: true });
      }
    },
  };
}
