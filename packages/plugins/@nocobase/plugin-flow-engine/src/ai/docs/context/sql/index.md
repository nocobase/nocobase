# ctx.sql

`ctx.sql` 提供 SQL 执行和管理能力，常用于 JSBlock 中直接访问数据库。  
支持临时 SQL 执行、参数绑定、结果类型控制，以及保存/复用 SQL 模板等能力。

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

> 说明：实际实现位于 FlowSQLRepository 中，这里只展示常用方法和参数，便于在 JSBlock 中直接调用。

## 常用方法

- `ctx.sql.run(sql, options?)`：执行一段临时 SQL，支持参数绑定、返回类型控制
- `ctx.sql.save({ uid, sql, dataSourceKey? })`：保存/更新一条 SQL 模板，供后续按 ID 复用
- `ctx.sql.runById(uid, options?)`：根据模板 ID 执行 SQL，`options` 与 `run` 一致
- `ctx.sql.destroy(uid)`：删除不再需要的 SQL 模板

## 使用示例

- [执行临时 SQL](./sql-basic.md)
- [保存并复用 SQL 模板](./sql-save-and-run-by-id.md)
- [使用字符串变量占位符](./sql-vars.md)
