# ctx.sql

`ctx.sql` 提供 SQL 执行与管理能力，常用于在 JSBlock 中直接访问数据库。支持临时 SQL 执行、参数绑定、结果类型控制以及保存/复用 SQL 模板。

## 类型定义

```ts
sql: FlowSQLRepository;

interface FlowSQLRepository {
  run<T = any>(
    sql: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'select' | 'selectRow' | 'selectVar' | 'raw';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  save(options: {
    uid: string;
    sql: string;
    dataSourceKey?: string;
  }): Promise<void>;

  runById<T = any>(
    uid: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'select' | 'selectRow' | 'selectVar' | 'raw';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  destroy(uid: string): Promise<void>;
};
```

> 说明：实现位于 FlowSQLRepository，此处仅列出在 JSBlock 中直接使用的常用方法与参数。

## 常用方法

- `ctx.sql.run(sql, options?)`：执行临时 SQL，支持参数绑定与结果类型控制
- `ctx.sql.save({ uid, sql, dataSourceKey? })`：按 ID 保存/更新 SQL 模板以供复用
- `ctx.sql.runById(uid, options?)`：按 ID 执行已保存的 SQL 模板，`options` 与 `run` 一致
- `ctx.sql.destroy(uid)`：删除不再使用的 SQL 模板
