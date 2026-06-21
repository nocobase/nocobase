---
pkg: "@nocobase/preset-cluster"
title: "Phát triển plugin trong chế độ Cluster"
description: "Phát triển plugin trong chế độ Cluster: Cache, SyncMessageManager (tín hiệu đồng bộ), PubSubManager (broadcast tin nhắn), Queue (hàng đợi), distributed lock, giải quyết tính nhất quán trạng thái, lập lịch tác vụ và race condition."
keywords: "Phát triển plugin Cluster,Cache,SyncMessageManager,PubSubManager,Message queue,Distributed lock,Đồng bộ trạng thái,WORKER_MODE,NocoBase"
---

# Phát triển plugin

## Vấn đề bối cảnh

Trong môi trường node đơn, plugin thường có thể hoàn thành nhu cầu thông qua trạng thái trong tiến trình, sự kiện hoặc tác vụ. Còn trong chế độ Cluster, cùng một plugin có thể chạy đồng thời trên nhiều instance, đối mặt với các vấn đề điển hình sau:

- **Tính nhất quán trạng thái**: Nếu cấu hình hoặc dữ liệu runtime chỉ lưu trong bộ nhớ, rất khó đồng bộ giữa các instance, dễ xảy ra dirty read hoặc thực thi trùng lặp.
- **Lập lịch tác vụ**: Các tác vụ tốn thời gian nếu không có cơ chế xếp hàng và xác nhận rõ ràng, sẽ khiến nhiều instance thực thi đồng thời cùng một tác vụ.
- **Race condition**: Khi liên quan đến thay đổi schema hoặc phân bổ tài nguyên, cần serialize các thao tác để tránh xung đột do ghi đồng thời.

Lõi của NocoBase đã tích hợp sẵn nhiều interface middleware ở tầng ứng dụng, giúp plugin tái sử dụng các năng lực thống nhất trong môi trường Cluster. Phần dưới đây sẽ kết hợp với mã nguồn để giới thiệu cách sử dụng và best practices của cache, sync message, message queue và distributed lock.

## Giải pháp

### Component Cache

Đối với dữ liệu cần lưu trong bộ nhớ, khuyến nghị dùng component cache tích hợp sẵn của hệ thống để quản lý.

- Lấy instance cache mặc định qua `app.cache`.
- `Cache` cung cấp các thao tác cơ bản như `set/get/del/reset`, đồng thời hỗ trợ `wrap` và `wrapWithCondition` để đóng gói logic cache, cũng như các phương thức batch như `mset/mget/mdel`.
- Khi triển khai Cluster, khuyến nghị đặt dữ liệu chia sẻ vào storage có khả năng persistence (như Redis), và đặt `ttl` hợp lý, tránh mất cache khi instance restart.

