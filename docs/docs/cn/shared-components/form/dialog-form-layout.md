---
title: "DialogFormLayout"
description: "DialogFormLayout：在 viewer.dialog 中放置标准表单。"
keywords: "DialogFormLayout,dialog,表单容器,NocoBase"
---

# DialogFormLayout

`DialogFormLayout` 用来在 `ctx.viewer.dialog()` 打开的 dialog 里放置标准表单。它负责统一标题区、内容区和底部按钮。

它只处理外壳，不接管表单实例、校验和接口请求。表单本身仍然由你用 Antd `Form` 来写。

## 基本用法

```tsx
import { DialogFormLayout } from '@nocobase/client-v2';
import { Form, Input } from 'antd';

ctx.viewer.dialog({
  closable: true,
  content: () => (
    <DialogFormLayout
      title={t('Bind verifier')}
      onCancel={async () => {
        // 可以在这里做未保存确认。
      }}
      onSubmit={async () => {
        const values = await form.validateFields();
        await ctx.api.resource('verifiers').create({ values });
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="code" label={t('Code')}>
          <Input />
        </Form.Item>
      </Form>
    </DialogFormLayout>
  ),
});
```

短表单或确认类表单默认用 `DialogFormLayout`。调用方需要在 `ctx.viewer.dialog()` 上传 `closable: true`，让 Antd Modal 渲染原生关闭按钮。

## API

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `title` | `React.ReactNode` | 标题内容 |
| `children` | `React.ReactNode` | 表单主体，通常是 Antd `Form` |
| `onCancel` | `() => void \| Promise<void>` | 点击 Cancel 或右上角关闭按钮前调用 |
| `onSubmit` | `() => void \| Promise<void>` | 点击 Submit 时调用，resolve 后自动关闭当前 view |
| `submitting` | `boolean` | Submit 按钮 loading 状态 |
| `submitText` | `React.ReactNode` | Submit 按钮文案 |
| `cancelText` | `React.ReactNode` | Cancel 按钮文案 |
| `footer` | `React.ReactNode` | 完全替换默认 footer |

## 相关链接

- [DrawerFormLayout](./drawer-form-layout) — 在 drawer 里放置标准表单
