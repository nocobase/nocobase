---
title: "nb db"
description: "nb db コマンドリファレンス：選択した env の組み込みデータベースの実行状態を表示・管理します。"
keywords: "nb db,NocoBase CLI,組み込みデータベース,Docker,データベース状態"
---

# nb db

CLI が管理する組み込みデータベースを表示・管理します。CLI が管理するデータベースコンテナを持たない env の場合、`nb db ps` は `external` や `remote` などのステータスを表示します。

## 使い方

```bash
nb db <command>
```

## サブコマンド

| コマンド | 説明 |
| --- | --- |
| [`nb db ps`](./ps.md) | 組み込みデータベースの実行状態を表示します |
| [`nb db start`](./start.md) | 組み込みデータベースコンテナを起動します |
| [`nb db stop`](./stop.md) | 組み込みデータベースコンテナを停止します |
| [`nb db logs`](./logs.md) | 組み込みデータベースコンテナのログを表示します |

## 使用例

```bash
nb db ps
nb db ps --env app1
nb db start --env app1
nb db stop --env app1
nb db logs --env app1
```

## 関連コマンド

- [`nb env info`](../env/info.md)
- [`nb app logs`](../app/logs.md)
