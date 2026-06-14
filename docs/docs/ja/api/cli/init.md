---
title: 'nb init'
description: 'nb init コマンドリファレンス: 新規インストール、ローカルの既存アプリの引き継ぎ、またはリモートアプリへの接続を行い、CLI env として保存します。'
keywords: 'nb init,NocoBase CLI,初期化,env,Docker,npm,Git,リモート接続'
---

# nb init

現在のワークスペースを初期化して、coding agent が NocoBase に接続して利用できるようにします。

`nb init` は、新しいローカル NocoBase アプリをインストールすることも、既存アプリの接続情報を保存することもできます。

また、`nb init` はデフォルトで NocoBase AI coding skills も同期します。すでに skills を自分で管理している場合、または CI やオフライン環境で実行する場合にのみ、`--skip-skills` を追加する必要があります。

## 使い方

```bash
nb init [flags]
```

## 対話モード

`nb init` は 3 つの対話モードをサポートしています:

- `nb init`: ターミナルでガイドに従って 1 ステップずつセットアップを完了する
- `nb init --ui`: ローカルブラウザでフォームを開き、ビジュアルウィザードで setup を完了する
- `nb init --yes --env app1`: プロンプトをスキップして flags を直接使う。明示的に渡していないパラメータはデフォルト値で処理される

`--yes` モードは、スクリプト、CI/CD、その他の非対話シナリオに適しています。このモードでは、`--env <envName>` は必須です。通常はデフォルトで新しいローカルアプリをインストールします。`--source` を指定しない場合、インストール元として `docker` がデフォルトで使用されます。

## 中断した初期化の再開

インストール系フローでは、まず env 設定を保存し、その後にダウンロード、データベース、アプリのインストールを実行します。途中で失敗した場合は、次のように続行できます:

```bash
nb init --env app1 --resume
```

`--resume` は、すでに env 設定が保存されている初期化フローにのみ適用でき、`--env` を明示的に渡す必要があります。

## 先に env を準備し、アプリのインストールは後で行う

`--prepare-only` は、最初に env を準備し、その後 license を有効化し、最後にアプリをインストールして起動する必要があるフロー向けです。

env 設定を先に保存し、ソースファイルまたはイメージを準備し、データベースも用意しておきたい一方で、実際のアプリインストールと初回起動は後回しにしたい場合は、次のように実行できます:

```bash
nb init --env app1 --prepare-only
nb init --env app1 --prepare-only --ui
nb init --env app1 --prepare-only --yes
```

このモードは `--ui` ウィザードを含むローカルインストールフローで利用できますが、リモート接続フローでは利用できません。CLI は現在の env を prepared 状態として保存するため、後で次のようなフローで続行できます:

```bash
nb license activate --env app1
nb app start --env app1
```

その後、`nb app start` が初回インストールを完了し、env を prepared 状態から通常の installed 状態へ切り替えます。

## インストールディレクトリの説明

完全なパスは `nb env info app1 --field app.appPath` で確認できます。

デフォルトでは、CLI は `app-path` 配下のローカルファイルを次の規約で構成します:

```text
<app-path>/
├── source/   # アプリのソースコードまたはダウンロード内容のデフォルトディレクトリ
├── storage/  # ランタイムデータディレクトリ
└── .env      # オプションのアプリ環境変数ファイル
```

通常は次の通りです:

- `source/` は主に npm / Git env のローカルアプリディレクトリに対応します。Docker env についても CLI はこのデフォルトのパス導出を維持しますが、ほとんどの場合は手動で気にする必要はありません。アップグレード時には特に注意してください。`source/` ディレクトリは削除されたあと再ダウンロードされるため、保持したいファイルをここに置かないでください
- `storage/` には、組み込みデータベースのデータ、プラグイン、ログなどのランタイムデータを格納します
- `.env` はオプションのアプリ環境変数ファイルです。環境変数をカスタマイズしたい場合にのみ `<app-path>/.env` に追加する必要があります。このファイルが存在する場合、Docker、npm、Git の各インストール元はデフォルトでこれを読み取ります

これは CLI のデフォルトディレクトリ規約を表しています。インストール元、プラグイン、実行段階によって、実際に生成されるディレクトリ内容は完全には同じでない場合があります。

## 注意事項

:::warning 注意事項

- `--ui` は `--yes` と一緒に使用できません
- `--ui` は `--resume` とも一緒に使用できません
- `--ui-host`、`--ui-port` は `--ui` と一緒にのみ使用できます
- `--skip-auth` は `--access-token` または `--token` と一緒に使用できません

