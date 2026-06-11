---
title: "nb db ps"
description: "nb db ps コマンドリファレンス：設定済み env の組み込みデータベースの実行状態を表示します。"
keywords: "nb db ps,NocoBase CLI,データベース状態"
---

# nb db ps

組み込みデータベースの実行状態を表示します。リソースの起動や停止は行いません。`--env` を省略すると、設定済みの全 env のデータベース状態を表示します。

## 使い方

```bash
nb db ps [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | 表示する CLI env 名。省略時はすべての env を表示します |

## 使用例

```bash
nb db ps
nb db ps --env app1
```

## 関連コマンド

- [`nb db start`](./start.md)
- [`nb db stop`](./stop.md)
- [`nb env info`](../env/info.md)
