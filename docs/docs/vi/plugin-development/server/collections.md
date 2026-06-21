---
title: "Định nghĩa Collections"
description: "Định nghĩa Collection trong Plugin NocoBase: defineCollection, extendCollection, fields, quy ước thư mục src/server/collections."
keywords: "Collections,defineCollection,extendCollection,bảng dữ liệu,định nghĩa Collection,NocoBase"
---

# Collections

Trong phát triển Plugin NocoBase, **Collection (bảng dữ liệu)** là một trong những khái niệm cốt lõi nhất. Bạn có thể thêm hoặc sửa cấu trúc bảng dữ liệu trong Plugin bằng cách định nghĩa hoặc mở rộng Collection. Khác với bảng dữ liệu được tạo qua giao diện "Quản lý nguồn dữ liệu", **Collection định nghĩa bằng code thường là bảng metadata cấp hệ thống**, sẽ không xuất hiện trong danh sách quản lý nguồn dữ liệu.

## Định nghĩa bảng dữ liệu

Theo cấu trúc thư mục quy ước, file Collection nên đặt trong thư mục `./src/server/collections`. Tạo bảng mới dùng `defineCollection()`, mở rộng bảng hiện có dùng `extendCollection()`.

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'articles',
  title: 'Bài viết ví dụ',
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

- `name`: Tên bảng (database sẽ tự động tạo bảng cùng tên).
- `title`: Tên hiển thị của bảng trong giao diện.
- `fields`: Tập hợp các Field, mỗi Field có các thuộc tính `type`, `name`, v.v.

Khi cần thêm Field hoặc sửa cấu hình cho Collection của Plugin khác, bạn có thể dùng `extendCollection()`:

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

Sau khi kích hoạt Plugin, hệ thống sẽ tự động thêm Field `isPublished` vào bảng `articles` hiện có.

:::tip Mẹo

Thư mục quy ước sẽ được load xong trước khi phương thức `load()` của tất cả Plugin được thực thi, từ đó tránh các vấn đề phụ thuộc do một số bảng dữ liệu chưa được load.

:::

## Tra cứu nhanh kiểu Field

Trong `fields` của `defineCollection`, `type` quyết định loại column trong database. Dưới đây là tất cả các kiểu Field tích hợp sẵn:

### Văn bản

| type | Loại database | Mô tả | Tham số riêng |
|------|---------------|-------|---------------|
| `string` | VARCHAR(255) | Văn bản ngắn | `length?: number` (độ dài tùy chỉnh), `trim?: boolean` |
| `text` | TEXT | Văn bản dài | `length?: 'tiny' \| 'medium' \| 'long'` (chỉ MySQL) |

### Số

| type | Loại database | Mô tả | Tham số riêng |
|------|---------------|-------|---------------|
| `integer` | INTEGER | Số nguyên | — |
| `bigInt` | BIGINT | Số nguyên lớn | — |
| `float` | FLOAT | Số thực | — |
| `double` | DOUBLE | Số thực độ chính xác kép | — |
| `decimal` | DECIMAL(p,s) | Số dấu chấm cố định | `precision: number`, `scale: number` |

### Boolean

| type | Loại database | Mô tả |
|------|---------------|-------|
| `boolean` | BOOLEAN | Giá trị Boolean |

### Ngày giờ

| type | Loại database | Mô tả | Tham số riêng |
|------|---------------|-------|---------------|
| `date` | DATE(3) | Ngày giờ (có mili giây) | `defaultToCurrentTime?`, `onUpdateToCurrentTime?` |
| `dateOnly` | DATEONLY | Chỉ ngày, không giờ | — |
| `time` | TIME | Chỉ giờ | — |
| `unixTimestamp` | BIGINT | Unix timestamp | `accuracy?: 'second' \| 'millisecond'` |

:::tip Mẹo

`date` là kiểu ngày tháng được dùng nhiều nhất. Nếu cần phân biệt cách xử lý timezone, còn có `datetimeTz` (có timezone) và `datetimeNoTz` (không timezone).

:::

### Dữ liệu cấu trúc

| type | Loại database | Mô tả | Tham số riêng |
|------|---------------|-------|---------------|
| `json` | JSON / JSONB | Dữ liệu JSON | `jsonb?: boolean` (dùng JSONB trên PostgreSQL) |
| `jsonb` | JSONB / JSON | Ưu tiên dùng JSONB | — |
| `array` | ARRAY / JSON | Mảng | Có thể dùng kiểu ARRAY native trên PostgreSQL |

### Sinh ID

| type | Loại database | Mô tả | Tham số riêng |
|------|---------------|-------|---------------|
| `uid` | VARCHAR(255) | Tự động sinh ID ngắn | `prefix?: string` |
| `uuid` | UUID | UUID v4 | `autoFill?: boolean` (mặc định true) |
| `nanoid` | VARCHAR(255) | NanoID | `size?: number` (mặc định 12), `customAlphabet?: string` |
| `snowflakeId` | BIGINT | Snowflake ID | `autoFill?: boolean` (mặc định true) |

### Kiểu đặc biệt

| type | Loại database | Mô tả |
|------|---------------|-------|
| `password` | VARCHAR(255) | Tự động hash với salt |
| `virtual` | Không có column thực | Field ảo, không tạo column trong database |
| `context` | Có thể cấu hình | Tự động fill từ ngữ cảnh request (ví dụ `currentUser.id`) |

### Kiểu liên kết

