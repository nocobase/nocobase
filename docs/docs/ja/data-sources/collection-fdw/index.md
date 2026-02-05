---
pkg: "@nocobase/plugin-collection-fdw"
---
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::


# 外部データテーブル（FDW）に接続する

## 概要

この**プラグイン**は、データベースのForeign Data Wrapper（FDW）を利用して、リモートのデータテーブルに接続する機能を提供します。現在、MySQLとPostgreSQLデータベースに対応しています。

:::info{title="データソースへの接続 vs 外部データテーブルへの接続"}
- **データソース**への接続とは、特定のデータベースやAPIサービスとの接続を確立し、そのデータベースの機能やAPIが提供するサービスを完全に利用することを指します。
- **外部データテーブル**への接続とは、外部からデータを取得し、ローカルで利用できるようにマッピングすることを指します。データベースではFDW（Foreign Data Wrapper）と呼ばれ、リモートテーブルをローカルテーブルとして利用することに重点を置いたデータベース技術です。テーブルは1つずつしか接続できません。リモートアクセスであるため、利用時には様々な制約や制限があります。

これら2つは組み合わせて使用することもできます。前者は**データソース**との接続を確立するために使用され、後者は**データソース**をまたいだアクセスに利用されます。例えば、あるPostgreSQL**データソース**に接続し、その**データソース**内にあるテーブルがFDWに基づいて作成された外部データテーブルである、といったケースが考えられます。
:::

### MySQL

MySQLでは、`federated` エンジンを使用します。このエンジンは有効化が必要で、リモートのMySQLやMariaDBなどのプロトコル互換データベースへの接続をサポートしています。詳細については、[Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html)のドキュメントをご参照ください。

### PostgreSQL

PostgreSQLでは、様々な種類の`fdw`拡張機能を利用して、異なるタイプのリモートデータをサポートできます。現在サポートされている拡張機能は以下の通りです。

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html)：PostgreSQLからリモートのPostgreSQLデータベースに接続します。
- [mysql_fdw(開発中)](https://github.com/EnterpriseDB/mysql_fdw)：PostgreSQLからリモートのMySQLデータベースに接続します。
- その他の`fdw`拡張機能については、[PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers)をご参照ください。NocoBaseに組み込むには、コード内で対応するアダプターインターフェースを実装する必要があります。

## インストール

前提条件

- NocoBaseのメインデータベースがMySQLの場合、`federated`を有効化する必要があります。詳細については、[MySQLでfederatedエンジンを有効にする方法](./enable-federated.md)をご参照ください。

その後、**プラグイン**マネージャーから**プラグイン**をインストールして有効化します。

![プラグインをインストールして有効化](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## 利用方法

「**コレクション**管理 > **コレクション**を作成」のドロップダウンから、「外部データに接続」を選択します。

![外部データに接続](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

「データベースサービス」のドロップダウンオプションで、既存のデータベースサービスを選択するか、「データベースサービスを作成」を選択します。

![データベースサービス](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

データベースサービスを作成します。

![データベースサービスを作成](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

データベースサービスを選択した後、「リモートテーブル」のドロップダウンオプションから、接続したいデータテーブルを選択します。

![接続したいデータテーブルを選択](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

フィールド情報を設定します。

![フィールド情報を設定](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

リモートテーブルに構造変更があった場合は、「リモートテーブルから同期」することもできます。

![リモートテーブルから同期](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

リモートテーブルの同期

![リモートテーブルの同期](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

最後に、インターフェースに表示されます。

![インターフェースに表示](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)