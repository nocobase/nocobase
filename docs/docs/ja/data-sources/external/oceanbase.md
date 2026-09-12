---
pkg: "@nocobase/plugin-data-source-oceanbase"
title: "外部データソース - OceanBase"
description: "OceanBase を NocoBase の外部データベースとして接続する方法について説明します。対応バージョン、MySQL 互換モード、接続設定、テーブル範囲、権限、フィールドマッピングを含みます。"
keywords: "外部データソース,OceanBase,外部データベース,MySQL 互換モード,フィールドマッピング,NocoBase"
---

# OceanBase

## はじめに

OceanBase は NocoBase の外部データベースとして接続できます。接続すると、NocoBase は OceanBase 内のテーブル、フィールド、ビューを読み込み、外部データソース内のデータテーブルとして使用できるようにします。

[メインデータベース](../main/index.md)とは異なり、外部 OceanBase の実際のテーブル構造は、引き続き元の業務システム、データベースクライアント、または移行スクリプトによって管理されます。NocoBase は構造の読み込み、フィールドメタデータの保存、ページブロック、権限、ワークフロー、API の設定を担当します。

| 設定項目 | 説明 |
| --- | --- |
| 対応バージョン | OceanBase >= 4.3。 |
| 商用版 | エンタープライズ版に対応しています。 |
| 対応プラグイン | `@nocobase/plugin-data-source-oceanbase`。 |
| データベースモード | MySQL 互換モードのみ対応しています。 |

外部 OceanBase の利用に適したシナリオ：

- 既存の OceanBase MySQL テナント内の業務データベースを接続する
- 履歴データを移行せずに、NocoBase で管理画面を構築する
- 既存のテーブルに対して、権限制御、ワークフロー処理、データ修正、レポート表示を行う
- データベース構造を DBA、移行スクリプト、または元のシステムで引き続き管理する

:::warning 注意

OceanBase を外部データベースとして使用する場合、MySQL 互換モードのみ対応しています。Oracle 互換モードを使用すると、NocoBase は現在のプラグインでテーブル構造とフィールドタイプを読み取れません。

:::

## プラグインのインストール

このプラグインは商用プラグインです。詳しい有効化方法については、[商用プラグインの有効化ガイド](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)を参照してください。

## データソースの追加

「データソース管理」で「Add new」をクリックし、OceanBase を選択して接続情報を入力します。

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

一般的な接続設定は次のとおりです。

| 設定 | 説明 |
| --- | --- |
| Data source name | ページブロック、権限、ワークフロー、API で参照するデータソース識別名です。作成後は変更できません。 |
| Data source display name | 画面上に表示されるデータソース名です。「OceanBase 業務データベース」「レポートデータベース」など、業務担当者にも分かりやすい名前を推奨します。 |
| Host / Port | OceanBase の MySQL 互換接続先アドレスとポートです。ポートはテナントまたはプロキシの実際の設定に従います。 |
| Database | 接続する OceanBase データベースの名前です。 |
| Username / Password | OceanBase への接続に使用するアカウントとパスワードです。NocoBase が読み取れるのは、このアカウントにアクセス権限があるオブジェクトのみであり、他のアカウント固有のオブジェクトに権限を付与したり、読み取ったりすることはありません。 |
| Table prefix | テーブル名のプレフィックスです。設定すると、NocoBase はこのプレフィックスに一致するテーブルとビューのみを読み込み、NocoBase 内ではプレフィックスを除いたテーブル名を生成します。 |
| Collections / Add all collections | 接続範囲を制御します。「Add all collections」を有効にすると、NocoBase は現在の範囲内にあるすべてのテーブルとビューを接続します。無効にすると、「Collections」で選択したオブジェクトのみを接続します。 |
| Enabled the data source | このデータソースを有効にするかどうかを指定します。無効にすると、データソースの設定は保持されますが、ページブロック、権限、ワークフロー、API からデータを読み取れなくなります。 |

:::tip ヒント

OceanBase 内のオブジェクトが多い場合は、`Database`、`Table prefix`、「Collections」を使って範囲を絞り込むことを推奨します。現在のアプリケーションで使用するテーブルとビューだけを接続すると、その後の権限設定、ページ構築、同期メンテナンスが容易になります。