Field liên kết không tạo column trong database mà thiết lập quan hệ giữa các bảng ở tầng ORM:

| type | Mô tả | Tham số chính |
|------|-------|---------------|
| `belongsTo` | Nhiều-một | `target` (bảng đích), `foreignKey` (Field khóa ngoại) |
| `hasOne` | Một-một | `target`, `foreignKey` |
| `hasMany` | Một-nhiều | `target`, `foreignKey` |
| `belongsToMany` | Nhiều-nhiều | `target`, `through` (bảng trung gian), `foreignKey`, `otherKey` |

Ví dụ cách dùng Field liên kết:

```ts
export default defineCollection({
  name: 'articles',
  fields: [
    { type: 'string', name: 'title' },
    // Nhiều-một: bài viết thuộc về một tác giả
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
    },
    // Một-nhiều: bài viết có nhiều bình luận
    {
      type: 'hasMany',
      name: 'comments',
      target: 'comments',
      foreignKey: 'articleId',
    },
    // Nhiều-nhiều: bài viết có nhiều tag
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags',
      through: 'articlesTags',  // Tên bảng trung gian
    },
  ],
});
```

### Tham số chung

Tất cả Field column đều hỗ trợ các tham số sau:

| Tham số | Loại | Mô tả |
|---------|------|-------|
| `name` | `string` | Tên Field (bắt buộc) |
| `defaultValue` | `any` | Giá trị mặc định |
| `allowNull` | `boolean` | Có cho phép null không |
| `unique` | `boolean` | Có duy nhất không |
| `primaryKey` | `boolean` | Có phải primary key không |
| `autoIncrement` | `boolean` | Có tự tăng không |
| `index` | `boolean` | Có tạo index không |
| `comment` | `string` | Comment cho Field |

## Đồng bộ cấu trúc database

Lần đầu kích hoạt Plugin, hệ thống sẽ tự động đồng bộ cấu hình Collection với cấu trúc database. Nếu Plugin đã được cài đặt và đang chạy, sau khi thêm hoặc sửa Collection cần chạy lệnh upgrade thủ công:

```bash
yarn nocobase upgrade
```

Nếu trong quá trình đồng bộ có lỗi hoặc dữ liệu rác, có thể tái cài đặt ứng dụng để dựng lại cấu trúc bảng:

```bash
yarn nocobase install -f
```

Nếu khi nâng cấp Plugin cần migration dữ liệu hiện có — như đổi tên Field, tách bảng, fill ngược giá trị mặc định, v.v. — nên dùng [Migration script nâng cấp](./migration.md) thay vì sửa database thủ công.

## Để Collection xuất hiện trong danh sách bảng dữ liệu UI

Bảng được định nghĩa qua `defineCollection` là bảng nội bộ phía server, mặc định **sẽ không xuất hiện** trong danh sách "Quản lý nguồn dữ liệu", cũng không xuất hiện trong danh sách lựa chọn bảng dữ liệu khi "Thêm Block".

**Cách làm khuyến nghị**: Trong giao diện NocoBase, vào "[Quản lý nguồn dữ liệu](../../data-sources/data-source-main/index.md)" để thêm bảng dữ liệu tương ứng, sau khi cấu hình Field và kiểu interface, bảng sẽ tự động xuất hiện trong danh sách lựa chọn bảng dữ liệu của Block.

![Có thể chọn bảng của mình khi thêm Block](https://static-docs.nocobase.com/20260409143839.png)

Nếu thực sự cần đăng ký trong code Plugin (ví dụ trong kịch bản demo của Plugin mẫu), bạn có thể đăng ký thủ công qua `addCollection` trong Plugin client. Lưu ý phải đăng ký theo mẫu `eventBus`, không thể gọi trực tiếp trong `load()` — `ensureLoaded()` sẽ xóa và set lại tất cả collection sau `load()`. Xem ví dụ đầy đủ tại [Tạo Plugin quản lý dữ liệu kết hợp front-end và back-end](../client/examples/fullstack-plugin.md).

## Tự động sinh Resource

Sau khi định nghĩa Collection, NocoBase sẽ tự động tạo resource REST API tương ứng cho nó, các API CRUD (`list`, `get`, `create`, `update`, `destroy`) sẵn sàng dùng ngay không cần viết thêm. Nếu các Action CRUD tích hợp sẵn không đủ — ví dụ bạn cần API "import hàng loạt" hoặc "tổng hợp thống kê" — bạn có thể đăng ký Action tùy chỉnh qua `resourceManager`. Xem chi tiết tại [ResourceManager](./resource-manager.md).

## Liên kết liên quan

- [Database](./database.md) — CRUD, Repository, transaction và sự kiện database
- [DataSourceManager](./data-source-manager.md) — Quản lý nhiều nguồn dữ liệu và Collection của chúng
- [Migration](./migration.md) — Script migration dữ liệu khi nâng cấp Plugin
- [Plugin](./plugin.md) — Vòng đời lớp Plugin, các phương thức thành viên và đối tượng `app`
- [ResourceManager](./resource-manager.md) — REST API tùy chỉnh và handler Action
- [Tạo Plugin quản lý dữ liệu kết hợp front-end và back-end](../client/examples/fullstack-plugin.md) — Ví dụ đầy đủ về defineCollection + addCollection
- [Cấu trúc thư mục dự án](../project-structure.md) — Mô tả quy ước thư mục `src/server/collections`
