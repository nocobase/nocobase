---
title: "DialogFormLayout"
description: "DialogFormLayout: Colocar um formulário padrão em um dialog."
keywords: "DialogFormLayout,NocoBase,client-v2"
---

# DialogFormLayout

`DialogFormLayout` é usado para colocar um formulário padrão em um dialog.

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

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `title` | `React.ReactNode` | Title content |
| `children` | `React.ReactNode` | Content rendered inside the component |
| `onCancel` | `() => void | Promise<void>` | Chamado antes de Cancel fechar a view |
| `onSubmit` | `() => void | Promise<void>` | Chamado ao clicar em Submit |
| `submitting` | `boolean` | Loading state of the submit button |
| `submitText` | `React.ReactNode` | Submit button text |
| `cancelText` | `React.ReactNode` | Cancel button text |
| `footer` | `React.ReactNode` | Replace the default footer |

## Links relacionados

- [DrawerFormLayout](./drawer-form-layout)
