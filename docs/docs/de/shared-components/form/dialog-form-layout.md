---
title: "DialogFormLayout"
description: "DialogFormLayout: Ein Standardformular in einem Dialog platzieren."
keywords: "DialogFormLayout,NocoBase,client-v2"
---

# DialogFormLayout

`DialogFormLayout` dient dazu: ein Standardformular in einem Dialog platzieren.

## Grundlegende Verwendung

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

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `title` | `React.ReactNode` | Titelinhalt |
| `children` | `React.ReactNode` | Inhalt im Component |
| `onCancel` | `() => void | Promise<void>` | Wird aufgerufen, bevor Cancel die View schließt |
| `onSubmit` | `() => void | Promise<void>` | Wird beim Klick auf Submit aufgerufen |
| `submitting` | `boolean` | Loading-Zustand des Submit-Buttons |
| `submitText` | `React.ReactNode` | Text des Submit-Buttons |
| `cancelText` | `React.ReactNode` | Text des Cancel-Buttons |
| `footer` | `React.ReactNode` | Ersetzt den Standard-Footer |

## Verwandte Links

- [DrawerFormLayout](./drawer-form-layout)
