# ctx.sql

`ctx.sql` 提供 SQL 执行与管理能力，常用于 RunJS（如 JSBlock、事件流）中直接访问数据库。支持临时 SQL 执行、按 ID 执行已保存的 SQL 模板、参数绑定、模板变量（`{{ctx.xxx}}`）以及结果类型控制。

## 适用场景

| 场景 | 说明 |
|------|------|
| **JSBlock** | 自定义统计报表、复杂筛选列表、跨表聚合查询 |
| **图表区块** | 保存 SQL 模板驱动图表数据源 |
| **事件流 / 联动** | 执行预置 SQL 获取数据并参与后续逻辑 |
| **SQLResource** | 与 `ctx.initResource('SQLResource')` 配合，用于分页列表等场景 |

> 注意：`ctx.sql` 通过 `flowSql` API 访问数据库，需确保当前用户有对应数据源的执行权限。

## 权限说明

| 权限 | 方法 | 说明 |
|------|------|------|
| **登录用户** | `runById` | 按已配置的 SQL 模板 ID 执行 |
| **SQL 配置权限** | `run`、`save`、`destroy` | 临时执行 SQL、保存/更新/删除 SQL 模板 |

面向普通用户的前端逻辑可使用 `ctx.sql.runById(uid, options)`；需要动态 SQL 或管理模板时，需确保当前角色具备 SQL 配置权限。

## 类型定义

```ts
sql: FlowSQLRepository;

interface FlowSQLRepository {
  run<T = any>(
    sql: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  save(options: { uid: string; sql: string; dataSourceKey?: string }): Promise<void>;

  runById<T = any>(
    uid: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  destroy(uid: string): Promise<void>;
}
```

## 常用方法

| 方法 | 说明 | 权限要求 |
|------|------|----------|
| `ctx.sql.run(sql, options?)` | 执行临时 SQL，支持参数绑定与模板变量 | 需 SQL 配置权限 |
| `ctx.sql.save({ uid, sql, dataSourceKey? })` | 按 ID 保存/更新 SQL 模板以供复用 | 需 SQL 配置权限 |
| `ctx.sql.runById(uid, options?)` | 按 ID 执行已保存的 SQL 模板 | 登录用户均可 |
| `ctx.sql.destroy(uid)` | 删除指定 ID 的 SQL 模板 | 需 SQL 配置权限 |

注意：

- `run` 用于调试 SQL，需配置权限；
- `save`、`destroy` 用于管理 SQL 模板，需配置权限；
- `runById` 开放给普通用户，仅能按已保存模板执行，无法调试或修改 SQL；
- SQL 模板有变动时，需调用 `save` 保存。

## 参数说明

### run / runById 的 options

| 参数 | 类型 | 说明 |
|------|------|------|
| `bind` | `Record<string, any>` \| `any[]` | 绑定变量。对象形式配合 `:name`，数组形式配合 `?` |
| `type` | `'selectRows'` \| `'selectRow'` \| `'selectVar'` | 结果类型：多行、单行、单值，默认 `selectRows` |
| `dataSourceKey` | `string` | 数据源标识，默认使用主数据源 |
| `filter` | `Record<string, any>` | 额外筛选条件（视接口支持） |

### save 的 options

| 参数 | 类型 | 说明 |
|------|------|------|
| `uid` | `string` | 模板唯一标识，保存后可用 `runById(uid, ...)` 执行 |
| `sql` | `string` | SQL 内容，支持 `{{ctx.xxx}}` 模板变量和 `:name` / `?` 占位符 |
| `dataSourceKey` | `string` | 可选，数据源标识 |

## SQL 模板变量与参数绑定

### 模板变量 `{{ctx.xxx}}`

在 SQL 中可使用 `{{ctx.xxx}}` 引用上下文变量，执行前会解析为实际值：

```js
// 引用 ctx.user.id
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = {{ctx.user.id}}',
  { type: 'selectRow' }
);
```

可引用的变量来源与 `ctx.getVar()` 一致（如 `ctx.user.*`、`ctx.record.*`、自定义 `ctx.defineProperty` 等）。

### 参数绑定

- **命名参数**：SQL 中使用 `:name`，`bind` 传对象 `{ name: value }`
- **位置参数**：SQL 中使用 `?`，`bind` 传数组 `[value1, value2]`

```js
// 命名参数
const users = await ctx.sql.run(
  'SELECT * FROM users WHERE status = :status AND age > :minAge',
  { bind: { status: 'active', minAge: 18 }, type: 'selectRows' }
);

// 位置参数
const count = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users WHERE city = ? AND status = ?',
  { bind: ['Beijing', 'active'], type: 'selectVar' }
);
```

## 示例

### 临时执行 SQL（需 SQL 配置权限）

```js
// 多行结果（默认）
const rows = await ctx.sql.run('SELECT * FROM users LIMIT 10');

// 单行结果
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = :id',
  { bind: { id: 1 }, type: 'selectRow' }
);

// 单值结果（如 COUNT、SUM）
const total = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users',
  { type: 'selectVar' }
);
```

### 使用模板变量

```js
ctx.defineProperty('minId', { get: () => 1 });

const rows = await ctx.sql.run(
  'SELECT * FROM users WHERE id > {{ctx.minId}}',
  { type: 'selectRows' }
);
```

### 保存模板并复用

```js
// 保存（需 SQL 配置权限）
await ctx.sql.save({
  uid: 'active-users-report',
  sql: 'SELECT * FROM users WHERE status = :status ORDER BY created_at DESC',
});

// 登录用户均可执行
const users = await ctx.sql.runById('active-users-report', {
  bind: { status: 'active' },
  type: 'selectRows',
});

// 删除模板（需 SQL 配置权限）
await ctx.sql.destroy('active-users-report');
```

### 分页列表（SQLResource）

```js
// 需要分页、筛选时，可使用 SQLResource
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('saved-sql-uid');  // 已保存的 SQL 模板 ID
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta();  // 含 page、pageSize 等
```

## 与 ctx.resource、ctx.request 的关系

| 用途 | 推荐用法 |
|------|----------|
| **执行 SQL 查询** | `ctx.sql.run()` 或 `ctx.sql.runById()` |
| **SQL 分页列表（区块）** | `ctx.initResource('SQLResource')` + `ctx.resource.refresh()` |
| **通用 HTTP 请求** | `ctx.request()` |

`ctx.sql` 封装了 `flowSql` API，专用于 SQL 场景；`ctx.request` 可调用任意 API。

## 注意事项

- 使用参数绑定（`:name` / `?`）而非字符串拼接，避免 SQL 注入
- `type: 'selectVar'` 时返回标量值，通常用于 `COUNT`、`SUM` 等
- 模板变量 `{{ctx.xxx}}` 在执行前解析，确保上下文中已定义对应变量

## 相关

- [ctx.resource](./resource.md)：数据资源，SQLResource 内部会调用 `flowSql` API
- [ctx.initResource()](./init-resource.md)：初始化 SQLResource 用于分页列表等
- [ctx.request()](./request.md)：通用 HTTP 请求
