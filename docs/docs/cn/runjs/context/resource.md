# ctx.resource

当前上下文中的 **FlowResource** 实例，用于访问和操作数据。多数区块（表单、表格、详情等）和弹窗场景下，运行环境会预先绑定 `ctx.resource`；JSBlock 等默认无 resource 的场景，需先调用 [ctx.initResource()](./init-resource.md) 初始化，再通过 `ctx.resource` 使用。

## 适用场景

凡 RunJS 中需要访问结构化数据（列表、单条、自定义 API、SQL）的场景均可使用。表单、表格、详情区块及弹窗通常已预绑定；JSBlock、JSField、JSItem、JSColumn 等若需加载数据，可先 `ctx.initResource(type)` 再访问 `ctx.resource`。

## 类型定义

```ts
resource: FlowResource | undefined;
```

- 有预绑定的上下文下，`ctx.resource` 为对应 resource 实例；
- JSBlock 等默认无 resource，为 `undefined`，需先 `ctx.initResource(type)` 后才有值。

## 常见方法

不同 resource 类型（MultiRecordResource、SingleRecordResource、APIResource、SQLResource）暴露的方法略有差异，以下为通用或常用方法：

| 方法 | 说明 |
|------|------|
| `getData()` | 获取当前数据（列表或单条） |
| `setData(value)` | 设置本地数据 |
| `refresh()` | 按当前参数发起请求，刷新数据 |
| `setResourceName(name)` | 设置资源名（如 `'users'`、`'users.tags'`） |
| `setFilterByTk(tk)` | 设置主键筛选（单条 get 等） |
| `runAction(actionName, options)` | 调用任意资源 action（如 `create`、`update`） |
| `on(event, callback)` / `off(event, callback)` | 订阅/取消订阅事件（如 `refresh`、`saved`） |

**MultiRecordResource 特有**：`getSelectedRows()`、`destroySelectedRows()`、`setPage()`、`next()`、`previous()` 等。

## 示例

### 列表数据（需先 initResource）

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

### 表格场景（已预绑定）

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
for (const row of rows) {
  console.log(row);
}

await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('已删除'));
```

### 单条记录

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### 调用自定义 action

```js
await ctx.resource.runAction('create', { data: { name: '张三' } });
```

## 与 ctx.initResource / ctx.makeResource 的关系

- **ctx.initResource(type)**：若 `ctx.resource` 不存在则创建并绑定；已存在则直接返回。保证 `ctx.resource` 可用。
- **ctx.makeResource(type)**：新建 resource 实例并返回，**不**写入 `ctx.resource`。适合需要多个独立 resource 或临时使用的场景。
- **ctx.resource**：访问当前上下文中已绑定的 resource。多数区块/弹窗已预绑定；无绑定时为 `undefined`，需先 `ctx.initResource`。

## 注意事项

- 使用前建议做空值判断：`ctx.resource?.refresh()`，尤其在 JSBlock 等可能无预绑定的场景。
- 初始化后需调用 `setResourceName(name)` 指定数据表，再通过 `refresh()` 加载数据。
- 各 Resource 类型的完整 API 见下方链接。

## 相关

- [ctx.initResource()](./init-resource.md) - 初始化并绑定 resource 到当前上下文
- [ctx.makeResource()](./make-resource.md) - 新建 resource 实例，不绑定到 `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) - 多条记录/列表
- [SingleRecordResource](../resource/single-record-resource.md) - 单条记录
- [APIResource](../resource/api-resource.md) - 通用 API 资源
- [SQLResource](../resource/sql-resource.md) - SQL 查询资源
