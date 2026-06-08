---
title: "nb app autostart disable"
description: "nb app autostart disable のリファレンス：1 つの env に対するアプリ自動起動を無効にします。"
keywords: "nb app autostart disable,NocoBase CLI,autostart,env"
---

# nb app autostart disable

1 つの env に対してアプリケーション自動起動フラグを無効にします。

無効化すると、その env は `nb app autostart run` に参加しなくなります。このコマンド自体は、すでに実行中のアプリを直接停止しません。現在のランタイムも停止したい場合は、別途 `nb app stop` を使ってください。

## 使用方法

```bash
nb app autostart disable [flags]
```

## Flags

| Flag | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | 自動起動から外す CLI env 名。省略時は現在の env を使用 |
| `--yes`, `-y` | boolean | 明示的な `--env` が現在の env と異なる場合の対話確認をスキップ |

## 例

```bash
nb app autostart disable
nb app autostart disable --env app1
nb app autostart disable --env app1 --yes
```

## 注意

このコマンドは保存済みの自動起動フラグだけを変更します。アプリ自体は直接停止しません。もともと自動起動が有効でなかった env に対して実行しても、そのまま無効状態が維持されます。

`enable` と同じく、CLI が env 間確認を行うのは `--env` を明示的に指定した場合だけです。非対話端末や AI エージェントのフローでは、必要に応じて自分で `--yes` を付けてください。

## 関連コマンド

- [`nb app autostart enable`](./enable.md)
- [`nb app autostart list`](./list.md)
- [`nb app stop`](../stop.md)
