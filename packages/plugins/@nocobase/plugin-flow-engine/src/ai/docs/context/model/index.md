# ctx.model

当前 `FlowModel` 实例。  

## 类型定义（简化）

```ts
model: FlowModel;
```

> 实际上 `FlowModel` 下面会有不同的子类（如 `BlockModel`、`ActionModel`、`PageModel` 等），其可用属性和方法会因类型而异，这里不展开完整类型定义。

常见成员（不同模型上可能部分不存在，仅作参考）：

- `uid: string`：模型唯一标识，可用于 `ctx.getModel(uid)` 或作为过滤/弹窗 UID 绑定
- `collection?: Collection`：当前模型绑定的数据表（如果有）
- `resource?: Resource`：当前模型关联的资源实例（如表格、详情等）
- `subModels?: Record<string, FlowModel>`：子模型集合，例如表格内部的列模型、表单内部的字段模型等
- `setProps(partialProps: any): void`：更新当前模型的 UI/行为配置
- `dispatchEvent(event: { type: string; payload?: any }): void`：向模型分发事件，触发内部逻辑

## 使用示例

- [读取和更新模型属性](./model-basic.md)

> 提示：
> - `ctx.model` 始终指向“当前这条流/当前块”的模型实例，是编写 JSBlock/JSField/Action 的默认入口
> - 若需要跨模型访问其他块/动作，可使用 `ctx.getModel(uid)` 获取目标模型实例
> - 若只关心区块级别（如表格/表单块）的信息，可以搭配 `ctx.blockModel` 一起使用

