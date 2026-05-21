---
title: "nb db stop"
description: "nb db stop コマンドリファレンス：指定した env の組み込みデータベースコンテナを停止します。"
keywords: "nb db stop,NocoBase CLI,データベース停止,Docker"
---

# nb db stop

指定した env の組み込みデータベースコンテナを停止します。このコマンドは CLI 管理の組み込みデータベースが有効な env でのみ使用できます。

## 使い方

```bash
nb db stop [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | 組み込みデータベースを停止する CLI env 名。省略時は現在の env を使用します |
| `--verbose` | boolean | 内部の Docker コマンド出力を表示します |

## 使用例

```bash
nb db stop
nb db stop --env app1
nb db stop --env app1 --verbose
```

## 関連コマンド

- [`nb db start`](./start.md)
- [`nb app stop`](../app/stop.md)
- [`nb app down`](../app/down.md)
