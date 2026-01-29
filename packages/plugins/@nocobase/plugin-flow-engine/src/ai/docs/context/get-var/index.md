# ctx.getVar()

从当前运行时上下文中读取变量值。变量来源与 SQL、模板等场景中的变量解析一致，通常来自当前用户、当前记录、视图参数等。

## 类型定义（简化）

```ts
getVar<T = any>(path: string, defaultValue?: T): T | undefined;
```

- `path`：变量路径，支持点号访问（如 `user.id`）或完整表达式（如 `ctx.user.id`），在 FlowEngine 内部会映射到对应的上下文对象
- `defaultValue`：可选，变量不存在或为 `undefined` 时返回的默认值

> 说明：
> - `ctx.getVar()` 与 SQL 中的 `{{ctx.xxx}}`、模板中的变量解析使用同一套上下文解析规则
> - 常见可用变量包括：`ctx.user.*`、`ctx.record.*`、流输入参数、视图/弹窗参数等

## 使用示例

- [读取变量](./get-var-basic.md)
