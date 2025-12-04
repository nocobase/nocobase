:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# 環境変数

## 環境変数の設定方法

### Gitソースコードまたはcreate-nocobase-appでのインストール方法

プロジェクトのルートディレクトリにある `.env` ファイルで環境変数を設定します。環境変数を変更した後は、アプリケーションのプロセスを終了させてから再起動する必要があります。

### Dockerでのインストール方法

`docker-compose.yml` の設定を変更し、`environment` パラメータで環境変数を設定します。例：

```yml
services:
  app:
    image: nocobase/nocobase:latest
    environment:
      - APP_ENV=production
```

`env_file` を使用して、`.env` ファイルで環境変数を設定することもできます。例：

```yml
services:
  app:
    image: nocobase/nocobase:latest
    env_file: .env
```

環境変数を変更した後は、appコンテナを再構築する必要があります。

```yml
docker compose up -d app
```

## グローバル環境変数

### TZ

アプリケーションのタイムゾーンを設定するために使用します。デフォルトはオペレーティングシステムのタイムゾーンです。

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
時間に関連する操作はこのタイムゾーンに基づいて処理されます。TZを変更すると、データベース内の日付値に影響を与える可能性があります。詳細は「[日付と時刻の概要](/data-sources/data-modeling/collection-fields/datetime)」を参照してください。
:::

### APP_ENV

アプリケーションの環境です。デフォルト値は `development` で、選択可能なオプションは以下の通りです：

- `production` 本番環境
- `development` 開発環境

```bash
APP_ENV=production
```

### APP_KEY

アプリケーションの秘密鍵で、ユーザートークンの生成などに使用されます。独自のアプリケーションキーに変更し、外部に漏洩しないようにしてください。

:::warning
APP_KEYが変更されると、古いトークンも無効になります。
:::

```bash
APP_KEY=app-key-test
```

### APP_PORT

アプリケーションのポート番号です。デフォルト値は `13000` です。

```bash
APP_PORT=13000
```

### API_BASE_PATH

NocoBase APIアドレスのプレフィックスです。デフォルト値は `/api/` です。

```bash
API_BASE_PATH=/api/
```

### API_BASE_URL

### CLUSTER_MODE

> `v1.6.0+`

マルチコア（クラスター）起動モードです。この変数を設定すると、`pm2 start` コマンドに `-i <instances>` パラメータとして渡されます。オプションはpm2の `-i` パラメータと一致します（[PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/) を参照）。オプションは以下の通りです：

- `max`：CPUの最大コア数を使用
- `-1`：CPUの最大コア数 - 1を使用
- `<number>`：指定したコア数を使用

デフォルト値は空で、無効を意味します。

:::warning{title="注意"}
このモードはクラスターモード関連のプラグインと併用する必要があります。そうしないと、アプリケーションの機能に異常が発生する可能性があります。
:::

詳細は[クラスターモード](/cluster-mode)を参照してください。

### PLUGIN_PACKAGE_PREFIX

プラグインパッケージのプレフィックスです。デフォルトは `@nocobase/plugin-,@nocobase/preset-` です。

例えば、`hello` プラグインを `my-nocobase-app` プロジェクトに追加する場合、プラグインの完全なパッケージ名は `@my-nocobase-app/plugin-hello` となります。

PLUGIN_PACKAGE_PREFIXは以下のように設定できます：

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

この場合、プラグイン名とパッケージ名の対応関係は以下のようになります：

- `users` プラグインのパッケージ名は `@nocobase/plugin-users`
- `nocobase` プラグインのパッケージ名は `@nocobase/preset-nocobase`
- `hello` プラグインのパッケージ名は `@my-nocobase-app/plugin-hello`

### DB_DIALECT

データベースの種類です。選択可能なオプションは以下の通りです：

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

### DB_HOST

データベースのホストです（MySQLまたはPostgreSQLデータベースを使用する場合に設定が必要です）。

デフォルト値は `localhost` です。

```bash
DB_HOST=localhost
```

### DB_PORT

データベースのポート番号です（MySQLまたはPostgreSQLデータベースを使用する場合に設定が必要です）。

