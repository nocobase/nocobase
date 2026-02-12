# ctx.getVar()

从当前运行时上下文中读取变量值。变量来源与 SQL、模板中的变量解析一致，通常来自当前用户、当前记录、视图参数等。

## 类型定义（简化）

```ts
getVar<T = any>(path: string, defaultValue?: T): T | undefined;
```

- `path`：变量路径，支持点访问（如 `user.id`）或完整表达式（如 `ctx.user.id`）；在 FlowEngine 内会映射到对应上下文对象
- `defaultValue`：可选，变量不存在或为 `undefined` 时的默认值

> 说明：
> - `ctx.getVar()` 与 SQL、模板变量中 `{{ctx.xxx}}` 使用相同的上下文解析规则
> - 常见变量包括 `ctx.user.*`、`ctx.record.*`、流程输入参数、视图/弹窗参数等
