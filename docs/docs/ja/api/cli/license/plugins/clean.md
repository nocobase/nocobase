---
title: "nb license plugins clean"
description: "nb license plugins clean コマンドリファレンス：選択した env にダウンロード済みの商用プラグインを削除します。"
keywords: "nb license plugins clean,NocoBase CLI,commercial plugins"
---

# nb license plugins clean

ライセンスの有効化状態を変更せずに、選択した env にダウンロード済みの商用プラグインを削除します。

## 使い方

```bash
nb license plugins clean [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env 名。省略時は現在の env が使用されます |
| `--yes`, `-y` | boolean | 明示的に指定した `--env` が現在の env と異なる場合、対話確認をスキップします |
| `--dry-run` | boolean | 何も削除せずに、削除対象のプラグインだけを確認します |
| `--verbose` | boolean | プラグインごとの詳細ログを表示します |
| `--json` | boolean | JSON を出力します |

## 使用例

```bash
nb license plugins clean
nb license plugins clean --env app1
nb license plugins clean --env app1 --yes
nb license plugins clean --env app1 --dry-run
nb license plugins clean --env app1 --verbose
nb license plugins clean --env app1 --json
```

`--env` を明示的に指定し、その値が現在の env と異なる場合、CLI は最初に確認を求めます。非対話端末や AI エージェントのセッションでは、自分で `--yes` を追加するか、先に `nb env use <name>` を実行してから再試行してください。

## 関連コマンド

- [`nb license plugins sync`](./sync.md)
- [`nb plugin disable`](../../plugin/disable.md)
