---
title: "DialogFormLayout"
description: "DialogFormLayout: Colocar un formulario estándar en un dialog."
keywords: "DialogFormLayout,NocoBase,client-v2"
---

# DialogFormLayout

`DialogFormLayout` sirve para colocar un formulario estándar en un dialog.

## Uso básico

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

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `title` | `React.ReactNode` | Contenido del título |
| `children` | `React.ReactNode` | Contenido renderizado dentro del componente |
| `onCancel` | `() => void | Promise<void>` | Se llama antes de que Cancel cierre la vista |
| `onSubmit` | `() => void | Promise<void>` | Se llama al hacer clic en Submit |
| `submitting` | `boolean` | Estado loading del botón Submit |
| `submitText` | `React.ReactNode` | Texto del botón Submit |
| `cancelText` | `React.ReactNode` | Texto del botón Cancel |
| `footer` | `React.ReactNode` | Sustituye el footer predeterminado |

## Enlaces relacionados

- [DrawerFormLayout](./drawer-form-layout)
