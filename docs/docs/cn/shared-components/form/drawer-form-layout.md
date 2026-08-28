---
title: "DrawerFormLayout"
description: "DrawerFormLayout：在 viewer.drawer 中放置标准表单。"
keywords: "DrawerFormLayout,drawer,表单容器,NocoBase"
---

# DrawerFormLayout

`DrawerFormLayout` 用来在 `ctx.viewer.drawer()` 打开的 drawer 里放置标准表单。它负责统一标题区、内容区和底部按钮。

它只处理外壳，不接管表单实例、校验和接口请求。表单本身仍然由你用 Antd `Form` 来写。

## 基本用法

```tsx
import { DrawerFormLayout } from '@nocobase/client-v2';
import { Form, Input } from 'antd';

ctx.viewer.drawer({
  width: '50%',
  closable: true,
  content: () => (
    <DrawerFormLayout
      title={t('Add provider')}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
      onSubmit={async () => {
        const values = await form.validateFields();
        await ctx.api.resource('providers').create({ values });
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label={t('Name')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
      </Form>
    </DrawerFormLayout>
  ),
});
```

调用方需要在 `ctx.viewer.drawer()` 上传 `closable: true`，让 Antd Drawer 渲染原生关闭按钮。

## API

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `title` | `React.ReactNode` | 标题内容 |
| `children` | `React.ReactNode` | 表单主体，通常是 Antd `Form` |
| `onSubmit` | `() => void \| Promise<void>` | 点击 Submit 时调用，resolve 后自动关闭当前 view |
| `submitting` | `boolean` | Submit 按钮 loading 状态 |
| `submitText` | `React.ReactNode` | Submit 按钮文案 |
| `cancelText` | `React.ReactNode` | Cancel 按钮文案 |
| `footer` | `React.ReactNode` | 完全替换默认 footer |

:::tip 提示

如果需要拦截 drawer 关闭，比如做未保存内容确认，优先用更底层的 `viewer.drawer({ preventClose, beforeClose })`。`DrawerFormLayout` 自己不会包装复杂关闭逻辑。

:::

## 相关链接

- [DialogFormLayout](./dialog-form-layout) — 在 dialog 里放置标准表单
