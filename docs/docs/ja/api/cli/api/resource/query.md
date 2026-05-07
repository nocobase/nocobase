---
title: "nb api resource query"
description: "nb api resource query コマンドリファレンス：指定した NocoBase リソースに対して集計クエリを実行します。"
keywords: "nb api resource query,NocoBase CLI,集計クエリ,統計"
---

# nb api resource query

指定したリソースに対して集計クエリを実行します。`--measures`、`--dimensions`、`--orders` はすべて JSON 配列形式で指定します。

## 使い方

```bash
nb api resource query --resource <resource> [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--resource` | string | リソース名（必須） |
| `--data-source` | string | データソース key。デフォルトは `main` です |
| `--measures` | string | JSON 配列形式のメジャー定義 |
| `--dimensions` | string | JSON 配列形式のディメンション定義 |
| `--orders` | string | JSON 配列形式のソート定義 |
| `--filter` | string | JSON オブジェクト形式のフィルタ条件 |
| `--having` | string | JSON オブジェクト形式のグループ化後のフィルタ条件 |
| `--limit` | integer | 返却行数の上限 |
| `--offset` | integer | スキップする行数 |
| `--timezone` | string | クエリのフォーマットに使用するタイムゾーン |

[`nb api resource`](./index.md) の共通接続パラメータもサポートしています。

## 使用例

```bash
nb api resource query --resource orders --measures '[{"field":["id"],"aggregation":"count","alias":"count"}]'
nb api resource query --resource orders --dimensions '[{"field":["status"],"alias":"status"}]' --orders '[{"field":["createdAt"],"order":"desc"}]'
```

## 関連コマンド

- [`nb api resource list`](./list.md)
- [`nb api ダイナミックコマンド`](../dynamic.md)
