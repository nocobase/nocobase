---
title: "Migration"
description: "NocoBase Migration API 参考：Migration 基类、up/down 方法、on 执行时机、appVersion 版本控制、可用属性。"
keywords: "Migration,数据迁移,up,down,appVersion,on,beforeLoad,afterSync,afterLoad,NocoBase"
---

# Migration

Migration 是 NocoBase 的数据迁移基类，用于在插件升级时处理数据库结构变更和数据迁移。从 `@nocobase/server` 导入。

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad';
  appVersion = '<1.0.0';

  async up() {
    // 升级逻辑
  }
}
```

## 类属性

### on

```ts
on: 'beforeLoad' | 'afterSync' | 'afterLoad';
```

控制 migration 在 upgrade 流程中的执行时机。默认 `'afterLoad'`。

| 值 | 执行时机 | 适用场景 |
|----|----------|----------|
| `'beforeLoad'` | 插件加载之前 | 底层 DDL 操作（比如添加列、添加约束），此时不能使用 Repository API |
| `'afterSync'` | `db.sync()` 之后、插件 upgrade 之前 | 需要新表结构但不依赖插件逻辑的数据迁移 |
| `'afterLoad'` | 所有插件加载完成之后 | **默认值**，大多数 migration 用这个。可以使用完整的 Repository API |

### appVersion

```ts
appVersion: string;
```

semver 范围字符串，决定该 migration 在哪些版本的应用上执行。框架用 `semver.satisfies()` 判断：只有当前应用版本满足该范围时，migration 才会执行。

```ts
// 只有从低于 1.0.0 的版本升级时才执行
appVersion = '<1.0.0';

// 只有从低于 0.21.0-alpha.13 的版本升级时才执行
appVersion = '<0.21.0-alpha.13';

// 留空则每次 upgrade 都执行
appVersion = '';
```

## 实例属性

### app

```ts
get app(): Application
```

NocoBase Application 实例。通过它可以访问应用的各个模块：

```ts
async up() {
  // 获取应用版本
  const version = this.app.version;

  // 获取日志
  this.app.log.info('Migration started');
}
```

### db

```ts
get db(): Database
```

NocoBase Database 实例，可以用来获取 Repository、执行查询等：

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

当前插件实例。仅在插件级 migration 中可用（core migration 中为 `undefined`）。

```ts
async up() {
  const pluginName = this.plugin.name;
}
```

### sequelize

```ts
get sequelize(): Sequelize
```

Sequelize 实例，可以直接执行原始 SQL：

```ts
async up() {
  await this.sequelize.query(`UPDATE users SET status = 'active' WHERE status IS NULL`);
}
```

### queryInterface

```ts
get queryInterface(): QueryInterface
```

Sequelize QueryInterface，用于执行 DDL 操作（添加/删除列、添加约束、修改列类型等）：

```ts
async up() {
  const { DataTypes } = require('@nocobase/database');

  // 添加列
  await this.queryInterface.addColumn('users', 'nickname', {
    type: DataTypes.STRING,
  });

  // 添加唯一约束
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

插件管理器。通过 `this.pm.repository` 可以查询和修改插件元数据：

```ts
async up() {
  const plugins = await this.pm.repository.find();
  for (const plugin of plugins) {
    // 批量修改插件记录
  }
}
```

## 实例方法

### up()

```ts
async up(): Promise<void>
```

**升级时执行。** 子类必须 override 此方法，编写迁移逻辑。

### down()

```ts
async down(): Promise<void>
```

**回滚时执行。** 大多数 migration 留空。如果需要支持回滚，在这里编写反向操作。

## 完整示例

### 使用 Repository API 更新数据（afterLoad）

最常见的场景——在所有插件加载完成后，用 Repository API 批量更新数据：

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

### 使用 QueryInterface 修改表结构（beforeLoad）

在插件加载之前执行底层 DDL——比如给表添加新列和唯一约束：

```ts
import { DataTypes } from '@nocobase/database';
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'beforeLoad';
  appVersion = '<0.14.0-alpha.2';

  async up() {
    const tableName = this.pm.collection.getTableNameWithSchema();
    const field = this.pm.collection.getField('packageName');

    // 先检查字段是否已存在
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

### 使用原始 SQL（afterSync）

在表结构同步完成后，用原始 SQL 做数据迁移：

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

## 创建 Migration 文件

通过 CLI 命令创建：

```bash
yarn nocobase create-migration my-migration --pkg @my-project/plugin-hello
```

命令会在插件的 `src/server/migrations/` 目录下生成带时间戳的文件，模板如下：

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad';
  appVersion = '<当前版本>';

  async up() {
    // coding
  }
}
```

命令参数：

| 参数 | 说明 |
|------|------|
| `<name>` | migration 名称，用于生成文件名 |
| `--pkg <pkg>` | 包名，决定文件存放路径 |
| `--on <on>` | 执行时机，默认 `'afterLoad'` |

## 相关链接

- [Migration 升级脚本（插件开发）](../../plugin-development/server/migration.md) — 插件开发中 migration 的使用教程
- [Collections 数据表](../../plugin-development/server/collections.md) — defineCollection 和表结构同步
- [Database 数据库操作](../../plugin-development/server/database.md) — Repository API 和数据库操作
- [Plugin 插件](../../plugin-development/server/plugin.md) — 插件生命周期中 install() 和 migration 的关系
