# ctx.modal

基于 Ant Design Modal 的快捷 API，用于在 JSBlock / Action / JSField 中主动打开模态对话框。

> 底层由 `ctx.viewer` / 视图系统实现，这里只给出常用能力的简化说明。

## 常见用法

```ts
// 弹出一个简单的提示对话框
ctx.modal.info?.({
  title: '提示',
  content: '操作已完成',
});

// 确认对话框，结合 ctx.exit/ctx.exitAll 控制流
ctx.modal.confirm?.({
  title: '确认删除',
  content: '确定要删除这条记录吗？',
  async onOk() {
    await ctx.runAction('destroy', { filterByTk: ctx.record?.id });
  },
});
```

> 提示：
> - 具体可用方法与参数与 Ant Design `Modal` 组件保持一致（如 `info`、`success`、`error`、`warning`、`confirm` 等）
> - 在复杂交互中，更推荐通过 `ctx.openView` 打开自定义视图（页面/抽屉/弹窗），`ctx.modal` 适合轻量提示
