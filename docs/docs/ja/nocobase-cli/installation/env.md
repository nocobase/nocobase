# アプリケーション構成と `.env`

このページは、NocoBase CLI を介して作成またはホストされるアプリケーションにのみ適用されます。

[CLI を使用したインストール (推奨)](./cli.md) を読み終えて、「インストール ディレクトリ」セクションを見た場合は、通常、遭遇する最も一般的な問題は次のとおりです。

- `.env` ファイルはどこにありますか?
- `.env` に書き込むのにまだ適している構成はどれですか
- どの構成が `nb env update` に引き継ぐのに適しているか

まず結論からお話しましょう。

- CLI がインストールされたアプリケーションの場合、`.env` はデフォルトで `<app-path>/.env` に配置されます
- このファイルはオプションです。すべての環境を手動で作成する必要はありません
- `APP_KEY`、`TZ`、`APP_PORT`、`APP_PUBLIC_PATH`、`DB_*` などの基本構成は、デフォルトでは `nb env update` によって管理されます。
- `.env` は主に、ストレージ、キャッシュ、ログ、監視、一部のプラグイン拡張変数など、CLI が直接引き継いでいないランタイム変数を補足するために使用されます。

## 最初に `app-path` を見つけます

[CLIを使用したインストール(推奨)](./cli.md#インストールディレクトリ)における、CLI環境のデフォルトのディレクトリ構成は以下のとおりです。

```text
<app-path>/
├── source/
├── storage/
└── .env
```

現在適用されている `app-path` がどこにあるのかわからない場合は、次のようにして直接確認できます。

```bash
nb env info app1 --field app.appPath
```

`app1` を環境名に置き換えるだけです。

つまり、CLI を介して作成またはホストされるアプリケーションの場合、`.env` ファイルの最適な場所は次のとおりです。

```text
<app-path>/.env
```

一般に、古いインストール方法に従って、`source/.env` に配置する必要はなく、Docker Compose プロジェクトのルート ディレクトリで `.env` を見つける必要もありません。

## `.env` を自分で作成する必要があるのはどのような場合ですか?

`.env` はオプションです。

最初にアプリケーションを実行するだけの場合、またはポート、タイムゾーン、データベース接続、パブリック アクセス パスなどの基本構成を変更するだけの場合は、多くの場合、`.env` を手動で作成する必要はありません。

CLI が直接引き継いでいないランタイム変数を追加する必要がある場合にのみ、`<app-path>/.env` に追加してください。

## デフォルトでは最初に `nb env update` を使用します

新しい CLI インストール方法では、デフォルトで基本的なアプリケーション構成を [`nb env update`](../../api/cli/env/update.md) に優先させることをお勧めします。

これには次の 2 つの利点があります。

- 構成と環境自体は同じ CLI マインドに保存されるため、確認と変更が容易になります
- 将来的には、ユーザー、スクリプト、AI エージェントはメンテナンスのために同じコマンド セットを使用し続けることができるため、「あるセットの変更がファイルに行われたが、別のセットが CLI に記録される」という状況が起こりにくくなります。

### これらの構成は、`nb env update` に引き渡すのに適しています。

以下の項目については、以前は `.env` に直接書き込むことに慣れていたかもしれません。ただし、CLI インストール モードでは、デフォルトで `nb env update` を使用することをお勧めします。

|変わりたい… |デフォルトを変更する方法 |
| --- | --- |
| `APP_KEY` | `nb env update <name> --app-key <value>` |
| `TZ` | `nb env update <name> --timezone <value>` |
| `APP_PORT` | `nb env update <name> --app-port <value>` |
| `APP_PUBLIC_PATH` | `nb env update <name> --app-public-path <value>` |
| `CDN_BASE_URL` | `nb env update <name> --cdn-base-url <value>` |
|データベースの種類と接続パラメータ (`DB_DIALECT`、`DB_HOST`、`DB_PORT`、`DB_DATABASE`、`DB_USER`、`DB_PASSWORD` など) `nb env update <name> --db-dialect ... --db-host ... --db-port ... --db-database ... --db-user ... --db-password ...` |
| PostgreSQL スキーマ、テーブル接頭辞、データベース補助項目などの名前付けのアンダースコア (`DB_SCHEMA`、`DB_TABLE_PREFIX`、`DB_UNDERSCORED` など) | `nb env update <name> --db-schema ... --db-table-prefix ... --db-underscored` |

たとえば、アプリケーションのポートとタイムゾーンを変更したい場合は、次のように直接記述できます。

```bash
nb env update app1 --app-port 13080 --timezone Asia/Shanghai
```

データベース接続パラメータを変更したい場合は、次のように記述できます。

```bash
nb env update app1 \
  --db-dialect postgres \
  --db-host 127.0.0.1 \
  --db-port 5432 \
  --db-database nocobase \
  --db-user nocobase \
  --db-password nocobase
```

変更を加えた後、通常、CLI は後で `nb app restart` を実行するように求めるプロンプトを表示します。より完全なパラメーターの説明については、[`nb env update`](../../api/cli/env/update.md) を参照してください。

## `.env` に書き込むのがより適切な状況はどれですか

変数に対応する CLI パラメーターがまだない場合、または「アプリケーション ランタイムに直接渡される」拡張構成に近い場合は、`<app-path>/.env` の書き込みを続けます。

通常、次のカテゴリが含まれます。

- ファイル ストレージおよびオブジェクト ストレージ構成 (`LOCAL_STORAGE_*`、`AWS_S3_*`、`ALI_OSS_*`、`TX_COS_*` など)
- キャッシュと Redis の構成 (`CACHE_*`、`REDIS_URL` など)
- ログおよび観察の構成 (`LOGGER_*`、`TELEMETRY_*` など)
- エクスポート、非同期タスク、ワークフロー、AI 拡張機能関連の変数など、特定のプラグインまたは拡張機能固有の変数

例えば：

```bash
LOCAL_STORAGE_DEST=storage/uploads
AWS_S3_BUCKET=your-bucket
AWS_S3_REGION=ap-southeast-1
LOGGER_LEVEL=info
REDIS_URL=redis://127.0.0.1:6379
```

このタイプの変数は基本的にアプリケーションのランタイム構成であり、現時点では CLI はそれを項目ごとに引き継ぎません。 `.env` に配置するのが最も自然です。

## `.env` と `nb env update` の間で作業を分割する方法

特定の構成をどこに配置すべきかわからない場合は、デフォルトで次のルールに従ってください。

- `nb env update` に対応するパラメータがすでにある場合は、デフォルトでそのパラメータが最初に使用されます。
- 対応するパラメータがない場合、または明らかにプラグイン、ストレージ、キャッシュ、ログなどのランタイム拡張設定に属する場合は、`<app-path>/.env` に配置します。

ほとんどのシナリオでは、この役割分担で十分です。

### よくある誤解

同じ構成の 2 つのコピーを同時に維持しないでください。

たとえば、`APP_PORT`、`TZ`、`APP_PUBLIC_PATH`、`DB_HOST` などの基本的な項目を `nb env update` で保存した場合、通常はそれらを `.env` に再度記述する必要はありません。そうしないと、後で問題のトラブルシューティングを行うときに、どのレイヤーが実際に有効にしたい値であるかが分からなくなりやすくなります。

## 最小限の `.env` の例

基本設定が CLI を通じて保存されている場合、`.env` はおそらく次のようないくつかの拡張変数を保持するだけで済みます。

```bash
LOGGER_LEVEL=info
REDIS_URL=redis://127.0.0.1:6379
AWS_S3_BUCKET=your-bucket
AWS_S3_REGION=ap-southeast-1
```

これは、このページが構築するのに最も役立ちたい考え方でもあります。

`.env` は依然として便利ですが、新しい CLI インストール方法では、すべての基本的なインストール パラメーターを引き続き想定するのではなく、ランタイム拡張機能の構成を補足することに重点が置かれています。

## 次にどこを見るべきか

・ アプリケーションのディレクトリ構成を確認していない場合は、「CLIを使用したインストール(推奨)」(./cli.md#インストールディレクトリ)に戻ってください。
- ポート、タイムゾーン、データベース接続、パブリック アクセス パスなどの基本構成を変更する場合は、引き続き [`nb env update`](../../api/cli/env/update.md) を参照してください。
- アプリケーションのログを起動、再起動、表示したい場合は、引き続き [アプリケーションの管理](../operations/manage-app.md) を参照してください。
