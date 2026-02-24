# ctx.message

Ant Design 全局 message API，用于在页面顶部中央显示临时轻提示。消息会在一定时间后自动关闭，也可由用户手动关闭。

## 适用场景

| 场景 | 说明 |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | 操作反馈、校验提示、复制成功等轻量提示 |
| **表单操作 / 事件流** | 提交成功、保存失败、校验不通过等反馈 |
| **操作事件 (JSAction)** | 点击、批量操作完成等即时反馈 |

## 类型定义

```ts
message: MessageInstance;
```

`MessageInstance` 为 Ant Design message 接口，提供以下方法。

## 常用方法

| 方法 | 说明 |
|------|------|
| `success(content, duration?)` | 显示成功提示 |
| `error(content, duration?)` | 显示错误提示 |
| `warning(content, duration?)` | 显示警告提示 |
| `info(content, duration?)` | 显示信息提示 |
| `loading(content, duration?)` | 显示加载提示（需手动关闭） |
| `open(config)` | 使用自定义配置打开消息 |
| `destroy()` | 关闭所有已展示的消息 |

**参数：**

- `content`（`string` \| `ConfigOptions`）：消息内容或配置对象
- `duration`（`number`，可选）：自动关闭延迟（秒），默认 3 秒；设为 0 表示不自动关闭

**ConfigOptions**（当 `content` 为对象时）：

```ts
interface ConfigOptions {
  content: React.ReactNode;  // 消息内容
  duration?: number;        // 自动关闭延迟（秒）
  onClose?: () => void;    // 关闭回调
  icon?: React.ReactNode;  // 自定义图标
}
```

## 示例

### 基础用法

```ts
ctx.message.success('操作成功');
ctx.message.error('操作失败');
ctx.message.warning('请先选择数据');
ctx.message.info('正在处理...');
```

### 与 ctx.t 配合国际化

```ts
ctx.message.success(ctx.t('Copied'));
ctx.message.warning(ctx.t('Please select at least one row'));
ctx.message.success(ctx.t('Exported {{count}} records', { count: rows.length }));
```

### loading 与手动关闭

```ts
const hide = ctx.message.loading(ctx.t('Saving...'));
// 执行异步操作
await saveData();
hide();  // 手动关闭 loading
ctx.message.success(ctx.t('Saved'));
```

### 使用 open 自定义配置

```ts
ctx.message.open({
  type: 'success',
  content: '自定义成功提示',
  duration: 5,
  onClose: () => console.log('message closed'),
});
```

### 关闭所有消息

```ts
ctx.message.destroy();
```

## 与 ctx.notification 的区别

| 特性 | ctx.message | ctx.notification |
|------|--------------|------------------|
| **位置** | 页面顶部中央 | 右上角 |
| **用途** | 临时轻提示，自动消失 | 通知面板，可带标题与描述，适合较长时间展示 |
| **典型场景** | 操作反馈、校验提示、复制成功 | 任务完成通知、系统消息、需用户注意的较长内容 |

## 相关

- [ctx.notification](./notification.md) - 右上角通知，适合较长时间展示
- [ctx.modal](./modal.md) - 弹窗确认，阻塞式交互
- [ctx.t()](./t.md) - 国际化，常与 message 配合使用
