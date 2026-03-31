# Plugin Development

## Background

In a single-node environment, plugins can typically fulfill requirements through in-process state, events, or tasks. However, in a cluster mode, the same plugin may run on multiple instances simultaneously, facing the following typical issues:

- **State consistency**: If configuration or runtime data is stored only in memory, it is difficult to synchronize between instances, leading to dirty reads or duplicate executions.
- **Task scheduling**: Without a clear queuing and confirmation mechanism, long-running tasks can be executed concurrently by multiple instances.
- **Race conditions**: Operations involving schema changes or resource allocation need to be serialized to avoid conflicts caused by concurrent writes.

The NocoBase core provides various middleware interfaces at the application layer to help plugins reuse unified capabilities in a cluster environment. The following sections will introduce the usage and best practices of caching, synchronous messaging, message queues, and distributed locks, with source code references.

## Solutions

### Cache Component

For data that needs to be stored in memory, it is recommended to use the system's built-in cache component for management.

- Get the default cache instance via `app.cache`.
- `Cache` provides basic operations like `set/get/del/reset`, and also supports `wrap` and `wrapWithCondition` to encapsulate caching logic, as well as batch methods like `mset/mget/mdel`.
- When deploying in a cluster, it is recommended to place shared data in a persistent storage (like Redis) and set a reasonable `ttl` to prevent cache loss upon instance restart.

Example: [Cache initialization and usage in `plugin-auth`](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts#L11-L72)

```ts title="Create and use a cache in a plugin"
// packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts
async load() {
  this.cache = await this.app.cacheManager.createCache({
    name: 'auth',
    prefix: 'auth',
    store: 'redis',
  });

  await this.cache.wrap('token:config', async () => {
    const repo = this.app.db.getRepository('tokenPolicies');
    return repo.findOne({ filterByTk: 'default' });
  }, 60 * 1000);
}
```

### Sync Message Manager

If in-memory state cannot be managed with a distributed cache (e.g., it cannot be serialized), then when the state changes due to user actions, the change needs to be broadcast to other instances via a sync signal to maintain state consistency.

- The plugin base class has implemented `sendSyncMessage`, which internally calls `app.syncMessageManager.publish` and automatically adds an application-level prefix to the channel to avoid conflicts.
- `publish` can specify a `transaction`, and the message will be sent after the database transaction is committed, ensuring state and message synchronization.
- Use `handleSyncMessage` to process messages from other instances. Subscribing during the `beforeLoad` phase is very suitable for scenarios like configuration changes and schema synchronization.

Example: [`plugin-data-source-main` uses sync messages to maintain schema consistency across multiple nodes](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L20-L220)

```ts title="Synchronize schema updates within a plugin"
export class PluginDataSourceMainServer extends Plugin {
  async handleSyncMessage(message) {
    if (message.type === 'syncCollection') {
      await this.app.db.getRepository('collections').load(message.collectionName);
    }
  }

  private sendSchemaChange(data, options) {
    this.sendSyncMessage(data, options); // Automatically calls app.syncMessageManager.publish
  }
}
```

### Pub/Sub Manager

Message broadcasting is the underlying component of sync signals and can also be used directly. When you need to broadcast messages between instances, you can use this component.

- `app.pubSubManager.subscribe(channel, handler, { debounce })` can be used to subscribe to a channel across instances; the `debounce` option is used to prevent frequent callbacks caused by repeated broadcasts.
- `publish` supports `skipSelf` (default is true) and `onlySelf` to control whether the message is sent back to the current instance.
- An adapter (like Redis, RabbitMQ, etc.) must be configured before the application starts; otherwise, it will not connect to an external messaging system by default.

Example: [`plugin-async-task-manager` uses PubSub to broadcast task cancellation events](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L194-L258)

```ts title="Broadcast task cancellation signal"
const channel = `${plugin.name}.task.cancel`;

await this.app.pubSubManager.subscribe(channel, async ({ id }) => {
  this.logger.info(`Task ${id} cancelled on other node`);
  await this.stopLocalTask(id);
});

await this.app.pubSubManager.publish(channel, { id: taskId }, { skipSelf: true });
```

### Event Queue Component

The message queue is used to schedule asynchronous tasks, suitable for handling long-running or retryable operations.

- Declare a consumer with `app.eventQueue.subscribe(channel, { idle, process, concurrency })`. `process` returns a `Promise`, and you can use `AbortSignal.timeout` to control timeouts.
- `publish` automatically adds the application name prefix and supports options like `timeout` and `maxRetries`. It defaults to an in-memory queue adapter but can be switched to extended adapters like RabbitMQ as needed.
- In a cluster, ensure all nodes use the same adapter to avoid task fragmentation between nodes.

Example: [`plugin-async-task-manager` uses EventQueue to schedule tasks](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L199-L240)

```ts title="Dispatch asynchronous tasks in a queue"
this.app.eventQueue.subscribe(`${plugin.name}.task`, {
  concurrency: this.concurrency,
  idle: this.idle,
  process: async (payload, { signal }) => {
    await this.runTask(payload.id, { signal });
  },
});

await this.app.eventQueue.publish(`${plugin.name}.task`, { id: taskId }, { maxRetries: 3 });
```

### Distributed Lock Manager

When you need to avoid race conditions, you can use a distributed lock to serialize access to a resource.

- By default, it provides a process-based `local` adapter. You can register distributed implementations like Redis. Use `app.lockManager.runExclusive(key, fn, ttl)` or `acquire`/`tryAcquire` to control concurrency.
- `ttl` is used as a safeguard to release the lock, preventing it from being held indefinitely in exceptional cases.
- Common scenarios include: schema changes, preventing duplicate tasks, rate limiting, etc.

Example: [`plugin-data-source-main` uses a distributed lock to protect the field deletion process](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L320-L360)

```ts title="Serialize field deletion operation"
const lockKey = `${this.name}:fields.beforeDestroy:${collectionName}`;
await this.app.lockManager.runExclusive(lockKey, async () => {
  await fieldModel.remove(options);
  this.sendSyncMessage({ type: 'removeField', collectionName, fieldName });
});
```

## Development Recommendations

- **In-memory state consistency**: Try to avoid using in-memory state during development. Instead, use caching or synchronous messages to maintain state consistency.
- **Prioritize reusing built-in interfaces**: Use unified capabilities like `app.cache` and `app.syncMessageManager` to avoid reimplementing cross-node communication logic in plugins.
- **Pay attention to transaction boundaries**: Operations with transactions should use `transaction.afterCommit` (`syncMessageManager.publish` has this built-in) to ensure data and message consistency.
- **Develop a backoff strategy**: For queue and broadcast tasks, set reasonable `timeout`, `maxRetries`, and `debounce` values to prevent new traffic spikes in exceptional situations.
- **Use complementary monitoring and logging**: Make good use of application logs to record channel names, message payloads, lock keys, etc., to facilitate troubleshooting of intermittent issues in a cluster.

With these capabilities, plugins can safely share state, synchronize configurations, and schedule tasks across different instances, meeting the stability and consistency requirements of cluster deployment scenarios.