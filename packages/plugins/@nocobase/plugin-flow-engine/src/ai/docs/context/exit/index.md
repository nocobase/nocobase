# ctx.exit()

终止当前这条流的执行，后续步骤不再运行。常用于业务条件不满足、用户取消操作或遇到不可恢复错误时，中断当前流。

可以在 JSField、JSItem、Action 等运行在 FlowEngine 上下文中的脚本里调用。

## 类型定义（简化）

```ts
exit(): never;
```

调用 `ctx.exit()` 会抛出内部的 `FlowExitException`，由 Flow 引擎捕获并终止当前流的执行。  
一旦调用，当前 JS 代码中后续语句也不会再继续执行。

与之对应的还有：

- `ctx.exit()`：终止当前这条流
- `ctx.exitAll()`：终止当前事件中的所有相关流（当前流及当前事件触发的其它流）

## 使用示例

- [终止当前流](./exit-basic.md)

> 提示：
> - 适合在前置校验、权限检查、用户取消等场景下使用，立即中断当前流，避免执行后续步骤
> - 可先通过 `ctx.message`、`ctx.notification` 或弹窗提示用户原因，再调用 `ctx.exit()` 终止当前流
> - 若希望当前事件中所有相关流都不再继续，请使用 `ctx.exitAll()`
