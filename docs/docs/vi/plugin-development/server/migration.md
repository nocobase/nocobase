---
title: "Migration - Migration database"
description: "Migration database cho Plugin NocoBase: lớp Migration, up/down, nâng cấp phiên bản, thay đổi schema."
keywords: "Migration,Migration database,up,down,Script nâng cấp,Thay đổi schema,NocoBase"
---

# Migration - Script nâng cấp

Trong quá trình phát triển và cập nhật Plugin NocoBase, cấu trúc database hoặc cấu hình của Plugin có thể có những thay đổi không tương thích. Để đảm bảo việc nâng cấp được thực hiện trơn tru, NocoBase cung cấp cơ chế **Migration** — xử lý các thay đổi này thông qua việc viết tệp migration.

## Khái niệm Migration

Migration là script được thực thi tự động khi nâng cấp Plugin, dùng để giải quyết các vấn đề sau:

- Điều chỉnh cấu trúc bảng dữ liệu (thêm Field, sửa kiểu Field, v.v.)
- Migration dữ liệu (như cập nhật hàng loạt giá trị Field)
- Cập nhật cấu hình hoặc logic nội bộ của Plugin

Thời điểm thực thi Migration chia làm ba loại:

| Loại | Thời điểm kích hoạt | Tình huống thực thi |
|------|----------|----------|
| `beforeLoad` | Trước khi tải tất cả cấu hình Plugin |
| `afterSync`  | Sau khi cấu hình bảng dữ liệu đồng bộ với database (cấu trúc bảng đã thay đổi) |
| `afterLoad`  | Sau khi tải tất cả cấu hình Plugin |

## Tạo tệp Migration

Tệp Migration được đặt trong `src/server/migrations/*.ts` của thư mục Plugin. NocoBase cung cấp lệnh `create-migration` để nhanh chóng sinh tệp migration.

```bash
yarn nocobase create-migration [options] <name>
```

Tham số tùy chọn

| Tham số | Mô tả |
|------|------|
| `--pkg <pkg>` | Chỉ định tên gói Plugin |
| `--on [on]`  | Chỉ định thời điểm thực thi, có thể chọn `beforeLoad`, `afterSync`, `afterLoad` |

Ví dụ

```bash
$ yarn nocobase create-migration update-ui --pkg=@nocobase/plugin-client
```

Đường dẫn tệp migration được sinh ra như sau:

```
/nocobase/packages/plugins/@nocobase/plugin-client/src/server/migrations/20240107173313-update-ui.ts
```

Nội dung ban đầu của tệp:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' | 'afterSync' | 'afterLoad'
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // Viết logic nâng cấp ở đây
  }
}
```

:::tip Mẹo

`appVersion` dùng để xác định phiên bản mà việc nâng cấp nhắm đến, môi trường có phiên bản nhỏ hơn phiên bản đã chỉ định sẽ thực thi migration này.

:::

## Viết Migration

Trong tệp Migration, bạn có thể truy cập các thuộc tính và API phổ biến sau thông qua `this`, tiện cho việc thao tác database, Plugin và instance ứng dụng:

Thuộc tính phổ biến

- **`this.app`**
  Instance ứng dụng NocoBase hiện tại, có thể dùng để truy cập dịch vụ toàn cục, Plugin hoặc cấu hình.
  ```ts
  const config = this.app.config.get('database');
  ```

- **`this.db`**
  Instance dịch vụ database, cung cấp interface thao tác trên model (Tables).
  ```ts
  const users = await this.db.getRepository('users').findAll();
  ```

- **`this.plugin`**
  Instance Plugin hiện tại, có thể dùng để truy cập các phương thức tùy chỉnh của Plugin.
  ```ts
  const settings = this.plugin.customMethod();
  ```

- **`this.sequelize`**
  Instance Sequelize, có thể thực thi trực tiếp SQL gốc hoặc thao tác transaction.
  ```ts
  await this.sequelize.transaction(async (transaction) => {
    await this.sequelize.query('UPDATE users SET active = 1', { transaction });
  });
  ```

- **`this.queryInterface`**
  QueryInterface của Sequelize, thường dùng để sửa cấu trúc bảng, ví dụ thêm Field, xóa bảng, v.v.
  ```ts
  await this.queryInterface.addColumn('users', 'age', {
    type: this.sequelize.Sequelize.INTEGER,
    allowNull: true,
  });
  ```

Ví dụ viết Migration

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // Dùng queryInterface để thêm Field
    await this.queryInterface.addColumn('users', 'nickname', {
      type: this.sequelize.Sequelize.STRING,
      allowNull: true,
    });

    // Dùng db để truy cập model dữ liệu
    const users = await this.db.getRepository('users').findAll();
    for (const user of users) {
      user.nickname = user.username;
      await user.save();
    }

    // Gọi phương thức tùy chỉnh của plugin
    await this.plugin.customMethod();
  }
}
```

Ngoài các thuộc tính phổ biến đã liệt kê ở trên, Migration còn cung cấp thêm nhiều API, cách dùng chi tiết xem tại [Migration API](../../api/server/migration.md).

## Kích hoạt Migration

Việc thực thi Migration được kích hoạt bởi lệnh `nocobase upgrade`:

```bash
$ yarn nocobase upgrade
```

Khi nâng cấp, hệ thống sẽ phán đoán thứ tự thực thi dựa trên loại Migration và `appVersion`.

## Kiểm thử Migration

Trong phát triển Plugin, khuyến nghị dùng **Mock Server** để kiểm thử migration có thực thi đúng không, tránh phá hỏng dữ liệu thật.

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('Migration Test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['my-plugin'], // Tên Plugin
      version: '0.18.0-alpha.5', // Phiên bản trước khi nâng cấp
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('run upgrade migration', async () => {
    await app.runCommand('upgrade');
    // Viết logic xác minh, ví dụ kiểm tra Field có tồn tại không, dữ liệu có migration thành công không
  });
});
```

:::tip Mẹo

Dùng Mock Server có thể nhanh chóng mô phỏng tình huống nâng cấp, và xác minh thứ tự thực thi Migration cũng như thay đổi dữ liệu.

:::

## Khuyến nghị thực hành phát triển

1. **Tách Migration**
   Mỗi lần nâng cấp cố gắng sinh một tệp migration, giữ tính nguyên tử, tiện cho việc chẩn đoán vấn đề.
2. **Chỉ định thời điểm thực thi**
   Chọn `beforeLoad`, `afterSync` hoặc `afterLoad` theo đối tượng thao tác, tránh phụ thuộc vào module chưa được tải.
3. **Chú ý kiểm soát phiên bản**
   Dùng `appVersion` để xác định rõ phiên bản mà migration áp dụng, ngăn việc thực thi trùng lặp.
4. **Kiểm thử bao trùm**
   Trước tiên xác minh migration trên Mock Server, sau đó mới thực thi nâng cấp trong môi trường thật.

## Liên kết liên quan

- [Collections](./collections.md) — Định nghĩa cấu trúc bảng dữ liệu thường cần điều chỉnh trong Migration
- [Database](./database.md) — API thao tác dữ liệu thông qua `this.db` trong Migration
- [Plugin](./plugin.md) — Cách tổ chức và tải tệp Migration trong Plugin
- [Command](./command.md) — Kích hoạt migration thông qua các lệnh `nocobase upgrade` và `create-migration`
- [Test](./test.md) — Kiểm thử kết quả thực thi Migration bằng Mock Server
- [Migration API](../../api/server/migration.md) — Tham chiếu API đầy đủ của lớp Migration
