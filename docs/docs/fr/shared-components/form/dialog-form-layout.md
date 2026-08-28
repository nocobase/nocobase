---
title: "DialogFormLayout"
description: "DialogFormLayout: Placer un formulaire standard dans un dialog."
keywords: "DialogFormLayout,NocoBase,client-v2"
---

# DialogFormLayout

`DialogFormLayout` sert à placer un formulaire standard dans un dialog.

## Utilisation de base

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

| Paramètre | Type | Description |
| --- | --- | --- |
| `title` | `React.ReactNode` | Contenu du titre |
| `children` | `React.ReactNode` | Contenu rendu dans le composant |
| `onCancel` | `() => void | Promise<void>` | Appelé avant que Cancel ferme la vue |
| `onSubmit` | `() => void | Promise<void>` | Appelé au clic sur Submit |
| `submitting` | `boolean` | État loading du bouton Submit |
| `submitText` | `React.ReactNode` | Texte du bouton Submit |
| `cancelText` | `React.ReactNode` | Texte du bouton Cancel |
| `footer` | `React.ReactNode` | Remplace le footer par défaut |

## Liens associés

- [DrawerFormLayout](./drawer-form-layout)
