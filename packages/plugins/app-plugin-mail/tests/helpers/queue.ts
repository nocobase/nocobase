import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createQueueService,
  type QueueAdapter,
  type QueueConfig,
  type QueueConfigEntry,
  type QueueService,
} from '@nocobase/queue';

const redisPort = process.env.NOCOBASE_MAIL_TEST_REDIS_PORT;
export const mailQueueBackends: readonly QueueAdapter[] = [
  'inMemory',
  ...(redisPort ? (['redis'] as const) : []),
];

export interface MailTestQueue {
  readonly hostQueue: QueueService;
  readonly config: QueueConfig;
  setup(): Promise<void>;
  close(): Promise<void>;
}

/** The fixture owns the host queue; Mail may only release its subscriptions. */
export async function createMailTestQueue(
  backend: QueueAdapter,
  sharedNamespace?: string,
  namedConfigKey?: string,
): Promise<MailTestQueue> {
  const path = await mkdtemp(join(tmpdir(), 'mail-queue-test-'));
  const namespace = sharedNamespace ?? `mail-test-${randomUUID()}`;
  const entry: QueueConfigEntry = {
    adapter: backend,
    namespace,
    ...(backend === 'redis'
      ? { connection: { host: '127.0.0.1', port: Number(redisPort) } }
      : { persistence: { path } }),
    shutdownTimeoutMs: 1000,
    cancellationGraceMs: 1000,
  };
  const config: QueueConfig = {
    default: 'test',
    test: namedConfigKey
      ? {
          adapter: 'inMemory',
          namespace,
          persistence: { path: join(path, 'default') },
          shutdownTimeoutMs: 1000,
          cancellationGraceMs: 1000,
        }
      : entry,
    ...(namedConfigKey
      ? { [namedConfigKey]: { ...entry, concurrency: 2, attempts: 2 } }
      : {}),
  };
  const hostQueue = createQueueService(config, {
    appName: namespace,
    storagePath: path,
    logger: {
      debug() {},
      info() {},
      warn() {},
      error() {},
    },
  });
  return {
    hostQueue,
    config,
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
