# ctx.exit()

终止当前事件流的执行，后续步骤不会运行。常用于业务条件不满足、用户取消或发生不可恢复错误时。

## 适用场景

`ctx.exit()` 一般用于以下可执行 JS 的上下文中：

| 场景 | 说明 |
|------|------|
| **事件流** | 表单提交、按钮点击等触发的事件流中，条件不满足时中止后续步骤 |
| **联动规则** | 字段联动、筛选联动等，校验失败或需跳过执行时终止当前事件流 |
| **操作事件** | 自定义操作（如删除确认、保存前置校验）中，用户取消或校验不通过时退出 |

> 与 `ctx.exitAll()` 的区别：`ctx.exit()` 仅终止当前事件流，同事件下的其他事件流不受影响；`ctx.exitAll()` 会终止当前事件流及同事件下尚未执行的后续事件流。

## 类型定义

```ts
exit(): never;
```

调用 `ctx.exit()` 会抛出内部的 `FlowExitException`，由事件流引擎捕获并停止当前事件流执行。一旦调用，当前 JS 代码中剩余的语句不会执行。

## 与 ctx.exitAll() 的对比

| 方法 | 作用范围 |
|------|----------|
| `ctx.exit()` | 仅终止当前事件流，后续事件流不受影响 |
| `ctx.exitAll()` | 终止当前事件流，且中止同事件下**顺序执行**的后续事件流 |

## 示例

### 用户取消时退出

```ts
// 确认弹窗中，用户点击取消则终止事件流
if (!confirmed) {
  ctx.message.info('已取消操作');
  ctx.exit();
}
```

### 参数校验失败时退出

```ts
// 校验不通过时提示并终止
if (!params.value || params.value.length < 3) {
  ctx.message.error('参数无效，长度至少为 3');
  ctx.exit();
}
```

### 业务条件不满足时退出

```ts
// 条件不满足时终止，后续步骤不会执行
const record = ctx.model?.getValue?.();
if (!record || record.status !== 'draft') {
  ctx.notification.warning({ message: '仅草稿状态可提交' });
  ctx.exit();
}
```

### 与 ctx.exitAll() 的选用

```ts
// 仅当前事件流需退出 → 使用 ctx.exit()
if (!params.valid) {
  ctx.message.error('参数无效');
  ctx.exit();  // 其他事件流不受影响
}

// 需终止当前事件下的全部后续事件流 → 使用 ctx.exitAll()
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: '权限不足' });
  ctx.exitAll();  // 主事件流及同事件下后续事件流一并终止
}
```

### 弹窗确认后根据用户选择退出

```ts
const ok = await ctx.modal?.confirm?.({
  title: '确认删除',
  content: '删除后不可恢复，是否继续？',
});
if (!ok) {
  ctx.message.info('已取消');
  ctx.exit();
}
```

## 注意事项

- 调用 `ctx.exit()` 后，当前 JS 中后续代码不会执行；建议在调用前通过 `ctx.message`、`ctx.notification` 或弹窗向用户说明原因
- 业务代码中通常无需捕获 `FlowExitException`，交给事件流引擎处理即可
- 若需终止当前事件下的所有后续事件流，使用 `ctx.exitAll()`

## 相关

- [ctx.exitAll()](./exit-all.md)：终止当前事件流及同事件下后续事件流
- [ctx.message](./message.md)：提示消息
- [ctx.modal](./modal.md)：确认弹窗
