# ctx.message

Ant Design 全局 message API，用于显示临时轻提示。

## 类型定义

```typescript
message: MessageInstance
```

`MessageInstance` 为 Ant Design message 接口，提供以下方法：

- `success(content: string | ConfigOptions, duration?: number): MessageType`
- `error(content: string | ConfigOptions, duration?: number): MessageType`
- `warning(content: string | ConfigOptions, duration?: number): MessageType`
- `info(content: string | ConfigOptions, duration?: number): MessageType`
- `loading(content: string | ConfigOptions, duration?: number): MessageType`

## 说明

`ctx.message` 是 Ant Design 全局 message API，用于在页面顶部中央显示临时轻提示。消息会在一定时间后自动关闭，也可由用户关闭。

**与 `ctx.notification` 的区别：**

- `ctx.message`：顶部中央的临时轻提示，自动消失
- `ctx.notification`：右上角通知面板，可手动关闭或自动消失

## 方法说明

### success(content, duration?)

显示成功提示。

**参数：**

- `content`（string | ConfigOptions）：消息内容或配置对象
- `duration`（number，可选）：自动关闭延迟（秒），默认 3 秒

**返回值**：`MessageType`，可用于手动关闭该条消息

### error(content, duration?)

显示错误提示。

**参数**：同上。

### warning(content, duration?)

显示警告提示。

**参数**：同上。

### info(content, duration?)

显示信息提示。

**参数**：同上。

### loading(content, duration?)

显示加载提示。

**参数**：同上。

## ConfigOptions

当 `content` 为对象时，支持以下配置：

```typescript
interface ConfigOptions {
  content: React.ReactNode;  // 消息内容
  duration?: number;        // 自动关闭延迟（秒）
  onClose?: () => void;     // 关闭回调
  icon?: React.ReactNode;   // 自定义图标
}
```
