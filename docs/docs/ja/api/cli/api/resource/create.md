---
title: "nb api resource create"
description: "nb api resource create コマンドリファレンス：指定した NocoBase リソースのレコードを作成します。"
keywords: "nb api resource create,NocoBase CLI,レコード作成,CRUD"
---

# nb api resource create

指定したリソースのレコードを作成します。レコードの内容は `--values` で JSON オブジェクトとして渡します。

## 使い方

```bash
nb api resource create --resource <resource> --values <json> [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--resource` | string | リソース名（必須） |
| `--data-source` | string | データソース key。デフォルトは `main` です |
| `--source-id` | string | リレーションリソースのソースレコード ID |
| `--values` | string | 作成するレコードのデータ（JSON オブジェクト、必須） |
| `--whitelist` | string[] | 書き込みを許可するフィールド。複数回指定するか、JSON 配列で渡せます |
| `--blacklist` | string[] | 書き込みを禁止するフィールド。複数回指定するか、JSON 配列で渡せます |

[`nb api resource`](./index.md) の共通接続パラメータもサポートしています。

## 使用例

```bash
nb api resource create --resource users --values '{"nickname":"Ada"}'
nb api resource create --resource posts.comments --source-id 1 --values '{"content":"Hello"}'
```

## 関連コマンド

- [`nb api resource update`](./update.md)
- [`nb api resource destroy`](./destroy.md)
