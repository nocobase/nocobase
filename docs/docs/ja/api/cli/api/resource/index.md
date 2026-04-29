---
title: "nb api resource"
description: "nb api resource コマンドリファレンス：任意の NocoBase リソースに対して汎用 CRUD および集計クエリを実行します。"
keywords: "nb api resource,NocoBase CLI,CRUD,リソース,データテーブル"
---

# nb api resource

任意の NocoBase リソースに対して汎用 CRUD および集計クエリを実行します。リソース名は `users` のような通常リソースのほか、`posts.comments` のようなリレーションリソースも指定できます。

## 使い方

```bash
nb api resource <command>
```

## サブコマンド

| コマンド | 説明 |
| --- | --- |
| [`nb api resource list`](./list.md) | リソースレコードを一覧表示します |
| [`nb api resource get`](./get.md) | 単一のリソースレコードを取得します |
| [`nb api resource create`](./create.md) | リソースレコードを作成します |
| [`nb api resource update`](./update.md) | リソースレコードを更新します |
| [`nb api resource destroy`](./destroy.md) | リソースレコードを削除します |
| [`nb api resource query`](./query.md) | 集計クエリを実行します |

## 共通パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--api-base-url` | string | NocoBase API アドレス（例：`http://localhost:13000/api`） |
| `--verbose` | boolean | 詳細な進捗を表示します |
| `--env`, `-e` | string | 環境名 |
| `--role` | string | ロールのオーバーライド。`X-Role` リクエストヘッダーとして送信されます |
| `--token`, `-t` | string | API key のオーバーライド |
| `--json-output`, `-j` / `--no-json-output` | boolean | 生の JSON を出力するかどうか。デフォルトは有効です |
| `--resource` | string | リソース名（必須）。例：`users`、`orders`、`posts.comments` |
| `--data-source` | string | データソース key。デフォルトは `main` です |

リレーションリソースのコマンドでは、`--source-id` でソースレコード ID を指定することもできます。

## 使用例

```bash
nb api resource list --resource users
nb api resource get --resource users --filter-by-tk 1
nb api resource create --resource users --values '{"nickname":"Ada"}'
nb api resource list --resource posts.comments --source-id 1 --fields id --fields content
```

## 関連コマンド

- [`nb api`](../index.md)
- [`nb env update`](../../env/update.md)
