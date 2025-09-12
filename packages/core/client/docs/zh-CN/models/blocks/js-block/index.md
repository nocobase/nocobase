# JSBlockModel

## 示例

### 支持筛选的自定义区块

自定义区块

```ts
// 使用 Resource，支持 MultiRecordResource、SingleRecordResource、SQLResource
ctx.useResource('MultiRecordResource');
ctx.resource.setResourceName('users');

await ctx.resource.refresh();

ctx.model.getFilterFields = async () => {
  return ctx.dataSourceManager.getCollection('main', 'users').getFields();
}

ctx.element.innerHTML = `<pre>${JSON.stringify(ctx.resource.getData(), null, 2)}</pre>`;
```

JS 按钮

```ts
ctx.form.submit();
const model = ctx.engine.getModel('11df49d3343');
model.rerender();
```
