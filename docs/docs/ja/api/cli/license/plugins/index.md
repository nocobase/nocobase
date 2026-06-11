---
title: "nb license plugins"
description: "nb license plugins コマンドリファレンス：現在のライセンスで許可された商用プラグインを確認または同期します。"
keywords: "nb license plugins,NocoBase CLI,commercial plugins"
---

# nb license plugins

現在のライセンスで許可された商用プラグインを確認または同期します。

## 使い方

```bash
nb license plugins <command>
```

## サブコマンド

| コマンド | 説明 |
| --- | --- |
| [`nb license plugins list`](./list.md) | 現在のライセンスに紐づく商用プラグインを表示します |
| [`nb license plugins sync`](./sync.md) | 現在のライセンスで許可された商用プラグインを同期します |
| [`nb license plugins clean`](./clean.md) | 現在の env にダウンロード済みの商用プラグインを削除します |

## 使用例

```bash
nb license plugins list --env app1
nb license plugins sync --env app1 --dry-run
nb license plugins clean --env app1 --verbose
```

## 関連コマンド

- [`nb license activate`](../activate.md)
- [`nb plugin list`](../../plugin/list.md)
