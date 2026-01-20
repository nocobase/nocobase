:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# 概要

データモデリングは、データベース設計における重要なステップです。これは、現実世界の様々なデータとその相互関係を深く分析し、抽象化するプロセスを指します。このプロセスを通じて、私たちはデータ間の本質的なつながりを明らかにし、データモデルとして形式的に記述することで、情報システムのデータベース構造の基盤を築きます。NocoBaseはデータモデル駆動型のプラットフォームであり、以下の特徴を備えています。

## 様々なデータソースへの接続をサポート

NocoBaseの**データソース**は、一般的な各種データベース、API（SDK）プラットフォーム、ファイルに対応しています。

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBaseは、各**データソース**とその**コレクション**を管理するための[データソース管理**プラグイン**](/data-sources/data-source-manager)を提供しています。**データソース**管理**プラグイン**は、すべての**データソース**の管理インターフェースを提供するものであり、**データソース**への直接的な接続機能を提供するものではありません。様々な**データソース****プラグイン**と組み合わせて使用する必要があります。現在サポートされている**データソース**は以下の通りです。

- [メインデータベース](/data-sources/data-source-main)：NocoBaseのメインデータベースで、MySQL、PostgreSQL、MariaDBなどのリレーショナルデータベースをサポートしています。
- [KingbaseES](/data-sources/data-source-kingbase)：KingbaseESデータベースを**データソース**として使用します。メインデータベースとしても、外部データベースとしても利用できます。
- [外部MySQL](/data-sources/data-source-external-mysql)：外部のMySQLデータベースを**データソース**として使用します。
- [外部MariaDB](/data-sources/data-source-external-mariadb)：外部のMariaDBデータベースを**データソース**として使用します。
- [外部PostgreSQL](/data-sources/data-source-external-postgres)：外部のPostgreSQLデータベースを**データソース**として使用します。
- [外部MSSQL](/data-sources/data-source-external-mssql)：外部のMSSQL（SQL Server）データベースを**データソース**として使用します。
- [外部Oracle](/data-sources/data-source-external-oracle)：外部のOracleデータベースを**データソース**として使用します。

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## 多様なデータモデリングツールを提供

**シンプルなコレクション管理インターフェース**：様々なモデル（**コレクション**）を作成したり、既存のモデル（**コレクション**）に接続したりするために使用します。

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**ER図のようなビジュアルインターフェース**：ユーザーやビジネス要件からエンティティとその関係を抽出するために使用します。データモデルを直感的で分かりやすい方法で記述でき、ER図を通じてシステム内の主要なデータエンティティとその関連性をより明確に理解できます。

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## 様々な**コレクション**の作成をサポート

| コレクション | 説明 |
| - | - |
| [汎用コレクション](/data-sources/data-source-main/general-collection) | 一般的なシステムフィールドが組み込まれています。 |
| [カレンダーコレクション](/data-sources/calendar/calendar-collection) | カレンダー関連のイベント**コレクション**を作成するために使用します。 |
| コメントコレクション | データに対するコメントやフィードバックを保存するために使用します。 |
| [ツリーコレクション](/data-sources/collection-tree) | ツリー構造の**コレクション**で、現在は隣接リストモデルのみをサポートしています。 |
| [ファイルコレクション](/data-sources/file-manager/file-collection) | ファイルストレージの管理に使用します。 |
| [SQLコレクション](/data-sources/collection-sql) | 実際のデータベーステーブルではなく、SQLクエリを構造化された形式で素早く表示します。 |
| [データベースビューへの接続](/data-sources/collection-view) | 既存のデータベースビューに接続します。 |
| 式コレクション | **ワークフロー**における動的な式シナリオに使用します。 |
| [外部データへの接続](/data-sources/collection-fdw) | データベースのFDW技術に基づき、外部**コレクション**への接続を実現します。 |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

詳細については、「[コレクション / 概要](/data-sources/data-modeling/collection)」の章をご覧ください。

## 豊富なフィールドタイプを提供

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

詳細については、「[コレクションフィールド / 概要](/data-sources/data-modeling/collection-fields)」の章をご覧ください。