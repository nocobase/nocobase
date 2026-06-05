:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# 外部データベース

## はじめに

既存の外部データベースをデータソースとして利用できます。現在サポートされている外部データベースは、MySQL、MariaDB、PostgreSQL、MSSQL、Oracleです。

## 利用方法

### 外部データベースの追加

プラグインを有効化すると、データソース管理の「Add new」ドロップダウンメニューから選択して追加できるようになります。

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

接続したいデータベース情報を入力してください。

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### コレクションの同期

外部データベースとの接続が確立されると、データソース内のすべてのコレクションが直接読み込まれます。外部データベースでは、コレクションの直接追加やテーブル構造の変更はサポートされていません。変更が必要な場合は、データベースクライアントを介して操作し、その後インターフェース上の「更新」ボタンをクリックして同期してください。

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### フィールドの設定

外部データベースは、既存のコレクションのフィールドを自動的に読み込み、表示します。フィールドのタイトル、データタイプ（Field type）、UIタイプ（Field interface）を素早く確認・設定できます。また、「編集」ボタンをクリックして、さらに多くの設定を変更することも可能です。

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

外部データベースではテーブル構造の変更がサポートされていないため、新しいフィールドを追加する際に選択できるのは関連フィールドのみです。関連フィールドは実際のフィールドではなく、コレクション間の接続を確立するために使用されます。

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

詳細については、[コレクションフィールド/概要](/data-sources/data-modeling/collection-fields)の章をご覧ください。

### フィールドタイプのマッピング

NocoBaseは、外部データベースのフィールドタイプを、対応するデータタイプ（Field type）とUIタイプ（Field Interface）に自動的にマッピングします。

- データタイプ（Field type）：フィールドが格納できるデータの種類、形式、構造を定義します。
- UIタイプ（Field interface）：ユーザーインターフェースでフィールド値を表示および入力するために使用されるコントロールのタイプを指します。

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
| ENUM | ENUM | enum | select<br/>radioGroup |
| ARRAY |  -  | array | multipleSelect<br/>checkboxGroup |
| BIT | BIT | - | - |
| SET | SET | set | multipleSelect<br/>checkboxGroup |
| RANGE | - | - | - |

### 未サポートのフィールドタイプ

未サポートのフィールドタイプは個別に表示されます。これらのフィールドは、開発による対応が完了した後に利用可能になります。

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### フィルターターゲットキー

ブロックとして表示されるコレクションには、フィルターターゲットキー（Filter target key）が設定されている必要があります。フィルターターゲットキーとは、特定のフィールドに基づいてデータをフィルタリングするためのもので、そのフィールド値は一意である必要があります。フィルターターゲットキーは、デフォルトでコレクションの主キーフィールドとなります。ビュー、主キーを持たないコレクション、または複合主キーを持つコレクションの場合は、カスタムのフィルターターゲットキーを定義する必要があります。

![20240507210230](https://static-docs.nocobase.com/20240507210230.png)

フィルターターゲットキーが設定されているコレクションのみ、ページに追加できます。

![20240507222827](https://static-docs.nocobase.com/20240507222827.png)