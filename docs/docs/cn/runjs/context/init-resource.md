# ctx.initResource()

**初始化**当前上下文的 resource：若尚未存在 `ctx.resource`，则按指定类型创建一个并绑定到上下文；若已存在则直接使用。之后可通过 `ctx.resource` 访问。

## 类型

```ts
initResource(type: ResourceType): FlowResource;
```

- `type`：资源类型，常用字符串为 `'APIResource'`、`'SingleRecordResource'`、`'MultiRecordResource'`、`'SQLResource'`。
- 返回：当前上下文中的 resource 实例（即 `ctx.resource`）。

## 示例

```js
// 确保有 ctx.resource，没有则按类型初始化
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

与 `makeResource` 的区别：`initResource` 会确保并可能设置 `ctx.resource`；`makeResource` 只创建新实例，不改变 `ctx.resource`。

各 Resource 类型的详细 API 见：

- [MultiRecordResource](/runjs/resource/multi-record-resource) — 多条记录/列表
- [SingleRecordResource](/runjs/resource/single-record-resource) — 单条记录
- [APIResource](/runjs/resource/api-resource) — 通用 API 资源
- [SQLResource](/runjs/resource/sql-resource) — SQL 查询资源
