---
title: "nb db start"
description: "nb db start コマンドリファレンス：指定した env の組み込みデータベースコンテナを起動します。"
keywords: "nb db start,NocoBase CLI,データベース起動,Docker"
---

# nb db start

指定した env の組み込みデータベースコンテナを起動します。このコマンドは CLI 管理の組み込みデータベースが有効な env でのみ使用できます。

## 使い方

```bash
nb db start [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | 組み込みデータベースを起動する CLI env 名。省略時は現在の env を使用します |
| `--verbose` | boolean | 内部の Docker コマンド出力を表示します |

## 使用例

```bash
nb db start
nb db start --env app1
nb db start --env app1 --verbose
```

## 関連コマンド

- [`nb db stop`](./stop.md)
- [`nb db logs`](./logs.md)
- [`nb app start`](../app/start.md)
