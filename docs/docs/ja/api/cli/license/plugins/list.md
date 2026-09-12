---
title: "nb license plugins list"
description: "nb license plugins list コマンドリファレンス：選択した env で現在のライセンスに紐づく商用プラグインを表示します。"
keywords: "nb license plugins list,NocoBase CLI,commercial plugins"
---

# nb license plugins list

選択した env に保存されている license key に紐づく商用プラグインを表示します。

## 使い方

```bash
nb license plugins list [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env 名。省略時は現在の env が使用されます |
| `--yes`, `-y` | boolean | 明示的に指定した `--env` が現在の env と異なる場合、対話確認をスキップします |
| `--json` | boolean | JSON を出力します |

## 使用例

```bash
nb license plugins list
nb license plugins list --env app1
nb license plugins list --env app1 --yes
nb license plugins list --env app1 --json
```

`--env` を明示的に指定し、その値が現在の env と異なる場合、CLI は最初に確認を求めます。非対話端末や AI エージェントのセッションでは、自分で `--yes` を追加するか、先に `nb env use <name>` を実行してから再試行してください。

## 関連コマンド

- [`nb license plugins sync`](./sync.md)
- [`nb license activate`](../activate.md)
