# ctx.getModel()

获取 FlowEngine 中任意模型实例（BlockModel / ActionModel / PageModel 等），通常通过模型的 `uid` 获取。

等价于在当前引擎上调用 `ctx.engine.getModel(uid)`，便于在 JS 中访问其他模型实例。

## 类型定义（简化）

```ts
getModel(uid: string, searchInPreviousEngines?: boolean): FlowModel | undefined;
```

- `uid`：目标模型实例的唯一标识（一般由系统生成，可在配置或上下文中获取）
- `searchInPreviousEngines`：可选，默认 `false`。在视图/区块作用域引擎中设为 `true` 时，会在上游引擎中查找（复用已加载的模型树）

> 提示：
> - 在 JS Action / JS 字段中可用 `ctx.getModel` 获取其他模型实例做进阶控制
> - 若只需当前模型或当前区块，优先使用 `ctx.model` 或 `ctx.blockModel`，不必用 `ctx.getModel`
