---
title: "nb api resource get"
description: "nb api resource get コマンドリファレンス：指定した NocoBase リソースの 1 件のレコードを取得します。"
keywords: "nb api resource get,NocoBase CLI,レコード取得,プライマリキー"
---

# nb api resource get

指定したリソースの 1 件のレコードを取得します。通常、`--filter-by-tk` でプライマリキーを指定します。

## 使い方

```bash
nb api resource get --resource <resource> [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--resource` | string | リソース名（必須） |
| `--data-source` | string | データソース key。デフォルトは `main` です |
| `--source-id` | string | リレーションリソースのソースレコード ID |
| `--filter-by-tk` | string | プライマリキーの値。複合キーや複数キーの場合は JSON 配列を渡せます |
| `--fields` | string[] | クエリフィールド。複数回指定するか、JSON 配列で渡せます |
| `--appends` | string[] | 追加で取得するリレーションフィールド。複数回指定するか、JSON 配列で渡せます |
| `--except` | string[] | 除外するフィールド。複数回指定するか、JSON 配列で渡せます |

[`nb api resource`](./index.md) の共通接続パラメータもサポートしています。

## 使用例

```bash
nb api resource get --resource users --filter-by-tk 1
nb api resource get --resource posts.comments --source-id 1 --filter-by-tk 2
```

## 関連コマンド

- [`nb api resource list`](./list.md)
- [`nb api resource update`](./update.md)
