---
title: "DrawerFormLayout"
description: "DrawerFormLayout: Put a standard form in a drawer."
keywords: "DrawerFormLayout,NocoBase,client-v2"
---

# DrawerFormLayout

`DrawerFormLayout` is used to put a standard form in a drawer.

## Basic Usage

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

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `React.ReactNode` | Title content |
| `children` | `React.ReactNode` | Content rendered inside the component |
| `onSubmit` | `() => void | Promise<void>` | Called when Submit is clicked |
| `submitting` | `boolean` | Loading state of the submit button |
| `submitText` | `React.ReactNode` | Submit button text |
| `cancelText` | `React.ReactNode` | Cancel button text |
| `footer` | `React.ReactNode` | Replace the default footer |

## Related Links

- [DialogFormLayout](./dialog-form-layout)
