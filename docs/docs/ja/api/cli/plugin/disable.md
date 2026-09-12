---
title: "nb plugin disable"
description: "nb plugin disable コマンドリファレンス：選択した NocoBase env で 1 つまたは複数のプラグインを無効化します。"
keywords: "nb plugin disable,NocoBase CLI,プラグイン無効化"
---

# nb plugin disable

選択した env で 1 つまたは複数のプラグインを無効化します。

## 使い方

```bash
nb plugin disable <packages...> [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `<packages...>` | string[] | プラグインのパッケージ名（必須）。複数指定できます |
| `--env`, `-e` | string | CLI env 名。省略時は現在の env を使用します |
| `--yes`, `-y` | boolean | 明示的に指定した `--env` が現在の env と異なる場合、対話確認をスキップします |

## 使用例

```bash
nb plugin disable @nocobase/plugin-sample
nb plugin disable @nocobase/plugin-a @nocobase/plugin-b
nb plugin disable -e local @nocobase/plugin-sample
nb plugin disable -e local --yes @nocobase/plugin-sample
```

`--env` を明示的に指定し、その値が現在の env と異なる場合、CLI は最初に確認を求めます。非対話端末や AI エージェントのセッションでは、自分で `--yes` を追加するか、先に `nb env use <name>` を実行してから再試行してください。

## 関連コマンド

- [`nb plugin list`](./list.md)
- [`nb plugin enable`](./enable.md)
