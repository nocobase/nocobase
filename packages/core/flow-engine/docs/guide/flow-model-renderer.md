# 渲染 FlowModel

使用 FlowModelRenderer 渲染 model

```tsx | pure
<FlowModelRenderer model={model} />
```

整个渲染周期会调用以下方法：

1. model.dispatchEvent('beforeRender')
2. model.render()
3. model.onMount
4. model.onUnmount


受控的字段 Model，使用 FieldModelRenderer 渲染

```tsx | pure
<FieldModelRenderer model={model} />
```
