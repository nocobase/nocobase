---
title: "nb api resource update"
description: "nb api resource update コマンドリファレンス：指定した NocoBase リソースのレコードを更新します。"
keywords: "nb api resource update,NocoBase CLI,レコード更新,CRUD"
---

# nb api resource update

指定したリソースのレコードを更新します。`--filter-by-tk` または `--filter` でレコードを特定し、`--values` で更新内容を渡します。

## 使い方

```bash
nb api resource update --resource <resource> --values <json> [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--resource` | string | リソース名（必須） |
| `--data-source` | string | データソース key。デフォルトは `main` です |
| `--source-id` | string | リレーションリソースのソースレコード ID |
| `--filter-by-tk` | string | プライマリキーの値。複合キーや複数キーの場合は JSON 配列を渡せます |
| `--filter` | string | JSON オブジェクト形式のフィルタ条件 |
| `--values` | string | 更新するレコードのデータ（JSON オブジェクト、必須） |
| `--whitelist` | string[] | 書き込みを許可するフィールド。複数回指定するか、JSON 配列で渡せます |
| `--blacklist` | string[] | 書き込みを禁止するフィールド。複数回指定するか、JSON 配列で渡せます |
| `--update-association-values` | string[] | 同時に更新するリレーションフィールド。複数回指定するか、JSON 配列で渡せます |
| `--force-update` / `--no-force-update` | boolean | 変更のない値も強制的に書き込むかどうか |

[`nb api resource`](./index.md) の共通接続パラメータもサポートしています。

## 使用例

```bash
nb api resource update --resource users --filter-by-tk 1 --values '{"nickname":"Grace"}'
nb api resource update --resource posts --filter '{"status":"draft"}' --values '{"status":"published"}'
```

## 関連コマンド

- [`nb api resource get`](./get.md)
- [`nb api resource destroy`](./destroy.md)
