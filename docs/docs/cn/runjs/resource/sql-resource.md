# SQLResource

基于**已保存的 SQL 配置**或**动态 SQL** 执行查询的 Resource，数据来源为 `flowSql:run` / `flowSql:runById` 等接口。适用于报表、统计、自定义 SQL 列表等场景。

继承关系：FlowResource → APIResource → BaseRecordResource → SQLResource。具备 [APIResource](/runjs/resource/api-resource) 的请求能力，并在此基础上扩展 SQL 类型、bind、分页与 `run`/`runById`。

创建方式：`ctx.makeResource('SQLResource')` 或 `ctx.initResource('SQLResource')`。按配置执行时需 `setFilterByTk(uid)`（SQL 配置的 uid）；调试时可用 `setDebug(true)` + `setSQL(sql)` 直接执行 SQL。

---

## SQL 配置与执行模式

| 方法 | 说明 |
|------|------|
| `setFilterByTk(uid)` | 设置要执行的 SQL 配置 uid（对应 runById） |
| `setSQL(sql)` | 设置原始 SQL（仅调试模式 `setDebug(true)` 时用于 runBySQL） |
| `setSQLType(type)` | 结果类型：`'selectVar'` / `'selectRow'` / `'selectRows'` |
| `setDebug(enabled)` | 为 true 时 refresh 走 `runBySQL()`，否则走 `runById()` |
| `run()` | 根据 debug 调用 `runBySQL()` 或 `runById()` |
| `runBySQL()` | 用当前 `setSQL` 的 SQL 执行（需先 setDebug(true)） |
| `runById()` | 用当前 uid 执行已保存的 SQL 配置 |

---

## 参数与上下文

| 方法 | 说明 |
|------|------|
| `setBind(bind)` | 绑定变量（key-value 或数组） |
| `setLiquidContext(ctx)` | 模板上下文（Liquid） |
| `setFilter(filter)` | 筛选（传入请求 data） |
| `setDataSourceKey(key)` | 数据源标识 |

---

## 分页

| 方法 | 说明 |
|------|------|
| `setPage(page)` / `getPage()` | 当前页（默认 1） |
| `setPageSize(size)` / `getPageSize()` | 每页条数（默认 20） |
| `next()` / `previous()` / `goto(page)` | 翻页并触发 refresh |

---

## 数据拉取与事件

| 方法 | 说明 |
|------|------|
| `refresh()` | 执行 SQL（runById 或 runBySQL），将结果写入 `setData(data)` 并更新 meta |
| `runAction(actionName, options)` | 调用底层接口（如 `getBind`、`run`、`runById`） |
| `on('refresh', fn)` / `on('loading', fn)` | 刷新完成、开始加载时触发 |

---

## 示例

```js
const res = ctx.makeResource('SQLResource');

// 调试：直接执行 SQL
res.setDebug(true);
res.setSQL('SELECT * FROM users LIMIT {{ctx.limit}}');
await res.refresh();

const data = res.getData();
```
