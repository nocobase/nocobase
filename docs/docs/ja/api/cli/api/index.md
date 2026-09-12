---
title: "nb api"
description: "nb api コマンドリファレンス：CLI から NocoBase API を呼び出します。汎用 resource コマンドとダイナミックコマンドを含みます。"
keywords: "nb api,NocoBase CLI,API,resource,OpenAPI"
---

# nb api

CLI から NocoBase API を呼び出します。`nb api` には汎用の [`nb api resource`](./resource/index.md) CRUD コマンドと、現在のアプリケーションの OpenAPI Schema から動的に生成されるコマンドが含まれます。

## 使い方

```bash
nb api <command>
```

## サブコマンド

| コマンド | 説明 |
| --- | --- |
| [`nb api resource`](./resource/index.md) | 任意の NocoBase リソースに対して汎用 CRUD および集計クエリを実行します |
| [`nb api ダイナミックコマンド`](./dynamic.md) | アプリケーションの OpenAPI Schema から生成される topic および operation コマンド |

## 共通パラメータ

ほとんどの `nb api` コマンドは以下の接続パラメータをサポートしています：

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--api-base-url` | string | NocoBase API アドレス（例：`http://localhost:13000/api`） |
| `--env`, `-e` | string | 環境名 |
| `--token`, `-t` | string | API key のオーバーライド |
| `--role` | string | ロールのオーバーライド。`X-Role` リクエストヘッダーとして送信されます |
| `--verbose` | boolean | 詳細な進捗を表示します |
| `--json-output`, `-j` / `--no-json-output` | boolean | 生の JSON を出力するかどうか。デフォルトは有効です |

## 使用例

```bash
nb api resource list --resource users -e app1
nb api resource get --resource users --filter-by-tk 1 -e app1
nb api resource create --resource users --values '{"nickname":"Ada"}' -e app1
nb api resource list --resource users -e app1 --no-json-output
```

## 関連コマンド

- [`nb env update`](../env/update.md)
- [`nb env add`](../env/add.md)
