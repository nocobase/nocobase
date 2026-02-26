# SQLResource

基于**已保存的 SQL 配置**或**动态 SQL** 执行查询的 Resource，数据来源为 `flowSql:run` / `flowSql:runById` 等接口。适用于报表、统计、自定义 SQL 列表等场景。与 [MultiRecordResource](./multi-record-resource.md) 不同，SQLResource 不依赖数据表，直接执行 SQL 查询，支持分页、参数绑定、模板变量（`{{ctx.xxx}}`）及结果类型控制。

**继承关系**：FlowResource → APIResource → BaseRecordResource → SQLResource。

**创建方式**：`ctx.makeResource('SQLResource')` 或 `ctx.initResource('SQLResource')`。按已保存配置执行时需 `setFilterByTk(uid)`（SQL 模板的 uid）；调试时可用 `setDebug(true)` + `setSQL(sql)` 直接执行 SQL；RunJS 中 `ctx.api` 由运行环境注入。

---

## 适用场景

| 场景 | 说明 |
|------|------|
| **报表 / 统计** | 复杂聚合、跨表查询、自定义统计指标 |
| **JSBlock 自定义列表** | 用 SQL 实现特殊筛选、排序或关联，并自定义渲染 |
| **图表区块** | 保存 SQL 模板驱动图表数据源，支持分页 |
| **与 ctx.sql 的取舍** | 需要分页、事件、响应式数据时用 SQLResource；简单一次性查询可用 `ctx.sql.run()` / `ctx.sql.runById()` |

---

## 数据格式

- `getData()` 根据 `setSQLType()` 返回不同格式：
  - `selectRows`（默认）：**数组**，多行结果
  - `selectRow`：**单条对象**
  - `selectVar`：**标量值**（如 COUNT、SUM）
- `getMeta()` 返回分页等元信息：`page`、`pageSize`、`count`、`totalPage` 等

---

## SQL 配置与执行模式

| 方法 | 说明 |
|------|------|
| `setFilterByTk(uid)` | 设置要执行的 SQL 模板 uid（对应 runById，需先在管理端保存） |
| `setSQL(sql)` | 设置原始 SQL（仅调试模式 `setDebug(true)` 时用于 runBySQL） |
| `setSQLType(type)` | 结果类型：`'selectVar'` / `'selectRow'` / `'selectRows'` |
| `setDebug(enabled)` | 为 true 时 refresh 走 `runBySQL()`，否则走 `runById()` |
| `run()` | 根据 debug 调用 `runBySQL()` 或 `runById()` |
| `runBySQL()` | 用当前 `setSQL` 的 SQL 执行（需先 setDebug(true)） |
| `runById()` | 用当前 uid 执行已保存的 SQL 模板 |

---

## 参数与上下文

| 方法 | 说明 |
|------|------|
| `setBind(bind)` | 绑定变量。对象形式配合 `:name`，数组形式配合 `?` |
| `setLiquidContext(ctx)` | 模板上下文（Liquid），用于解析 `{{ctx.xxx}}` |
| `setFilter(filter)` | 额外筛选条件（传入请求 data） |
| `setDataSourceKey(key)` | 数据源标识（多数据源时使用） |

---

## 分页

| 方法 | 说明 |
|------|------|
| `setPage(page)` / `getPage()` | 当前页（默认 1） |
| `setPageSize(size)` / `getPageSize()` | 每页条数（默认 20） |
| `next()` / `previous()` / `goto(page)` | 翻页并触发 refresh |

SQL 中可使用 `{{ctx.limit}}`、`{{ctx.offset}}` 引用分页参数，SQLResource 会在上下文中注入 `limit`、`offset`。

---

## 数据拉取与事件

| 方法 | 说明 |
|------|------|
| `refresh()` | 执行 SQL（runById 或 runBySQL），将结果写入 `setData(data)` 并更新 meta，触发 `'refresh'` 事件 |
| `runAction(actionName, options)` | 调用底层接口（如 `getBind`、`run`、`runById`） |
| `on('refresh', fn)` / `on('loading', fn)` | 刷新完成、开始加载时触发 |

---

## 示例

### 按已保存模板执行（runById）

```js
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('active-users-report'); // 已保存的 SQL 模板 uid
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta(); // page、pageSize、count 等
```

### 调试模式：直接执行 SQL（runBySQL）

```js
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE status = :status LIMIT {{ctx.limit}}');
res.setBind({ status: 'active' });
await res.refresh();
const data = res.getData();
```

### 分页与翻页

```js
ctx.resource.setFilterByTk('user-list-sql');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();

// 翻页
await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### 结果类型

```js
// 多行（默认）
ctx.resource.setSQLType('selectRows');
const rows = ctx.resource.getData(); // [{...}, {...}]

// 单行
ctx.resource.setSQLType('selectRow');
const row = ctx.resource.getData(); // {...}

// 单值（如 COUNT）
ctx.resource.setSQLType('selectVar');
const total = ctx.resource.getData(); // 42
```

### 使用模板变量

```js
ctx.defineProperty('minId', { get: () => 10 });
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE id > {{ctx.minId}} LIMIT {{ctx.limit}}');
await res.refresh();
```

### 监听 refresh 事件

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

---

## 注意事项

- **runById 需先保存模板**：`setFilterByTk(uid)` 的 uid 必须是已在管理端保存的 SQL 模板 ID，可通过 `ctx.sql.save({ uid, sql })` 保存。
- **调试模式需权限**：`setDebug(true)` 时走 `flowSql:run`，需当前角色具备 SQL 配置权限；`runById` 仅需登录即可。
- **refresh 防抖**：同一事件循环内多次调用 `refresh()` 只会执行最后一次，避免重复请求。
- **参数绑定防注入**：使用 `setBind()` 配合 `:name` / `?` 占位符，避免字符串拼接导致 SQL 注入。

---

## 相关

- [ctx.sql](../context/sql.md) - SQL 执行与管理，`ctx.sql.runById` 适合简单一次性查询
- [ctx.resource](../context/resource.md) - 当前上下文中的 resource 实例
- [ctx.initResource()](../context/init-resource.md) - 初始化并绑定到 ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - 新建 resource 实例，不绑定
- [APIResource](./api-resource.md) - 通用 API 资源
- [MultiRecordResource](./multi-record-resource.md) - 面向数据表/列表
