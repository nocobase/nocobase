# ctx.notification

基于 Ant Design Notification 的全局通知 API。在 JSBlock / Action 中用于在右上角显示通知。

## 常用用法

```ts
ctx.notification.open?.({
  message: '操作成功',
  description: '数据已保存到服务器。',
});
```

> 提示：
> - 完整参数与 Ant Design `notification` API 一致
> - 相比 `ctx.message`，更适合需要较长时间展示的消息
