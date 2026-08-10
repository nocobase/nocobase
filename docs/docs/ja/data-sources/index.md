---
title: "データソースの概要"
description: "NocoBase のデータソースとデータモデリング：メインデータベース、外部データベース、REST API、外部 NocoBase、データソース管理、通常テーブル、ツリーテーブル、SQL テーブル、ファイルテーブル。"
keywords: "データソース,データモデリング,メインデータベース,外部データベース,REST API,外部 NocoBase,Collection,ツリーテーブル,SQL テーブル,NocoBase"
---

# 概要

データモデリングは、データベースを設計する際の重要なステップです。現実世界に存在するさまざまなデータとその相互関係を詳細に分析し、抽象化するプロセスです。このプロセスでは、データ間にある本質的なつながりを明らかにし、それをデータモデルとして形式的に記述することで、情報システムのデータベース構造の基盤を構築します。NocoBase はデータモデル駆動型のプラットフォームで、次のような特徴があります。

## さまざまなソースのデータに対応

NocoBase のデータソースには、一般的な各種データベース、API（SDK）プラットフォーム、ファイルを利用できます。

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase には、各データソースとそのデータテーブルを管理するための[データソース管理プラグイン](./data-source-manager/index.md)が用意されています。データソース管理プラグインは、すべてのデータソースを管理するためのインターフェースを提供するだけで、データソースへの接続機能は提供しません。そのため、各種データソースプラグインと組み合わせて使用する必要があります。現在、次のデータソースに対応しています。

- [メインデータソース](./data-source-main/index.md)：NocoBase のメインデータベース。PostgreSQL、MySQL、MariaDB、KingbaseES、OceanBase に対応しています。
- [外部 PostgreSQL](./data-source-external-postgres/index.md)：既存の PostgreSQL データベースに接続します。
- [外部 MySQL](./data-source-external-mysql/index.md)：既存の MySQL データベースに接続します。
- [外部 MariaDB](./data-source-external-mariadb/index.md)：既存の MariaDB データベースに接続します。
- [外部 MSSQL](./data-source-external-mssql/index.md)：既存の SQL Server データベースに接続します。
- [外部 KingbaseES](./data-source-kingbase/index.md)：既存の KingbaseES データベースに接続します。
- [外部 OceanBase](./external/oceanbase.md)：既存の OceanBase データベースに接続します。
- [外部 Oracle](./data-source-external-oracle/index.md)：既存の Oracle データベースに接続します。
- [外部 ClickHouse](./external/clickhouse.md)：既存の ClickHouse データベースに接続します。
- [外部 Doris](./external/doris.md)：既存の Doris データベースに接続します。
- [REST API データソース](./data-source-rest-api/index.md)：第三者システムの REST API をデータソースとしてマッピングします。
- [外部 NocoBase データソース](./data-source-external-nocobase/index.md)：別の NocoBase アプリケーション内のデータテーブルに接続します。

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## 多様なデータモデリングツールを提供

**シンプルなデータテーブル管理インターフェース**：さまざまなモデル（データテーブル）を作成したり、既存のモデル（データテーブル）に接続したりできます。

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**ER 図に似たビジュアルインターフェース**：ユーザーや業務の要件からエンティティとその関係を抽出するために使用します。データモデルを直感的かつ分かりやすく表現できるため、ER 図を通して、システム内の主要なデータエンティティとそれらの関係をより明確に理解できます。

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## さまざまなデータテーブルの作成に対応

| データテーブル | 説明 |
| - | - |
| [通常データテーブル](/data-sources/data-source-main/general-collection) | よく使用されるシステムフィールドが組み込まれています |
| [カレンダーデータテーブル](/data-sources/calendar/calendar-collection) | カレンダー関連のイベントテーブルを作成するために使用します |
| [コメントテーブル](/data-sources/collection-comment/) | データに対するコメントやフィードバックを保存するために使用します |
| [ツリー構造テーブル](/data-sources/collection-tree/) | ツリー構造のテーブル。現在は隣接リストによる設計にのみ対応しています |
| [ファイルデータテーブル](/data-sources/file-manager/file-collection) | ファイルストレージを管理するために使用します |
| [データベースビューへの接続](/data-sources/collection-view/) | 既存のデータベースビューに接続します |
| [SQL データテーブル](/data-sources/collection-sql/) | 実際のデータベーステーブルではなく、SQL クエリをすばやく構造化して表示するものです |
| [外部データへの接続](/data-sources/collection-fdw) | データベースの FDW 技術に基づいて、リモートデータテーブルに接続します |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

詳しくは「[データテーブル / 概要](/data-sources/data-modeling/collection)」の章を参照してください。

## 豊富なフィールドタイプを提供

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

詳しくは「[データテーブルフィールド / 概要](/data-sources/data-modeling/collection-fields/)」の章を参照してください。