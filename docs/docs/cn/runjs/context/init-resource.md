# ctx.initResource()

**初始化**当前上下文的 resource：若尚未存在 `ctx.resource`，则按指定类型创建一个并绑定到上下文；若已存在则直接使用。之后可通过 `ctx.resource` 访问。

## 适用场景

一般只在 **JSBlock**（独立区块）场景使用。多数区块、弹窗等会预先绑定 `ctx.resource`，无需手动调用；JSBlock 默认无 resource，需先 `ctx.initResource(type)` 再通过 `ctx.resource` 加载数据。

## 类型定义

```ts
initResource(
  type: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): FlowResource;
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `type` | `string` | 资源类型：`'APIResource'`、`'SingleRecordResource'`、`'MultiRecordResource'`、`'SQLResource'` |

**返回值**：当前上下文中的 resource 实例（即 `ctx.resource`）。

## 与 ctx.makeResource() 的区别

| 方法 | 行为 |
|------|------|
| `ctx.initResource(type)` | 若 `ctx.resource` 不存在则创建并绑定；已存在则直接返回。保证 `ctx.resource` 可用 |
| `ctx.makeResource(type)` | 仅创建新实例并返回，**不**写入 `ctx.resource`。适合需要多个独立 resource 或临时使用的场景 |

## 示例

### 列表数据（MultiRecordResource）

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
ctx.render(<pre>{JSON.stringify(rows, null, 2)}</pre>);
```

### 单条记录（SingleRecordResource）

```ts
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1); // 指定主键
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### 指定数据源

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setDataSourceKey('main');
ctx.resource.setResourceName('orders');
await ctx.resource.refresh();
```

## 注意事项

- 多数区块（表单、表格、详情等）和弹窗场景下，`ctx.resource` 已由运行环境预绑定，无需调用 `ctx.initResource`。
- 仅在 JSBlock 等默认无 resource 的上下文中需要手动初始化。
- 初始化后需调用 `setResourceName(name)` 指定数据表，再通过 `refresh()` 加载数据。

## 相关

- [ctx.resource](./resource.md)：当前上下文中的 resource 实例
- [ctx.makeResource()](./make-resource.md)：新建 resource 实例，不绑定到 `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) — 多条记录/列表
- [SingleRecordResource](../resource/single-record-resource.md) — 单条记录
- [APIResource](../resource/api-resource.md) — 通用 API 资源
- [SQLResource](../resource/sql-resource.md) — SQL 查询资源
