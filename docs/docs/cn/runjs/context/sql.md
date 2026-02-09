# ctx.sql

`ctx.sql` 提供 SQL 执行与管理能力，常用于在 RunJS（如 JSBlock）中直接访问数据库。支持临时 SQL 执行、按 ID 执行已保存的 SQL 模板、参数绑定、结果类型控制，以及保存/删除 SQL 模板。

## 权限说明

- **登录用户**：都可以执行 `runById`，即按已配置的 SQL 模板 ID 执行。
- **开放了 SQL 配置权限的角色**：还可执行 `run`、`save`、`destroy`，即临时执行 SQL、保存/更新/删除 SQL 模板。

因此，面向登录用户的前端逻辑可使用 `ctx.sql.runById(uid, options)`；需要动态 SQL 或管理模板时，需确保当前角色具备 SQL 配置权限。

---

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
}
```

> 说明：实现位于 FlowSQLRepository，此处仅列出在 RunJS 中直接使用的常用方法与参数。

---

## 常用方法

| 方法 | 说明 | 权限要求 |
|------|------|----------|
| `ctx.sql.run(sql, options?)` | 执行临时 SQL，支持参数绑定与结果类型控制 | 需 SQL 配置权限 |
| `ctx.sql.save({ uid, sql, dataSourceKey? })` | 按 ID 保存/更新 SQL 模板以供复用 | 需 SQL 配置权限 |
| `ctx.sql.runById(uid, options?)` | 按 ID 执行已保存的 SQL 模板，`options` 与 `run` 一致 | 登录用户均可 |
| `ctx.sql.destroy(uid)` | 删除指定 ID 的 SQL 模板 | 需 SQL 配置权限 |

---

## 参数说明

- **run / runById 的 options**
  - `bind`：绑定变量（对象或数组），可在 SQL 或模板中使用。
  - `type`：结果类型（如 `select` 多行、`selectRow` 单行、`selectVar` 单值、`raw` 等），以实际接口为准。
  - `dataSourceKey`：数据源标识。
  - `filter`：筛选条件（视接口支持情况使用）。

- **save 的 options**
  - `uid`：模板唯一标识，保存后可用 `runById(uid, ...)` 执行。
  - `sql`：SQL 内容。
  - `dataSourceKey`：可选，数据源标识。

---

## 示例

```js
// 注册需要的上下文
ctx.defineProperty('minId', {
  get: () => 1,
});

const sql = 'SELECT * FROM users WHERE id > {{ctx.minId}}';

// 需 SQL 配置权限：临时执行 SQL
const rows = await ctx.sql.run(sql, { type: 'select' });

// 需 SQL 配置权限：保存 SQL 模板
await ctx.sql.save({ uid: 'my-report-uid', sql });

// 登录用户均可：按已配置的 SQL 模板执行
const data = await ctx.sql.runById('my-report-uid', {
  type: 'select',
});

// 需 SQL 配置权限：删除 SQL 模板
await ctx.sql.destroy('my-report-uid');
```
