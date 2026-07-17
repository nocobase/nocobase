---
pkg: "@nocobase/plugin-data-source-external-mssql"
title: "外部データソース - MSSQL"
description: "MSSQL/SQL ServerをNocoBaseの外部データベースとして接続する方法、サポートバージョン、プラグインのインストール、接続設定、暗号化接続、権限、フィールドマッピングについて説明します。"
keywords: "外部データソース,MSSQL,SQL Server,外部データベース,フィールドマッピング,NocoBase"
---

# MSSQL

## はじめに

MSSQL（SQL Server）は、NocoBaseに外部データベースとして接続できます。接続すると、NocoBaseはSQL Server内のテーブル、フィールド、ビューを読み取り、外部データソースのデータテーブルとして利用できるようにします。

[メインデータベース](../main/index.md)とは異なり、外部MSSQLの実際のテーブル構造は、既存の業務システム、データベースクライアント、またはマイグレーションスクリプトによって引き続き管理されます。NocoBaseは、構造の読み取り、フィールドメタデータの保存、ページブロック、権限、ワークフロー、APIの設定を担当します。

| 設定項目 | 説明 |
| --- | --- |
| サポートバージョン | SQL Server 2014～2019。 |
| 商用版 | スタンダード版、プロフェッショナル版、エンタープライズ版で利用できます。 |
| 対応プラグイン | `@nocobase/plugin-data-source-external-mssql`。 |
| 接続機能 | 「Encrypt connection」と「Trust server certificate」を設定できます。 |

外部MSSQLが適している利用シーン：

- 既存のERP、MES、WMS、CRMなどの業務システムのSQL Serverデータベースを接続する
- 過去のデータを移行せずに、NocoBaseで管理画面を構築する
- 既存のテーブルに対して、権限制御、ワークフロー処理、データ修正、レポート表示を行う
- データベース構造をDBA、マイグレーションスクリプト、または既存システムで引き続き管理する

:::warning 注意

外部MSSQLはNocoBaseのシステムデータベースではありません。NocoBaseがバックアップ、復元、移行、テーブル構造の変更を管理することはありません。

:::

## プラグインのインストール

このプラグインは商用プラグインです。詳しい有効化方法については、[商用プラグインの有効化ガイド](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)を参照してください。

## データソースの追加

「データソース管理」で「Add new」をクリックし、MSSQLを選択して接続情報を入力します。

