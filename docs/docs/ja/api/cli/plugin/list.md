---
title: "nb plugin list"
description: "nb plugin list コマンドリファレンス：選択した NocoBase env のプラグインを一覧表示します。"
keywords: "nb plugin list,NocoBase CLI,プラグイン一覧"
---

# nb plugin list

選択した env のインストール済みプラグインを一覧表示します。

## 使い方

```bash
nb plugin list [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env 名。省略時は現在の env を使用します |
| `--yes`, `-y` | boolean | 明示的に指定した `--env` が現在の env と異なる場合、対話確認をスキップします |

## 使用例

```bash
nb plugin list
nb plugin list -e local
nb plugin list -e local --yes
nb plugin list -e local-docker
```

`--env` を明示的に指定し、その値が現在の env と異なる場合、CLI は最初に確認を求めます。非対話端末や AI エージェントのセッションでは、自分で `--yes` を追加するか、先に `nb env use <name>` を実行してから再試行してください。

## 関連コマンド

- [`nb plugin enable`](./enable.md)
- [`nb plugin disable`](./disable.md)
