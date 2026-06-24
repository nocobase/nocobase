---
title: "DialogFormLayout"
description: "DialogFormLayout: Đặt biểu mẫu chuẩn trong dialog."
keywords: "DialogFormLayout,NocoBase,client-v2"
---

# DialogFormLayout

`DialogFormLayout` dùng để đặt biểu mẫu chuẩn trong dialog.

## Cách dùng cơ bản

```tsx
import { DialogFormLayout } from '@nocobase/client-v2';

ctx.viewer.dialog({
  closable: true,
  content: () => (
    <DialogFormLayout title={t('Bind verifier')} onSubmit={handleSubmit}>
      <Form form={form} layout="vertical">
        <Form.Item name="code" label={t('Code')}>
          <Input />
        </Form.Item>
      </Form>
    </DialogFormLayout>
  ),
});
```

## API

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `title` | `React.ReactNode` | Title content |
| `children` | `React.ReactNode` | Content rendered inside the component |
| `onCancel` | `() => void | Promise<void>` | Được gọi trước khi Cancel đóng view |
| `onSubmit` | `() => void | Promise<void>` | Được gọi khi bấm Submit |
| `submitting` | `boolean` | Loading state of the submit button |
| `submitText` | `React.ReactNode` | Submit button text |
| `cancelText` | `React.ReactNode` | Cancel button text |
| `footer` | `React.ReactNode` | Replace the default footer |

## Liên kết liên quan

- [DrawerFormLayout](./drawer-form-layout)
