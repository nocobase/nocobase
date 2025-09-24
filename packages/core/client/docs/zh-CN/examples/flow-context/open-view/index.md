# ctx.openView

:::info
- `ctx.openView(uid, options)` 由 `FlowModelContext` 提供，用于以`对话框/抽屉/内嵌`方式打开一个视图。
- 本功能基于内置 `openView` 动作，默认创建并渲染 `ChildPageModel`，支持参数透传与上下文扩展。
:::

## 用法

### `ctx.openView(uid, options)`

- `uid`：标识本次打开的视图的 flowModel。
  - 若 uid 对应的 flowModel 实例不存在，则会添加一个 subModel 到 ctx.model 。
  - 若打开内部的弹窗，注意保持 uid 稳定，建议使用类似 `${ctx.model.uid}-1` 的 uid 。
- `options` 关键字段：
  - `mode`: `dialog` | `drawer` | `embed`，默认 `drawer`
  - `size`: `small` | `medium` | `large`，默认 `medium`
  - `pageModelClass`: 视图的根节点模型类名（默认 `ChildPageModel`）
  - `dataSourceKey` / `collectionName` / `associationName` / `filterByTk` / `sourceId`：视图需要的数据相关上下文。
  - `defineProperties`：向视图中的模型动态注入上下文属性。
  - `defineMethods`：向视图中的模型动态注入上下文方法。

可通过 `ctx.view` 访问当前视图实例，通过 `ctx.view.inputArgs` 读取传入参数。

## 示例

点击按钮打开一个抽屉，并向抽屉页面的模型上下文注入自定义属性与方法。

<code src="./index.tsx"></code>
