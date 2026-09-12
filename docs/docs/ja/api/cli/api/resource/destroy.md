---
title: "nb api resource destroy"
description: "nb api resource destroy コマンドリファレンス：指定した NocoBase リソースのレコードを削除します。"
keywords: "nb api resource destroy,NocoBase CLI,レコード削除,CRUD"
---

# nb api resource destroy

指定したリソースのレコードを削除します。`--filter-by-tk` または `--filter` でレコードを特定します。

## 使い方

```bash
nb api resource destroy --resource <resource> [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--resource` | string | リソース名（必須） |
| `--data-source` | string | データソース key。デフォルトは `main` です |
| `--source-id` | string | リレーションリソースのソースレコード ID |
| `--filter-by-tk` | string | プライマリキーの値。複合キーや複数キーの場合は JSON 配列を渡せます |
| `--filter` | string | JSON オブジェクト形式のフィルタ条件 |

[`nb api resource`](./index.md) の共通接続パラメータもサポートしています。

## 使用例

```bash
nb api resource destroy --resource users --filter-by-tk 1
nb api resource destroy --resource posts --filter '{"status":"archived"}'
```

## 関連コマンド

- [`nb api resource list`](./list.md)
- [`nb api resource update`](./update.md)
