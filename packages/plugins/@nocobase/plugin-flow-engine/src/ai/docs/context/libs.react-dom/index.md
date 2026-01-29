# ctx.libs.ReactDOM

内置的 ReactDOM 客户端 API，与 `ctx.ReactDOM` 等价。通常不需要直接使用，更多通过 `ctx.render` 进行渲染；在少数场景下也可以手动创建根节点。

## 类型定义（简化）

```ts
libs.ReactDOM: typeof import('react-dom/client');
```

## 使用示例

```ts
// 推荐：直接使用 ctx.render 渲染 JSX
ctx.render(<div>Hello from ReactDOM</div>);
```

> 提示：
> - 一般情况下使用 `ctx.render(jsx)` 即可完成渲染，无需直接操作 `ReactDOM`
> - 只有在需要更精细控制根节点/多根渲染时，才建议使用 `ctx.libs.ReactDOM`，此类场景可参考高级用法文档
