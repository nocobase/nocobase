---
title: "nb api resource list"
description: "nb api resource list コマンドリファレンス：指定した NocoBase リソースのレコードを一覧表示します。"
keywords: "nb api resource list,NocoBase CLI,一覧表示,リソース"
---

# nb api resource list

指定したリソースのレコードを一覧表示します。`--filter`、`--fields`、`--sort`、`--page` などのパラメータでクエリを制御できます。

## 使い方

```bash
nb api resource list --resource <resource> [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--resource` | string | リソース名（必須） |
| `--data-source` | string | データソース key。デフォルトは `main` です |
| `--source-id` | string | リレーションリソースのソースレコード ID |
| `--filter` | string | JSON オブジェクト形式のフィルタ条件 |
| `--fields` | string[] | クエリフィールド。複数回指定するか、JSON 配列で渡せます |
| `--appends` | string[] | 追加で取得するリレーションフィールド。複数回指定するか、JSON 配列で渡せます |
| `--except` | string[] | 除外するフィールド。複数回指定するか、JSON 配列で渡せます |
| `--sort` | string[] | ソートフィールド（例：`-createdAt`）。複数回指定するか、JSON 配列で渡せます |
| `--page` | integer | ページ番号 |
| `--page-size` | integer | 1 ページあたりの件数 |
| `--paginate` / `--no-paginate` | boolean | ページネーションを行うかどうか |

[`nb api resource`](./index.md) の共通接続パラメータもサポートしています。

## 使用例

```bash
nb api resource list --resource users
nb api resource list --resource posts.comments --source-id 1 --fields id --fields content
nb api resource list --resource users --filter '{"status":"active"}' --sort=-createdAt
```

## 関連コマンド

- [`nb api resource get`](./get.md)
- [`nb api resource query`](./query.md)
