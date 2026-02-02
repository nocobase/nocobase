# ctx.exitAll()

终止当前流程及其所有嵌套子流程。常用于因全局错误或权限校验需要立即中止当前事件下的所有流程。

可在 FlowEngine 上下文中运行的脚本里调用，如 JSField、JSItem、Action。

## 类型定义（简化）

```ts
exitAll(): never;
```

调用 `ctx.exitAll()` 会抛出内部的 `FlowExitAllException`，由流程引擎捕获并停止当前流程实例及其触发的所有子流程（如子工作流、弹窗内流程）。一旦调用，当前 JS 代码中剩余的语句不会执行。

相关方法：

- `ctx.exit()`：仅终止当前流程实例
- `ctx.exitAll()`：终止当前事件下**所有**相关流程（当前流程及由该事件触发的其他流程）

> 提示：
> - 适用于前置校验、权限校验或条件不满足时需要阻止任何后续步骤的场景
> - 常先通过 `ctx.message`、`ctx.notification` 或弹窗说明原因，再调用 `ctx.exitAll()` 中止当前事件下所有流程
> - 若只需停止当前子流程而不影响其他流程，使用 `ctx.exit()`
> - 业务代码中通常无需捕获 `FlowExitAllException`，交给流程引擎处理更安全
