---
title: "DrawerFormLayout"
description: "DrawerFormLayout: Đặt biểu mẫu chuẩn trong drawer."
keywords: "DrawerFormLayout,NocoBase,client-v2"
---

# DrawerFormLayout

`DrawerFormLayout` dùng để đặt biểu mẫu chuẩn trong drawer.

## Cách dùng cơ bản

```tsx
import { DrawerFormLayout } from '@nocobase/client-v2';

ctx.viewer.drawer({
  width: '50%',
  closable: true,
  content: () => (
    <DrawerFormLayout title={t('Add provider')} onSubmit={handleSubmit}>
      <Form form={form} layout="vertical">
        <Form.Item name="name" label={t('Name')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
      </Form>
    </DrawerFormLayout>
  ),
});
```

## API

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `title` | `React.ReactNode` | Title content |
| `children` | `React.ReactNode` | Content rendered inside the component |
| `onSubmit` | `() => void | Promise<void>` | Được gọi khi bấm Submit |
| `submitting` | `boolean` | Loading state of the submit button |
| `submitText` | `React.ReactNode` | Submit button text |
| `cancelText` | `React.ReactNode` | Cancel button text |
| `footer` | `React.ReactNode` | Replace the default footer |

## Liên kết liên quan

- [DialogFormLayout](./dialog-form-layout)