:::

## Steps ですばやく位置を確認する

表示される Steps は setup パスによって完全には同じではありません。たとえば既存アプリに接続する場合は、通常 `Getting started` と `Remote connection` だけを使います。

ローカル UI ウィザードに従って 1 ステップずつ操作する場合は、まず次の表で該当箇所をすばやく確認できます:

| Step                      | 主に確認するパラメータ                                                                                                                                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Getting started`         | `--env`、`--yes`、`--ui`、`--locale`、`--verbose`、`--skip-skills`、`--resume`、`--prepare-only`                                                                                                                 |
| `App environment`         | `--lang`、`--app-path`、`--app-port`、`--force`                                                                                                                                                                   |
| `App source and version`  | `--source`、`--version`、`--skip-download`、`--git-url`、`--docker-registry`、`--docker-platform`、`--npm-registry`、`--replace`、`--dev-dependencies`、`--output-dir`、`--docker-save`、`--build`、`--build-dts` |
| `Configure the database`  | `--builtin-db`、`--db-dialect`、`--builtin-db-image`、`--db-host`、`--db-port`、`--db-database`、`--db-user`、`--db-password`、`--db-schema`、`--db-table-prefix`、`--db-underscored`                             |
| `Create an admin account` | `--root-username`、`--root-email`、`--root-password`、`--root-nickname`                                                                                                                                           |
| `Remote connection`       | `--api-base-url`、`--auth-type`、`--access-token`、`--username`、`--password`、`--skip-auth`                                                                                                                      |

## パラメータ

パラメータは多いため、利用シナリオごとに分けて見るとわかりやすくなります。

以下の「デフォルト値」は、そのパラメータを省略したときに `nb init` が通常採用する値または動作を意味します。

### 基本と対話

| パラメータ      | 型      | デフォルト値                                                                          | 説明                                                                         |
| --------------- | ------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `--yes`, `-y`   | boolean | `false`                                                                               | プロンプトをスキップし、flags とデフォルト値を使用する                       |
| `--env`, `-e`   | string  | なし                                                                                  | この初期化で保存する env 名。`--yes` および `--resume` モードでは必須        |
| `--ui`          | boolean | `false`                                                                               | ローカルブラウザウィザードを開く。`--yes`、`--resume` と一緒に使用できない   |
| `--verbose`     | boolean | `false`                                                                               | 詳細なコマンド出力を表示する                                                 |
| `--skip-skills` | boolean | `false`                                                                               | NocoBase AI coding skills の同期をスキップする                               |
| `--ui-host`     | string  | `127.0.0.1`                                                                           | `--ui` ローカルサービスのバインドアドレス                                    |
| `--ui-port`     | integer | `0`                                                                                   | `--ui` ローカルサービスポート。`0` は自動割り当てを意味する                  |
| `--locale`      | string  | `NB_LOCALE`、CLI 設定、またはシステム locale に従い、最終的なフォールバックは `en-US` | CLI プロンプトとローカル setup UI の言語: `en-US` または `zh-CN`             |
| `--resume`      | boolean | `false`                                                                               | 前回未完了だった初期化を続行し、保存済みの workspace env config を再利用する |
| `--prepare-only` | boolean | `false`                                                                              | `--ui` フローを含むローカルインストール env を保存して準備するが、アプリはまだインストールも起動もしない |

### 既存アプリへの接続

| パラメータ             | 型      | デフォルト値 | 説明                                                                                                                                |
| ---------------------- | ------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `--api-base-url`, `-u` | string  | なし         | API ベース URL。`/api` プレフィックスを含める必要がある                                                                             |
| `--auth-type`, `-a`    | string  | `oauth`      | 認証方式: `basic`、`token`、または `oauth`。通常はデフォルトの `oauth` で十分です。一部の CI/CD シナリオでは `basic` も使用できます |
| `--access-token`, `-t` | string  | なし         | `token` 認証で使用する API key または access token                                                                                  |
| `--username`           | string  | なし         | `basic` 認証で使用するユーザー名                                                                                                    |
| `--password`           | string  | なし         | `basic` 認証で使用するパスワード                                                                                                    |
| `--skip-auth`          | boolean | `false`      | 先に env と認証方式を保存し、後で `nb env auth` によってログインを完了する                                                          |

### ローカルインストールの基本パラメータ

| パラメータ        | 型      | デフォルト値                           | 説明                                                                             |
| ----------------- | ------- | -------------------------------------- | -------------------------------------------------------------------------------- |
| `--lang`, `-l`    | string  | `en-US`                                | 新規インストールするアプリの UI 言語                                             |
| `--force`, `-f`   | boolean | `false`                                | 既存 env を再設定し、必要に応じて競合するランタイムリソースを置き換える          |
| `--app-path`      | string  | `./<envName>/`                         | ローカル npm/Git アプリディレクトリ                                              |
| `--app-port`      | string  | `13000`                                | ローカルアプリの HTTP ポート。`--yes` モードでは利用可能なポートが自動選択される |
| `--root-username` | string  | `nocobase`（`--yes` モード）           | 初期管理者ユーザー名                                                             |
| `--root-email`    | string  | `admin@nocobase.com`（`--yes` モード） | 初期管理者メールアドレス                                                         |
| `--root-password` | string  | `admin123`（`--yes` モード）           | 初期管理者パスワード                                                             |
| `--root-nickname` | string  | `Super Admin`（`--yes` モード）        | 初期管理者表示名                                                                 |

### データベースパラメータ

| パラメータ                                 | 型      | デフォルト値                                                          | 説明                                                                     |
| ------------------------------------------ | ------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `--builtin-db` / `--no-builtin-db`         | boolean | `true`                                                                | CLI 管理の組み込みデータベースを作成して接続するかどうか                 |
| `--db-dialect`                             | string  | `postgres`                                                            | データベース種別: `postgres`、`mysql`、`mariadb`、`kingbase`             |
| `--builtin-db-image`                       | string  | `--db-dialect` と locale に従う                                       | 組み込みデータベースのコンテナイメージ                                   |
| `--db-host`                                | string  | 組み込みデータベースでは `postgres`、外部データベースでは `127.0.0.1` | データベースホストアドレス                                               |
| `--db-port`                                | string  | `postgres=5432`、`mysql=3306`、`mariadb=3306`、`kingbase=54321`       | データベースポート                                                       |
| `--db-database`                            | string  | `nocobase`、KingbaseES の場合は `kingbase`                            | データベース名                                                           |
| `--db-user`                                | string  | `nocobase`                                                            | データベースユーザー名                                                   |
| `--db-password`                            | string  | `nocobase`                                                            | データベースパスワード                                                   |
| `--db-schema`                              | string  | なし                                                                  | データベース schema。PostgreSQL でのみ使用                               |
| `--db-table-prefix`                        | string  | なし                                                                  | データベーステーブルのプレフィックス                                     |
| `--db-underscored` / `--no-db-underscored` | boolean | `false`                                                               | データベースのテーブル名とフィールド名にアンダースコア形式を使うかどうか |

### ダウンロードとソースコードのパラメータ

| パラメータ                                           | 型      | デフォルト値                                                                                   | 説明                                                                                         |
| ---------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `--skip-download`                                    | boolean | `false`                                                                                        | ダウンロードをスキップし、既存のローカルアプリディレクトリまたは Docker イメージを再利用する |
| `--source`, `-s`                                     | string  | `docker`                                                                                       | NocoBase の取得方法: `docker`、`npm`、または `git`                                           |
| `--version`, `-v`                                    | string  | `beta`                                                                                         | バージョンパラメータ: npm パッケージバージョン、Docker イメージ tag、または Git ref          |
| `--replace`, `-r`                                    | boolean | `false`                                                                                        | 対象ディレクトリがすでに存在する場合は置き換える                                             |
| `--dev-dependencies`, `-D` / `--no-dev-dependencies` | boolean | `false`                                                                                        | npm/Git インストール時に devDependencies をインストールするかどうか                          |
| `--output-dir`, `-o`                                 | string  | npm/Git では `--app-path` から導出。Docker + `--docker-save` では `./nocobase-<version>`       | ダウンロード先ディレクトリ、または `--docker-save` 有効時の tarball 保存ディレクトリ         |
| `--git-url`                                          | string  | `https://github.com/nocobase/nocobase.git`                                                     | Git リポジトリ URL                                                                           |
| `--docker-registry`                                  | string  | `nocobase/nocobase`。`zh-CN` locale では `registry.cn-shanghai.aliyuncs.com/nocobase/nocobase` | Docker イメージリポジトリ名。tag は含まない                                                  |
| `--docker-platform`                                  | string  | `auto`                                                                                         | Docker イメージプラットフォーム: `auto`、`linux/amd64`、`linux/arm64`                        |
| `--docker-save` / `--no-docker-save`                 | boolean | `false`                                                                                        | Docker イメージを pull した後、追加で tarball として保存するかどうか                         |
| `--npm-registry`                                     | string  | 空                                                                                             | npm/Git のダウンロードと依存関係インストールで使用する registry                              |
| `--build` / `--no-build`                             | boolean | `true`                                                                                         | npm/Git 依存関係のインストール後にビルドするかどうか                                         |
| `--build-dts`                                        | boolean | `false`                                                                                        | npm/Git ビルド時に TypeScript 宣言ファイルを生成するかどうか                                 |

