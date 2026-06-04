---
title: "nb license plugins sync"
description: "nb license plugins sync コマンドリファレンス：選択した env に対して、現在のライセンスで許可されている商用プラグインを同期します。"
keywords: "nb license plugins sync,NocoBase CLI,commercial plugins"
---

# nb license plugins sync

現在のライセンスで許可されている商用プラグインを同期します。

## 使い方

```bash
nb license plugins sync [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env 名。省略時は現在の env を使用します |
| `--yes`, `-y` | boolean | 明示的に指定した `--env` が現在の env と異なる場合、対話確認をスキップします |
| `--dry-run` | boolean | プラグインのインストール、更新、削除を行わずに変更内容だけを確認します |
| `--version` | string | 同期する registry バージョンまたは dist-tag。デフォルトでは現在の workspace バージョンを使用します |
| `--skip-if-no-license` | boolean | 現在の env にライセンスキーが保存されていない場合は、エラーにせずスキップします |
| `--verbose` | boolean | プラグインごとの詳細ログを表示します |
| `--json` | boolean | JSON を出力します |

## 使用例

```bash
nb license plugins sync
nb license plugins sync --env app1
nb license plugins sync --env app1 --yes
nb license plugins sync --env app1 --dry-run
nb license plugins sync --env app1 --skip-if-no-license
nb license plugins sync --env app1 --json
```

## 補足

`--version` を省略した場合、CLI は現在のアプリケーションバージョンを自動検出し、それに応じてどの registry バージョンの商用プラグインをダウンロードするかを判断します。

`--skip-if-no-license` が無視するのは 1 つのケースだけです。現在の env にライセンスキーがまだ保存されていない場合です。ライセンスキー内の registry 資格情報不足、registry ログイン失敗、プラグインのダウンロード失敗など、その他のエラーは通常どおり表示されます。

`--env` を明示的に指定し、その値が現在の env と異なる場合、CLI は最初に確認を求めます。非対話端末や AI エージェントのセッションでは、自分で `--yes` を追加するか、先に `nb env use <name>` を実行してから再試行してください。

## 関連コマンド

- [`nb license plugins list`](./list.md)
- [`nb license plugins clean`](./clean.md)
