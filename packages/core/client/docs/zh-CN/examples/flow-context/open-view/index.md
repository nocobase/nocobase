# ctx.openView

:::info
- `ctx.openView(uid, options)` 由 `FlowModelContext` 提供，用于以标准视图（对话框/抽屉/内嵌）方式打开一个子页面。
- 本功能基于内置 `openView` 动作，默认创建并渲染 `ChildPageModel`，支持参数透传与上下文扩展。
:::

## 用法

### `ctx.openView(uid, options)`

- `uid`：标识本次打开的子页面的 flowModel。
  - 若 uid 对应的 flowModel 实例不存在，则会添加一个 subModel 到 ctx.model 。
- `options` 关键字段：
  - `mode`: `dialog` | `drawer` | `embed`，默认 `drawer`
  - `size`: `small` | `medium` | `large`，默认 `medium`
  - `pageModelClass`: 自定义子页面模型类名（默认 `ChildPageModel`）
  - `dataSourceKey` / `collectionName` / `associationName` / `filterByTk` / `sourceId`：当子页面需要数据相关上下文。
  - `defineProperties`：向子页面上下文 `ctx` 动态注入属性。
  - `defineMethods`：向子页面上下文 `ctx` 动态注入方法。

子页面中可通过 `ctx.view` 访问当前视图实例，通过 `ctx.view.inputArgs` 读取传入参数。

## 示例

点击按钮打开一个子页面（对话框/抽屉），并向子页面注入自定义属性与方法。

<code src="./index.tsx"></code>
