---
pkg: "@nocobase/plugin-data-source-kingbase"
title: "外部データソース - KingbaseES"
description: "KingbaseES を NocoBase の外部データベースとして接続する方法について説明します。対応バージョン、PostgreSQL 互換モード、接続設定、Schema、権限、フィールドマッピングについて解説します。"
keywords: "外部データソース,KingbaseES,人大金仓,外部データベース,PostgreSQL 互換モード,フィールドマッピング,NocoBase"
---

# KingbaseES

## 概要

KingbaseES は外部データベースとして NocoBase に接続できます。接続後、NocoBase は KingbaseES 内のテーブル、フィールド、ビューを読み取り、外部データソース内のデータテーブルとして利用できます。

[メインデータベース](../main/index.md)とは異なり、外部 KingbaseES の実際のテーブル構造は、引き続き元の業務システム、データベースクライアント、または移行スクリプトによって管理されます。NocoBase は構造の読み取り、フィールドメタデータの保存、ページブロック、権限、ワークフロー、API の設定を担当します。

| 設定項目 | 説明 |
| --- | --- |
| 対応バージョン | KingbaseES >= V9。 |
| 商用版 | プロフェッショナル版、エンタープライズ版で利用できます。 |
| 対応プラグイン | `@nocobase/plugin-data-source-kingbase`。 |
| データベースモード | PostgreSQL 互換モードのみ対応しています。 |

外部 KingbaseES の利用に適したシナリオ：

- 既存の官公庁・企業、イントラネット、または国産化環境の KingbaseES 業務データベースに接続する
- 履歴データを移行せずに、NocoBase で管理画面を構築する
- 既存のテーブルに対して権限制御、ワークフロー処理、データ修正、レポート表示を行う
- データベース構造を DBA、移行スクリプト、または元のシステムで引き続き管理する

:::warning 注意

KingbaseES を外部データベースとして利用する場合、PostgreSQL 互換モードのみ対応しています。データベースが PostgreSQL 互換モードでない場合、NocoBase は現在のプラグインを使用してテーブル構造とフィールドタイプを読み取れません。

:::

## プラグインのインストール

このプラグインは商用プラグインです。詳しいアクティベーション方法については、[商用プラグインのアクティベーションガイド](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)を参照してください。

## データソースの追加

「データソース管理」で「Add new」をクリックし、KingbaseES を選択して接続情報を入力します。

