# ctx.makeResource()

**新建**一个 resource 实例并返回，**不会**写入或改变 `ctx.resource`。适合需要多个独立 resource 或临时使用的场景。

## 适用场景

| 场景 | 说明 |
|------|------|
| **多个 resource** | 同时加载多个数据源（如用户列表 + 订单列表），每个用独立 resource |
| **临时查询** | 一次性查询，用完即弃，无需绑定到 `ctx.resource` |
| **辅助数据** | 主数据用 `ctx.resource`，额外数据用 `makeResource` 新建 |

若只需单一 resource 且希望绑定到 `ctx.resource`，使用 [ctx.initResource()](./init-resource.md) 更合适。

## 类型定义

```ts
makeResource<T = FlowResource>(
  resourceType: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): T;
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `resourceType` | `string` | 资源类型：`'APIResource'`、`'SingleRecordResource'`、`'MultiRecordResource'`、`'SQLResource'` |

**返回值**：新创建的 resource 实例。

## 与 ctx.initResource() 的区别

| 方法 | 行为 |
|------|------|
| `ctx.makeResource(type)` | 仅创建新实例并返回，**不**写入 `ctx.resource`。可多次调用得到多个独立 resource |
| `ctx.initResource(type)` | 若 `ctx.resource` 不存在则创建并绑定；已存在则直接返回。保证 `ctx.resource` 可用 |

## 示例

### 单个 resource

```ts
const listRes = ctx.makeResource('MultiRecordResource');
listRes.setResourceName('users');
await listRes.refresh();
const users = listRes.getData();
// ctx.resource 仍为原来的值（若有）
```

### 多个 resource

```ts
const usersRes = ctx.makeResource('MultiRecordResource');
usersRes.setResourceName('users');
await usersRes.refresh();

const ordersRes = ctx.makeResource('MultiRecordResource');
ordersRes.setResourceName('orders');
await ordersRes.refresh();

ctx.render(
  <div>
    <p>用户数：{usersRes.getData().length}</p>
    <p>订单数：{ordersRes.getData().length}</p>
  </div>
);
```

### 临时查询

```ts
// 一次性查询，不污染 ctx.resource
const tempRes = ctx.makeResource('SingleRecordResource');
tempRes.setResourceName('users');
tempRes.setFilterByTk(1);
await tempRes.refresh();
const record = tempRes.getData();
```

## 注意事项

- 新建的 resource 需调用 `setResourceName(name)` 指定数据表，再通过 `refresh()` 加载数据。
- 每个 resource 实例独立，互不影响；适合并行加载多个数据源。

## 相关

- [ctx.initResource()](./init-resource.md)：初始化并绑定到 `ctx.resource`
- [ctx.resource](./resource.md)：当前上下文中的 resource 实例
- [MultiRecordResource](../resource/multi-record-resource) — 多条记录/列表
- [SingleRecordResource](../resource/single-record-resource) — 单条记录
- [APIResource](../resource/api-resource) — 通用 API 资源
- [SQLResource](../resource/sql-resource) — SQL 查询资源
