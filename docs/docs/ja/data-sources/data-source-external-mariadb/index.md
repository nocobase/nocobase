---
pkg: "@nocobase/plugin-data-source-external-mariadb"
title: "外部データソース - MariaDB"
description: "MariaDB を NocoBase の外部データベースとして接続する方法（対応バージョン、プラグインのインストール、接続設定、テーブル範囲、権限、フィールドマッピング）について説明します。"
keywords: "外部データソース,MariaDB,外部データベース,フィールドマッピング,NocoBase"
---

# MariaDB

## 概要

MariaDB は外部データベースとして NocoBase に接続できます。接続後、NocoBase は MariaDB 内のテーブル、フィールド、ビューを読み込み、外部データソース内のデータテーブルとして使用します。

[メインデータベース](../data-source-main/index.md)とは異なり、外部 MariaDB の実際のテーブル構造は、元の業務システム、データベースクライアント、またはマイグレーションスクリプトによって引き続き管理されます。NocoBase は構造の読み込み、フィールドメタデータの保存、ページブロック、権限、ワークフロー、API の設定を担当します。

| 設定項目 | 説明 |
| --- | --- |
| 対応バージョン | MariaDB >= 10.3。 |
| 商用版 | スタンダード版、プロフェッショナル版、エンタープライズ版で利用できます。 |
| 対応プラグイン | `@nocobase/plugin-data-source-external-mariadb`。 |
| 互換プロトコル | MySQL プロトコルを使用して接続します。フィールドマッピングも基本的に MySQL 互換のロジックに従います。 |

外部 MariaDB の利用に適したシナリオ：

- 既存の ERP、MES、WMS、CRM などの業務システムの MariaDB データベースに接続する
- 履歴データを移行せずに、NocoBase で管理画面を構築する
- 既存のテーブルに対して権限制御、ワークフロー処理、データ修正、レポート表示を行う
- データベース構造を DBA、マイグレーションスクリプト、または元のシステムで引き続き管理する

:::warning 注意

外部 MariaDB は NocoBase のシステムデータベースではありません。NocoBase は、そのバックアップ、復元、マイグレーション、テーブル構造の変更を管理しません。

:::

## プラグインのインストール

このプラグインは商用プラグインです。詳しい有効化方法については、[商用プラグイン有効化ガイド](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)を参照してください。

## データソースの追加

「データソース管理」で「Add new」をクリックし、MariaDB を選択して接続情報を入力します。

