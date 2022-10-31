# 数据库迁移

插件在更新迭代过程中，可能会出现某些不兼容的改动，这些不兼容的升级脚本可以通过编写 migration 文件来处理。

## 如何添加迁移文件？

```ts
export class MyPlugin extends Plugin {
  load() {
    // 加载单个 Migration 文件
    this.db.addMigration();
    // 加载多个 Migration 文件
    this.db.addMigrations();
  }
}
```

API 参考：

- [db.addMigration()](/api/database#addmigration)
- [db.addMigrations()](/api/database#addmigrations)

## 什么时候执行？

```bash
# app 升级时，会执行 migrator.up() 和 db.sync()
yarn nocobase upgrade
# 单独触发 migration
yarn nocobase migrator up
```

## 什么时候需要写 migration 文件？

一般用于升级过程中，存于数据库的系统配置的更新。如果只是 collection 配置的变更，无需配置 migration，直接执行 `yarn nocobase db:sync` 就可以同步给数据库了。

## Migration 文件

```ts
import { Migration } from '@nocobase/server';

export default class CustomMigration extends Migration {
  async up() {
    // 
  }

  async down() {
    // 
  }
}
```
