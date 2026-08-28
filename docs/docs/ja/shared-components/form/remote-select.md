---
title: "RemoteSelect"
description: "RemoteSelect: API から Select オプションを非同期に読み込む."
keywords: "RemoteSelect,NocoBase,client-v2"
---

# RemoteSelect

`RemoteSelect` は、API から Select オプションを非同期に読み込むためのコンポーネントです。

## 基本的な使い方

```tsx
import { RemoteSelect } from '@nocobase/client-v2';

<RemoteSelect<{ name: string; title: string }>
  request={async () => {
    const { data } = await ctx.api.resource('providers').list();
    return data.data;
  }}
  fieldNames={{ label: 'title', value: 'name' }}
/>;
```

## API

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `request` | `() => Promise<T[]>` | オプションを読み込む非同期リクエスト |
| `fieldNames` | `{ label; value }` | オプションの label / value フィールドを対応付ける |
| `options` | `DefaultOptionType[]` | 静的オプション |
| `mode` | `SelectProps['mode']` | Select モード |
| `showSearch` | `boolean` | 検索を有効にするかどうか |
| `filterOption` | `boolean | function` | クライアント側のオプションフィルター |
