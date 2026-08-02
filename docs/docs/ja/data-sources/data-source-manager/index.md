---
pkg: "@nocobase/plugin-data-source-manager"
title: "データソース管理"
description: "データソース管理プラグイン：メインデータベース、外部データベース、REST API データソース、外部 NocoBase データソースを管理し、統一されたデータソース管理画面を提供します。"
keywords: "データソース管理,メインデータベース,外部データベース,データテーブル同期,REST API データソース,NocoBase"
---
# データソース管理

## 概要

NocoBase は、データソースとそのデータテーブルを管理するためのデータソース管理プラグインを提供しています。データソース管理プラグインは、すべてのデータソースを管理するためのインターフェースを提供するだけで、データソースへの接続機能は提供しません。各種データソースプラグインと組み合わせて使用する必要があります。現在、接続をサポートしているデータソースは以下のとおりです。

- [メインデータベース](/data-sources/data-source-main/)：NocoBase のメインデータベース。MySQL、PostgreSQL、MariaDB、KingbaseES、OceanBase をサポートしています。
- [外部 PostgreSQL](/data-sources/data-source-external-postgres/)：外部の PostgreSQL データベースをデータソースとして使用します。
- [外部 MySQL](/data-sources/data-source-external-mysql/)：外部の MySQL データベースをデータソースとして使用します。
- [外部 MariaDB](/data-sources/data-source-external-mariadb/)：外部の MariaDB データベースをデータソースとして使用します。
- [外部 MSSQL](/data-sources/data-source-external-mssql/)：外部の MSSQL（SQL Server）データベースをデータソースとして使用します。
- [外部 KingbaseES](/data-sources/data-source-kingbase/)：外部の KingbaseES データベースをデータソースとして使用します。
- [外部 OceanBase](/data-sources/external/oceanbase)：外部の OceanBase データベースをデータソースとして使用します。
- [外部 Oracle](/data-sources/data-source-external-oracle/)：外部の Oracle データベースをデータソースとして使用します。
- [外部 ClickHouse](/data-sources/external/clickhouse)：外部の ClickHouse データベースをデータソースとして使用します。通常、クエリ、集計、レポート表示に使用されます。
- [外部 Doris](/data-sources/external/doris)：外部の Doris データベースをデータソースとして使用します。通常、クエリ、集計、レポート表示に使用されます。
- [REST API データソース](/data-sources/data-source-rest-api/)：REST API を介してデータを NocoBase に取り込みます。
- [外部 NocoBase](/data-sources/data-source-external-nocobase/)：リモート NocoBase API を介して、別の NocoBase アプリケーションを外部データソースとして使用します。

このほか、プラグインによってさらに多くの種類を拡張できます。一般的な各種データベースだけでなく、API（SDK）を提供するプラットフォームにも対応できます。

## インストール

組み込みプラグインのため、個別にインストールする必要はありません。

## 使用方法

アプリケーションの初期インストール時に、NocoBase のデータを保存するためのデータソースがデフォルトで 1 つ用意されます。これをメインデータベースと呼びます。詳しくは [メインデータベース](/data-sources/data-source-main/index.md) のドキュメントを参照してください。

### 外部データソース

外部データベースをデータソースとして使用できます。詳しくは [外部データベース / 概要](/data-sources/data-source-manager/external-database.md) のドキュメントを参照してください。

![nocobase_doc-2025-10-29-19-45-33](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-45-33.png)

### データベースで独自に作成したテーブルの同期をサポート

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

HTTP API から取得したデータを接続することもできます。詳しくは [REST API データソース](/data-sources/data-source-rest-api/index.md) のドキュメントを参照してください。

### 外部 NocoBase データソース

リモート NocoBase API を介して、別の NocoBase アプリケーションを外部データソースとして接続できます。詳しくは [外部 NocoBase](/data-sources/data-source-external-nocobase/index.md) のドキュメントを参照してください。
