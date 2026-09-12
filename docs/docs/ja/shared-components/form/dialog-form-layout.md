---
title: "DialogFormLayout"
description: "DialogFormLayout: dialog に標準フォームを配置する."
keywords: "DialogFormLayout,NocoBase,client-v2"
---

# DialogFormLayout

`DialogFormLayout` は、dialog に標準フォームを配置するためのコンポーネントです。

## 基本的な使い方

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

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `title` | `React.ReactNode` | タイトル内容 |
| `children` | `React.ReactNode` | コンポーネント内に描画する内容 |
| `onCancel` | `() => void | Promise<void>` | Cancel で view を閉じる前に呼ばれる |
| `onSubmit` | `() => void | Promise<void>` | Submit をクリックしたときに呼ばれる |
| `submitting` | `boolean` | Submit ボタンの loading 状態 |
| `submitText` | `React.ReactNode` | Submit ボタンの文言 |
| `cancelText` | `React.ReactNode` | Cancel ボタンの文言 |
| `footer` | `React.ReactNode` | デフォルト footer を置き換える |

## 関連リンク

- [DrawerFormLayout](./drawer-form-layout)
