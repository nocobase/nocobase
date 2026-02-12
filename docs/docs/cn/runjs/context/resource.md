# ctx.resource

当前上下文中的 **resource** 实例（FlowResource），用于访问和操作数据。

- 可能由区块、弹窗等运行环境预先绑定。
- 若上下文中尚未有 resource，可先调用 `ctx.initResource(type)` 初始化一个，再通过 `ctx.resource` 使用。

常用用法示例：

```js
// 先确保有 resource（没有则按类型初始化一个）
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

常见方法（视具体 resource 类型而定）：`getData()`、`setData(value)`、`refresh()`、`setResourceName(name)`、`setFilterByTk(tk)`、`runAction(actionName, params)`，以及 `on`/`off` 事件订阅等。

各 Resource 类型的详细 API 见：

- [MultiRecordResource](/runjs/resource/multi-record-resource) — 多条记录/列表
- [SingleRecordResource](/runjs/resource/single-record-resource) — 单条记录
- [APIResource](/runjs/resource/api-resource) — 通用 API 资源
- [SQLResource](/runjs/resource/sql-resource) — SQL 查询资源
