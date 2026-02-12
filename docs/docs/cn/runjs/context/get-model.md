# ctx.getModel()

根据模型 `uid` 获取当前引擎中的任意模型实例（如 BlockModel、PageModel、ActionModel 等），用于在 RunJS 中访问其他区块、页面或动作模型。

若只需当前执行上下文所在的模型或区块，优先使用 `ctx.model` 或 `ctx.blockModel`，不必用 `ctx.getModel`。

## 类型定义

```typescript
getModel<T extends FlowModel = FlowModel>(
  uid: string,
  searchInPreviousEngines?: boolean
): T | undefined
```

## 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `uid` | string | 目标模型实例的唯一标识，由配置或创建时指定 |
| `searchInPreviousEngines` | boolean | 可选，默认 `false`。为 `true` 时在「视图栈」中从栈顶向根查找（适用于弹窗、多级视图等场景，可拿到上层引擎中的模型） |

## 返回值

- 找到则返回对应的 `FlowModel` 子类实例（如 `BlockModel`、`PageModel`）。
- 未找到返回 `undefined`。

## 说明

- 默认只在**当前引擎**内按 `uid` 查找；传入 `searchInPreviousEngines: true` 时会在当前引擎及其上游引擎（previousEngine 链）中查找，从栈顶引擎开始，命中即返回。
- 适用于需要跨区块、跨页面或跨弹窗访问其他模型时（例如在 JS 区块中根据已知 `uid` 取另一个区块的模型并读写其 `resource`、`form` 等）。

## 示例

```javascript
// 仅在当前引擎查找
const block = ctx.getModel('block-uid-xxx');
if (block) {
  console.log(block.uid, block.resource?.getData?.());
}

// 在视图栈中查找（如弹窗内要拿打开它的页面的某个模型）
const pageBlock = ctx.getModel('page-block-uid', true);
if (pageBlock) {
  pageBlock.rerender?.();
}
```

## 提示

- 在 JS Action / JS 字段中可用 `ctx.getModel` 获取其他模型做进阶控制。
- 若只需当前模型或当前区块，优先使用 `ctx.model` 或 `ctx.blockModel`。
