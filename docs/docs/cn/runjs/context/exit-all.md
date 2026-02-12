# ctx.exitAll()

终止当前事件流及其在同一次事件调度中触发的所有后续事件流。常用于因全局错误或权限校验需要立即中止当前事件下的所有事件流。

## 适用场景

`ctx.exitAll()` 一般用于以下可执行 JS 的上下文中，且需**同时中止当前事件流及由该事件触发的后续事件流**时：

| 场景 | 说明 |
|------|------|
| **事件流** | 主事件流校验失败（如权限不足），需中止主事件流及同事件下尚未执行的后续事件流 |
| **联动规则** | 联动校验不通过时，需终止当前联动及同事件触发的后续联动 |
| **操作事件** | 操作前置校验失败（如删除前权限检查），需阻止主操作及后续步骤 |

> 与 `ctx.exit()` 的区别：`ctx.exit()` 仅终止当前事件流；`ctx.exitAll()` 会终止当前事件调度中**尚未执行**的后续事件流。

## 类型定义

```ts
exitAll(): never;
```

调用 `ctx.exitAll()` 会抛出内部的 `FlowExitAllException`，由事件流引擎捕获并停止当前事件流实例及同事件下的后续事件流。一旦调用，当前 JS 代码中剩余的语句不会执行。

## 与 ctx.exit() 的对比

| 方法 | 作用范围 |
|------|----------|
| `ctx.exit()` | 仅终止当前事件流，后续事件流不受影响 |
| `ctx.exitAll()` | 终止当前事件流，且中止同事件下**顺序执行**的后续事件流 |

## 执行模式说明

- **顺序执行（sequential）**：同事件下事件流按顺序执行；任一事件流调用 `ctx.exitAll()` 后，后续事件流将不再执行
- **并行执行（parallel）**：同事件下事件流并行执行；某个事件流调用 `ctx.exitAll()` 不会中断其他已并发的事件流（各自独立）

## 示例

### 权限校验失败时终止所有事件流

```ts
// 权限不足时，中止主事件流及后续事件流
if (!hasPermission(ctx)) {
  ctx.notification.error({ message: '无操作权限' });
  ctx.exitAll();
}
```

### 全局前置校验不通过时终止

```ts
// 如：删除前发现关联数据不可删，需阻止主事件流及后续操作
const canDelete = await checkDeletable(ctx.model?.getValue?.());
if (!canDelete) {
  ctx.message.error('存在关联数据，无法删除');
  ctx.exitAll();
}
```

### 与 ctx.exit() 的选用

```ts
// 仅当前事件流需退出 → 使用 ctx.exit()
if (!params.valid) {
  ctx.message.error('参数无效');
  ctx.exit();  // 后续事件流不受影响
}

// 需终止当前事件下的全部后续事件流 → 使用 ctx.exitAll()
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: '权限不足' });
  ctx.exitAll();  // 主事件流及同事件下后续事件流一并终止
}
```

### 先提示再终止

```ts
if (!isValidInput(ctx.form?.getValues?.())) {
  ctx.message.warning('请先修正表单中的错误');
  ctx.exitAll();
}
```

## 注意事项

- 调用 `ctx.exitAll()` 后，当前 JS 中后续代码不会执行；建议在调用前通过 `ctx.message`、`ctx.notification` 或弹窗向用户说明原因
- 业务代码中通常无需捕获 `FlowExitAllException`，交给事件流引擎处理即可
- 若只需停止当前事件流而不影响后续事件流，使用 `ctx.exit()`
- 并行模式下，`ctx.exitAll()` 仅终止当前事件流，不会打断其他已并发的事件流

## 相关

- [ctx.exit()](./exit.md)：仅终止当前事件流
- [ctx.message](./message.md)：提示消息
- [ctx.modal](./modal.md)：确认弹窗
