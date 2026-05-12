---
title: "nb license activate"
description: "nb license activate コマンドリファレンス：選択した env で NocoBase の商用ライセンスを有効化します。"
keywords: "nb license activate,NocoBase CLI,commercial licensing"
---

# nb license activate

選択した env の商用ライセンスを有効化します。既存の license key を直接指定することも、オンラインでライセンスを要求して有効化することもできます。

## 使い方

```bash
nb license activate [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env 名。省略時は現在の env が使用されます |
| `--key` | string | 既存の license key を直接指定します |
| `--key-file` | string | license key をファイルから読み込みます |
| `--online` | boolean | ライセンスをオンラインで要求して有効化します |
| `--account` | string | オンライン有効化に使用するライセンスサービスのアカウント |
| `--password` | string | オンライン有効化に使用するライセンスサービスのパスワード |
| `--desc` | string | オンライン有効化時に送信するアプリケーション名 |
| `--yes`, `-y` | boolean | 明示的に指定した `--env` が現在の env と異なる場合、対話確認をスキップします |
| `--json` | boolean | JSON を出力します |

## 使用例

```bash
nb license activate --env app1 --key <licenseKey>
nb license activate --env app1 --key-file ./license.txt
nb license activate --env app1 --online
nb license activate --env app1 --online --account aa --password bb --desc test24
nb license activate --env app1 --online --account aa --password bb --desc test24 --yes
nb license activate --env app1 --json --key-file ./license.txt
```

## 補足

オンライン有効化を使用する場合、CLI は現在の env の instance ID とアプリ URL を使ってライセンスサービスに license key を要求します。

`--env` を明示的に指定し、その値が現在の env と異なる場合、CLI は最初に確認を求めます。非対話端末や AI エージェントのセッションでは、自分で `--yes` を追加するか、先に `nb env use <name>` を実行してから再試行してください。

## 関連コマンド

- [`nb license id`](./id.md)
- [`nb license status`](./status.md)