Ví dụ: [Khởi tạo và sử dụng cache trong `plugin-auth`](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts#L11-L72)

```ts title="Tạo và sử dụng cache trong plugin"
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

### SyncMessageManager (Quản lý tín hiệu đồng bộ)

Nếu trạng thái trong bộ nhớ không thể dùng distributed cache (như không thể serialize), thì khi trạng thái thay đổi theo thao tác người dùng, cần thông báo thay đổi đến các instance khác qua tín hiệu đồng bộ để duy trì tính nhất quán.

- Plugin base class đã triển khai sẵn `sendSyncMessage`, bên trong gọi `app.syncMessageManager.publish` và tự động thêm tiền tố cấp ứng dụng vào channel để tránh xung đột channel.
- `publish` có thể chỉ định `transaction`, tin nhắn sẽ được gửi sau khi database transaction commit, đảm bảo trạng thái và tin nhắn đồng bộ.
- Xử lý tin nhắn từ instance khác qua `handleSyncMessage`, có thể subscribe ở giai đoạn `beforeLoad`, rất phù hợp cho các kịch bản thay đổi cấu hình, đồng bộ Schema, v.v.

Ví dụ: [`plugin-data-source-main` duy trì schema nhất quán đa node qua sync message](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L20-L220)

```ts title="Đồng bộ cập nhật Schema trong plugin"
export class PluginDataSourceMainServer extends Plugin {
  async handleSyncMessage(message) {
    if (message.type === 'syncCollection') {
      await this.app.db.getRepository('collections').load(message.collectionName);
    }
  }

  private sendSchemaChange(data, options) {
    this.sendSyncMessage(data, options); // Tự động gọi app.syncMessageManager.publish
  }
}
```

### PubSubManager (Quản lý broadcast tin nhắn)

Broadcast tin nhắn là component nền tảng của tín hiệu đồng bộ, cũng hỗ trợ sử dụng trực tiếp. Khi cần broadcast tin nhắn giữa các instance, có thể dùng component này.

- `app.pubSubManager.subscribe(channel, handler, { debounce })` có thể subscribe channel giữa các instance; tùy chọn `debounce` dùng để chống dội, tránh callback liên tục do broadcast trùng lặp.
- `publish` hỗ trợ `skipSelf` (mặc định true) và `onlySelf`, để kiểm soát có gửi lại tin nhắn về instance hiện tại hay không.
- Cần cấu hình adapter (như Redis, RabbitMQ, v.v.) trước khi khởi động ứng dụng, nếu không mặc định sẽ không kết nối hệ thống message bên ngoài.

Ví dụ: [`plugin-async-task-manager` dùng PubSub để broadcast sự kiện cancel task](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L194-L258)

```ts title="Broadcast tín hiệu cancel task"
const channel = `${plugin.name}.task.cancel`;

await this.app.pubSubManager.subscribe(channel, async ({ id }) => {
  this.logger.info(`Task ${id} cancelled on other node`);
  await this.stopLocalTask(id);
});

await this.app.pubSubManager.publish(channel, { id: taskId }, { skipSelf: true });
```

### Component EventQueue

Message queue dùng để lập lịch các tác vụ bất đồng bộ, phù hợp xử lý các thao tác tốn thời gian hoặc có thể retry.

- Khai báo consumer qua `app.eventQueue.subscribe(channel, { idle, process, concurrency })`, `process` trả về `Promise`, có thể dùng `AbortSignal.timeout` để kiểm soát timeout.
- `publish` sẽ tự động thêm tiền tố tên ứng dụng và hỗ trợ các tùy chọn như `timeout`, `maxRetries`, mặc định adapter là memory queue, có thể chuyển sang adapter mở rộng như RabbitMQ khi cần.
- Trong cluster, đảm bảo tất cả các node sử dụng cùng một adapter để tránh task bị chia cắt giữa các node.

Ví dụ: [`plugin-async-task-manager` dùng EventQueue để lập lịch task](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L199-L240)

```ts title="Phân phối task bất đồng bộ trong queue"
this.app.eventQueue.subscribe(`${plugin.name}.task`, {
  concurrency: this.concurrency,
  idle: this.idle,
  process: async (payload, { signal }) => {
    await this.runTask(payload.id, { signal });
  },
});

await this.app.eventQueue.publish(`${plugin.name}.task`, { id: taskId }, { maxRetries: 3 });
```

### LockManager (Quản lý distributed lock)

Khi cần tránh các thao tác race condition, có thể dùng distributed lock để serialize việc truy cập tài nguyên.

- Mặc định cung cấp adapter `local` dựa trên process, có thể đăng ký các implementation distributed như Redis; kiểm soát đồng thời qua `app.lockManager.runExclusive(key, fn, ttl)` hoặc `acquire`/`tryAcquire`.
- `ttl` dùng để tự giải phóng lock dự phòng, ngăn lock bị giữ vĩnh viễn trong các tình huống bất thường.
- Các kịch bản phổ biến gồm: thay đổi Schema, ngăn task trùng lặp, rate limit, v.v.

Ví dụ: [`plugin-data-source-main` dùng distributed lock bảo vệ quy trình xóa field](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L320-L360)

```ts title="Serialize thao tác xóa field"
const lockKey = `${this.name}:fields.beforeDestroy:${collectionName}`;
await this.app.lockManager.runExclusive(lockKey, async () => {
  await fieldModel.remove(options);
  this.sendSyncMessage({ type: 'removeField', collectionName, fieldName });
});
```

## Khuyến nghị phát triển

- **Tính nhất quán trạng thái bộ nhớ**: Cố gắng tránh dùng trạng thái bộ nhớ trong phát triển, thay bằng cache hoặc sync message để duy trì tính nhất quán.
- **Ưu tiên tái sử dụng interface tích hợp sẵn**: Sử dụng thống nhất các năng lực như `app.cache`, `app.syncMessageManager`, tránh triển khai lại logic giao tiếp xuyên node trong plugin.
- **Chú ý đến biên giới transaction**: Các thao tác có transaction nên dùng `transaction.afterCommit` (đã tích hợp sẵn trong `syncMessageManager.publish`) để đảm bảo dữ liệu và tin nhắn nhất quán.
- **Xây dựng chiến lược backoff**: Đối với task queue và broadcast, đặt hợp lý các tham số `timeout`, `maxRetries`, `debounce`, ngăn tạo ra các đợt traffic mới trong tình huống bất thường.
- **Giám sát và log đi kèm**: Tận dụng log ứng dụng để ghi tên channel, payload tin nhắn, lock key, v.v., thuận tiện cho việc khắc phục các sự cố ngẫu nhiên trong cluster.

Thông qua các năng lực trên, plugin có thể chia sẻ trạng thái an toàn, đồng bộ cấu hình, lập lịch task giữa các instance, đáp ứng yêu cầu về tính ổn định và nhất quán trong kịch bản triển khai Cluster.
