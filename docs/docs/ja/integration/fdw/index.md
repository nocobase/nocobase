:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/integration/fdw/index)をご参照ください。
:::

# 外部データテーブルの接続 (FDW)

## 紹介

データベースの Foreign Data Wrapper (FDW) に基づいて、リモートデータテーブルに接続する機能です。現在、MySQL および PostgreSQL データベースをサポートしています。

:::info{title="データソースの接続 vs 外部データテーブルの接続"}
- **データソースの接続**とは、特定のデータベースや API サービスとの接続を確立することを指します。データベースの機能や API が提供するサービスをフルに活用できます。
- **外部データテーブルの接続**とは、外部からデータを取得し、ローカルで使用するためにマッピングすることを指します。データベース用語では FDW (Foreign Data Wrapper) と呼ばれ、リモートテーブルをローカルテーブルとして扱うことに特化した技術です。一度に接続できるのは 1 テーブルずつです。リモートアクセスであるため、使用時にはさまざまな制約や制限があります。

これら 2 つを組み合わせて使用することも可能です。前者はデータソースとの接続を確立するために使用し、後者はデータソースをまたいだアクセスに使用します。例えば、ある PostgreSQL データソースに接続しており、そのデータソース内にある特定のテーブルが FDW に基づいて作成された外部データテーブルである場合などです。
:::

### MySQL

MySQL では `federated` ストレージエンジンを使用します。これを有効化する必要があり、リモートの MySQL および MariaDB などのプロトコル互換データベースへの接続をサポートしています。詳細については、[Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html) のドキュメントを参照してください。

### PostgreSQL

PostgreSQL では、さまざまな種類の `fdw` 拡張機能を使用して、異なるリモートデータ型をサポートできます。現在サポートされている拡張機能は以下の通りです：

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html)：PostgreSQL 内でリモートの PostgreSQL データベースに接続します。
- [mysql_fdw](https://github.com/EnterpriseDB/mysql_fdw)：PostgreSQL 内でリモートの MySQL データベースに接続します。
- その他の種類の fdw 拡張機能については、[PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers) を参照してください。NocoBase に統合するには、コード内で対応するアダプターインターフェースを実装する必要があります。

## 前提条件

- NocoBase のメインデータベースが MySQL の場合は、`federated` を有効にする必要があります。[MySQL で federated エンジンを有効にする方法](./enable-federated) を参照してください。

その後、プラグインマネージャーからプラグインをインストールして有効化します。

![プラグインのインストールと有効化](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## 使用方法

「コレクション管理 > コレクションの作成」のドロップダウンから、「外部データに接続」を選択します。

![外部データに接続](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

「データベースサービス」のドロップダウンオプションから、既存のデータベースサービスを選択するか、「データベースサービスを作成」を選択します。

![データベースサービス](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

データベースサービスを作成します。

![データベースサービスの作成](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

データベースサービスを選択した後、「リモートテーブル」のドロップダウンオプションから、接続するデータテーブルを選択します。

![接続するデータテーブルの選択](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

フィールド情報を設定します。

![フィールド情報の設定](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

リモートテーブルの構造に変更があった場合は、「リモートテーブルから同期」することも可能です。

![リモートテーブルから同期](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

リモートテーブルの同期。

![リモートテーブルの同期](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

最後に、インターフェースに表示されます。

![インターフェースでの表示](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)