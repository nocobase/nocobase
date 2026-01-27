---
pkg: "@nocobase/plugin-data-source-manager"
---
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::


# データソース管理

## はじめに

NocoBase は、データソースとそのコレクションを管理するためのデータソース管理プラグインを提供しています。データソース管理プラグインは、すべてのデータソースの管理インターフェースを提供するだけで、データソースにアクセスする機能は提供していません。これは、さまざまなデータソースプラグインと組み合わせて使用する必要があります。現在、アクセスをサポートしているデータソースは以下の通りです。

- [メインデータベース](/data-sources/data-source-main)：NocoBase のメインデータベースで、MySQL、PostgreSQL、MariaDB などのリレーショナルデータベースをサポートしています。
- [外部 MySQL](/data-sources/data-source-external-mysql)：外部の MySQL データベースをデータソースとして使用します。
- [外部 MariaDB](/data-sources/data-source-external-mariadb)：外部の MariaDB データベースをデータソースとして使用します。
- [外部 PostgreSQL](/data-sources/data-source-external-postgres)：外部の PostgreSQL データベースをデータソースとして使用します。
- [外部 MSSQL](/data-sources/data-source-external-mssql)：外部の MSSQL（SQL Server）データベースをデータソースとして使用します。
- [外部 Oracle](/data-sources/data-source-external-oracle)：外部の Oracle データベースをデータソースとして使用します。

これに加えて、プラグインを通じてさらに多くのタイプを拡張できます。一般的な各種データベースだけでなく、API（SDK）を提供するプラットフォームもデータソースとして利用可能です。

## インストール

内蔵プラグインのため、個別のインストールは不要です。

## 使用方法

アプリケーションの初期インストール時に、NocoBase のデータを保存するためのデータソースがデフォルトで提供されます。これはメインデータベースと呼ばれます。詳細については、[メインデータベース](/data-sources/data-source-main/)のドキュメントをご覧ください。

### 外部データソース

外部データベースをデータソースとしてサポートしています。詳細については、[外部データベース / はじめに](/data-sources/data-source-manager/external-database)のドキュメントをご覧ください。

![nocobase_doc-2025-10-29-19-45-33](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-45-33.png)

### データベースで作成されたテーブルの同期をサポート

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

HTTP API からのデータも利用できます。詳細については、[REST API データソース](/data-sources/data-source-rest-api/)のドキュメントをご覧ください。