![20260709204413](https://static-docs.nocobase.com/20260709204413.png)

一般的な接続設定は次のとおりです。

| 設定 | 説明 |
| --- | --- |
| Data source name | ページブロック、権限、ワークフロー、API から参照するデータソースの識別名です。作成後は変更できません。 |
| Data source display name | 画面上に表示されるデータソース名です。「ERP MariaDB」「注文データベース」など、業務担当者が理解しやすい名前を使用することをおすすめします。 |
| Host / Port | MariaDB のホストアドレスとポートです。デフォルトポートは通常 `3306` です。 |
| Database | 接続する MariaDB データベースの名前です。 |
| Username / Password | MariaDB への接続に使用するアカウントとパスワードです。NocoBase は、このアカウントにアクセス権のあるオブジェクトのみ読み取ることができ、他のアカウントの非公開オブジェクトに権限を付与したり、読み取ったりすることはありません。 |
| Table prefix | テーブル名のプレフィックスです。設定すると、NocoBase はこのプレフィックスに一致するテーブルとビューのみを読み込み、NocoBase 内ではプレフィックスを除いたデータテーブル名を生成します。 |
| Collections / Add all collections | 接続範囲を制御します。「Add all collections」を有効にすると、NocoBase は現在の範囲内にあるすべてのテーブルとビューを接続します。無効にすると、「Collections」で選択したオブジェクトのみを接続します。 |
| Enabled the data source | このデータソースを有効にするかどうかを指定します。無効にすると、データソースの設定は保持されますが、ページブロック、権限、ワークフロー、API からデータを読み取れなくなります。 |

:::tip ヒント

MariaDB 内のオブジェクトが多い場合は、`Database`、`Table prefix`、「Collections」を使用して、対象範囲を絞り込むことをおすすめします。現在のアプリケーションで使用するテーブルとビューだけを接続すると、その後の権限設定、ページ構築、同期メンテナンスが容易になります。

:::

## データテーブルの選択

接続情報を入力したら、「Load Collections」をクリックして、MariaDB で利用可能なテーブルとビューを読み込むことができます。読み込み結果は、接続アカウント、`Database`、`Table prefix`、「Collections」の設定に左右されます。

デフォルトでは「Add all collections」が有効になっており、現在の範囲内にあるすべてのテーブルとビューを接続する設定になっています。一部のオブジェクトのみを接続する場合は、「Add all collections」を無効にして、リストから必要なテーブルまたはビューを選択します。

![20260709204452](https://static-docs.nocobase.com/20260709204452.png)

:::warning 注意

1 つの外部データソースで接続できるテーブルまたはビューは、一度に最大 500 個です。MariaDB 内のオブジェクトが多い場合は、まず `Database`、`Table prefix`、「Collections」を使用して対象範囲を絞り込むことをおすすめします。

:::

## フィールドの同期と設定

外部 MariaDB のテーブル構造はデータベース側で管理されます。NocoBase は外部 MariaDB にフィールドを作成したり、フィールドの型を変更したり、実際のフィールドを削除したりしません。

MariaDB 側でテーブル構造が変更された場合は、データソースで「Sync from database」を実行して、テーブルとフィールドのメタデータを再読み込みできます。同期によって、NocoBase に保存されているデータテーブル、フィールド、主キー、ユニークキー、フィールド型のマッピング情報が更新されますが、MariaDB 内の実際のテーブルやデータが削除されることはありません。

フィールドの同期後、NocoBase でフィールドのタイトル、フィールドタイプ（Field type）、フィールドインターフェース（Field interface）を設定できます。NocoBase のリレーションフィールドを作成する場合も、NocoBase 内にリレーションメタデータが保存されるだけで、MariaDB のテーブルに実際の外部キーフィールドが自動的に追加されることはありません。

## フィールドタイプのマッピング

NocoBase は MariaDB のフィールドタイプに基づいて、適切な Field type と Field interface に自動的にマッピングします。MariaDB の一般的なフィールドマッピングは MySQL と基本的に同じで、フィールド設定で画面上の表示方法を調整できます。

一般的なマッピングは次のとおりです。

| MariaDB フィールドタイプ | NocoBase Field type | 選択可能な Field interface |
| --- | --- | --- |
| `TINYINT`、`SMALLINT`、`MEDIUMINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `INT`、`INTEGER` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `FLOAT`、`DOUBLE` | `float` | Number、Percent。 |
| `DECIMAL` | `decimal` | Number、Percent、Currency。 |
| `CHAR`、`VARCHAR` | `string`、`uuid`、`nanoid`、`encryption` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TINYTEXT`、`TEXT`、`MEDIUMTEXT`、`LONGTEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `DATE` | `dateOnly` | Date。 |
| `TIME` | `time` | Time。 |
| `DATETIME` | `datetimeNoTz`、`datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP` | `datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `YEAR` | `string`、`integer` | Input、Integer、Date。 |
| `JSON` | `json`、`array` | JSON。 |

:::warning 注意

サポートされていない MariaDB フィールドタイプは、フィールド設定画面に個別に表示されます。これらのフィールドを NocoBase で通常のフィールドとして使用するには、開発による対応が必要です。

:::

## 主キーとレコードの一意識別子

ページブロックで表示・編集するデータテーブルには、主キーまたは一意フィールドを設定することをおすすめします。NocoBase は、レコードの一意識別子として、まず主キーを使用します。

ビュー、主キーのないテーブル、複合主キーのテーブルを接続する場合は、データテーブル設定で「Record unique key」を手動で設定する必要があります。利用可能な一意識別子がない場合、ページブロックでレコードを正しく表示、編集、削除できないことがあります。

![20260709205835](https://static-docs.nocobase.com/20260709205835.png)
![20260709205854](https://static-docs.nocobase.com/20260709205854.png)

## 関連リンク

- [外部データベース](./index.md) — 外部データベースの共通設定と管理方法を確認
- [データソース管理](../data-source-manager/index.md) — データソースへの入口と管理方法を確認
- [データテーブルのフィールド](../data-modeling/collection-fields/index.md) — フィールドタイプとフィールドマッピングの説明を確認