:::

## データテーブルの選択

接続情報を入力した後、「Load Collections」をクリックすると、OceanBase で利用可能なテーブルとビューを読み込めます。読み込み結果は、接続アカウント、`Database`、`Table prefix`、「Collections」の設定によって異なります。

デフォルトでは「Add all collections」が有効になっており、現在の範囲内にあるすべてのテーブルとビューを接続します。一部のオブジェクトのみを接続する場合は、「Add all collections」を無効にして、一覧から必要なテーブルまたはビューを選択します。

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning 注意

1 つの外部データソースで一度に接続できるテーブルまたはビューは最大 500 個です。OceanBase 内のオブジェクトが多い場合は、`Database`、`Table prefix`、または「Collections」を使って、あらかじめ範囲を絞り込むことを推奨します。

:::

## フィールドの同期と設定

外部 OceanBase のテーブル構造はデータベース側で管理されます。NocoBase が外部 OceanBase にフィールドを作成したり、フィールドタイプを変更したり、実際のフィールドを削除したりすることはありません。

OceanBase 側でテーブル構造が変更された場合は、データソースで「Sync from database」を実行し、テーブルとフィールドのメタデータを再読み込みできます。同期すると、NocoBase に保存されているデータテーブル、フィールド、主キー、ユニークキー、フィールドタイプのマッピング情報が更新されますが、OceanBase 内の実際のテーブルやデータが削除されることはありません。

フィールドの同期後、NocoBase でフィールドのタイトル、フィールドタイプ（Field type）、フィールドコンポーネント（Field interface）を設定できます。NocoBase のリレーションフィールドを作成する場合も、NocoBase 内にリレーションメタデータが保存されるだけで、OceanBase のテーブルに実際の外部キーフィールドが自動的に追加されることはありません。

## フィールドタイプのマッピング

NocoBase は MySQL 互換のロジックに基づいて OceanBase のフィールドタイプを識別し、適切な Field type と Field interface に自動的にマッピングします。フィールド設定で画面上の表示方法を調整できます。

主なマッピングは次のとおりです。

| OceanBase フィールドタイプ | NocoBase Field type | 選択可能な Field interface |
| --- | --- | --- |
| `TINYINT`、`SMALLINT`、`MEDIUMINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `INT`、`INTEGER` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `FLOAT`、`DOUBLE` | `float` | Number、Percent。 |
| `DECIMAL` | `decimal` | Number、Percent、Currency。 |
| `CHAR`、`VARCHAR` | `string`、`uuid`、`nanoid`、`encryption` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `DATE` | `dateOnly` | Date。 |
| `TIME` | `time` | Time。 |
| `DATETIME` | `datetimeNoTz`、`datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP` | `datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `JSON` | `json`、`array` | JSON。 |

:::warning 注意

対応していない OceanBase のフィールドタイプは、フィールド設定内に個別に表示されます。このようなフィールドを NocoBase で通常のフィールドとして使用するには、別途アダプターを開発する必要があります。

:::

## 主キーとレコードの一意識別子

ページブロックで表示および編集するデータテーブルには、主キーまたはユニークフィールドを設定することを推奨します。NocoBase は、レコードの一意識別子として主キーを優先的に使用します。

ビュー、主キーのないテーブル、または複合主キーのテーブルを接続する場合は、データテーブルの設定で「Record unique key」を手動で設定する必要があります。利用可能な一意識別子がない場合、ページブロックでレコードを正しく表示、編集、削除できないことがあります。

![edit_collection](https://static-docs.nocobase.com/edit_collection.png)

![edit_collection_configure](https://static-docs.nocobase.com/edit_collection_configure.png)

## 関連リンク

- [外部データベース](./index.md) — 外部データベースの共通設定と管理方法を確認できます
- [データソース管理](../data-source-manager/index.md) — データソースへのアクセスと管理方法を確認できます
- [データテーブルのフィールド](../data-modeling/collection-fields/index.md) — フィールドタイプとフィールドマッピングについて確認できます
