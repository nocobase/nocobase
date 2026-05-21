---
title: "nb app down"
description: "nb app down コマンドリファレンス：指定した env のローカル実行リソースを停止してクリーンアップします。"
keywords: "nb app down,NocoBase CLI,リソースクリーンアップ,コンテナ削除,storage"
---

# nb app down

指定した env のローカル実行リソースを停止してクリーンアップします。デフォルトでは storage データと env 設定は保持されます。すべてを削除するには、明示的に `--all --force` を指定する必要があります。

## 使い方

```bash
nb app down [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | クリーンアップする CLI env 名。省略時は現在の env を使用します |
| `--all` | boolean | その env のすべてのコンテンツ（storage データと保存済み env 設定を含む）を削除します |
| `--yes`, `-y` | boolean | 明示的に指定した `--env` が現在の env と異なる場合、対話確認をスキップします |
| `--force`, `-f` | boolean | `--all` などの破壊的なクリーンアップや、非対話モードでの高リスクなクリーンアップを強制実行します |
| `--verbose` | boolean | 内部の停止・クリーンアップコマンド出力を表示します |

## 使用例

```bash
nb app down --env app1
nb app down --env app1 --all --force
nb app down --env app1 --force
```

`--yes` は、明示的に指定した `--env` が現在の env と異なる場合の対話確認だけをスキップします。`--force` は、`--all` や非対話モードでのその他の高リスクなクリーンアップのような、破壊的なクリーンアップを本当に強制実行するためのものです。

## 関連コマンド

- [`nb app stop`](./stop.md)
- [`nb env remove`](../env/remove.md)
- [`nb db stop`](../db/stop.md)
