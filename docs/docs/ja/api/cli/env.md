:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# グローバル環境変数

## TZ

アプリケーションのタイムゾーンを設定します。デフォルトはオペレーティングシステムのタイムゾーンです。

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

:::warning
時間に関連する操作はこのタイムゾーンに基づいて処理されます。`TZ` を変更すると、データベース内の日付値に影響を与える可能性があります。詳細は「[日付と時刻の概要](#)」をご覧ください。
:::

## APP_ENV

アプリケーションの環境を設定します。デフォルト値は `development` です。選択肢は以下の通りです。

- `production`：本番環境
- `development`：開発環境

```bash
APP_ENV=production
```

## APP_KEY

アプリケーションの秘密鍵です。ユーザーのトークン生成などに使用されます。ご自身のアプリケーションキーに変更し、外部に漏洩しないように注意してください。

:::warning
`APP_KEY` を変更すると、以前のトークンは無効になります。
:::

```bash
APP_KEY=app-key-test
```

## APP_PORT

アプリケーションのポート番号です。デフォルト値は `13000` です。

```bash
APP_PORT=13000
```

## API_BASE_PATH

NocoBase API のアドレスプレフィックスです。デフォルト値は `/api/` です。

```bash
API_BASE_PATH=/api/
```

## API_BASE_URL

## CLUSTER_MODE

> `v1.6.0+`

マルチコア（クラスター）起動モードです。この変数を設定すると、`pm2 start` コマンドに `-i <instances>` パラメーターとして渡されます。選択肢は pm2 の `-i` パラメーターと同じです（[PM2: Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/) を参照）。

- `max`：CPU の最大コア数を使用します。
- `-1`：CPU の最大コア数から 1 を引いた数を使用します。
- `<number>`：指定されたコア数を使用します。

デフォルト値は空で、このモードは有効になりません。

:::warning{title="注意"}
このモードは、クラスターモード関連の**プラグイン**と組み合わせて使用する必要があります。そうしないと、アプリケーションの機能が異常になる可能性があります。
:::

詳細は「[クラスターモード](#)」をご覧ください。

## PLUGIN_PACKAGE_PREFIX

**プラグイン**のパッケージ名のプレフィックスです。デフォルトは `@nocobase/plugin-,@nocobase/preset-` です。

例えば、`my-nocobase-app` プロジェクトに `hello` **プラグイン**を追加する場合、**プラグイン**の完全なパッケージ名は `@my-nocobase-app/plugin-hello` となります。

`PLUGIN_PACKAGE_PREFIX` は次のように設定できます。

```bash
PLUGIN_PACKAGE_PREFIX=@nocobase/plugin-,@nocobase-preset-,@my-nocobase-app/plugin-
```

その場合、**プラグイン**名とパッケージ名の対応関係は以下のようになります。

- `users` **プラグイン**のパッケージ名は `@nocobase/plugin-users` です。
- `nocobase` **プラグイン**のパッケージ名は `@nocobase/preset-nocobase` です。
- `hello` **プラグイン**のパッケージ名は `@my-nocobase-app/plugin-hello` です。

## DB_DIALECT

データベースの種類です。選択肢は以下の通りです。

- `mariadb`
- `mysql`
- `postgres`

```bash
DB_DIALECT=mysql
```

## DB_HOST

データベースのホスト名です（MySQL または PostgreSQL データベースを使用する場合に必要です）。

デフォルト値は `localhost` です。

```bash
DB_HOST=localhost
```

## DB_PORT

データベースのポート番号です（MySQL または PostgreSQL データベースを使用する場合に必要です）。

- MySQL、MariaDB のデフォルトポートは `3306` です。
- PostgreSQL のデフォルトポートは `5432` です。

```bash
DB_PORT=3306
```

## DB_DATABASE

データベース名です（MySQL または PostgreSQL データベースを使用する場合に必要です）。

```bash
DB_DATABASE=nocobase
```

## DB_USER

データベースのユーザー名です（MySQL または PostgreSQL データベースを使用する場合に必要です）。

```bash
DB_USER=nocobase
```

## DB_PASSWORD

データベースのパスワードです（MySQL または PostgreSQL データベースを使用する場合に必要です）。

```bash
DB_PASSWORD=nocobase
```

## DB_TABLE_PREFIX

データベースのテーブルプレフィックスです。

```bash
DB_TABLE_PREFIX=nocobase_
```

## DB_UNDERSCORED

データベースのテーブル名とフィールド名をスネークケース形式に変換するかどうかを設定します。デフォルトは `false` です。MySQL（MariaDB）データベースを使用しており、`lower_case_table_names=1` の場合は、`DB_UNDERSCORED` を `true` に設定する必要があります。

:::warning
`DB_UNDERSCORED=true` の場合、データベース内の実際のテーブル名とフィールド名は、インターフェースで表示されるものと異なります。例えば、`orderDetails` はデータベースでは `order_details` となります。
:::

## DB_LOGGING

データベースのログ出力のオン/オフを切り替えます。デフォルト値は `off` です。選択肢は以下の通りです。

- `on`：有効
- `off`：無効

```bash
DB_LOGGING=on
```

## LOGGER_TRANSPORT

ログの出力方法です。複数指定する場合は `,` で区切ります。開発環境でのデフォルト値は `console`、本番環境でのデフォルト値は `console,dailyRotateFile` です。
選択肢：

- `console` - `console.log`
- `file` - ファイル
- `dailyRotateFile` - 日次ローテーションファイル

```bash
LOGGER_TRANSPORT=console,dailyRotateFile
```

## LOGGER_BASE_PATH

ファイルベースのログ保存パスです。デフォルトは `storage/logs` です。

```bash
LOGGER_BASE_PATH=storage/logs
```

## LOGGER_LEVEL

出力するログレベルです。開発環境でのデフォルト値は `debug`、本番環境でのデフォルト値は `info` です。選択肢は以下の通りです。

- `error`
- `warn`
- `info`
- `debug`
- `trace`

```bash
LOGGER_LEVEL=info
```

データベースのログ出力レベルは `debug` で、`DB_LOGGING` によって出力が制御されます。`LOGGER_LEVEL` の影響は受けません。

## LOGGER_MAX_FILES

保持するログファイルの最大数です。

- `LOGGER_TRANSPORT` が `file` の場合、デフォルト値は `10` です。
- `LOGGER_TRANSPORT` が `dailyRotateFile` の場合、`[n]d` は日数を表します。デフォルト値は `14d` です。

```bash
LOGGER_MAX_FILES=14d
```

## LOGGER_MAX_SIZE

サイズによるログローテーションを設定します。

- `LOGGER_TRANSPORT` が `file` の場合、単位は `byte` で、デフォルト値は `20971520 (20 * 1024 * 1024)` です。
- `LOGGER_TRANSPORT` が `dailyRotateFile` の場合、`[n]k`、`[n]m`、`[n]g` を使用できます。デフォルトでは設定されていません。

```bash
LOGGER_MAX_SIZE=20971520
```

## LOGGER_FORMAT

ログの出力形式です。開発環境でのデフォルトは `console`、本番環境でのデフォルトは `json` です。選択肢:

- `console`
- `json`
- `logfmt`
- `delimiter`

```bash
LOGGER_FORMAT=json
```

詳細は「[ログ形式](#)」をご覧ください。

## CACHE_DEFAULT_STORE

使用するキャッシュストアの一意の識別子です。サーバーサイドのデフォルトキャッシュストアを指定します。デフォルト値は `memory` です。組み込みの選択肢は以下の通りです。

- `memory`
- `redis`

```bash
CACHE_DEFAULT_STORE=memory
```

## CACHE_MEMORY_MAX

メモリキャッシュ内の最大項目数です。デフォルト値は `2000` です。

```bash
CACHE_MEMORY_MAX=2000
```

## CACHE_REDIS_URL

Redis への接続 URL です（オプション）。例：`redis://localhost:6379`

```bash
CACHE_REDIS_URL=redis://localhost:6379
```

## TELEMETRY_ENABLED

テレメトリーデータ収集を有効にします。デフォルトは `off` です。

```bash
TELEMETRY_ENABLED=on
```

## TELEMETRY_METRIC_READER

有効にする監視メトリックリーダーです。デフォルトは `console` です。その他の値は、対応するリーダー**プラグイン**の登録名（例：`prometheus`）を参照してください。複数指定する場合は `,` で区切ります。

```bash
TELEMETRY_METRIC_READER=console,prometheus
```

## TELEMETRY_TRACE_PROCESSOR

有効にするトレースデータプロセッサーです。デフォルトは `console` です。その他の値は、対応するプロセッサー**プラグイン**の登録名を参照してください。複数指定する場合は `,` で区切ります。

```bash
TELEMETRY_TRACE_PROCESSOR=console
```