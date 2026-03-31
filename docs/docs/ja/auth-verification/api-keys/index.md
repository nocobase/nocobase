---
pkg: '@nocobase/plugin-api-keys'
---
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::


# APIキー

## はじめに

## 使い方

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### APIキーの追加

![](https://static-docs.nocobase.com/46181872fc0ad9a96fa5b14e97fcba12.png)

**注意事項**

- 追加されたAPIキーは、現在のユーザーに紐付けられ、そのユーザーのロールを継承します。
- `APP_KEY` 環境変数が設定されており、かつ漏洩しないように管理されていることを確認してください。`APP_KEY` が変更されると、追加済みのすべてのAPIキーが無効になります。

### APP_KEYの設定方法

Docker版をご利用の場合は、`docker-compose.yml` ファイルを編集してください。

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

ソースコードから、または `create-nocobase-app` でインストールした場合は、`.env` ファイルの `APP_KEY` を直接編集してください。

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```