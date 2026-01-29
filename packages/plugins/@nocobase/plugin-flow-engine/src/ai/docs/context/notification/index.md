# ctx.notification

基于 Ant Design Notification 的全局通知 API，可在 JSBlock / Action 等场景中展示右上角通知。

## 常见用法

```ts
ctx.notification.open?.({
  message: '操作成功',
  description: '数据已保存到服务器。',
});
```

> 提示：
> - 完整参数与 Ant Design `notification` API 保持一致
> - 与 `ctx.message` 相比，适合展示更长时间存在的消息
