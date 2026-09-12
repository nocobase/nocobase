---
title: "Migration"
description: "Tham khảo API Migration của NocoBase: lớp cơ sở Migration, phương thức up/down, thời điểm thực thi on, appVersion để kiểm soát phiên bản, các thuộc tính khả dụng."
keywords: "Migration,migration dữ liệu,up,down,appVersion,on,beforeLoad,afterSync,afterLoad,NocoBase"
---

# Migration

Migration là lớp cơ sở cho migration dữ liệu của NocoBase, dùng để xử lý thay đổi cấu trúc cơ sở dữ liệu và migration dữ liệu khi nâng cấp Plugin. Import từ `@nocobase/server`.

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad';
  appVersion = '<1.0.0';

  async up() {
    // Logic nâng cấp
  }
}
```

## Thuộc tính của lớp

### on

```ts
on: 'beforeLoad' | 'afterSync' | 'afterLoad';
```

Kiểm soát thời điểm migration thực thi trong quy trình upgrade. Mặc định `'afterLoad'`.

| Giá trị | Thời điểm thực thi | Tình huống áp dụng |
|----|----------|----------|
| `'beforeLoad'` | Trước khi Plugin được load | Thao tác DDL ở tầng thấp (ví dụ thêm cột, thêm ràng buộc), tại thời điểm này chưa thể dùng Repository API |
| `'afterSync'` | Sau `db.sync()`, trước khi Plugin upgrade | Migration dữ liệu cần cấu trúc bảng mới nhưng không phụ thuộc vào logic Plugin |
| `'afterLoad'` | Sau khi tất cả Plugin đã được load | **Giá trị mặc định**, hầu hết migration dùng giá trị này. Có thể dùng đầy đủ Repository API |

### appVersion

```ts
appVersion: string;
```

Chuỗi semver range, quyết định migration được thực thi trên các phiên bản ứng dụng nào. Framework dùng `semver.satisfies()` để kiểm tra: chỉ khi phiên bản ứng dụng hiện tại thỏa mãn range này thì migration mới chạy.

```ts
// Chỉ chạy khi nâng cấp từ phiên bản thấp hơn 1.0.0
appVersion = '<1.0.0';

// Chỉ chạy khi nâng cấp từ phiên bản thấp hơn 0.21.0-alpha.13
appVersion = '<0.21.0-alpha.13';

// Để trống thì chạy mỗi lần upgrade
appVersion = '';
```

## Thuộc tính của instance

### app

```ts
get app(): Application
```

Instance Application của NocoBase. Qua đây bạn có thể truy cập các module của ứng dụng:

```ts
async up() {
  // Lấy phiên bản ứng dụng
  const version = this.app.version;

  // Lấy logger
  this.app.log.info('Migration started');
}
```

### db

```ts
get db(): Database
```

Instance Database của NocoBase, có thể dùng để lấy Repository, thực thi truy vấn, v.v.:

```ts
async up() {
  const repo = this.db.getRepository('users');
  await repo.update({
    filter: { status: 'inactive' },
    values: { status: 'disabled' },
  });
}
```

### plugin

```ts
get plugin(): Plugin
```

Instance Plugin hiện tại. Chỉ khả dụng trong migration cấp Plugin (trong core migration là `undefined`).

```ts
async up() {
  const pluginName = this.plugin.name;
}
```

### sequelize

```ts
get sequelize(): Sequelize
```

Instance Sequelize, có thể trực tiếp thực thi SQL thô:

```ts
async up() {
  await this.sequelize.query(`UPDATE users SET status = 'active' WHERE status IS NULL`);
}
```

### queryInterface

```ts
get queryInterface(): QueryInterface
```

Sequelize QueryInterface, dùng cho thao tác DDL (thêm/xóa cột, thêm ràng buộc, đổi kiểu cột, v.v.):

```ts
async up() {
  const { DataTypes } = require('@nocobase/database');

  // Thêm cột
  await this.queryInterface.addColumn('users', 'nickname', {
    type: DataTypes.STRING,
  });

  // Thêm ràng buộc unique
  await this.queryInterface.addConstraint('users', {
    type: 'unique',
    fields: ['email'],
  });
}
```

### pm

```ts
get pm(): PluginManager
```

Trình quản lý Plugin. Qua `this.pm.repository` bạn có thể truy vấn và sửa metadata Plugin:

```ts
async up() {
  const plugins = await this.pm.repository.find();
  for (const plugin of plugins) {
    // Sửa hàng loạt bản ghi Plugin
  }
}
```

## Phương thức của instance

### up()

```ts
async up(): Promise<void>
```

**Thực thi khi nâng cấp.** Lớp con phải override phương thức này, viết logic migration.

### down()

```ts
async down(): Promise<void>
```

**Thực thi khi rollback.** Hầu hết migration để trống. Nếu cần hỗ trợ rollback, viết thao tác ngược ở đây.

## Ví dụ đầy đủ

### Dùng Repository API để cập nhật dữ liệu (afterLoad)

Tình huống phổ biến nhất - sau khi tất cả Plugin được load xong, dùng Repository API để cập nhật hàng loạt dữ liệu:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  appVersion = '<1.0.0';

  async up() {
    const repo = this.db.getRepository('roles');
    await repo.update({
      filter: {
        $or: [{ allowConfigure: true }, { name: 'root' }],
      },
      values: {
        snippets: ['ui.*', 'pm', 'pm.*'],
        allowConfigure: false,
      },
    });
  }

  async down() {}
}
```

