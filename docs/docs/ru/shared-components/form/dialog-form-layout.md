---
title: "DialogFormLayout"
description: "DialogFormLayout: Разместить стандартную форму в dialog."
keywords: "DialogFormLayout,NocoBase,client-v2"
---

# DialogFormLayout

`DialogFormLayout` используется, чтобы разместить стандартную форму в dialog.

## Базовое использование

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

| Параметр | Тип | Описание |
| --- | --- | --- |
| `title` | `React.ReactNode` | Title content |
| `children` | `React.ReactNode` | Content rendered inside the component |
| `onCancel` | `() => void | Promise<void>` | Вызывается перед тем, как Cancel закроет view |
| `onSubmit` | `() => void | Promise<void>` | Вызывается при клике на Submit |
| `submitting` | `boolean` | Loading state of the submit button |
| `submitText` | `React.ReactNode` | Submit button text |
| `cancelText` | `React.ReactNode` | Cancel button text |
| `footer` | `React.ReactNode` | Replace the default footer |

## Связанные ссылки

- [DrawerFormLayout](./drawer-form-layout)
