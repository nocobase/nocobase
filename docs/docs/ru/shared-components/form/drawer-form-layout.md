---
title: "DrawerFormLayout"
description: "DrawerFormLayout: Разместить стандартную форму в drawer."
keywords: "DrawerFormLayout,NocoBase,client-v2"
---

# DrawerFormLayout

`DrawerFormLayout` используется, чтобы разместить стандартную форму в drawer.

## Базовое использование

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

| Параметр | Тип | Описание |
| --- | --- | --- |
| `title` | `React.ReactNode` | Title content |
| `children` | `React.ReactNode` | Content rendered inside the component |
| `onSubmit` | `() => void | Promise<void>` | Вызывается при клике на Submit |
| `submitting` | `boolean` | Loading state of the submit button |
| `submitText` | `React.ReactNode` | Submit button text |
| `cancelText` | `React.ReactNode` | Cancel button text |
| `footer` | `React.ReactNode` | Replace the default footer |

## Связанные ссылки

- [DialogFormLayout](./dialog-form-layout)
