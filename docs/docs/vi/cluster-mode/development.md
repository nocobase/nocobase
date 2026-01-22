:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Phát triển plugin

## Vấn đề nền tảng

Trong môi trường đơn nút, các plugin thường có thể đáp ứng yêu cầu thông qua trạng thái, sự kiện hoặc tác vụ trong tiến trình. Tuy nhiên, trong chế độ cụm, cùng một plugin có thể chạy đồng thời trên nhiều phiên bản, đối mặt với các vấn đề điển hình sau:

- **Tính nhất quán của trạng thái**: Nếu dữ liệu cấu hình hoặc dữ liệu thời gian chạy chỉ được lưu trữ trong bộ nhớ, rất khó để đồng bộ hóa giữa các phiên bản, dễ dẫn đến đọc sai (dirty reads) hoặc thực thi trùng lặp.
- **Lập lịch tác vụ**: Nếu không có cơ chế xếp hàng và xác nhận rõ ràng, các tác vụ chạy dài có thể bị nhiều phiên bản thực thi đồng thời.
- **Điều kiện tranh chấp**: Khi liên quan đến thay đổi schema hoặc phân bổ tài nguyên, cần tuần tự hóa các thao tác để tránh xung đột do ghi đồng thời.

NocoBase core đã tích hợp sẵn nhiều giao diện middleware ở tầng ứng dụng, giúp các plugin tái sử dụng các khả năng thống nhất trong môi trường cụm. Dưới đây, chúng ta sẽ tìm hiểu cách sử dụng và các phương pháp hay nhất cho bộ nhớ đệm (cache), tin nhắn đồng bộ, hàng đợi tin nhắn và khóa phân tán, cùng với các tham chiếu mã nguồn.

## Giải pháp

### Thành phần bộ nhớ đệm (Cache)

Đối với dữ liệu cần lưu trữ trong bộ nhớ, bạn nên sử dụng thành phần bộ nhớ đệm tích hợp sẵn của hệ thống để quản lý.

- Lấy phiên bản bộ nhớ đệm mặc định thông qua `app.cache`.
- `Cache` cung cấp các thao tác cơ bản như `set/get/del/reset`, đồng thời hỗ trợ `wrap` và `wrapWithCondition` để đóng gói logic bộ nhớ đệm, cũng như các phương thức hàng loạt như `mset/mget/mdel`.
- Khi triển khai trong cụm, bạn nên đặt dữ liệu chia sẻ vào một bộ lưu trữ có khả năng duy trì (như Redis) và đặt `ttl` hợp lý để tránh mất bộ nhớ đệm khi phiên bản khởi động lại.

