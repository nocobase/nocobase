---
title: "外部データベース"
description: "NocoBase 外部データベース：既存の MySQL/PostgreSQL/MariaDB/KingbaseES/OceanBase/MSSQL/Oracle/ClickHouse/Doris データベースに接続し、データテーブルの構造を読み込み、フィールドマッピングとリレーションフィールドを設定します。"
keywords: "外部データベース,MySQL,PostgreSQL,MariaDB,KingbaseES,OceanBase,MSSQL,Oracle,ClickHouse,Doris,データテーブル同期,フィールドマッピング,NocoBase"
---

# 外部データベース

## 概要

外部データベースを使用すると、既存の業務データベースを NocoBase に接続し、外部データベース内のデータテーブル、フィールド、ビューを読み込んで、ページブロック、権限、ワークフロー、API で利用できるようになります。

[メインデータベース](../main/index.md)とは異なり、外部データベースのテーブル構造は元のシステムやデータベースクライアントによって管理されます。NocoBase はテーブル構造とビューの読み込みのみを行い、外部データベースの実際のテーブル構造を変更することはありません。

外部データベースがサポートするデータベースのバージョンとエディションは次のとおりです。

| データベース | サポートバージョン | Community Edition | Standard Edition | Professional Edition | Enterprise Edition |
| --- | --- | --- | --- | --- | --- |
| MySQL | >= 5.7 | ❌ | ✅ | ✅ | ✅ |
| PostgreSQL | >= 9.5 | ❌ | ✅ | ✅ | ✅ |
| MariaDB | >= 10.3 | ❌ | ✅ | ✅ | ✅ |
| MSSQL | 2014-2019 | ❌ | ✅ | ✅ | ✅ |
| KingbaseES | >=V9 | ❌ | ❌ | ✅ | ✅ |
| OceanBase | >=4.3 | ❌ | ❌ | ❌ | ✅ |
| Oracle | >= 11g | ❌ | ❌ | ❌ | ✅ |
| ClickHouse | 対応するプラグインの説明に準拠 | ❌ | ❌ | ❌ | ✅ |
| Doris | 対応するプラグインの説明に準拠 | ❌ | ❌ | ❌ | ✅ |

:::tip ヒント

KingbaseES は PostgreSQL 互換モードのみ、OceanBase、ClickHouse、Doris は MySQL 互換モードのみをサポートします。

:::

外部データベースの利用シーン：

- 既存の業務システム（旧 ERP、MES、WMS など）のデータベースに接続し、元のデータベースのテーブル構造を変更することなく、NocoBase の機能を活用して管理画面、権限制御、ワークフロー、レポートを迅速に構築する。
- 承認、データ修正、異常処理、運用ダッシュボードなど、既存システムに軽量なアプリケーション機能を追加する。元のシステムを置き換える必要はありません。
- 既存データベースに対して読み取り専用の検索、統計分析、BI 表示を行い、元の業務システム画面への依存を減らす。
- 旧システムを段階的に移行する。まず NocoBase から旧データベースに接続して利用を続け、その後、新しい業務データを段階的にメインデータベースで管理する。
- データベース構造は引き続き DBA、移行スクリプト、または元の業務システムで管理し、NocoBase は構造の読み込み、画面の設定、データの利用のみを担当する。

:::warning 注意

外部データベースは NocoBase のシステムデータベースではありません。NocoBase は外部データベースのバックアップ、復元、移行、テーブル構造を管理しません。これらは引き続き外部データベース側で管理する必要があります。

:::

## プラグインのインストール

外部データベースは、対応するデータソースプラグインによって提供されます。プラグインをインストールして有効化すると、「データソース管理」の「Add new」メニューから対応するデータベースタイプを選択できるようになります。

| データベース | 対応プラグイン | インストール方法 |
| --- | --- | --- |
| MySQL | `@nocobase/plugin-data-source-external-mysql` | 商用ライセンスが必要です。プラグインをインストールして有効化した後に使用できます。 |
| PostgreSQL | `@nocobase/plugin-data-source-external-postgres` | 商用ライセンスが必要です。プラグインをインストールして有効化した後に使用できます。 |
| MariaDB | `@nocobase/plugin-data-source-external-mariadb` | 商用ライセンスが必要です。プラグインをインストールして有効化した後に使用できます。 |
| KingbaseES | `@nocobase/plugin-data-source-kingbase` | 商用ライセンスが必要です。プラグインをインストールして有効化した後に使用できます。 |
| OceanBase | `@nocobase/plugin-data-source-oceanbase` | 商用ライセンスが必要です。プラグインをインストールして有効化した後に使用できます。 |
| MSSQL | `@nocobase/plugin-data-source-external-mssql` | 商用ライセンスが必要です。プラグインをインストールして有効化した後に使用できます。 |
| Oracle | `@nocobase/plugin-data-source-external-oracle` | 商用ライセンスが必要です。プラグインをインストールして有効化した後に使用できます。 |
| ClickHouse | `@nocobase/plugin-data-source-external-clickhouse` | 商用ライセンスが必要です。プラグインをインストールして有効化した後に使用できます。 |
| Doris | `@nocobase/plugin-data-source-external-doris` | 商用ライセンスが必要です。プラグインをインストールして有効化した後に使用できます。 |

