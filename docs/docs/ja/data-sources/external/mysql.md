---
pkg: "@nocobase/plugin-data-source-external-mysql"
title: "外部データソース - MySQL"
description: "MySQL を NocoBase の外部データベースとして接続する方法について説明します。対応バージョン、プラグインのインストール、接続設定、テーブル範囲、権限、フィールドマッピングを含みます。"
keywords: "外部データソース,MySQL,外部データベース,フィールドマッピング,NocoBase"
---

# MySQL

## 概要

MySQL は外部データベースとして NocoBase に接続できます。接続すると、NocoBase は MySQL 内のテーブル、フィールド、ビューを読み込み、外部データソース内のデータテーブルとして利用できるようにします。

[メインデータベース](../main/index.md)とは異なり、外部 MySQL の実際のテーブル構造は、元の業務システム、データベースクライアント、またはマイグレーションスクリプトによって引き続き管理されます。NocoBase は構造の読み込み、フィールドメタデータの保存、ページブロック、権限、ワークフロー、API の設定を担当します。

| 設定項目 | 説明 |
| --- | --- |
| 対応バージョン | MySQL >= 5.7。 |
| 商用版 | スタンダード版、プロフェッショナル版、エンタープライズ版に対応しています。 |
| 対応プラグイン | `@nocobase/plugin-data-source-external-mysql`。 |
| 対応プロトコル | MySQL プロトコルを使用して接続します。 |

外部 MySQL の利用に適したシーン：

- 既存の ERP、MES、WMS、CRM などの業務システムの MySQL データベースに接続する
- 履歴データを移行せずに、NocoBase で管理画面を構築する
- 既存のテーブルに対して権限制御、プロセス処理、データ修正、レポート表示を行う
- データベース構造を DBA、マイグレーションスクリプト、または元のシステムで引き続き管理する

:::warning 注意

外部 MySQL は NocoBase のシステムデータベースではありません。NocoBase がバックアップ、リストア、マイグレーション、テーブル構造の変更を管理することはありません。

:::

## プラグインのインストール

このプラグインは商用プラグインです。詳しいアクティベーション方法については、[商用プラグインのアクティベーションガイド](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)を参照してください。

## データソースの追加

「データソース管理」で「Add new」をクリックし、MySQL を選択して接続情報を入力します。

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

一般的な接続設定は次のとおりです。

| 設定 | 説明 |
| --- | --- |
| Data source name | ページブロック、権限、ワークフロー、API で参照するデータソースの識別名です。作成後は変更できません。 |
| Data source display name | 画面上に表示されるデータソース名です。業務担当者が理解しやすい名前（例：「ERP MySQL」「注文データベース」）を使用することをおすすめします。 |
| Host / Port | MySQL のホストアドレスとポートです。デフォルトポートは通常 `3306` です。 |
| Database | 接続する MySQL データベースの名前です。 |
| Username / Password | MySQL への接続に使用するアカウントとパスワードです。NocoBase はこのアカウントがアクセス権を持つオブジェクトのみ読み取ることができ、他のアカウント専用のオブジェクトに権限を付与したり、読み取ったりすることはありません。 |
| Table prefix | テーブル名のプレフィックスです。設定すると、NocoBase はこのプレフィックスに一致するテーブルとビューのみを読み込み、NocoBase 内ではプレフィックスを除いたデータテーブル名を生成します。 |
| Collections / Add all collections | 接続範囲を制御します。「Add all collections」を有効にすると、NocoBase は現在の範囲内にあるすべてのテーブルとビューを接続します。無効にすると、「Collections」で選択したオブジェクトのみを接続します。 |
| Enabled the data source | このデータソースを有効にするかどうかを指定します。無効にすると、データソースの設定は保持されますが、ページブロック、権限、ワークフロー、API からそのデータを読み取れなくなります。 |

:::tip ヒント

MySQL 内のオブジェクトが多い場合は、`Database`、`Table prefix`、「Collections」を使って、あらかじめ範囲を絞り込んでください。現在のアプリケーションで使用するテーブルとビューだけを接続すると、その後の権限設定、ページ構築、同期・メンテナンスの負担を軽減できます。

:::

## データテーブルの選択

接続情報を入力した後、「Load Collections」をクリックすると、MySQL で利用可能なデータテーブルとビューを読み込めます。読み込み結果は、接続アカウント、`Database`、`Table prefix`、「Collections」の設定によって異なります。

デフォルトでは「Add all collections」が有効になっており、現在の範囲内にあるすべてのテーブルとビューが接続されます。一部のオブジェクトのみを接続する場合は、「Add all collections」を無効にして、一覧から必要なデータテーブルまたはビューを選択してください。

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning 注意

1 つの外部データソースで一度に接続できるデータテーブルまたはビューは、最大 500 個です。MySQL 内のオブジェクトが多い場合は、`Database`、`Table prefix`、または「Collections」を使って、あらかじめ範囲を絞り込むことをおすすめします。

:::

## フィールドの同期と設定

外部 MySQL のテーブル構造はデータベース側で管理されます。NocoBase が外部 MySQL にフィールドを作成したり、フィールドタイプを変更したり、実際のフィールドを削除したりすることはありません。

MySQL 側でテーブル構造が変更された場合は、データソースで「Sync from database」を実行して、テーブルとフィールドのメタデータを再読み込みできます。同期によって、NocoBase に保存されているデータテーブル、フィールド、主キー、ユニークキー、フィールドタイプのマッピング情報が更新されますが、MySQL 内の実際のテーブルやデータが削除されることはありません。

フィールドの同期後、NocoBase でフィールドのタイトル、フィールドタイプ（Field type）、フィールドコンポーネント（Field interface）を設定できます。NocoBase のリレーションフィールドを作成する場合も、リレーションのメタデータは NocoBase に保存されるだけで、MySQL のテーブルに実際の外部キーフィールドが自動的に追加されることはありません。

## フィールドタイプのマッピング

NocoBase は MySQL のフィールドタイプに基づいて、適切な Field type と Field interface に自動的にマッピングします。フィールド設定で画面上の表示方法を調整できます。

一般的なマッピングは次のとおりです。

| MySQL フィールドタイプ | NocoBase Field type | 選択可能な Field interface |
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

サポートされていない MySQL フィールドタイプは、フィールド設定画面に個別に表示されます。これらのフィールドを NocoBase で通常のフィールドとして使用するには、適応対応が必要です。

:::

## 主キーとレコードの一意識別子

ページブロックで表示・編集するデータテーブルには、主キーまたは一意フィールドを設定することをおすすめします。NocoBase は原則として、レコードの一意識別子に主キーを使用します。

ビュー、主キーのないテーブル、または複合主キーのテーブルを接続する場合は、データテーブルの設定で「Record unique key」を手動で設定する必要があります。利用可能な一意識別子がない場合、ページブロックでレコードを正しく表示、編集、削除できないことがあります。

![20260709205547](https://static-docs.nocobase.com/20260709205547.png)
![20260709205609](https://static-docs.nocobase.com/20260709205609.png)

- [外部データベース](./index.md) — 外部データベースの共通設定と管理方法を確認する
- [データソース管理](../data-source-manager/index.md) — データソースの入口と管理方法を確認する
- [データテーブルのフィールド](../data-modeling/collection-fields/index.md) — フィールドタイプとフィールドマッピングの説明を確認する