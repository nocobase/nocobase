---
title: "nb license activate"
description: "nb license activate コマンドリファレンス：選択した env で既存の NocoBase 商用 license key を有効化します。"
keywords: "nb license activate,NocoBase CLI,commercial licensing"
---

# nb license activate

選択した env で既存の商用 license key を有効化します。直接渡すことも、ファイルから読み込むことも、対話端末で貼り付けることもできます。

## 使い方

```bash
nb license activate [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | CLI env 名。省略時は現在の env が使用されます |
| `--key` | string | 既存の商用 license key を直接渡します |
| `--key-file` | string | 既存の商用 license key をファイルから読み込みます |
| `--yes`, `-y` | boolean | 明示的に指定した `--env` が現在の env と異なる場合、対話確認をスキップします |
| `--json` | boolean | JSON を出力します |

## 使用例

```bash
nb license activate
nb license activate --env app1 --key <licenseKey>
nb license activate --env app1 --key-file ./license.txt
nb license activate --env app1 --json --key-file ./license.txt
```

## 補足

対話実行では、CLI はまず現在の Hostname と Instance ID を表示し、そのあとに license key を直接貼り付けるか、key ファイルのパスを入力するよう求めます。これらの情報を使って、ライセンスが正しいインスタンスに紐付いているか確認できます。

有効化に成功したら、ライセンス状態と商用プラグインの状態を実際に反映させるためにアプリを再起動してください。CLI は再起動前に、現在のライセンスで利用が許可されている商用プラグインを自動的に同期します。

```bash
nb app restart
```

`--env` を明示的に指定し、その値が現在の env と異なる場合、CLI は最初に確認を求めます。非対話端末や AI エージェントのセッションでは、自分で `--yes` を追加するか、先に `nb env use <name>` を実行してから再試行してください。

## 関連コマンド

- [`nb app restart`](../app/restart.md)
- [`nb license id`](./id.md)
- [`nb license status`](./status.md)
