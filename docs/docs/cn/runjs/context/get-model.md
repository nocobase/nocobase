# ctx.getModel()

根据模型 `uid` 获取当前引擎或视图栈中的模型实例（如 BlockModel、PageModel、ActionModel 等），用于在 RunJS 中跨区块、跨页面或跨弹窗访问其他模型。

若只需当前执行上下文所在的模型或区块，优先使用 `ctx.model` 或 `ctx.blockModel`，不必用 `ctx.getModel`。

## 适用场景

| 场景 | 说明 |
|------|------|
| **JSBlock / JSAction** | 根据已知 `uid` 获取其他区块的模型，读写其 `resource`、`form`、`setProps` 等 |
| **弹窗内 RunJS** | 在弹窗内需访问打开它的页面上的某个模型时，传入 `searchInPreviousEngines: true` |
| **自定义操作** | 跨视图栈按 `uid` 定位设置面板中的表单或子模型，读取其配置或状态 |

## 类型定义

```ts
getModel<T extends FlowModel = FlowModel>(
  uid: string,
  searchInPreviousEngines?: boolean
): T | undefined
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `uid` | `string` | 目标模型实例的唯一标识，由配置或创建时指定（如 `ctx.model.uid`） |
| `searchInPreviousEngines` | `boolean` | 可选，默认 `false`。为 `true` 时在「视图栈」中从当前引擎向根查找，可拿到上层引擎（如打开弹窗的页面）中的模型 |

## 返回值

- 找到则返回对应的 `FlowModel` 子类实例（如 `BlockModel`、`FormBlockModel`、`ActionModel`）。
- 未找到返回 `undefined`。

## 查找范围

- **默认（`searchInPreviousEngines: false`）**：仅在**当前引擎**内按 `uid` 查找。在弹窗、多级视图中，每个视图有独立引擎，默认只查当前视图内的模型。
- **`searchInPreviousEngines: true`**：从当前引擎开始，沿 `previousEngine` 链向上查找，命中即返回。适用于弹窗内要访问打开它的页面的某个模型。

## 示例

### 获取其他区块并刷新

```ts
const block = ctx.getModel('list-block-uid');
if (block?.resource) {
  await block.resource.refresh();
}
```

### 弹窗内访问页面上的模型

```ts
// 弹窗内需访问打开它的页面上的区块
const pageBlock = ctx.getModel('page-block-uid', true);
if (pageBlock) {
  pageBlock.rerender?.();
}
```

### 跨模型读写并触发 rerender

```ts
const target = ctx.getModel('other-block-uid');
if (target) {
  target.setProps({ loading: true });
  target.rerender?.();
}
```

### 安全判断

```ts
const model = ctx.getModel(someUid);
if (!model) {
  ctx.message.warning('目标模型不存在');
  return;
}
```

## 相关

- [ctx.model](./model.md)：当前执行上下文所在的模型
- [ctx.blockModel](./block-model.md)：当前 JS 所在的父区块模型，通常无需 `getModel` 即可访问
