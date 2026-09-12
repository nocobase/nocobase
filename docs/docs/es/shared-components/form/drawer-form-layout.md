---
title: "DrawerFormLayout"
description: "DrawerFormLayout: Colocar un formulario estándar en un drawer."
keywords: "DrawerFormLayout,NocoBase,client-v2"
---

# DrawerFormLayout

`DrawerFormLayout` sirve para colocar un formulario estándar en un drawer.

## Uso básico

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

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `title` | `React.ReactNode` | Contenido del título |
| `children` | `React.ReactNode` | Contenido renderizado dentro del componente |
| `onSubmit` | `() => void | Promise<void>` | Se llama al hacer clic en Submit |
| `submitting` | `boolean` | Estado loading del botón Submit |
| `submitText` | `React.ReactNode` | Texto del botón Submit |
| `cancelText` | `React.ReactNode` | Texto del botón Cancel |
| `footer` | `React.ReactNode` | Sustituye el footer predeterminado |

## Enlaces relacionados

- [DialogFormLayout](./dialog-form-layout)