![20260709210022](https://static-docs.nocobase.com/20260709210022.png)

一般的な接続設定は次のとおりです。

| 設定 | 説明 |
| --- | --- |
| Data source name | ページブロック、権限、ワークフロー、APIで参照するデータソースの識別名です。作成後は変更できません。 |
| Data source display name | 画面に表示されるデータソース名です。業務担当者が理解しやすい名前（「ERP SQL Server」「財務DB」など）を使用することをおすすめします。 |
| Host / Port | SQL Serverのホストアドレスとポートです。デフォルトのポートは通常`1433`です。 |
| Database | 接続するSQL Serverデータベースの名前です。 |
| Username / Password | SQL Serverへの接続に使用するアカウントとパスワードです。NocoBaseが読み取れるのは、このアカウントにアクセス権限があるオブジェクトのみであり、他のアカウントのプライベートオブジェクトに権限を付与したり、読み取ったりすることはありません。 |
| Table prefix | テーブル名のプレフィックスです。設定すると、NocoBaseはこのプレフィックスに一致するテーブルとビューのみを読み取り、NocoBaseではプレフィックスを除いたデータテーブル名を生成します。 |
| Encrypt connection | 暗号化接続を有効にするかどうかを指定します。データベースで暗号化が必須の場合や、ネットワーク経路の暗号化が必要な場合に有効にします。 |
| Trust server certificate | サーバー証明書を信頼するかどうかを指定します。テスト環境や自己署名証明書の環境では有効にする必要がある場合があります。運用環境では、信頼できる証明書の使用をおすすめします。 |
| Collections / Add all collections | 接続範囲を制御します。「Add all collections」を有効にすると、現在の範囲内にあるすべてのテーブルとビューをNocoBaseに接続します。無効にすると、「Collections」で選択したオブジェクトのみを接続します。 |
| Enabled the data source | このデータソースを有効にするかどうかを指定します。無効にすると、データソースの設定は保持されますが、ページブロック、権限、ワークフロー、APIからデータを読み取れなくなります。 |

:::tip ヒント

SQL Server内のオブジェクトが多い場合は、`Database`、`Table prefix`、「Collections」を使って対象範囲を絞ることをおすすめします。現在のアプリケーションで使用するテーブルとビューのみを接続すると、その後の権限設定、ページ構築、同期メンテナンスが容易になります。

:::

## データテーブルの選択

接続情報を入力したら、「Load Collections」をクリックして、SQL Serverで利用可能なデータテーブルとビューを読み込むことができます。読み込み結果は、接続アカウント、`Database`、`Table prefix`、「Collections」の設定によって異なります。

デフォルトでは「Add all collections」が有効になっており、現在の範囲内にあるすべてのテーブルとビューを接続することを示します。一部のオブジェクトのみを接続する場合は、「Add all collections」を無効にして、一覧から必要なデータテーブルまたはビューを選択します。

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning 注意

1つの外部データソースで接続できるデータテーブルまたはビューは、一度に最大500個です。SQL Server内のオブジェクトが多い場合は、`Database`、`Table prefix`、「Collections」を使って、あらかじめ対象範囲を絞ることをおすすめします。

:::

## フィールドの同期と設定

外部MSSQLのテーブル構造は、データベース側で管理されます。NocoBaseが外部SQL Serverにフィールドを作成したり、フィールドの型を変更したり、実際のフィールドを削除したりすることはありません。

SQL Server側でテーブル構造が変更された場合は、データソースで「Sync from database」を実行し、テーブルとフィールドのメタデータを再読み込みできます。同期によって、NocoBaseに保存されているデータテーブル、フィールド、主キー、ユニークキー、フィールド型のマッピング情報が更新されますが、SQL Server内の実際のテーブルやデータが削除されることはありません。

フィールドの同期後、NocoBaseでフィールドタイトル、フィールドタイプ（Field type）、フィールドコンポーネント（Field interface）を設定できます。NocoBaseのリレーションフィールドを作成する場合も、NocoBaseにリレーションメタデータが保存されるだけで、SQL Serverのテーブルに実際の外部キーフィールドが自動的に追加されることはありません。

## フィールドタイプのマッピング

NocoBaseは、SQL Serverのフィールドタイプに応じて、適切なField typeとField interfaceに自動的にマッピングします。フィールド設定で画面上の表示方法を調整できます。

一般的なマッピングは次のとおりです。

| SQL Server フィールドタイプ | NocoBase Field type | 選択可能な Field interface |
| --- | --- | --- |
| `BIT` | `bit` | Checkbox、Switch。 |
| `TINYINT`、`SMALLINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `INT` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `BIGINT` | `bigInt`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `DECIMAL`、`MONEY`、`SMALLMONEY` | `decimal` | Number、Percent、Currency。 |
| `NUMERIC`、`FLOAT`、`REAL` | `float` | Number、Percent。 |
| `CHAR`、`VARCHAR`、`NCHAR`、`NVARCHAR` | `string`、`uuid`、`nanoid` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TEXT`、`NTEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `DATE` | `dateOnly` | Date。 |
| `TIME` | `time` | Time。 |
| `DATETIME`、`DATETIME2` | `datetimeNoTz` | Date、Time、Created at、Updated at。 |
| `DATETIMEOFFSET` | `datetimeTz` | Date、Time、Created at、Updated at。 |
| `UNIQUEIDENTIFIER` | `uuid`、`string` | UUID、Input。 |
| `JSON` | `json`、`array` | JSON。 |

:::warning 注意

サポートされていないSQL Serverのフィールドタイプは、フィールド設定に個別に表示されます。これらのフィールドをNocoBaseで通常のフィールドとして使用するには、開発による対応が必要です。

:::

## 主キーとレコードの一意識別子

ページブロックで表示および編集するデータテーブルには、主キーまたはユニークフィールドを設定することをおすすめします。NocoBaseは、レコードの一意識別子として、優先的に主キーを使用します。

ビュー、主キーのないテーブル、複合主キーのテーブルを接続する場合は、データテーブル設定で「Record unique key」を手動で設定する必要があります。利用可能な一意識別子がない場合、ページブロックでレコードを正しく表示、編集、削除できないことがあります。

![20260709210154](https://static-docs.nocobase.com/20260709210154.png)
![20260709210214](https://static-docs.nocobase.com/20260709210214.png)

## 関連リンク

- [外部データベース](./index.md) — 外部データベースの共通設定と管理方法を確認できます
- [データソース管理](../data-source-manager/index.md) — データソースの入口と管理方法を確認できます
- [データテーブルのフィールド](../data-modeling/collection-fields/index.md) — フィールドタイプとフィールドマッピングの説明を確認できます
