# ctx.getModel()

获取 FlowEngine 中的任意模型实例（BlockModel / ActionModel / PageModel 等），通常通过模型的 `uid` 进行查找。

等价于在当前引擎上调用 `ctx.engine.getModel(uid)`，便于在 JS 代码中访问其它模型实例。

## 类型定义（简化）

```ts
getModel(uid: string, searchInPreviousEngines?: boolean): FlowModel | undefined;
```

- `uid`：目标模型实例的唯一标识（通常由系统生成，可在配置或上下文中获取）
- `searchInPreviousEngines`：可选，默认为 `false`。在视图/块作用域引擎中，传 `true` 时会向上游引擎查找（复用已加载的模型树）

## 使用示例

- [根据 UID 获取模型实例](./get-model-basic.md)
- [在视图/弹窗中查找父模型](./get-model-search-previous.md)

> 提示：
> - `ctx.getModel` 适合在 JS Action/JS Field 中获取到其他模型实例做高级控制
> - 若只需访问当前 model、当前区块，请优先使用 `ctx.model` 或 `ctx.blockModel` 而不是 `ctx.getModel`
