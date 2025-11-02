# 插件开发

## 背景问题

在单节点环境中，插件通常可以通过进程内状态、事件或任务来完成需求；而在集群模式下，同一插件可能同时运行在多个实例上，面临以下典型问题：

- **状态一致性**：配置或运行时数据若只存储在内存中，很难在实例间同步，容易出现脏读或重复执行。
- **任务调度**：长耗时任务若无明确排队与确认机制，会造成多个实例并发执行同一任务。
- **竞争条件**：涉及 schema 变更或资源分配时，需要序列化操作，避免出现并发写入导致的冲突。

NocoBase 核心在应用层预置了多种中间件接口，帮助插件在集群环境下复用统一能力。下面将结合源码介绍缓存、同步消息、消息队列与分布式锁的用法及最佳实践。

## 解决方案

### 缓存组件（Cache）

对于要保存在内存中的数据，建议使用系统内置的缓存组件进行管理。

- 通过 `app.cache` 获取默认缓存实例。
- `Cache` 提供 `set/get/del/reset` 等基础操作，还支持 `wrap` 与 `wrapWithCondition` 封装缓存逻辑，以及 `mset/mget/mdel` 等批量方法。
- 集群部署时建议将共享数据放入具备持久化能力的存储（如 Redis），并合理设置 `ttl`，避免实例重启导致缓存丢失。

示例：[`plugin-auth` 中的缓存初始化与使用](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts#L11-L72)

```ts title="在插件中创建并使用缓存"
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

### 同步信号管理器（SyncMessageManager）

如果内存中的状态无法使用分布式缓存（如无法序列化），那么当状态随用户操作发生变化时，需要将变化通过同步信号通知到其他实例，以保持状态一致。

- 插件基类已实现 `sendSyncMessage`，内部调用 `app.syncMessageManager.publish` 并自动为通道加上应用级前缀，避免通道冲突。
- `publish` 可指定 `transaction`，消息会在数据库事务提交后再发送，保证状态与消息同步。
- 通过 `handleSyncMessage` 处理其他实例发来的消息，可在 `beforeLoad` 阶段订阅，对配置变更、Schema 同步等场景十分适用。

示例：[`plugin-data-source-main` 通过同步消息保持多节点 schema 一致](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L20-L220)

```ts title="在插件内同步 Schema 更新"
export class PluginDataSourceMainServer extends Plugin {
  async handleSyncMessage(message) {
    if (message.type === 'syncCollection') {
      await this.app.db.getRepository('collections').load(message.collectionName);
    }
  }

  private sendSchemaChange(data, options) {
    this.sendSyncMessage(data, options); // 自动调用 app.syncMessageManager.publish
  }
}
```

### 消息广播管理器（PubSubManager）

消息广播是同步信号的底层组件，也支持直接使用。当需要在实例间广播消息时，可通过该组件实现。

- `app.pubSubManager.subscribe(channel, handler, { debounce })` 可在实例间订阅通道；`debounce` 选项用于去抖动，避免重复广播导致的频繁回调。
- `publish` 支持 `skipSelf`（默认 true）与 `onlySelf`，用于控制消息是否回发到本实例。
- 需在应用启动前配置适配器（如 Redis、RabbitMQ 等），否则默认不会连接外部消息系统。

示例：[`plugin-async-task-manager` 使用 PubSub 广播任务取消事件](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L194-L258)

```ts title="广播任务取消信号"
const channel = `${plugin.name}.task.cancel`;

await this.app.pubSubManager.subscribe(channel, async ({ id }) => {
  this.logger.info(`Task ${id} cancelled on other node`);
  await this.stopLocalTask(id);
});

await this.app.pubSubManager.publish(channel, { id: taskId }, { skipSelf: true });
```

### 消息队列组件（EventQueue）

消息队列用于调度异步任务，适合处理长耗时或可重试的操作。

- 通过 `app.eventQueue.subscribe(channel, { idle, process, concurrency })` 声明消费者，`process` 返回 `Promise`，可使用 `AbortSignal.timeout` 控制超时。
- `publish` 会自动补齐应用名前缀，并支持 `timeout`、`maxRetries` 等选项，默认适配内存队列，可根据需要切换到 RabbitMQ 等扩展适配器。
- 在集群中，确保所有节点使用同一适配器，以避免任务在节点间割裂。

示例：[`plugin-async-task-manager` 使用 EventQueue 调度任务](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L199-L240)

```ts title="在队列中分发异步任务"
this.app.eventQueue.subscribe(`${plugin.name}.task`, {
  concurrency: this.concurrency,
  idle: this.idle,
  process: async (payload, { signal }) => {
    await this.runTask(payload.id, { signal });
  },
});

await this.app.eventQueue.publish(`${plugin.name}.task`, { id: taskId }, { maxRetries: 3 });
```

### 分布式锁管理器（LockManager）

在需要避免竞态操作时，可以使用分布式锁来序列化对资源的访问。

- 默认提供基于进程的 `local` 适配器，可注册 Redis 等分布式实现；通过 `app.lockManager.runExclusive(key, fn, ttl)` 或 `acquire`/`tryAcquire` 控制并发。
- `ttl` 用于兜底释放锁，防止异常情况下锁被永远持有。
- 常见场景包括：Schema 变更、防止重复任务、限流等。

示例：[`plugin-data-source-main` 使用分布式锁保护字段删除流程](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L320-L360)

```ts title="序列化字段删除操作"
const lockKey = `${this.name}:fields.beforeDestroy:${collectionName}`;
await this.app.lockManager.runExclusive(lockKey, async () => {
  await fieldModel.remove(options);
  this.sendSyncMessage({ type: 'removeField', collectionName, fieldName });
});
```

## 开发建议

- **内存状态一致性**：尽量避免在开发中使用内存状态，改用缓存或同步消息保持状态一致。
- **优先复用内置接口**：统一使用 `app.cache`、`app.syncMessageManager` 等能力，避免在插件中重复实现跨节点通信逻辑。
- **关注事务边界**：带事务的操作应使用 `transaction.afterCommit`（`syncMessageManager.publish` 已内置）以保证数据与消息一致。
- **制定退避策略**：对于队列与广播任务，合理设置 `timeout`、`maxRetries`、`debounce`，防止在异常情况下产生新的流量洪峰。
- **配套监控与日志**：善用应用日志记录通道名称、消息载荷、锁 key 等信息，方便排查集群下的偶发问题。

通过以上能力，插件可以在不同实例间安全共享状态、同步配置、调度任务，满足集群部署场景下的稳定性与一致性要求。
