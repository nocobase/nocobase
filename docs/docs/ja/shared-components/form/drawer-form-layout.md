---
title: "DrawerFormLayout"
description: "DrawerFormLayout: drawer に標準フォームを配置する."
keywords: "DrawerFormLayout,NocoBase,client-v2"
---

# DrawerFormLayout

`DrawerFormLayout` は、drawer に標準フォームを配置するためのコンポーネントです。

## 基本的な使い方

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

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `title` | `React.ReactNode` | タイトル内容 |
| `children` | `React.ReactNode` | コンポーネント内に描画する内容 |
| `onSubmit` | `() => void | Promise<void>` | Submit をクリックしたときに呼ばれる |
| `submitting` | `boolean` | Submit ボタンの loading 状態 |
| `submitText` | `React.ReactNode` | Submit ボタンの文言 |
| `cancelText` | `React.ReactNode` | Cancel ボタンの文言 |
| `footer` | `React.ReactNode` | デフォルト footer を置き換える |

## 関連リンク

- [DialogFormLayout](./dialog-form-layout)
