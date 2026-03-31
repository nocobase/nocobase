:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# APIキー

## はじめに

## インストール

## 使用方法

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### APIキーの追加

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

**注意点**

-   追加されたAPIキーは、現在のユーザーに紐付けられ、そのユーザーのロール（役割）を継承します。
-   `APP_KEY` 環境変数が設定されており、かつ漏洩しないように厳重に管理されていることを確認してください。もし `APP_KEY` が変更された場合、以前に追加されたすべてのAPIキーは無効になります。

### `APP_KEY` の設定方法

Docker版の場合、`docker-compose.yml` ファイルを修正します。

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

ソースコードから、または `create-nocobase-app` でインストールした場合、`.env` ファイルの `APP_KEY` を直接修正するだけでOKです。

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```