![20260709210325](https://static-docs.nocobase.com/20260709210325.png)

一般的な接続設定は次のとおりです。

| 設定 | 説明 |
| --- | --- |
| Data source name | ページブロック、権限、ワークフロー、API から参照するデータソースの識別名です。作成後は変更できません。 |
| Data source display name | 画面に表示されるデータソース名です。「行政サービス KingbaseES」「レポートデータベース」など、業務担当者にも分かりやすい名称を推奨します。 |
| Host / Port | KingbaseES のホストアドレスとポートです。ポートはデータベースの実際の設定に従ってください。 |
| Database | 接続する KingbaseES データベースの名前です。 |
| Username / Password | KingbaseES への接続に使用するアカウントとパスワードです。NocoBase が読み取れるのは、このアカウントにアクセス権限があるオブジェクトのみで、他のアカウント固有のオブジェクトに権限を付与したり、読み取ったりすることはありません。 |
| Schema | 読み取る schema です。データベースに複数の schema がある場合は、現在の業務で接続する必要がある schema のみを入力することを推奨します。 |
| Table prefix | テーブル名のプレフィックスです。設定すると、NocoBase はこのプレフィックスに一致するテーブルとビューのみを読み取り、NocoBase 内ではプレフィックスを除いたデータテーブル名を生成します。 |
| Collections / Add all collections | 接続範囲を制御します。「Add all collections」を有効にすると、NocoBase は現在の範囲内にあるすべてのテーブルとビューを接続します。無効にすると、「Collections」で選択したオブジェクトのみを接続します。 |
| Enabled the data source | このデータソースを有効にするかどうかを指定します。無効にすると、データソースの設定は保持されますが、ページブロック、権限、ワークフロー、API からそのデータを読み取れなくなります。 |

:::tip ヒント

KingbaseES 内のオブジェクトが多い場合は、`Schema`、`Table prefix`、「Collections」を使って対象範囲を絞り込むことをおすすめします。現在のアプリケーションで使用するテーブルとビューだけを接続すると、その後の権限設定、ページ構築、同期メンテナンスが容易になります。

:::

## データテーブルの選択

接続情報を入力した後、「Load Collections」をクリックすると、KingbaseES で利用可能なテーブルとビューを読み込めます。読み込み結果は、接続アカウント、`Schema`、`Table prefix`、「Collections」の設定によって異なります。

デフォルトでは「Add all collections」が有効になっており、現在の範囲内にあるすべてのテーブルとビューを接続します。一部のオブジェクトのみを接続する場合は、「Add all collections」を無効にして、一覧から必要なテーブルまたはビューを選択してください。

![20260709210603](https://static-docs.nocobase.com/20260709210603.png)

:::warning 注意

1 つの外部データソースで一度に接続できるテーブルまたはビューは、最大 500 個です。KingbaseES 内のオブジェクトが多い場合は、まず `Schema`、`Table prefix`、または「Collections」を使って対象範囲を絞り込むことをおすすめします。

:::

## フィールドの同期と設定

外部 KingbaseES のテーブル構造はデータベース側で管理されます。NocoBase が外部 KingbaseES 内にフィールドを作成したり、フィールドタイプを変更したり、実際のフィールドを削除したりすることはありません。

KingbaseES 側でテーブル構造が変更された場合は、データソースで「Sync from database」を実行して、テーブルとフィールドのメタデータを再読み込みできます。同期によって、NocoBase に保存されているデータテーブル、フィールド、主キー、ユニークキー、フィールドタイプのマッピング情報が更新されますが、KingbaseES 内の実際のテーブルやデータが削除されることはありません。

フィールドの同期後、NocoBase でフィールドタイトル、フィールドタイプ（Field type）、フィールドコンポーネント（Field interface）を設定できます。NocoBase のリレーションフィールドを作成する場合も、NocoBase 内にリレーションメタデータが保存されるだけで、KingbaseES のテーブルに実際の外部キーフィールドが自動的に追加されることはありません。

## フィールドタイプのマッピング

NocoBase は PostgreSQL 互換のロジックに基づいて KingbaseES のフィールドタイプを認識し、適切な Field type と Field interface に自動的にマッピングします。フィールド設定で画面上の表示方法を調整できます。

一般的なマッピングは次のとおりです。

| KingbaseES フィールドタイプ | NocoBase Field type | 選択可能な Field interface |
| --- | --- | --- |
| `BOOLEAN` | `boolean` | Checkbox、Switch。 |
| `SMALLINT`、`INTEGER` | `integer`、`sort` | Integer、Sort、Select、Radio group。 |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `REAL`、`DOUBLE PRECISION` | `float` | Number、Percent。 |
| `DECIMAL`、`NUMERIC` | `decimal` | Number、Percent、Currency。 |
| `VARCHAR`、`CHAR` | `string`、`uuid`、`nanoid`、`encryption`、`datetimeNoTz` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `UUID` | `uuid` | UUID。 |
| `JSON`、`JSONB` | `json`、`array` | JSON。 |
| `TIMESTAMP WITHOUT TIME ZONE` | `datetimeNoTz` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP WITH TIME ZONE` | `datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `DATE` | `dateOnly` | Date。 |
| `TIME WITHOUT TIME ZONE` | `time` | Time。 |
| `POINT`、`PATH`、`POLYGON`、`CIRCLE` | `json` | JSON。 |
| `ARRAY` | `array` | Multiple select、Checkbox group、JSON。 |

:::warning 注意

サポートされていない KingbaseES フィールドタイプは、フィールド設定画面に個別に表示されます。これらのフィールドを NocoBase で通常のフィールドとして使用するには、適応対応が必要です。

:::

## 主キーとレコードの一意識別子

ページブロックで表示・編集するデータテーブルには、主キーまたはユニークフィールドを設定することをおすすめします。NocoBase は、レコードの一意識別子として主キーを優先的に使用します。

ビュー、主キーのないテーブル、または複合主キーのテーブルを接続する場合は、データテーブル設定で「Record unique key」を手動で設定する必要があります。利用可能な一意識別子がない場合、ページブロックでレコードを正しく表示、編集、削除できないことがあります。

![20260709210636](https://static-docs.nocobase.com/20260709210636.png)
![20260709210651](https://static-docs.nocobase.com/20260709210651.png)

## 関連リンク

- [外部データベース](./index.md) — 外部データベースの共通設定と管理方法を確認できます
- [データソース管理](../data-source-manager/index.md) — データソースへの入口と管理方法を確認できます
- [データテーブルのフィールド](../data-modeling/collection-fields/index.md) — フィールドタイプとフィールドマッピングの説明を確認できます