### Dùng QueryInterface để sửa cấu trúc bảng (beforeLoad)

Thực thi DDL ở tầng thấp trước khi Plugin được load - ví dụ thêm cột mới và ràng buộc unique cho bảng:

```ts
import { DataTypes } from '@nocobase/database';
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'beforeLoad';
  appVersion = '<0.14.0-alpha.2';

  async up() {
    const tableName = this.pm.collection.getTableNameWithSchema();
    const field = this.pm.collection.getField('packageName');

    // Kiểm tra trước xem field đã tồn tại chưa
    const exists = await field.existsInDb();
    if (exists) return;

    await this.queryInterface.addColumn(tableName, field.columnName(), {
      type: DataTypes.STRING,
    });

    await this.queryInterface.addConstraint(tableName, {
      type: 'unique',
      fields: [field.columnName()],
    });
  }
}
```

### Dùng SQL thô (afterSync)

Sau khi cấu trúc bảng được sync xong, dùng SQL thô để migrate dữ liệu:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<1.0.0-alpha.3';

  async up() {
    const items = await this.pm.repository.find();
    for (const item of items) {
      if (item.name.startsWith('@nocobase/plugin-')) {
        item.set('name', item.name.substring('@nocobase/plugin-'.length));
        await item.save();
      }
    }
  }
}
```

## Tạo file Migration

Tạo qua lệnh CLI:

```bash
yarn nocobase create-migration my-migration --pkg @my-project/plugin-hello
```

Lệnh sẽ tạo file có timestamp trong thư mục `src/server/migrations/` của Plugin, theo template:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad';
  appVersion = '<phiên bản hiện tại>';

  async up() {
    // coding
  }
}
```

Tham số lệnh:

| Tham số | Mô tả |
|------|------|
| `<name>` | Tên migration, dùng để tạo tên file |
| `--pkg <pkg>` | Tên package, quyết định đường dẫn lưu file |
| `--on <on>` | Thời điểm thực thi, mặc định `'afterLoad'` |

## Liên kết liên quan

- [Migration script (phát triển Plugin)](../../plugin-development/server/migration.md) — Hướng dẫn dùng migration trong phát triển Plugin
- [Collections - bảng dữ liệu](../../plugin-development/server/collections.md) — defineCollection và sync cấu trúc bảng
- [Database - thao tác cơ sở dữ liệu](../../plugin-development/server/database.md) — Repository API và thao tác cơ sở dữ liệu
- [Plugin](../../plugin-development/server/plugin.md) — Quan hệ giữa install() và migration trong vòng đời Plugin
