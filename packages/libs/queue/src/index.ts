export { withChannel } from './consumer.js';
export { redisQueueIdentity, type RedisQueueIdentity } from './naming.js';
export { createQueueService } from './service.js';
export type {
  Channel,
  ConsumeHandler,
  JobIdProducer,
  PublishEntry,
  PublishOptions,
  PublishReceipt,
  QueueAdapter,
  QueueAdapterConnections,
  QueueBackoffOptions,
  QueueConfig,
  QueueConfigEntry,
  QueueConnectionOptions,
  QueueConsumer,
  QueueDrainOptions,
  QueueLocalRuntimeOptions,
  QueueLogger,
  QueueManager,
  QueueProducer,
  QueueRetentionPolicy,
  QueueRuntimeOptions,
  QueueService,
  QueueServiceDefaults,
  RateLimitOptions,
  UnregisterHandler,
} from './types.js';
