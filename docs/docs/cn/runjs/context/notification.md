# ctx.notification

基于 Ant Design Notification 的全局通知 API，用于在页面**右上角**显示通知面板。与 `ctx.message` 相比，通知可带标题与描述，适合较长时间展示、需用户留意的内容。

## 适用场景

| 场景 | 说明 |
|------|------|
| **JSBlock / 操作事件** | 任务完成通知、批量操作结果、导出完成等 |
| **事件流** | 异步流程结束后的系统级提醒 |
| **需较长展示的内容** | 带标题、描述、操作按钮的完整通知 |

## 类型定义

```ts
notification: NotificationInstance;
```

`NotificationInstance` 为 Ant Design notification 接口，提供以下方法。

## 常用方法

| 方法 | 说明 |
|------|------|
| `open(config)` | 使用自定义配置打开通知 |
| `success(config)` | 显示成功类型通知 |
| `info(config)` | 显示信息类型通知 |
| `warning(config)` | 显示警告类型通知 |
| `error(config)` | 显示错误类型通知 |
| `destroy(key?)` | 关闭指定 key 的通知，不传 key 则关闭所有 |

**配置参数**（与 [Ant Design notification](https://ant.design/components/notification-cn) 一致）：

| 参数 | 类型 | 说明 |
|------|------|------|
| `message` | `ReactNode` | 通知标题 |
| `description` | `ReactNode` | 通知描述 |
| `duration` | `number` | 自动关闭延迟（秒），默认 4.5 秒；设为 0 表示不自动关闭 |
| `key` | `string` | 通知唯一标识，用于 `destroy(key)` 关闭指定通知 |
| `onClose` | `() => void` | 关闭回调 |
| `placement` | `string` | 位置：`topLeft` \| `topRight` \| `bottomLeft` \| `bottomRight` |

## 示例

### 基础用法

```ts
ctx.notification.open({
  message: '操作成功',
  description: '数据已保存到服务器。',
});
```

### 按类型快捷调用

```ts
ctx.notification.success({
  message: ctx.t('Export completed'),
  description: ctx.t('Exported {{count}} records', { count: 10 }),
});

ctx.notification.error({
  message: ctx.t('Export failed'),
  description: ctx.t('Please check the console for details'),
});

ctx.notification.warning({
  message: ctx.t('Warning'),
  description: ctx.t('Some data may be incomplete'),
});
```

### 自定义持续时间与 key

```ts
ctx.notification.open({
  key: 'task-123',
  message: ctx.t('Task in progress'),
  description: ctx.t('Please wait...'),
  duration: 0,  // 不自动关闭
});

// 任务完成后手动关闭
ctx.notification.destroy('task-123');
```

### 关闭所有通知

```ts
ctx.notification.destroy();
```

## 与 ctx.message 的区别

| 特性 | ctx.message | ctx.notification |
|------|--------------|------------------|
| **位置** | 页面顶部中央 | 右上角（可配置） |
| **结构** | 单行轻提示 | 可带标题 + 描述 |
| **用途** | 临时反馈，自动消失 | 较完整通知，可长时间展示 |
| **典型场景** | 操作成功、校验失败、复制成功 | 任务完成、系统消息、需用户注意的较长内容 |

## 相关

- [ctx.message](./message.md) - 顶部轻提示，适合快速反馈
- [ctx.modal](./modal.md) - 弹窗确认，阻塞式交互
- [ctx.t()](./t.md) - 国际化，常与 notification 配合使用