- MySQL、MariaDBのデフォルトポートは3306
- PostgreSQLのデフォルトポートは5432

```bash
DB_PORT=3306
```

### DB_DATABASE

データベース名です（MySQLまたはPostgreSQLデータベースを使用する場合に設定が必要です）。

```bash
DB_DATABASE=nocobase
```

### DB_USER

データベースのユーザー名です（MySQLまたはPostgreSQLデータベースを使用する場合に設定が必要です）。

```bash
DB_USER=nocobase
```

### DB_PASSWORD

データベースのパスワードです（MySQLまたはPostgreSQLデータベースを使用する場合に設定が必要です）。

```bash
DB_PASSWORD=nocobase
```

### DB_TABLE_PREFIX

データテーブルのプレフィックスです。

```bash
DB_TABLE_PREFIX=nocobase_
```

### DB_UNDERSCORED

データベースのテーブル名、フィールド名をスネークケース（snake case）形式に変換するかどうかを指定します。デフォルトは `false` です。MySQL（MariaDB）データベースを使用し、`lower_case_table_names=1` の場合、DB_UNDERSCOREDは `true` に設定する必要があります。

:::warning
`DB_UNDERSCORED=true` の場合、データベース内の実際のテーブル名やフィールド名はUI上で表示されるものと一致しません。例えば、`orderDetails` はデータベース内では `order_details` となります。
:::

### DB_LOGGING

データベースログのスイッチです。デフォルト値は `off` で、選択可能なオプションは以下の通りです：

- `on` オン
- `off` オフ

```bash
DB_LOGGING=on
```

### DB_POOL_MAX

データベース接続プールの最大接続数です。デフォルト値は `5` です。

### DB_POOL_MIN

データベース接続プールの最小接続数です。デフォルト値は `0` です。

### DB_POOL_IDLE

データベース接続プールがアイドル状態を維持できる最大時間です。デフォルト値は `10000`（10秒）です。

### DB_POOL_ACQUIRE

データベース接続プールが接続を取得しようとする最大待機時間です。デフォルト値は `60000`（60秒）です。

### DB_POOL_EVICT

データベース接続プールがアイドル接続を削除するまでの時間間隔です。デフォルト値は `1000`（1秒）です。

### DB_POOL_MAX_USES

接続が破棄され、置き換えられるまでに使用できる回数です。デフォルト値は `0`（無制限）です。

### LOGGER_TRANSPORT

ログの出力方法です。複数指定する場合は `,` で区切ります。開発環境のデフォルト値は `console`、本番環境のデフォルト値は `console,dailyRotateFile` です。
選択可能なオプション：

- `console` - `console.log`
- `file` - `ファイル`
- `dailyRotateFile` - `日次ローテーションファイル`

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

### LOGGER_BASE_PATH

ファイルベースのログの保存パスです。デフォルトは `storage/logs` です。

```bash
LOGGER_BASE_PATH=storage/logs
```

### LOGGER_LEVEL

出力するログのレベルです。開発環境のデフォルト値は `debug`、本番環境のデフォルト値は `info` です。選択可能なオプション：

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

データベースログの出力レベルは `debug` で、`DB_LOGGING` によって出力が制御され、`LOGGER_LEVEL` の影響は受けません。

### LOGGER_MAX_FILES

保持するログファイルの最大数です。

- `LOGGER_TRANSPORT` が `file` の場合、デフォルト値は `10` です。
- `LOGGER_TRANSPORT` が `dailyRotateFile` の場合、`[n]d` で日数を表します。デフォルト値は `14d` です。

```bash
LOGGER_MAX_FILES=14d
```

### LOGGER_MAX_SIZE

サイズによるログのローテーションです。

- `LOGGER_TRANSPORT` が `file` の場合、単位は `byte` で、デフォルト値は `20971520 (20 * 1024 * 1024)` です。
- `LOGGER_TRANSPORT` が `dailyRotateFile` の場合、`[n]k`, `[n]m`, `[n]g` を使用できます。デフォルトでは設定されていません。

```bash
LOGGER_MAX_SIZE=20971520
```

### LOGGER_FORMAT

