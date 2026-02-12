# ctx.modal

基于 Ant Design Modal 的快捷 API，用于在 JSBlock / Action / JSField 中主动打开模态框。

> 由 `ctx.viewer` / 视图系统实现。此处仅以简化形式列出常用能力。

## 常用用法

```ts
// 简单信息弹窗
ctx.modal.info?.({
  title: '提示',
  content: '操作已完成',
});

// 确认弹窗，可与 ctx.exit/ctx.exitAll 配合控制流程
ctx.modal.confirm?.({
  title: '确认删除',
  content: '确定要删除这条记录吗？',
  async onOk() {
    await ctx.runAction('destroy', { filterByTk: ctx.record?.id });
  },
});
```

> 提示：
> - 可用方法及参数与 Ant Design `Modal` 一致（如 `info`、`success`、`error`、`warning`、`confirm`）
> - 复杂交互建议用 `ctx.openView` 打开自定义视图（页面/抽屉/弹窗）。`ctx.modal` 更适合轻量提示
