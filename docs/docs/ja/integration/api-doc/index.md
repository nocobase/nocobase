---
pkg: "@nocobase/plugin-api-doc"
---
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::



# API ドキュメント

## はじめに

Swagger を利用して、NocoBase のHTTP API ドキュメントを生成するプラグインです。

## インストール

このプラグインは組み込み済みのため、インストールは不要です。有効化するだけで利用できます。

## 利用方法

### API ドキュメントページへのアクセス

http://localhost:13000/admin/settings/api-doc/documentation

![](https://static-docs.nocobase.com/8db51cf50e3c666aba5a850a0fb664a0.png)

### ドキュメントの概要

![](https://static-docs.nocobase.com/5bb4d3e5bba6c6fdfcd830592e72385b.png)

- 全体のAPIドキュメント：`/api/swagger:get`
- コアAPIドキュメント：`/api/swagger:get?ns=core`
- すべてのプラグインAPIドキュメント：`/api/swagger:get?ns=plugins`
- 各プラグインのドキュメント：`/api/swagger:get?ns=plugins/{name}`
- カスタム**コレクション**のAPIドキュメント：`/api/swagger:get?ns=collections`
- 特定の `${collection}` および関連する `${collection}.${association}` リソース：`/api/swagger:get?ns=collections/{name}`

## 開発者ガイド

### プラグインのSwaggerドキュメントの記述方法

プラグインの `src` フォルダ内に `swagger/index.ts` ファイルを以下の内容で追加します。

```typescript
export default {
  info: {
    title: 'NocoBase API - Auth plugin',
  },
  tags: [],
  paths: {},
  components: {
    schemas: {},
  },
};
```

詳細な記述ルールについては、[Swagger 公式ドキュメント](https://swagger.io/docs/specification/about/)をご参照ください。