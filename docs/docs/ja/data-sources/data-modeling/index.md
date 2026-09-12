---
title: "データモデリングの概要"
description: "データモデリング：データモデルの設計、さまざまなデータソースへの接続、ER図の可視化、データテーブルの作成に対応し、メインデータベースと外部データベースをサポートします。"
keywords: "データモデリング,Collection,データモデル,ER図,メインデータベース,外部データベース,NocoBase"
---

# 概要

データモデリングは、データベースを設計する際の重要なステップです。現実世界に存在するさまざまなデータと、それらの相互関係を詳細に分析・抽象化するプロセスを指します。このプロセスでは、データ間に存在する本質的な関係を明らかにし、それをデータモデルとして形式化することで、情報システムのデータベース構造の基盤を構築します。NocoBaseはデータモデル駆動型のプラットフォームで、以下のような特徴があります。

## さまざまなデータソースへの接続に対応

NocoBaseのデータソースには、一般的な各種データベース、API（SDK）プラットフォーム、ファイルなどを利用できます。

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBaseには、各データソースとそのデータテーブルを管理するための[データソース管理プラグイン](/data-sources/data-source-manager)が用意されています。データソース管理プラグインは、すべてのデータソースを管理するためのインターフェースを提供するものであり、データソースへの接続機能自体は提供しません。そのため、各データソースプラグインと組み合わせて使用する必要があります。現在、以下のデータソースに対応しています。

- [Main Database](/data-sources/data-source-main)：NocoBaseのメインデータベース。MySQL、PostgreSQL、MariaDBなどのリレーショナルデータベースに対応しています。
- [KingbaseES](/data-sources/data-source-kingbase)：人大金倉（KingbaseES）データベースをデータソースとして使用します。メインデータベースとしても、外部データベースとしても利用できます。
- [External MySQL](/data-sources/data-source-external-mysql)：外部のMySQLデータベースをデータソースとして使用します。
- [External MariaDB](/data-sources/data-source-external-mariadb)：外部のMariaDBデータベースをデータソースとして使用します。
- [External PostgreSQL](/data-sources/data-source-external-postgres)：外部のPostgreSQLデータベースをデータソースとして使用します。
- [External MSSQL](/data-sources/data-source-external-mssql)：外部のMSSQL（SQL Server）データベースをデータソースとして使用します。
- [External Oracle](/data-sources/data-source-external-oracle)：外部のOracleデータベースをデータソースとして使用します。

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## 多様なデータモデリングツールを提供

**シンプルなデータテーブル管理インターフェース**：さまざまなモデル（データテーブル）を作成したり、既存のモデル（データテーブル）に接続したりするために使用します。

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**ER図形式のビジュアルインターフェース**：ユーザーや業務上の要件からエンティティとその関係を抽出するために使用します。データモデルを直感的かつ分かりやすく表現できるため、ER図を通じてシステム内の主要なデータエンティティと、それらの関係をより明確に理解できます。

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## さまざまなデータテーブルの作成に対応

| データテーブル | 説明 |
| - | - |
| [通常のデータテーブル](/data-sources/data-source-main/general-collection) | よく使用されるシステムフィールドが組み込まれています |
| [カレンダーデータテーブル](/data-sources/calendar/calendar-collection) | カレンダー関連のイベントテーブルを作成するために使用します |
| コメントテーブル | データへのコメントやフィードバックを保存するために使用します |
| [ツリー構造テーブル](/data-sources/collection-tree) | 現在は隣接リストモデルの設計にのみ対応しています |
| [ファイルデータテーブル](/data-sources/file-manager/file-collection) | ファイルストレージを管理するために使用します |
| [SQLデータテーブル](/data-sources/collection-sql) | 実際のデータベーステーブルではなく、SQLクエリをすばやく構造化して表示するためのものです |
| [データベースビューへの接続](/data-sources/collection-view) | 既存のデータベースビューに接続します |
| 式テーブル | ワークフローの動的な式を使用するシナリオに適しています |
| [外部データへの接続](/data-sources/collection-fdw) | データベースのFDW技術に基づき、リモートデータテーブルに接続します |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

詳しくは「[データテーブル / 概要](/data-sources/data-modeling/collection)」の章をご覧ください。

## 豊富なフィールドタイプを提供

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

詳しくは「[データテーブルフィールド / 概要](/data-sources/data-modeling/collection-fields)」の章をご覧ください。