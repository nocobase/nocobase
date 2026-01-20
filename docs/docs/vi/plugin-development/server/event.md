:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Sự kiện

Máy chủ (Server) của NocoBase kích hoạt các sự kiện (Event) tương ứng trong các giai đoạn như vòng đời ứng dụng, vòng đời plugin và các thao tác cơ sở dữ liệu. Các nhà phát triển plugin có thể lắng nghe các sự kiện này để triển khai logic mở rộng, các thao tác tự động hoặc hành vi tùy chỉnh.

Hệ thống sự kiện của NocoBase được chia thành hai cấp độ chính:

- **`app.on()` - Sự kiện cấp ứng dụng**: Lắng nghe các sự kiện vòng đời của ứng dụng, như khởi động, cài đặt, bật plugin, v.v.
- **`db.on()` - Sự kiện cấp cơ sở dữ liệu**: Lắng nghe các sự kiện thao tác ở cấp độ mô hình dữ liệu, như tạo, cập nhật, xóa bản ghi, v.v.

Cả hai đều kế thừa từ `EventEmitter` của Node.js, hỗ trợ sử dụng các giao diện chuẩn `.on()`, `.off()`, `.emit()`. NocoBase cũng mở rộng hỗ trợ `emitAsync`, được dùng để kích hoạt sự kiện không đồng bộ và chờ tất cả các trình lắng nghe hoàn thành việc thực thi.

## Vị trí đăng ký trình lắng nghe sự kiện

Các trình lắng nghe sự kiện thường nên được đăng ký trong phương thức `beforeLoad()` của plugin để đảm bảo các sự kiện đã sẵn sàng trong giai đoạn tải plugin và logic tiếp theo có thể phản hồi chính xác.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  async beforeLoad() {

    // Lắng nghe sự kiện ứng dụng
    this.app.on('afterStart', () => {
      app.logger.info('NocoBase đã khởi động');
    });

    // Lắng nghe sự kiện cơ sở dữ liệu
    this.db.on('afterCreate', (model) => {
      if (model.collectionName === 'posts') {
        app.logger.info(`Bài viết mới: ${model.get('title')}`);
      }
    });
  }
}
```

## Lắng nghe sự kiện ứng dụng `app.on()`

Các sự kiện ứng dụng được dùng để nắm bắt các thay đổi trong vòng đời của ứng dụng và plugin NocoBase, phù hợp cho việc khởi tạo logic, đăng ký tài nguyên hoặc kiểm tra phụ thuộc của plugin, v.v.

### Các loại sự kiện phổ biến

| Tên sự kiện | Thời điểm kích hoạt | Công dụng điển hình |
|-----------|------------|-----------|
| `beforeLoad` / `afterLoad` | Trước / sau khi tải ứng dụng | Đăng ký tài nguyên, khởi tạo cấu hình |
| `beforeStart` / `afterStart` | Trước / sau khi khởi động dịch vụ | Khởi động tác vụ, ghi log khởi động |
| `beforeInstall` / `afterInstall` | Trước / sau khi cài đặt ứng dụng | Khởi tạo dữ liệu, nhập mẫu |
| `beforeStop` / `afterStop` | Trước / sau khi dừng dịch vụ | Dọn dẹp tài nguyên, lưu trạng thái |
| `beforeDestroy` / `afterDestroy` | Trước / sau khi hủy ứng dụng | Xóa bộ nhớ đệm, ngắt kết nối |
| `beforeLoadPlugin` / `afterLoadPlugin` | Trước / sau khi tải plugin | Sửa đổi cấu hình plugin hoặc mở rộng chức năng |
| `beforeEnablePlugin` / `afterEnablePlugin` | Trước / sau khi bật plugin | Kiểm tra phụ thuộc, khởi tạo logic plugin |
| `beforeDisablePlugin` / `afterDisablePlugin` | Trước / sau khi tắt plugin | Dọn dẹp tài nguyên plugin |
| `afterUpgrade` | Sau khi nâng cấp ứng dụng hoàn tất | Thực hiện di chuyển dữ liệu hoặc sửa lỗi tương thích |

Ví dụ: Lắng nghe sự kiện khởi động ứng dụng

```ts
app.on('afterStart', async () => {
  app.logger.info('🚀 Dịch vụ NocoBase đã khởi động!');
});
```

Ví dụ: Lắng nghe sự kiện tải plugin

```ts
app.on('afterLoadPlugin', ({ plugin }) => {
  app.logger.info(`Plugin ${plugin.name} đã được tải`);
});
```

## Lắng nghe sự kiện cơ sở dữ liệu `db.on()`

Các sự kiện cơ sở dữ liệu có thể nắm bắt nhiều thay đổi dữ liệu khác nhau ở cấp độ mô hình, phù hợp cho các thao tác như kiểm toán, đồng bộ hóa, tự động điền, v.v.

### Các loại sự kiện phổ biến

| Tên sự kiện | Thời điểm kích hoạt |
|-----------|------------|
| `beforeSync` / `afterSync` | Trước / sau khi đồng bộ hóa cấu trúc cơ sở dữ liệu |
| `beforeValidate` / `afterValidate` | Trước / sau khi xác thực dữ liệu |
| `beforeCreate` / `afterCreate` | Trước / sau khi tạo bản ghi |
| `beforeUpdate` / `afterUpdate` | Trước / sau khi cập nhật bản ghi |
| `beforeSave` / `afterSave` | Trước / sau khi lưu (bao gồm tạo và cập nhật) |
| `beforeDestroy` / `afterDestroy` | Trước / sau khi xóa bản ghi |
| `afterCreateWithAssociations` / `afterUpdateWithAssociations` / `afterSaveWithAssociations` | Sau các thao tác bao gồm dữ liệu liên kết |
| `beforeDefineCollection` / `afterDefineCollection` | Trước / sau khi định nghĩa bộ sưu tập |
| `beforeRemoveCollection` / `afterRemoveCollection` | Trước / sau khi xóa bộ sưu tập |

Ví dụ: Lắng nghe sự kiện sau khi tạo dữ liệu

```ts
db.on('afterCreate', async (model, options) => {
  db.logger.info('Dữ liệu đã được tạo!');
});
```

Ví dụ: Lắng nghe sự kiện trước khi cập nhật dữ liệu

```ts
db.on('beforeUpdate', async (model, options) => {
  db.logger.info('Dữ liệu sắp được cập nhật!');
});
```