Ví dụ: [Khởi tạo và sử dụng bộ nhớ đệm trong `plugin-auth`](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts#L11-L72)

```ts title="Tạo và sử dụng bộ nhớ đệm trong plugin"
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

### Trình quản lý tin nhắn đồng bộ (SyncMessageManager)

Nếu trạng thái trong bộ nhớ không thể được quản lý bằng bộ nhớ đệm phân tán (ví dụ: không thể tuần tự hóa), thì khi trạng thái thay đổi do hành động của người dùng, cần thông báo sự thay đổi đó đến các phiên bản khác thông qua tín hiệu đồng bộ để duy trì tính nhất quán của trạng thái.

- Lớp cơ sở của plugin đã triển khai `sendSyncMessage`, bên trong gọi `app.syncMessageManager.publish` và tự động thêm tiền tố cấp ứng dụng vào kênh để tránh xung đột kênh.
- `publish` có thể chỉ định `transaction`, tin nhắn sẽ được gửi sau khi giao dịch cơ sở dữ liệu được cam kết, đảm bảo đồng bộ hóa trạng thái và tin nhắn.
- Xử lý tin nhắn từ các phiên bản khác bằng `handleSyncMessage`, có thể đăng ký trong giai đoạn `beforeLoad`, rất phù hợp cho các kịch bản như thay đổi cấu hình, đồng bộ hóa Schema.

Ví dụ: [`plugin-data-source-main` sử dụng tin nhắn đồng bộ để duy trì tính nhất quán của schema trên nhiều nút](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L20-L220)

```ts title="Đồng bộ hóa cập nhật Schema trong plugin"
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

### Trình quản lý phát sóng tin nhắn (PubSubManager)

Phát sóng tin nhắn là thành phần cơ bản của tín hiệu đồng bộ và cũng hỗ trợ sử dụng trực tiếp. Khi cần phát sóng tin nhắn giữa các phiên bản, bạn có thể thực hiện thông qua thành phần này.

- `app.pubSubManager.subscribe(channel, handler, { debounce })` có thể được sử dụng để đăng ký kênh giữa các phiên bản; tùy chọn `debounce` dùng để khử nhiễu, tránh các cuộc gọi lại thường xuyên do phát sóng lặp lại.
- `publish` hỗ trợ `skipSelf` (mặc định là true) và `onlySelf`, dùng để kiểm soát xem tin nhắn có được gửi lại cho phiên bản hiện tại hay không.
- Cần cấu hình bộ điều hợp (như Redis, RabbitMQ, v.v.) trước khi ứng dụng khởi động; nếu không, mặc định sẽ không kết nối với hệ thống tin nhắn bên ngoài.

Ví dụ: [`plugin-async-task-manager` sử dụng PubSub để phát sóng sự kiện hủy tác vụ](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L194-L258)

```ts title="Phát sóng tín hiệu hủy tác vụ"
const channel = `${plugin.name}.task.cancel`;

await this.app.pubSubManager.subscribe(channel, async ({ id }) => {
  this.logger.info(`Task ${id} cancelled on other node`);
  await this.stopLocalTask(id);
});

await this.app.pubSubManager.publish(channel, { id: taskId }, { skipSelf: true });
```

### Thành phần hàng đợi sự kiện (EventQueue)

Hàng đợi tin nhắn được sử dụng để lập lịch các tác vụ bất đồng bộ, phù hợp để xử lý các thao tác tốn nhiều thời gian hoặc có thể thử lại.

- Khai báo một consumer với `app.eventQueue.subscribe(channel, { idle, process, concurrency })`. `process` trả về một `Promise`, và bạn có thể sử dụng `AbortSignal.timeout` để kiểm soát thời gian chờ.
- `publish` tự động thêm tiền tố tên ứng dụng và hỗ trợ các tùy chọn như `timeout`, `maxRetries`. Mặc định nó sử dụng bộ điều hợp hàng đợi trong bộ nhớ, nhưng có thể chuyển sang các bộ điều hợp mở rộng như RabbitMQ khi cần.
- Trong một cụm, hãy đảm bảo tất cả các nút sử dụng cùng một bộ điều hợp để tránh phân mảnh tác vụ giữa các nút.

Ví dụ: [`plugin-async-task-manager` sử dụng EventQueue để lập lịch tác vụ](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L199-L240)

```ts title="Phân phối tác vụ bất đồng bộ trong hàng đợi"
this.app.eventQueue.subscribe(`${plugin.name}.task`, {
  concurrency: this.concurrency,
  idle: this.idle,
  process: async (payload, { signal }) => {
    await this.runTask(payload.id, { signal });
  },
});

await this.app.eventQueue.publish(`${plugin.name}.task`, { id: taskId }, { maxRetries: 3 });
```

### Trình quản lý khóa phân tán (LockManager)

Khi cần tránh các thao tác tranh chấp, bạn có thể sử dụng khóa phân tán để tuần tự hóa việc truy cập tài nguyên.

- Mặc định, nó cung cấp bộ điều hợp `local` dựa trên tiến trình, có thể đăng ký các triển khai phân tán như Redis; kiểm soát đồng thời thông qua `app.lockManager.runExclusive(key, fn, ttl)` hoặc `acquire`/`tryAcquire`.
- `ttl` được sử dụng để giải phóng khóa dự phòng, ngăn khóa bị giữ vĩnh viễn trong các trường hợp ngoại lệ.
- Các kịch bản phổ biến bao gồm: thay đổi Schema, ngăn chặn tác vụ trùng lặp, giới hạn tốc độ, v.v.

Ví dụ: [`plugin-data-source-main` sử dụng khóa phân tán để bảo vệ quy trình xóa trường](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L320-L360)

```ts title="Tuần tự hóa thao tác xóa trường"
const lockKey = `${this.name}:fields.beforeDestroy:${collectionName}`;
await this.app.lockManager.runExclusive(lockKey, async () => {
  await fieldModel.remove(options);
  this.sendSyncMessage({ type: 'removeField', collectionName, fieldName });
});
```

## Khuyến nghị phát triển

- **Tính nhất quán của trạng thái trong bộ nhớ**: Cố gắng tránh sử dụng trạng thái trong bộ nhớ khi phát triển. Thay vào đó, hãy sử dụng bộ nhớ đệm hoặc tin nhắn đồng bộ để duy trì tính nhất quán của trạng thái.
- **Ưu tiên tái sử dụng các giao diện tích hợp**: Thống nhất sử dụng các khả năng như `app.cache`, `app.syncMessageManager`, v.v., để tránh triển khai lại logic giao tiếp giữa các nút trong plugin.
- **Chú ý đến ranh giới giao dịch**: Các thao tác có giao dịch nên sử dụng `transaction.afterCommit` (`syncMessageManager.publish` đã tích hợp sẵn) để đảm bảo tính nhất quán của dữ liệu và tin nhắn.
- **Xây dựng chiến lược lùi dần (backoff)**: Đối với các tác vụ hàng đợi và phát sóng, hãy đặt các giá trị `timeout`, `maxRetries`, `debounce` hợp lý để ngăn chặn các đợt tăng đột biến lưu lượng truy cập mới trong các tình huống ngoại lệ.
- **Sử dụng giám sát và ghi nhật ký bổ trợ**: Tận dụng tốt nhật ký ứng dụng để ghi lại tên kênh, tải trọng tin nhắn, khóa key, v.v., nhằm thuận tiện cho việc khắc phục sự cố không thường xuyên trong cụm.

Với các khả năng trên, các plugin có thể an toàn chia sẻ trạng thái, đồng bộ hóa cấu hình và lập lịch tác vụ giữa các phiên bản khác nhau, đáp ứng các yêu cầu về tính ổn định và nhất quán trong các kịch bản triển khai cụm.