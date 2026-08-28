---
title: "DrawerFormLayout"
description: "DrawerFormLayout: Ein Standardformular in einem Drawer platzieren."
keywords: "DrawerFormLayout,NocoBase,client-v2"
---

# DrawerFormLayout

`DrawerFormLayout` dient dazu: ein Standardformular in einem Drawer platzieren.

## Grundlegende Verwendung

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

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `title` | `React.ReactNode` | Titelinhalt |
| `children` | `React.ReactNode` | Inhalt im Component |
| `onSubmit` | `() => void | Promise<void>` | Wird beim Klick auf Submit aufgerufen |
| `submitting` | `boolean` | Loading-Zustand des Submit-Buttons |
| `submitText` | `React.ReactNode` | Text des Submit-Buttons |
| `cancelText` | `React.ReactNode` | Text des Cancel-Buttons |
| `footer` | `React.ReactNode` | Ersetzt den Standard-Footer |

## Verwandte Links

- [DialogFormLayout](./dialog-form-layout)
