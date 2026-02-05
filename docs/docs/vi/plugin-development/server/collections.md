:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Bộ sưu tập (Collections)

Trong quá trình phát triển **plugin** NocoBase, **Bộ sưu tập (Collection)** là một trong những khái niệm cốt lõi nhất. Bạn có thể thêm mới hoặc sửa đổi cấu trúc bảng dữ liệu trong các **plugin** bằng cách định nghĩa hoặc mở rộng các Bộ sưu tập. Khác với các bảng dữ liệu được tạo thông qua giao diện quản lý **nguồn dữ liệu**, **các Bộ sưu tập được định nghĩa bằng mã thường là các bảng siêu dữ liệu cấp hệ thống** và sẽ không xuất hiện trong danh sách quản lý **nguồn dữ liệu**.

## Định nghĩa Bộ sưu tập

Theo cấu trúc thư mục theo quy ước, các tệp Bộ sưu tập nên được đặt trong thư mục `./src/server/collections`. Để tạo bảng mới, bạn sử dụng `defineCollection()`, và để mở rộng bảng hiện có, bạn sử dụng `extendCollection()`.

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'articles',
  title: 'Bài viết mẫu',
  fields: [
    { type: 'string', name: 'title', interface: 'input', uiSchema: { title: 'Tiêu đề', required: true } },
    { type: 'text', name: 'content', interface: 'textarea', uiSchema: { title: 'Nội dung' } },
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
      interface: 'recordPicker',
      uiSchema: { title: 'Tác giả' },
    },
  ],
});
```

Trong ví dụ trên:

- `name`: Tên bảng (một bảng có cùng tên sẽ tự động được tạo trong cơ sở dữ liệu).
- `title`: Tên hiển thị của bảng này trong giao diện.
- `fields`: Tập hợp các trường, mỗi trường chứa các thuộc tính như `type`, `name`, v.v.

Khi bạn cần thêm trường hoặc sửa đổi cấu hình cho các Bộ sưu tập của các **plugin** khác, bạn có thể sử dụng `extendCollection()`:

```ts
import { extendCollection } from '@nocobase/database';

export default extendCollection({
  name: 'articles',
  fields: [
    {
      type: 'boolean',
      name: 'isPublished',
      defaultValue: false,
    },
  ],
});
```

Sau khi kích hoạt **plugin**, hệ thống sẽ tự động thêm trường `isPublished` vào bảng `articles` hiện có.

:::tip
Thư mục theo quy ước sẽ hoàn tất quá trình tải trước khi tất cả các phương thức `load()` của các **plugin** được thực thi, nhờ đó tránh được các vấn đề phụ thuộc do một số bảng dữ liệu chưa được tải.
:::

## Đồng bộ hóa cấu trúc cơ sở dữ liệu

Khi **plugin** được kích hoạt lần đầu, hệ thống sẽ tự động đồng bộ hóa cấu hình **Bộ sưu tập** với cấu trúc cơ sở dữ liệu. Nếu **plugin** đã được cài đặt và đang chạy, sau khi thêm mới hoặc sửa đổi **Bộ sưu tập**, bạn cần thực hiện lệnh nâng cấp thủ công:

```bash
yarn nocobase upgrade
```

Nếu xảy ra lỗi hoặc dữ liệu không nhất quán trong quá trình đồng bộ hóa, bạn có thể xây dựng lại cấu trúc bảng bằng cách cài đặt lại ứng dụng:

```bash
yarn nocobase install -f
```

## Tự động tạo tài nguyên (Resource)

Sau khi định nghĩa **Bộ sưu tập**, hệ thống sẽ tự động tạo một tài nguyên (Resource) tương ứng cho nó. Bạn có thể trực tiếp thực hiện các thao tác CRUD (thêm, sửa, xóa, truy vấn) trên tài nguyên đó thông qua API. Xem chi tiết tại [Quản lý tài nguyên](./resource-manager.md).