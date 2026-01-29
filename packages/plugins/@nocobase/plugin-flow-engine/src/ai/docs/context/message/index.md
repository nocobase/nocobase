# ctx.message

Ant Design 全局消息 API，用于显示临时提示消息。

## 类型定义

```typescript
message: MessageInstance
```

`MessageInstance` 是 Ant Design 的消息实例接口，提供以下方法：

- `success(content: string | ConfigOptions, duration?: number): MessageType`
- `error(content: string | ConfigOptions, duration?: number): MessageType`
- `warning(content: string | ConfigOptions, duration?: number): MessageType`
- `info(content: string | ConfigOptions, duration?: number): MessageType`
- `loading(content: string | ConfigOptions, duration?: number): MessageType`

## 说明

`ctx.message` 是 Ant Design 的全局消息 API，用于在页面顶部显示临时提示消息。消息会在指定时间后自动消失，或用户点击后关闭。

**与 `ctx.notification` 的区别**：
- `ctx.message`：临时提示，显示在页面顶部中央，自动消失
- `ctx.notification`：通知框，显示在页面右上角，需要手动关闭或自动消失

## 方法说明

### success(content, duration?)

显示成功消息。

**参数**：
- `content` (string | ConfigOptions): 消息内容或配置对象
- `duration` (number, 可选): 自动关闭的延迟时间（秒），默认 3 秒

**返回值**：`MessageType` - 可用于手动关闭消息

### error(content, duration?)

显示错误消息。

**参数**：
- `content` (string | ConfigOptions): 消息内容或配置对象
- `duration` (number, 可选): 自动关闭的延迟时间（秒），默认 3 秒

**返回值**：`MessageType` - 可用于手动关闭消息

### warning(content, duration?)

显示警告消息。

**参数**：
- `content` (string | ConfigOptions): 消息内容或配置对象
- `duration` (number, 可选): 自动关闭的延迟时间（秒），默认 3 秒

**返回值**：`MessageType` - 可用于手动关闭消息

### info(content, duration?)

显示信息消息。

**参数**：
- `content` (string | ConfigOptions): 消息内容或配置对象
- `duration` (number, 可选): 自动关闭的延迟时间（秒），默认 3 秒

**返回值**：`MessageType` - 可用于手动关闭消息

### loading(content, duration?)

显示加载消息。

**参数**：
- `content` (string | ConfigOptions): 消息内容或配置对象
- `duration` (number, 可选): 自动关闭的延迟时间（秒），默认 3 秒

**返回值**：`MessageType` - 可用于手动关闭消息

## ConfigOptions 配置对象

当 `content` 为对象时，支持以下配置：

```typescript
interface ConfigOptions {
  content: React.ReactNode;  // 消息内容
  duration?: number;          // 自动关闭的延迟时间（秒）
  onClose?: () => void;       // 关闭时的回调函数
  icon?: React.ReactNode;     // 自定义图标
}
```

## 使用示例

- [显示成功消息](./message-success.md)
- [显示错误消息](./message-error.md)
- [显示警告消息](./message-warning.md)
- [显示信息消息](./message-info.md)
- [显示加载消息](./message-loading.md)
- [在事件处理中使用](./message-in-handler.md)
- [自定义持续时间](./message-duration.md)
