---
title: "nb env update"
description: "nb env update コマンドリファレンス：指定した env の OpenAPI Schema とランタイムコマンドキャッシュを更新します。"
keywords: "nb env update,NocoBase CLI,OpenAPI,ランタイムコマンド,swagger"
---

# nb env update

NocoBase アプリケーションから OpenAPI Schema を取得し、ローカルのランタイムコマンドキャッシュを更新します。キャッシュは `.nocobase/versions/<hash>/commands.json` に保存されます。

## 使い方

```bash
nb env update [name] [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `[name]` | string | 環境名。省略時は現在の env を使用します |
| `--verbose` | boolean | 詳細な進捗を表示します |
| `--api-base-url` | string | NocoBase API アドレスのオーバーライド。対象 env に永続化されます |
| `--role` | string | ロールのオーバーライド。`X-Role` リクエストヘッダーとして送信されます |
| `--token`, `-t` | string | API key のオーバーライド。対象 env に永続化されます |

## 使用例

```bash
nb env update
nb env update prod
nb env update prod --api-base-url http://localhost:13000/api
nb env update prod --token <token>
```

## 関連コマンド

- [`nb api`](../api/index.md)
- [`nb env info`](./info.md)
- [`nb env add`](./add.md)
