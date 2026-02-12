# ctx.exit()

终止当前流程的执行，后续步骤不会运行。常用于业务条件不满足、用户取消或发生不可恢复错误时。

可在 FlowEngine 上下文中运行的脚本里调用，如 JSField、JSItem、Action。

## 类型定义（简化）

```ts
exit(): never;
```

调用 `ctx.exit()` 会抛出内部的 `FlowExitException`，由流程引擎捕获并停止当前流程执行。一旦调用，当前 JS 代码中剩余的语句不会执行。

相关方法：

- `ctx.exit()`：终止当前流程
- `ctx.exitAll()`：终止当前事件相关的所有流程（当前流程及由该事件触发的其他流程）

> 提示：
> - 适用于前置校验、权限校验或用户取消等需要立即中止流程的场景
> - 可在调用 `ctx.exit()` 前用 `ctx.message`、`ctx.notification` 或弹窗说明原因
> - 若要停止当前事件下的所有流程，使用 `ctx.exitAll()`