## 例

もっとも一般的な使い方は次の通りです。

### ターミナルでガイドに従って 1 ステップずつ完了する

```bash
nb init
```

### ローカルブラウザウィザードを開く

```bash
nb init --ui
nb init --ui --ui-port 3000
```

### 先に準備し、その後で license を有効化して起動する

```bash
nb init --env app1 --prepare-only
nb license activate --env app1
nb app start --env app1
```

### 非対話モードで新しいローカルアプリをインストールする

`--source` を指定しない場合、通常は Docker がインストール元として使用されます。

```bash
nb init --env app1 --yes
nb init --env app1 --yes --source docker --version latest
nb init --env app1 --yes --source docker --version beta
nb init --env app1 --yes --source docker --version alpha
nb init --env app1 --yes --source docker --version main \
  --docker-registry registry.cn-beijing.aliyuncs.com/nocobase/nocobase
nb init --env app1 --yes --source npm --version latest
nb init --env app1 --yes --source npm --version beta
nb init --env app1 --yes --source npm --version alpha
nb init --env app1 --yes --source npm --version beta --app-port 13080
nb init --env app1 --yes --source git --version latest
nb init --env app1 --yes --source git --version beta
nb init --env app1 --yes --source git --version alpha
nb init --env app1 --yes --source git --version feat/plugin-workflow-timeout
nb init --env app1 --yes --source git --version latest \
  --git-url https://gitee.com/nocobase/nocobase.git
```

