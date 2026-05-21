---
title: "nb app upgrade"
description: "nb app upgrade コマンドリファレンス：ソースコードまたはイメージを更新し、指定した NocoBase アプリケーションを再起動します。"
keywords: "nb app upgrade,NocoBase CLI,アップグレード,更新,Docker イメージ"
---

# nb app upgrade

指定した NocoBase アプリケーションをアップグレードします。npm/Git インストールでは保存済みソースコードを更新して quickstart で再起動します。Docker インストールでは保存済みイメージを更新してアプリケーションコンテナを再構築します。

## 使い方

```bash
nb app upgrade [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | アップグレードする CLI env 名。省略時は現在の env を使用します |
| `--yes`, `-y` | boolean | 明示的に指定した `--env` が現在の env と異なる場合、対話確認をスキップします |
| `--skip-code-update`, `-s` | boolean | 保存済みのローカルソースコードまたは Docker イメージを使用して再起動し、再ダウンロードは行いません |
| `--version` | string | 保存されている `downloadVersion` を上書きします。アップグレードに成功すると、新しいバージョンが env 設定へ書き戻されます |
| `--verbose` | boolean | 内部の更新・再起動コマンド出力を表示します |

## 使用例

```bash
nb app upgrade
nb app upgrade --env local
nb app upgrade --env local -s
nb app upgrade --env local --version beta
nb app upgrade --env local --verbose
nb app upgrade --env local-docker -s
```

`--env` を明示的に指定し、その値が現在の env と異なる場合、CLI は最初に確認を求めます。非対話端末や AI エージェントのセッションでは、自分で `--yes` を追加するか、先に `nb env use <name>` を実行してから再試行してください。

## 関連コマンド

- [`nb source download`](../source/download.md)
- [`nb app restart`](./restart.md)
- [`nb self update`](../self/update.md)
