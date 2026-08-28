---
pkg: "@nocobase/plugin-collection-fdw"
title: "外部データテーブル（FDW）への接続"
description: "Foreign Data Wrapper に基づいてリモートデータテーブルに接続する機能です。MySQL の federated エンジンや PostgreSQL の postgres_fdw を使用して、リモートテーブルをローカルテーブルとしてマッピングします。"
keywords: "FDW,Foreign Data Wrapper,federated,postgres_fdw,外部テーブル,リモートテーブル,NocoBase"
---
# 外部データテーブル（FDW）への接続

## 概要

データベースの foreign data wrapper に基づいて、リモートデータテーブルに接続するための機能プラグインです。現在、MySQL と PostgreSQL のデータベースに対応しています。

:::info{title="データソースへの接続 vs 外部データテーブルへの接続"}
- **データソースへの接続** とは、特定のデータベースまたは API サービスとの接続を確立し、データベースの機能や API が提供するサービスを完全に利用することを指します；
- **外部データテーブルへの接続** とは、外部からデータを取得してローカルで使用できるようにマッピングすることを指します。データベースでは FDW（Foreign Data Wrapper）と呼ばれる技術で、リモートテーブルをローカルテーブルとして扱うことに重点を置いており、1 回につき 1 つのテーブルに接続できます。リモートアクセスであるため、使用時にはさまざまな制約や制限があります。

両者を組み合わせて使用することもできます。前者でデータソースとの接続を確立し、後者でデータソースをまたいだアクセスを行います。たとえば、ある PostgreSQL データソースに接続し、そのデータソース内のテーブルが FDW に基づいて作成された外部データテーブルである場合などです。
:::

### MySQL

MySQL では `federated` エンジンを使用します。事前に有効化する必要があり、リモートの MySQL および MariaDB などの互換プロトコルを持つデータベースへの接続に対応しています。詳しくは [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html) のドキュメントを参照してください。

### PostgreSQL

PostgreSQL では、異なる種類の `fdw` 拡張機能によって、さまざまなリモートデータタイプに対応できます。現在、以下の拡張機能に対応しています：

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html)：PostgreSQL からリモートの PostgreSQL データベースに接続します。
- [mysql_fdw（開発中）](https://github.com/EnterpriseDB/mysql_fdw)：PostgreSQL からリモートの MySQL データベースに接続します。
- その他の種類の fdw 拡張機能については、[PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers) を参照してください。NocoBase に接続するには、コード内で対応するアダプターインターフェースを実装する必要があります。

## インストール

前提条件

- NocoBase のメインデータベースが MySQL の場合は、`federated` を有効化する必要があります。詳しくは [MySQL で federated エンジンを有効にする方法](./enable-federated.md) を参照してください。

その後、プラグインマネージャーからプラグインをインストールして有効化します。

![プラグインのインストールと有効化](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## 使用方法

「データテーブル管理 > データテーブルを作成」のドロップダウンから、「外部データに接続」を選択します。

![外部データへの接続](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

「データベースサービス」のドロップダウンから、既存のデータベースサービス、または「データベースサービスを作成」を選択します。

![データベースサービス](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

データベースサービスを作成します。

![データベースサービスの作成](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

データベースサービスを選択した後、「リモートテーブル」のドロップダウンから、接続するデータテーブルを選択します。

![接続するデータテーブルの選択](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

フィールド情報を設定します。

![フィールド情報の設定](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

リモートテーブルの構造に変更があった場合は、「リモートテーブルから同期」を実行できます。

![リモートテーブルから同期](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

リモートテーブルを同期します。

![リモートテーブルの同期](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

最後に、画面上に表示されます。

![画面上での表示](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)