# ctx.modal

基于 Ant Design Modal 的快捷 API，用于在 RunJS 中主动打开模态框（信息提示、确认弹窗等）。由 `ctx.viewer` / 视图系统实现。

## 适用场景

| 场景 | 说明 |
|------|------|
| **JSBlock / JSField** | 用户交互后显示操作结果、错误提示或二次确认 |
| **事件流 / 操作事件** | 提交前弹窗确认，用户取消时通过 `ctx.exit()` 终止后续步骤 |
| **联动规则** | 校验失败时弹窗提示用户 |

> 注意：`ctx.modal` 在存在视图上下文的 RunJS 环境中可用（如页面内的 JSBlock、事件流等）；在后端或无 UI 上下文中可能不存在，使用时建议做可选链判断（`ctx.modal?.confirm?.()`）。

## 类型定义

```ts
modal: {
  info: (config: ModalConfig) => Promise<void>;
  success: (config: ModalConfig) => Promise<void>;
  error: (config: ModalConfig) => Promise<void>;
  warning: (config: ModalConfig) => Promise<void>;
  confirm: (config: ModalConfig) => Promise<boolean>;  // 用户点确定返回 true，取消返回 false
};
```

`ModalConfig` 与 Ant Design `Modal` 的静态方法配置一致。

## 常用方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `info(config)` | `Promise<void>` | 信息提示弹窗 |
| `success(config)` | `Promise<void>` | 成功提示弹窗 |
| `error(config)` | `Promise<void>` | 错误提示弹窗 |
| `warning(config)` | `Promise<void>` | 警告提示弹窗 |
| `confirm(config)` | `Promise<boolean>` | 确认弹窗，用户点确定返回 `true`，取消返回 `false` |

## 配置参数

与 Ant Design `Modal` 一致，常用字段包括：

| 参数 | 类型 | 说明 |
|------|------|------|
| `title` | `ReactNode` | 标题 |
| `content` | `ReactNode` | 内容 |
| `okText` | `string` | 确认按钮文案 |
| `cancelText` | `string` | 取消按钮文案（仅 `confirm`） |
| `onOk` | `() => void \| Promise<void>` | 点击确认时执行 |
| `onCancel` | `() => void` | 点击取消时执行 |

## 与 ctx.message、ctx.openView 的关系

| 用途 | 推荐用法 |
|------|----------|
| **轻量临时提示** | `ctx.message`，自动消失 |
| **信息/成功/错误/警告弹窗** | `ctx.modal.info` / `success` / `error` / `warning` |
| **二次确认（需用户选择）** | `ctx.modal.confirm`，配合 `ctx.exit()` 控制流程 |
| **复杂表单、列表等交互** | `ctx.openView` 打开自定义视图（页面/抽屉/弹窗） |

## 示例

### 简单信息弹窗

```ts
ctx.modal.info({
  title: '提示',
  content: '操作已完成',
});
```

### 确认弹窗并控制流程

```ts
const confirmed = await ctx.modal.confirm({
  title: '确认删除',
  content: '确定要删除这条记录吗？',
  okText: '确定',
  cancelText: '取消',
});
if (!confirmed) {
  ctx.exit();  // 用户取消时终止后续步骤
  return;
}
await ctx.runAction('destroy', { filterByTk: ctx.record?.id });
```

### 带 onOk 的确认弹窗

```ts
await ctx.modal.confirm({
  title: '确认提交',
  content: '提交后将无法修改，确定继续？',
  async onOk() {
    await ctx.form.submit();
  },
});
```

### 错误提示

```ts
try {
  await someOperation();
  ctx.modal.success({ title: '成功', content: '操作已完成' });
} catch (e) {
  ctx.modal.error({ title: '错误', content: e.message });
}
```

## 相关

- [ctx.message](./message.md)：轻量临时提示，自动消失
- [ctx.exit()](./exit.md)：用户取消确认时，常用 `if (!confirmed) ctx.exit()` 终止流程
- [ctx.openView()](./open-view.md)：打开自定义视图，适合复杂交互
