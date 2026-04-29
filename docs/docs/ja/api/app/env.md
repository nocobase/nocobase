---
title: "グローバル環境変数"
description: "NocoBase 環境変数：TZ、APP_KEY、DB などの設定項目の説明。"
keywords: "環境変数,APP_KEY,TZ,設定,NocoBase"
---

# グローバル環境変数

## TZ

アプリケーションのタイムゾーンを設定するために使用します。デフォルトはオペレーティングシステムのタイムゾーンです。

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning 注意
時間に関連する操作はこのタイムゾーンに基づいて処理されます。TZ を変更するとデータベース内の日付値に影響する可能性があります。詳細は「[日付と時間の概要](#)」を参照してください。
:::

## APP_ENV

アプリケーション環境。デフォルト値は `development` で、選択可能なオプションは以下のとおりです：

- `production` 本番環境
- `development` 開発環境

```bash
APP_ENV=production
```

## APP_KEY

アプリケーションの秘密鍵。ユーザートークンの生成などに使用します。独自のアプリケーション秘密鍵に変更し、外部に漏洩しないようにしてください。

:::warning 注意
APP_KEY を変更すると、古いトークンは無効になります。
:::

```bash
APP_KEY=app-key-test
```

## APP_PORT

アプリケーションポート。デフォルト値は `13000` です。

```bash
APP_PORT=13000
```

## API_BASE_PATH

NocoBase API アドレスのプレフィックス。デフォルト値は `/api/` です。

```bash
API_BASE_PATH=/api/
```

## API_BASE_URL

## CLUSTER_MODE

> `v1.6.0+`

マルチコア（クラスター）起動モード。この変数を設定すると、`pm2 start` コマンドの `-i <instances>` パラメータとして渡されます。選択可能なオプションは pm2 の `-i` パラメータと同じです（[PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/) を参照）：

- `max`：CPU の最大コア数を使用
- `-1`：CPU の最大コア数 -1 を使用
- `<number>`：コア数を指定

デフォルト値は空で、有効にしないことを意味します。

:::warning{title="注意"}
このモードはクラスターモード関連のプラグインと組み合わせて使用する必要があります。そうしないと、アプリケーションの機能に異常が発生する可能性があります。
:::

詳細は [クラスターモード](#) を参照してください。

## PLUGIN_PACKAGE_PREFIX

プラグインパッケージ名のプレフィックス。デフォルトは `@nocobase/plugin-,@nocobase/preset-` です。

例えば、`hello` プラグインを `my-nocobase-app` プロジェクトに追加する場合、プラグインの完全なパッケージ名は `@my-nocobase-app/plugin-hello` になります。

PLUGIN_PACKAGE_PREFIX は以下のように設定できます：

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

これにより、プラグイン名とパッケージ名の対応関係は以下のようになります：

- `users` プラグインのパッケージ名は `@nocobase/plugin-users`
- `nocobase` プラグインのパッケージ名は `@nocobase/preset-nocobase`
- `hello` プラグインのパッケージ名は `@my-nocobase-app/plugin-hello`

## DB_DIALECT

データベースタイプ。選択可能なオプションは以下のとおりです：

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

## DB_HOST

データベースホスト（MySQL または PostgreSQL データベースを使用する場合に設定が必要です）

デフォルト値は `localhost` です。

```bash
DB_HOST=localhost
```

## DB_PORT

データベースポート（MySQL または PostgreSQL データベースを使用する場合に設定が必要です）

- MySQL、MariaDB のデフォルトポートは 3306
- PostgreSQL のデフォルトポートは 5432

```bash
DB_PORT=3306
```

## DB_DATABASE

データベース名（MySQL または PostgreSQL データベースを使用する場合に設定が必要です）

```bash
DB_DATABASE=nocobase
```

## DB_USER

データベースユーザー（MySQL または PostgreSQL データベースを使用する場合に設定が必要です）

```bash
DB_USER=nocobase
```

## DB_PASSWORD

データベースパスワード（MySQL または PostgreSQL データベースを使用する場合に設定が必要です）

```bash
DB_PASSWORD=nocobase
```

## DB_TABLE_PREFIX

データテーブルのプレフィックス

```bash
DB_TABLE_PREFIX=nocobase_
```

## DB_UNDERSCORED

データベースのテーブル名・フィールド名を snake case スタイルに変換するかどうか。デフォルトは `false` です。MySQL（MariaDB）データベースを使用し、`lower_case_table_names=1` の場合、DB_UNDERSCORED を `true` に設定する必要があります。

:::warning 注意
`DB_UNDERSCORED=true` の場合、データベースの実際のテーブル名やフィールド名は画面上の表示と異なります。例えば `orderDetails` はデータベースでは `order_details` になります。
:::

## DB_LOGGING

データベースログのスイッチ。デフォルト値は `off` で、選択可能なオプションは以下のとおりです：

- `on` 有効
- `off` 無効

```bash
DB_LOGGING=on
```

## LOGGER_TRANSPORT

ログの出力方法。複数の場合は `,` で区切ります。開発環境のデフォルト値は `console`、本番環境のデフォルト値は `console,dailyRotateFile` です。
選択可能なオプション：

- `console` - `console.log`
- `file` - `ファイル`
- `dailyRotateFile` - `日次ローテーションファイル`

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

## LOGGER_BASE_PATH

ファイルベースのログ保存パス。デフォルトは `storage/logs` です。

```bash
LOGGER_BASE_PATH=storage/logs
```

## LOGGER_LEVEL

出力ログレベル。開発環境のデフォルト値は `debug`、本番環境のデフォルト値は `info` です。選択可能なオプション：

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

データベースログの出力レベルは `debug` で、`DB_LOGGING` によって出力するかどうかが制御されます。`LOGGER_LEVEL` の影響は受けません。

## LOGGER_MAX_FILES

ログファイルの最大保持数。

- `LOGGER_TRANSPORT` が `file` の場合、デフォルト値は `10` です。
- `LOGGER_TRANSPORT` が `dailyRotateFile` の場合、`[n]d` で日数を指定します。デフォルト値は `14d` です。

```bash
LOGGER_MAX_FILES=14d
```

## LOGGER_MAX_SIZE

サイズベースのログローテーション。

- `LOGGER_TRANSPORT` が `file` の場合、単位は `byte` で、デフォルト値は `20971520 (20 * 1024 * 1024)` です。
- `LOGGER_TRANSPORT` が `dailyRotateFile` の場合、`[n]k`、`[n]m`、`[n]g` を使用できます。デフォルトでは未設定です。

```bash
LOGGER_MAX_SIZE=20971520
```

## LOGGER_FORMAT

ログの出力フォーマット。開発環境のデフォルトは `console`、本番環境のデフォルトは `json` です。選択可能なオプション：

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

参考：[ログフォーマット](#)

## CACHE_DEFAULT_STORE

キャッシュ方式の一意識別子。サーバー側のデフォルトキャッシュ方式を指定します。デフォルト値は `memory` で、組み込みの選択可能なオプションは以下のとおりです：

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

## CACHE_MEMORY_MAX

メモリキャッシュの最大項目数。デフォルト値は `2000` です。

```bash
CACHE_MEMORY_MAX=2000
```

## CACHE_REDIS_URL

Redis 接続。オプションです。例：`redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

## TELEMETRY_ENABLED

テレメトリデータ収集を有効にします。デフォルトは `off` です。

```bash
TELEMETRY_ENABLED=on
```

## TELEMETRY_METRIC_READER

有効にする監視メトリクスコレクター。デフォルトは `console` です。その他の値は、対応するコレクタープラグインが登録する名前を参照してください（例：`prometheus`）。複数の場合は `,` で区切ります。

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

## TELEMETRY_TRACE_PROCESSOR

有効にするトレースデータプロセッサー。デフォルトは `console` です。その他の値は、対応するプロセッサープラグインが登録する名前を参照してください。複数の場合は `,` で区切ります。

```bash
TELEMETRY_TRACE_PROCESSOR=console
```
