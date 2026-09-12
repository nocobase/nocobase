---
title: "DrawerFormLayout"
description: "DrawerFormLayout: Placer un formulaire standard dans un drawer."
keywords: "DrawerFormLayout,NocoBase,client-v2"
---

# DrawerFormLayout

`DrawerFormLayout` sert à placer un formulaire standard dans un drawer.

## Utilisation de base

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

| Paramètre | Type | Description |
| --- | --- | --- |
| `title` | `React.ReactNode` | Contenu du titre |
| `children` | `React.ReactNode` | Contenu rendu dans le composant |
| `onSubmit` | `() => void | Promise<void>` | Appelé au clic sur Submit |
| `submitting` | `boolean` | État loading du bouton Submit |
| `submitText` | `React.ReactNode` | Texte du bouton Submit |
| `cancelText` | `React.ReactNode` | Texte du bouton Cancel |
| `footer` | `React.ReactNode` | Remplace le footer par défaut |

## Liens associés

- [DialogFormLayout](./dialog-form-layout)
