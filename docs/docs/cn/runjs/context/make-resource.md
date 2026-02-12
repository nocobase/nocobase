# ctx.makeResource()

**新建**一个 resource 实例并返回，**不会**写入或改变 `ctx.resource`。适合需要多个独立 resource 或临时使用的场景。

## 类型

```ts
makeResource<T = FlowResource>(resourceType: ResourceType<T>): T;
```

- `resourceType`：资源类型，可为字符串类名或构造函数，例如 `'MultiRecordResource'`、`'SingleRecordResource'`、`'SQLResource'`、`'APIResource'`。
- 返回：新创建的 resource 实例。

## 示例

```js
// 新建一个列表 resource，不改变 ctx.resource
const listRes = ctx.makeResource('MultiRecordResource');
listRes.setResourceName('users');
await listRes.refresh();

// ctx.resource 仍为原来的值（若有）
const current = ctx.resource;
```

与 `initResource` 的区别：`makeResource` 只创建新实例；`initResource` 会在没有 `ctx.resource` 时初始化并绑定到上下文。

各 Resource 类型的详细 API 见：

- [MultiRecordResource](/runjs/resource/multi-record-resource) — 多条记录/列表
- [SingleRecordResource](/runjs/resource/single-record-resource) — 单条记录
- [APIResource](/runjs/resource/api-resource) — 通用 API 资源
- [SQLResource](/runjs/resource/sql-resource) — SQL 查询资源
