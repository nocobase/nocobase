# ctx.model

当前的 `FlowModel` 实例。

## 类型定义（简化）

```ts
model: FlowModel;
```

> 实际中 `FlowModel` 有不同子类（如 `BlockModel`、`ActionModel`、`PageModel` 等），可用属性和方法因类型而异，此处不列完整 API。

常见成员（部分模型可能不存在，仅供参考）：

- `uid: string`：模型唯一标识，可用于 `ctx.getModel(uid)` 或作为筛选/弹窗 UID 绑定
- `collection?: Collection`：当前模型绑定的集合（若有）
- `resource?: Resource`：当前模型关联的资源实例（如表格、详情）
- `subModels?: Record<string, FlowModel>`：子模型集合，如表格内的列模型、表单内的字段模型
- `setProps(partialProps: any): void`：更新模型的 UI/行为配置
- `dispatchEvent(event: { type: string; payload?: any }): void`：向模型派发事件以触发内部逻辑

> 提示：
> - `ctx.model` 始终指向当前流程/当前区块的模型实例，是 JSBlock/JSField/Action 的默认入口
> - 需要跨模型访问其他区块/操作时，用 `ctx.getModel(uid)` 获取目标模型实例
> - 若只关心区块级信息（如表格/表单区块），可配合使用 `ctx.blockModel`
