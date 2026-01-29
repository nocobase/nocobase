# ctx.exitAll()

终止当前流及其所有嵌套子流的执行，常用于全局异常或权限校验失败时立即中断当前事件里的所有流。  
可以在 JSField、JSItem、Action 等运行在 FlowEngine 上下文中的脚本里调用。

## 类型定义（简化）

```ts
exitAll(): never;
```

调用 `ctx.exitAll()` 会抛出内部的 `FlowExitAllException`，由 Flow 引擎捕获并停止当前流实例以及所有由其触发的子流（如子工作流、弹窗中的子流等）。  
一旦调用，当前 JS 代码中后续语句也不会再继续执行。

与之对应的还有：

- `ctx.exit()`：终止当前「流实例」，相当于退出当前这条流
- `ctx.exitAll()`：终止当前事件中的「所有」相关流（当前流及当前事件触发的其它流）

## 使用示例

- [终止整个流程](./exit-all-basic.md)

> 提示：
> - 适合在前置校验、权限检查、数据不满足条件等场景下使用，避免继续执行后续步骤
> - 一般可先通过 `ctx.message`、`ctx.notification` 或弹窗提示用户终止原因，再调用 `ctx.exitAll()` 中断当前事件里的所有流
> - 若只需终止当前子流而不影响其它流，请改用 `ctx.exit()`
> - 通常不需要、也不建议在业务代码中捕获 `FlowExitAllException`，交由 Flow 引擎统一处理更安全

