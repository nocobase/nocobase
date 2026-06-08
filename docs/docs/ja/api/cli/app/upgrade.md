---
title: "nb app upgrade"
description: "nb app upgrade コマンドリファレンス：アプリケーションを停止し、保存済みのソースコードまたはイメージを置き換えて、指定した NocoBase アプリケーションをアップグレードして起動します。"
keywords: "nb app upgrade,NocoBase CLI,アップグレード,更新,Docker イメージ"
---

# nb app upgrade

指定した NocoBase アプリケーションをアップグレードします。CLI はまず現在のアプリケーションを停止し、デフォルトで保存済みのソースコードまたはイメージを置き換え、商用プラグインを同期し、アップグレード処理を実行してアプリケーションを起動したあと、最後に env runtime を更新します。Docker env では起動時に保存済みの env 設定からアプリケーションコンテナを再作成します。

## 使い方

```bash
nb app upgrade [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `--env`, `-e` | string | アップグレードする CLI env 名。省略時は現在の env を使用します |
| `--yes`, `-y` | boolean | 明示的に指定した `--env` が現在の env と異なる場合、対話確認をスキップします |
| `--force`, `-f` | boolean | アップグレード確認をスキップします。非対話端末と AI エージェントのセッションでは明示的に必要です |
| `--skip-download`, `-s` | boolean | ソースコードまたはイメージのダウンロードをスキップし、現在保存されているローカルソースコードまたは Docker イメージを使ってアップグレードと起動のフローを実行します。`nb license plugins sync` もスキップします |
| `--version` | string | 今回のアップグレード対象バージョンを上書きします。成功すると新しいバージョンは env 設定の `downloadVersion` に書き戻されます |
| `--verbose` | boolean | 内部の更新・再起動コマンド出力を表示します |

## 使用例

```bash
nb app upgrade
nb app upgrade --force
nb app upgrade --env local
nb app upgrade --env local --force
nb app upgrade --env local --skip-download
nb app upgrade --env local --skip-download --version beta
nb app upgrade --env local --version beta
nb app upgrade --env local --verbose
nb app upgrade --env local-docker --skip-download
```

`--env` を明示的に指定し、その値が現在の env と異なる場合、CLI は最初に確認を求めます。非対話端末や AI エージェントのセッションでは、自分で `--yes` を追加するか、先に `nb env use <name>` を実行してから再試行してください。

実際のアップグレード開始前には、`--force` を渡さない限り、対話端末で追加のアップグレード確認も表示されます。非対話端末と AI エージェントのセッションでは、`--force` がないと `nb app upgrade` は実行を拒否し、再実行用のコマンドを表示します。さらに cross-env 操作でもある場合は、`--yes` と `--force` の両方が必要です。

デフォルトでは、`nb app upgrade` は次の手順で実行されます。

1. `nb app stop`
2. `nb source download --replace`
3. `nb license plugins sync --skip-if-no-license`
4. `nb app start`
5. 必要に応じて新しい `downloadVersion` を保存
6. `nb env update`

`--skip-download` を指定すると、CLI は手順 2 と 3 をスキップし、現在保存されているソースコードまたはイメージを使ってアップグレードと起動のフローをそのまま実行します。さらに `--version` も指定した場合、そのバージョンはこの実行中にはダウンロードされず、起動成功後に新しい `downloadVersion` として保存されるだけなので、以後のアップグレードで利用できます。

手順 4 では、現在のコード状態に応じて必要なアップグレード準備を自動で完了してから、アプリケーションが `__health_check` を通過するのを待ちます。待機中、CLI は最初に待機メッセージを 1 行出力し、その後は 10 秒ごとに進捗メッセージを 1 行ずつ出力して、アプリケーションの準備完了またはタイムアウトまで待機します。

最後の `nb env update` が失敗しても、アップグレード自体は成功とみなされます。CLI は warning を表示し、あとで `nb env update <envName>` を手動で実行するよう案内します。

## 関連コマンド

- [`nb source download`](../source/download.md)
- [`nb app restart`](./restart.md)
- [`nb self update`](../self/update.md)
