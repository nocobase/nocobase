---
title: 数据库迁移
order: 1
toc: menu
nav:
  title: 核心
  order: 2
---

# 数据库迁移

NocoBase 通过配置来生成数据表和字段，如：

```ts
const db = new Database();

db.table({
  name: 'examples',
  fields: [
    { type: 'string', name: 'name' },
    { type: 'string', name: 'title' },
  ],
});
```

如果需要生成数据表和字段，直接执行 `db.sync()` 操作就可以了。

```ts
// 只更新不删除
await db.sync();

// 全部重建
await db.sync({
  force: true,
  alter: {
    drop: true,
  },
});

// 更多参数说明
interface SyncOptions {

  /**
   * The tables should be created or updated.
   */
  tables?: string[] | Table[] | Map<string, Table>;

  /**
   * If force is true, each DAO will do DROP TABLE IF EXISTS ..., before it tries to create its own table
   */
  force?: boolean;

  /**
   * If alter is true, each DAO will do ALTER TABLE ... CHANGE ...
   * Alters tables to fit models. Provide an object for additional configuration. Not recommended for production use. If not further configured deletes data in columns that were removed or had their type changed in the model.
   */
  alter?: boolean | SyncAlterOptions;

  /**
   * Match a regex against the database name before syncing, a safety check for cases where force: true is
   * used in tests but not live code
   */
  match?: RegExp;

  /**
   * The schema that the tables should be created in. This can be overridden for each table in sequelize.define
   */
  schema?: string;

  /**
   * An optional parameter to specify the schema search_path (Postgres only)
   */
  searchPath?: string;
}
```

如果后续有新增或删除字段操作，直接修改配置即可，如：

```ts
db.table({
  name: 'examples',
  fields: [
    { type: 'string', name: 'name' },
    // { type: 'string', name: 'title' }, // 去掉 title 字段
    { type: 'text', name: 'content' }, // 新增 content 字段
  ],
});
```

接着执行 `db.sync()` 操作就同步给数据库了。

但是，如果需要更改字段名怎么操作呢，比如将 name 改为 name2，需要将配置修一下：

```ts
db.table({
  name: 'examples',
  fields: [
    { type: 'string', name: 'name2' },
  ],
});
```

这时，执行 `db.sync()` 操作并不会把 name 改为 name2，而是又生成了一个新的 name2 字段。如果要更改字段名称，需要配合 migration 来处理，如：

```ts
await queryInterface.renameColumn('examples', 'name', 'name2');
```

这个办法能解决问题，但是需要写另外的 migration 文件来处理。更好的办法，可以给字段一个显式的 uid，如：

```ts
db.table({
  name: 'examples',
  fields: [
    { uid: 'f0nyq8tg3j1y', type: 'string', name: 'name' },
  ],
});
```

更改字段配置时，uid 不变，修改其他值即可

```ts
db.table({
  name: 'examples',
  fields: [
    { uid: 'f0nyq8tg3j1y', type: 'string', name: 'name2' },
  ],
});
```

需要同步给数据库时，接着执行 `db.sync()` 方法。

<Alert title="注意" type="warning">
uid 的方案适用于 table、field、index，但是还并未实现。暂时可以结合 migration 来管理数据库结构变更。
</Alert>