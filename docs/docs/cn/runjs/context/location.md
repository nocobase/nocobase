# ctx.location

当前路由位置信息，与 React Router 的 `location` 对象等价。通常与 `ctx.router` 配合使用。

## 常用字段

- `pathname: string`：当前路径
- `search: string`：查询字符串（如 `?page=1`）
- `hash: string`：hash 片段
- `state: any`：通过 `ctx.router.navigate(path, { state })` 传递的 state

> 提示：
> - 可用 `URLSearchParams` 解析 `search` 中的查询参数
> - 若只需查询参数，也可使用 `ctx.urlSearchParams`
