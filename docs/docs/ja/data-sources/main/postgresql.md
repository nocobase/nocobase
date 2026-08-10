---
pkg: "@nocobase/plugin-data-source-manager"
title: "メインデータソース - PostgreSQL"
description: "PostgreSQL を NocoBase のメインデータベースとして使用する場合のサポートバージョン、プラグインのインストール方法、使用方法、フィールドマッピングについて説明します。"
keywords: "メインデータソース,PostgreSQL,メインデータベース,フィールドマッピング,NocoBase"
---

# PostgreSQL

## 概要

PostgreSQL は NocoBase のメインデータベースとして使用でき、NocoBase のシステムテーブルデータおよびメインデータソース内の業務データを保存します。メインデータベースは NocoBase のデプロイ時に設定し、アプリケーションの起動後に削除することはできません。

| 設定項目 | 説明 |
| --- | --- |
| サポートバージョン | >= 10。 |
| 商用版 | コミュニティ版、スタンダード版、プロフェッショナル版、エンタープライズ版のすべてでサポートされています。 |
| データベースタイプ | PostgreSQL。 |

PostgreSQL はテーブル継承をサポートしているため、データモデルの継承が必要なシナリオに適しています。

## プラグインのインストール

PostgreSQL は組み込み機能のため、個別にプラグインをインストールする必要はありません。

## 使用方法

1. NocoBase のデプロイ時に、データベース接続設定で PostgreSQL に対応する接続パラメータを選択または入力します。
2. NocoBase の起動後、「データソース管理」で「Main」データソースに移動すると、メインデータベース内のテーブルとフィールドを管理できます。
3. データベースに既に存在するテーブルを接続する場合は、メインデータベースの管理ページで「データベースから同期」を使用します。
4. データテーブルのフィールドを設定する際は、[データテーブル](../data-modeling/collection.md)、[フィールド](../data-modeling/collection-fields/index.md)ディレクトリを参照して、フィールドタイプとフィールドコンポーネントを選択できます。

## フィールドタイプのマッピング

メインデータベースで NocoBase のページからフィールドを作成すると、NocoBase はフィールド設定に基づいて、対応する PostgreSQL フィールドを作成します。「データベースから同期」を使用して既存のテーブルを接続する場合、NocoBase は PostgreSQL のフィールドタイプに基づいて、適切な Field type と Field interface に自動的にマッピングします。フィールド設定で画面上の表示方法を調整できます。

一般的なマッピングは以下のとおりです。

| PostgreSQL フィールドタイプ | NocoBase Field type | 選択可能な Field interface |
| --- | --- | --- |
| `BOOLEAN` | `boolean` | Checkbox、Switch。 |
| `SMALLINT`、`INTEGER`、`SERIAL`、`SMALLSERIAL` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `BIGINT`、`BIGSERIAL` | `bigInt`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group、Unix timestamp、Created at、Updated at。 |
| `REAL` | `float` | Number、Percent。 |
| `DOUBLE PRECISION` | `double` | Number、Percent。 |
| `DECIMAL`、`NUMERIC` | `decimal` | Number、Percent、Currency。 |
| `VARCHAR`、`CHAR` | `string`、`password`、`uuid`、`nanoid` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TEXT` | `text`、`json` | Textarea、Markdown、Vditor、Rich text、URL、JSON。 |
| `UUID` | `uuid` | UUID。 |
| `JSON`、`JSONB` | `json` | JSON。 |
| `TIMESTAMP` | `date` | Date、Time、Created at、Updated at。 |
| `DATE` | `dateOnly` | Date。 |
| `TIME` | `time` | Time。 |
| `POINT`、`LINESTRING`、`POLYGON`、`CIRCLE` | `point`、`lineString`、`polygon`、`circle` | Point、Line string、Polygon、Circle、JSON。 |
| `ARRAY` | `array` | Multiple select、Checkbox group。 |

:::warning 注意

サポートされていない PostgreSQL フィールドタイプは、フィールド設定に個別に表示されます。これらのフィールドを NocoBase で通常のフィールドとして使用するには、開発による対応が必要です。

:::

その他の共通設定については、[メインデータソースの概要](./index.md)を参照してください。