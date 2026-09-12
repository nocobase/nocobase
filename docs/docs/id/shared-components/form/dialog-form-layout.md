---
title: "DialogFormLayout"
description: "DialogFormLayout: Menempatkan formulir standar di dialog."
keywords: "DialogFormLayout,NocoBase,client-v2"
---

# DialogFormLayout

`DialogFormLayout` digunakan untuk menempatkan formulir standar di dialog.

## Penggunaan dasar

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

| Parameter | Tipe | Deskripsi |
| --- | --- | --- |
| `title` | `React.ReactNode` | Title content |
| `children` | `React.ReactNode` | Content rendered inside the component |
| `onCancel` | `() => void | Promise<void>` | Dipanggil sebelum Cancel menutup view |
| `onSubmit` | `() => void | Promise<void>` | Dipanggil saat Submit diklik |
| `submitting` | `boolean` | Loading state of the submit button |
| `submitText` | `React.ReactNode` | Submit button text |
| `cancelText` | `React.ReactNode` | Cancel button text |
| `footer` | `React.ReactNode` | Replace the default footer |

## Tautan terkait

- [DrawerFormLayout](./drawer-form-layout)
