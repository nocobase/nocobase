# ctx.location

当前路由位置信息，等价于 React Router 中的 `location` 对象。通常与 `ctx.router` 一起使用。

## 常见字段

- `pathname: string`：当前路径
- `search: string`：查询字符串（如 `?page=1`）
- `hash: string`：哈希部分
- `state: any`：通过 `ctx.router.navigate(path, { state })` 传递的状态对象

> 提示：
> - 可配合 `URLSearchParams` 解析 `search` 中的查询参数
> - 若仅需读取查询参数，也可以使用 `ctx.urlSearchParams`
