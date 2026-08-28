---
title: "DrawerFormLayout"
description: "DrawerFormLayout: Menempatkan formulir standar di drawer."
keywords: "DrawerFormLayout,NocoBase,client-v2"
---

# DrawerFormLayout

`DrawerFormLayout` digunakan untuk menempatkan formulir standar di drawer.

## Penggunaan dasar

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

| Parameter | Tipe | Deskripsi |
| --- | --- | --- |
| `title` | `React.ReactNode` | Title content |
| `children` | `React.ReactNode` | Content rendered inside the component |
| `onSubmit` | `() => void | Promise<void>` | Dipanggil saat Submit diklik |
| `submitting` | `boolean` | Loading state of the submit button |
| `submitText` | `React.ReactNode` | Submit button text |
| `cancelText` | `React.ReactNode` | Cancel button text |
| `footer` | `React.ReactNode` | Replace the default footer |

## Tautan terkait

- [DialogFormLayout](./dialog-form-layout)