ログの出力形式です。開発環境のデフォルトは `console`、本番環境のデフォルトは `json` です。選択可能なオプション：

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

参考：[ログフォーマット](/log-and-monitor/logger/index.md#ログフォーマット)

### CACHE_DEFAULT_STORE

使用するキャッシュ方法の一意の識別子で、サーバーサイドのデフォルトのキャッシュ方法を指定します。デフォルト値は `memory` で、組み込みの選択肢は以下の通りです：

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

### CACHE_MEMORY_MAX

メモリキャッシュの最大アイテム数です。デフォルト値は `2000` です。

```bash
CACHE_MEMORY_MAX=2000
```

### CACHE_REDIS_URL

Redisの接続URLです。オプションです。例：`redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

### TELEMETRY_ENABLED

テレメトリデータ収集を有効にします。デフォルトは `off` です。

```bash
TELEMETRY_ENABLED=on
```

### TELEMETRY_METRIC_READER

有効にする監視メトリクスコレクターです。デフォルトは `console` です。その他の値は、対応するコレクタープラグインで登録された名前（例：`prometheus`）を参照してください。複数指定する場合は `,` で区切ります。

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

### TELEMETRY_TRACE_PROCESSOR

有効にするトレースデータプロセッサーです。デフォルトは `console` です。その他の値は、対応するプロセッサープラグインで登録された名前を参照してください。複数指定する場合は `,` で区切ります。

```bash
TELEMETRY_TRACE_PROCESSOR=console
```

## 実験的な環境変数

### APPEND_PRESET_LOCAL_PLUGINS

プリセットされた未アクティブなプラグインを追加するために使用します。値はプラグインのパッケージ名（package.jsonのnameパラメータ）で、複数のプラグインはカンマで区切ります。

:::info

1. プラグインがローカルにダウンロードされ、`node_modules` ディレクトリ内に存在することを確認してください。詳細は[プラグインの構成](/plugin-development/project-structure)を参照してください。
2. 環境変数を追加した後、初期インストール `nocobase install` またはアップグレード `nocobase upgrade` を実行すると、プラグイン管理ページに表示されるようになります。
   :::

```bash
APPEND_PRESET_LOCAL_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

### APPEND_PRESET_BUILT_IN_PLUGINS

組み込みでデフォルトでインストールされるプラグインを追加するために使用します。値はプラグインのパッケージ名（package.jsonのnameパラメータ）で、複数のプラグインはカンマで区切ります。

:::info

1. プラグインがローカルにダウンロードされ、`node_modules` ディレクトリ内に存在することを確認してください。詳細は[プラグインの構成](/plugin-development/project-structure)を参照してください。
2. 環境変数を追加した後、初期インストール `nocobase install` またはアップグレード `nocobase upgrade` 時にプラグインが自動的にインストールまたはアップグレードされます。
   :::

```bash
APPEND_PRESET_BUILT_IN_PLUGINS=@my-project/plugin-foo,@my-project/plugin-bar
```

## 一時的な環境変数

NocoBaseをインストールする際に、一時的な環境変数を設定してインストールを補助することができます。例：

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install

# 以下と同等
yarn nocobase install \
  --lang=zh-CN  \
  --root-email=demo@nocobase.com \
  --root-password=admin123 \
  --root-nickname="Super Admin"

# 以下と同等
yarn nocobase install -l zh-CN -e demo@nocobase.com -p admin123 -n "Super Admin"
```

### INIT_APP_LANG

インストール時の言語です。デフォルト値は `en-US` で、選択可能なオプションは以下の通りです：

- `en-US`
- `zh-CN`

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  nocobase install
```

### INIT_ROOT_EMAIL

Rootユーザーのメールアドレスです。

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  nocobase install
```

### INIT_ROOT_PASSWORD

Rootユーザーのパスワードです。

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  nocobase install
```

### INIT_ROOT_NICKNAME

Rootユーザーのニックネームです。

```bash
yarn cross-env \
  INIT_APP_LANG=zh-CN \
  INIT_ROOT_EMAIL=demo@nocobase.com \
  INIT_ROOT_PASSWORD=admin123 \
  INIT_ROOT_NICKNAME="Super Admin" \
  nocobase install
```