### すばやくインストールして basic 認証を使う

非対話モードでローカルアプリをすばやくインストールし、インストール完了後に `basic` 認証もそのまま保存したい場合は、このようにも書けます。こうすると、OAuth を完了するためにブラウザを開く必要がありません。

`--yes` モードのデフォルト管理者アカウントをそのまま使う場合、最短では次のように書けます。

省略時、デフォルトの管理者アカウントは `nocobase`、デフォルトパスワードは `admin123` です:

```bash
nb init --env app1 --yes --auth-type basic
```

管理者アカウントも同時にカスタマイズしたい場合は、次のように書けます:

```bash
nb init --env app1 --yes \
  --auth-type basic \
  --root-username admin \
  --root-password secret123
```

### 既存アプリに接続する

通常はデフォルトで OAuth を使えば十分です。CI/CD など一部のシナリオでブラウザを開くのが不便な場合は、`basic` 認証を直接保存することもできます。すでに API token を持っている場合は、`token` 認証を直接保存することもできます。

```bash
nb init --env staging --yes \
  --api-base-url https://demo.example.com/api

nb init --env staging --yes \
  --api-base-url https://demo.example.com/api \
  --auth-type basic \
  --username <username> \
  --password <password>

nb init --env staging --yes \
  --api-base-url https://demo.example.com/api \
  --auth-type token \
  --access-token <token>

nb init --env staging --yes \
  --api-base-url https://demo.example.com/api \
  --auth-type oauth \
  --skip-auth
```

### データベース命名をカスタマイズする

PostgreSQL schema、テーブルプレフィックス、またはアンダースコア命名を指定する必要がある場合は、次のようにパラメータを渡せます:

```bash
nb init --env app1 --yes \
  --db-dialect postgres \
  --db-schema public \
  --db-table-prefix nb_ \
  --db-underscored
```

### 前回中断した初期化を続行する

```bash
nb init --env app1 --resume
```

### トラブルシューティング時に詳細ログを表示する

```bash
nb init --env app1 --yes --source docker --version latest --verbose
```

## 関連コマンド

- [`nb env add`](./env/add.md)
- [`nb env auth`](./env/auth.md)
- [`nb source download`](./source/download.md)
