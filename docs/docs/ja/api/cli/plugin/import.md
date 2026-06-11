---
title: "nb plugin import"
description: "nb plugin import コマンドリファレンス：パッケージ化されたプラグインアーカイブまたは npm パッケージを、選択した NocoBase env の storage/plugins ディレクトリ、またはカスタム storage パスにインポートします。"
keywords: "nb plugin import,NocoBase CLI,プラグインのインポート,storage-path,npm-registry"
---

# nb plugin import

パッケージ化されたプラグインアーカイブまたは npm パッケージを `storage/plugins` にインポートします。このコマンドはプラグインを対象ディレクトリに配置するだけで、自動では有効化しません。

## 使い方

```bash
nb plugin import <archive> [flags]
```

## パラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `<archive>` | string | プラグインのソース。必須です。ローカルの `.tgz` パス、リモートの `http(s)` アーカイブ URL、または npm パッケージ名 / tag を指定できます |
| `--env`, `-e` | string | CLI env 名です。省略した場合は通常現在の env を使います。`--storage-path` を明示的に指定した場合は `--env` を省略できます |
| `--yes`, `-y` | boolean | 明示的に渡した `--env` が現在の env と異なる場合に、対話確認をスキップします |
| `--storage-path` | string | 保存先の storage ルートパスを上書きします。実際のインポート先は `<storage-path>/plugins` です |
| `--npm-registry` | string | ソースが npm パッケージ名または tag の場合に、使用する npm registry を指定します |

## 例

```bash
# リモートアーカイブ
nb plugin import https://github.com/nocobase/plugin-auth-cas/releases/download/v1.4.0/plugin-auth-cas-1.4.0.tgz

# ローカルアーカイブ
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz

# npm パッケージまたは tag
nb plugin import @my-scope/plugin-auth-cas@beta

# プライベート npm registry
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com

# 現在の env に依存せず、ローカルの storage パスへ直接書き込む
nb plugin import ./plugin-auth-cas-1.4.0.tgz --storage-path ./storage
```

## 補足

対象の env をすでに選択しているなら、その env の `storage/plugins` にそのままインポートするのが通常の使い方です。

プラグインをローカルの storage ディレクトリにだけ書き込みたい場合は `--storage-path` を指定します。この場合は `--env` を省略でき、CLI は `<storage-path>/plugins` に直接書き込みます。

インポート後の一般的な次の手順は、アプリを再起動してから、必要に応じてプラグインを有効化することです。通常は次の流れになります。

- 初回インストールでは、まず [`nb app restart`](../app/restart.md) を実行し、その後に [`nb plugin enable`](./enable.md) を実行します
- 新しいバージョンを再インポートしただけなら、先にアプリを再起動し、その後で新しいバージョンが読み込まれているか確認します

ソースがプライベート npm registry にある場合は、先にログインしてからインポートします。

```bash
npm login --registry=https://registry.example.com
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com
```

:::warning 注意

`storage/plugins` に手動で展開する必要はありません。`nb plugin import` が自動で正しいディレクトリに配置します。

:::

## 関連コマンド

- [`nb app restart`](../app/restart.md)
- [`nb plugin enable`](./enable.md)
- [`サードパーティプラグインのインストールとアップグレード`](../../../quickstart/plugins/third-party.md)
