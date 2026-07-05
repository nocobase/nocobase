---
title: "DialogFormLayout"
description: "DialogFormLayout: Put a standard form in a dialog."
keywords: "DialogFormLayout,NocoBase,client-v2"
---

# DialogFormLayout

`DialogFormLayout` is used to put a standard form in a dialog.

## Basic Usage

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

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `React.ReactNode` | Title content |
| `children` | `React.ReactNode` | Content rendered inside the component |
| `onCancel` | `() => void | Promise<void>` | Called before Cancel closes the view |
| `onSubmit` | `() => void | Promise<void>` | Called when Submit is clicked |
| `submitting` | `boolean` | Loading state of the submit button |
| `submitText` | `React.ReactNode` | Submit button text |
| `cancelText` | `React.ReactNode` | Cancel button text |
| `footer` | `React.ReactNode` | Replace the default footer |

## Related Links

- [DrawerFormLayout](./drawer-form-layout)
