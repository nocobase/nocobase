# ctx.openView()

以编程方式打开指定视图（抽屉、弹窗、内嵌页等）。由 FlowModelContext 提供，用于在 JSBlock、表格单元格、事件流等场景中打开已配置的 ChildPage 或 PopupAction 视图。

## 适用场景

| 场景 | 说明 |
|------|------|
| **JSBlock** | 按钮点击后打开详情/编辑弹窗，传入当前行 `filterByTk` |
| **表格单元格** | 在单元格中渲染按钮，点击打开行详情弹窗 |
| **事件流 / JSAction** | 在操作成功后打开下一个视图或弹窗 |
| **关联字段** | 通过 `ctx.runAction('openView', params)` 打开选择/编辑弹窗 |

> 注意：`ctx.openView` 需在存在 FlowModel 上下文的 RunJS 环境中可用；若 uid 对应的模型不存在，会自动创建 PopupActionModel 并持久化。

## 签名

```ts
openView(uid: string, options?: OpenViewOptions): Promise<void>
```

## 参数说明

### uid

视图模型的唯一标识。若不存在则会自动创建并保存。建议使用稳定的 UID，如 `${ctx.model.uid}-detail`，以便多次打开同一弹窗时复用配置。

### options 常用字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `mode` | `drawer` / `dialog` / `embed` | 打开方式：抽屉、弹窗、内嵌，默认 `drawer` |
| `size` | `small` / `medium` / `large` | 弹窗/抽屉尺寸，默认 `medium` |
| `title` | `string` | 视图标题 |
| `params` | `Record<string, any>` | 传给视图的任意参数 |
| `filterByTk` | `any` | 主键值，用于单条详情/编辑场景 |
| `sourceId` | `string` | 来源记录 ID，关联场景使用 |
| `dataSourceKey` | `string` | 数据源 |
| `collectionName` | `string` | 数据表名 |
| `associationName` | `string` | 关联字段名 |
| `navigation` | `boolean` | 是否使用路由导航，传 `defineProperties` / `defineMethods` 时会被强制设为 `false` |
| `preventClose` | `boolean` | 是否阻止关闭 |
| `defineProperties` | `Record<string, PropertyOptions>` | 向视图内模型动态注入属性 |
| `defineMethods` | `Record<string, Function>` | 向视图内模型动态注入方法 |

## 示例

### 基础用法：打开抽屉

```ts
const popupUid = `${ctx.model.uid}-detail`;
await ctx.openView(popupUid, {
  mode: 'drawer',
  size: 'medium',
  title: ctx.t('详情'),
});
```

### 传入当前行上下文

```ts
const primaryKey = ctx.collection?.primaryKey || 'id';
await ctx.openView(`${ctx.model.uid}-1`, {
  mode: 'dialog',
  title: ctx.t('行详情'),
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### 通过 runAction 打开

当模型配置了 openView 动作（如关联字段、可点击字段）时，可调用：

```ts
await ctx.runAction('openView', {
  navigation: false,
  mode: 'dialog',
  collectionName: 'users',
  filterByTk: ctx.record?.id,
});
```

### 注入自定义上下文

```ts
await ctx.openView(`${ctx.model.uid}-edit`, {
  mode: 'drawer',
  filterByTk: ctx.record?.id,
  defineProperties: {
    onSaved: {
      get: () => () => ctx.resource?.refresh?.(),
      cache: false,
    },
  },
});
```

## 与 ctx.viewer、ctx.view 的关系

| 用途 | 推荐用法 |
|------|----------|
| **打开已配置的流程视图** | `ctx.openView(uid, options)` |
| **打开自定义 content（无流程）** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` |
| **操作当前打开的视图** | `ctx.view.close()`、`ctx.view.inputArgs` |

`ctx.openView` 打开的是 FlowPage（ChildPageModel），内部会渲染完整流程页面；`ctx.viewer` 打开的是任意 React 内容。

## 注意事项

- uid 建议与 `ctx.model.uid` 关联（如 `${ctx.model.uid}-xxx`），避免多个区块冲突
- 传入 `defineProperties` / `defineMethods` 时，`navigation` 会被强制设为 `false`，以防止刷新后上下文丢失
- 弹窗内的 `ctx.view` 指向当前视图实例，`ctx.view.inputArgs` 可读取打开时传入的参数

## 相关

- [ctx.view](./view.md)：当前打开的视图实例
- [ctx.model](./model.md)：当前模型，用于构造稳定的 popupUid
