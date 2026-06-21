---
title: "Event - Sự kiện"
description: "Sự kiện phía server NocoBase: app.on, app.emit, lắng nghe và kích hoạt sự kiện, giao tiếp sự kiện giữa các Plugin."
keywords: "Event,Sự kiện,app.on,app.emit,Lắng nghe sự kiện,Kích hoạt sự kiện,NocoBase"
---

# Event - Sự kiện

Server NocoBase trong các giai đoạn vòng đời ứng dụng, vòng đời Plugin và thao tác database, đều sẽ kích hoạt các sự kiện (Event) tương ứng. Bạn có thể lắng nghe các sự kiện này để triển khai logic mở rộng, thao tác tự động hoặc hành vi tùy chỉnh.

Hệ thống sự kiện của NocoBase chủ yếu chia làm hai cấp:

- **`app.on()` — Sự kiện cấp ứng dụng**: Lắng nghe các sự kiện vòng đời của ứng dụng, ví dụ khởi động, cài đặt, bật Plugin, v.v.
- **`db.on()` — Sự kiện cấp database**: Lắng nghe các sự kiện thao tác cấp model dữ liệu, ví dụ tạo, cập nhật, xóa bản ghi, v.v.

Cả hai đều kế thừa từ `EventEmitter` của Node.js, hỗ trợ dùng các interface tiêu chuẩn `.on()`, `.off()`, `.emit()`. NocoBase còn mở rộng `emitAsync`, dùng để kích hoạt sự kiện bất đồng bộ và đợi tất cả listener thực thi xong.

## Vị trí đăng ký lắng nghe sự kiện

Việc lắng nghe sự kiện thường được đăng ký trong phương thức `beforeLoad()` của Plugin, như vậy có thể đảm bảo sự kiện đã sẵn sàng trong giai đoạn tải Plugin, các logic tiếp theo có thể phản hồi đúng.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  async beforeLoad() {

    // Lắng nghe sự kiện ứng dụng
    this.app.on('afterStart', () => {
      app.logger.info('NocoBase đã khởi động');
    });

    // Lắng nghe sự kiện database
    this.db.on('afterCreate', (model) => {
      if (model.collectionName === 'posts') {
        app.logger.info(`Bài viết mới: ${model.get('title')}`);
      }
    });
  }
}
```

## Lắng nghe sự kiện ứng dụng `app.on()`

Sự kiện ứng dụng dùng để bắt các thay đổi vòng đời của ứng dụng và Plugin NocoBase, phù hợp để làm logic khởi tạo, đăng ký tài nguyên hoặc kiểm tra phụ thuộc.

### Các loại sự kiện phổ biến

| Tên sự kiện | Thời điểm kích hoạt | Mục đích điển hình |
|-----------|------------|-----------|
| `beforeLoad` / `afterLoad` | Trước / sau khi tải ứng dụng | Đăng ký tài nguyên, khởi tạo cấu hình |
| `beforeStart` / `afterStart` | Trước / sau khi khởi động dịch vụ | Khởi động tác vụ, in log khởi động |
| `beforeInstall` / `afterInstall` | Trước / sau khi cài đặt ứng dụng | Khởi tạo dữ liệu, import template |
| `beforeStop` / `afterStop` | Trước / sau khi dừng dịch vụ | Dọn dẹp tài nguyên, lưu trạng thái |
| `beforeDestroy` / `afterDestroy` | Trước / sau khi hủy ứng dụng | Xóa cache, ngắt kết nối |
| `beforeLoadPlugin` / `afterLoadPlugin` | Trước / sau khi tải Plugin | Sửa cấu hình Plugin hoặc mở rộng chức năng |
| `beforeEnablePlugin` / `afterEnablePlugin` | Trước / sau khi bật Plugin | Kiểm tra phụ thuộc, khởi tạo logic Plugin |
| `beforeDisablePlugin` / `afterDisablePlugin` | Trước / sau khi tắt Plugin | Dọn dẹp tài nguyên Plugin |
| `afterUpgrade` | Sau khi nâng cấp ứng dụng | Thực thi migration dữ liệu hoặc fix tương thích |

Ví dụ lắng nghe sự kiện khởi động ứng dụng:

```ts
app.on('afterStart', async () => {
  app.logger.info('Dịch vụ NocoBase đã khởi động');
});
```

Ví dụ lắng nghe sự kiện tải Plugin:

```ts
app.on('afterLoadPlugin', ({ plugin }) => {
  app.logger.info(`Plugin ${plugin.name} đã được tải`);
});
```

## Lắng nghe sự kiện database `db.on()`

Sự kiện database dùng để bắt các thay đổi dữ liệu ở tầng model, phù hợp để làm audit, đồng bộ, tự động điền, v.v.

### Các loại sự kiện phổ biến

| Tên sự kiện | Thời điểm kích hoạt |
|-----------|------------|
| `beforeSync` / `afterSync` | Trước / sau khi đồng bộ cấu trúc database |
| `beforeValidate` / `afterValidate` | Trước / sau khi validate dữ liệu |
| `beforeCreate` / `afterCreate` | Trước / sau khi tạo bản ghi |
| `beforeUpdate` / `afterUpdate` | Trước / sau khi cập nhật bản ghi |
| `beforeSave` / `afterSave` | Trước / sau khi lưu (bao gồm tạo và cập nhật) |
| `beforeDestroy` / `afterDestroy` | Trước / sau khi xóa bản ghi |
| `afterCreateWithAssociations` / `afterUpdateWithAssociations` / `afterSaveWithAssociations` | Sau khi thao tác bao gồm dữ liệu quan hệ |
| `beforeDefineCollection` / `afterDefineCollection` | Trước / sau khi định nghĩa collection |
| `beforeRemoveCollection` / `afterRemoveCollection` | Trước / sau khi xóa collection |

Ví dụ lắng nghe sự kiện sau khi tạo dữ liệu:

```ts
db.on('afterCreate', async (model, options) => {
  db.logger.info('Dữ liệu đã được tạo!');
});
```

Ví dụ lắng nghe sự kiện trước khi cập nhật dữ liệu:

```ts
db.on('beforeUpdate', async (model, options) => {
  db.logger.info('Dữ liệu sắp được cập nhật');
});
```

## Liên kết liên quan

- [Plugin](./plugin.md) — Đăng ký lắng nghe sự kiện trong các phương thức vòng đời Plugin
- [Thao tác Database](./database.md) — Nguồn kích hoạt sự kiện cấp database và API thao tác dữ liệu
- [Collections](./collections.md) — Định nghĩa bảng dữ liệu và mối quan hệ model trong sự kiện database
- [Middleware](./middleware.md) — Sự phối hợp giữa middleware và sự kiện trong xử lý request
- [Tổng quan phát triển server](./index.md) — Vai trò của hệ thống sự kiện trong kiến trúc server