![add_new_database](https://static-docs.nocobase.com/add_new_database.png)

「Add new」メニューに対象のデータベースタイプが表示されない場合は、通常、次の点を確認する必要があります。

- 対応するプラグインがインストールされているか
- プラグインが有効化されているか
- 現在の商用ライセンスにそのプラグインが含まれているか
- 現在のユーザーにデータソース管理権限があるか


## 使用方法

### 外部データベースの追加

プラグインを有効化すると、データソース管理の「Add new」ドロップダウンメニューから選択して追加できるようになります。

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

接続するデータベースの情報を入力します。

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### データテーブルの同期

外部データベースへの接続を確立すると、データソース内のすべてのデータテーブルが直接読み込まれます。外部データベースでは、データテーブルの直接追加やテーブル構造の変更はサポートされていません。変更が必要な場合は、データベースクライアントで操作した後、画面上の「更新」ボタンをクリックして同期してください。

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### フィールドの設定

外部データベースは既存のデータテーブルのフィールドを自動的に読み込み、表示します。フィールドのタイトル、データタイプ（Field type）、UI タイプ（Field interface）をすばやく確認・設定できます。また、「編集」ボタンをクリックして、その他の設定を変更することもできます。

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

外部データベースではテーブル構造を変更できないため、フィールドの追加時に選択できるタイプはリレーションフィールドのみです。リレーションフィールドは実際のフィールドではなく、テーブル間の接続を構築するために使用されます。

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

詳しくは、[データテーブルフィールド / 概要](../data-modeling/collection-fields/index.md)の章を参照してください。

### フィールドタイプのマッピング

NocoBase は外部データベースのフィールドタイプを、自動的に対応するデータタイプ（Field type）と UI タイプ（Field Interface）にマッピングします。

- データタイプ（Field type）：フィールドに格納できるデータの種類、形式、構造を定義します。
- UI タイプ（Field interface）：ユーザーインターフェース上でフィールド値の表示や入力に使用するコントロールのタイプです。

| PostgreSQL | MySQL/MariaDB | NocoBase Data Type | NocoBase Interface Type |
| - | - | - | - |
| BOOLEAN | BOOLEAN<br/>TINYINT(1) | boolean | checkbox <br/> switch |
| SMALLINT<br/>INTEGER<br/>SERIAL<br/>SMALLSERIAL | TINYINT<br/>SMALLINT<br/>MEDIUMINT<br/>INTEGER | integer<br/>boolean<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup |
| BIGINT<br/>BIGSERIAL | BIGINT | bigInt<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup<br/>unixTimestamp<br/>createdAt<br/>updatedAt |
| REAL | FLOAT | float | number<br/>percent |
| DOUBLE PRECISION | DOUBLE PRECISION | double | number<br/>percent |
| DECIMAL<br/>NUMERIC | DECIMAL | decimal | number<br/>percent<br/>currency |
| VARCHAR<br/>CHAR | VARCHAR<br/>CHAR | string<br/>password<br/>uuid<br/>nanoid | input<br/>email<br/>phone<br/>password<br/>color<br/>icon<br/>select<br/>radioGroup<br/>uuid<br/>nanoid |
| TEXT | TEXT<br/>TINYTEXT<br/>MEDIUMTEXT<br/>LONGTEXT | text<br/>json | textarea<br/>markdown<br/>vditor<br/>richText<br/>url<br/>json |
| UUID | - | uuid | uuid |
| JSON<br/>JSONB | JSON | json | json |
| TIMESTAMP | DATETIME<br/>TIMESTAMP | date | date<br/>time<br/>createdAt<br/>updatedAt |
| DATE | DATE | dateOnly | datetime |
| TIME | TIME | time | time |
| - | YEAR |  | datetime |
| CIRCEL |  | circle | json<br/>circle |
| PATH<br/>GEOMETRY(LINESTRING) | LINESTRING | lineString | Json<br/>lineString |
| POINT<br/>GEOMETRY(POINT) | POINT | point | json<br/>point |
| POLYGON<br/>GEOMETRY(POLYGON) | POLYGON | polygon | json<br/>polygon |
| GEOMETRY | GEOMETRY |  -  |  -  |
| BLOB | BLOB | blob |  -  |
| ARRAY |  -  | array | multipleSelect<br/>checkboxGroup |
| BIT | BIT | - | - |
| SET | SET | set | multipleSelect<br/>checkboxGroup |
| RANGE | - | - | - |

### サポートされていないフィールドタイプ

サポートされていないフィールドタイプは個別に表示されます。これらのフィールドを使用するには、開発による対応が必要です。

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### レコードの一意識別子

ブロックに表示するデータテーブルには、「レコードの一意識別子」（Record unique key）が必要です。レコードの一意識別子は、ページブロック内でレコードを特定するために使用され、通常は主キーまたは一意フィールドを選択します。

ビュー、主キーのないテーブル、複合主キーのテーブルの場合は、データテーブルの設定で「Record unique key」を手動で設定する必要があります。使用可能な一意識別子がない場合、ページブロックを正しく作成したり、レコードを表示・編集したりできないことがあります。詳しくは[通常のテーブル / 設定の編集](../data-source-main/general-collection.md#编辑配置)を参照してください。

![edit_collection](https://static-docs.nocobase.com/edit_collection.png)

![edit_collection_configure](https://static-docs.nocobase.com/edit_collection_configure.png)