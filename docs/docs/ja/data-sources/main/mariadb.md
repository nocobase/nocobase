---
pkg: "@nocobase/plugin-data-source-manager"
title: "メインデータソース - MariaDB"
description: "MariaDB を NocoBase のメインデータベースとして使用する場合のサポートバージョン、プラグインのインストール方法、使用方法、フィールドマッピングについて説明します。"
keywords: "メインデータソース,MariaDB,メインデータベース,フィールドマッピング,NocoBase"
---

# MariaDB

## 概要

MariaDB は NocoBase のメインデータベースとして使用でき、NocoBase のシステムテーブルデータおよびメインデータソース内の業務データを保存します。メインデータベースは NocoBase のデプロイ時に設定し、アプリケーションの起動後に削除することはできません。

| 設定項目 | 説明 |
| --- | --- |
| サポートバージョン | >= 10.9。 |
| 商用バージョン | コミュニティ版、スタンダード版、プロフェッショナル版、エンタープライズ版のすべてで利用できます。 |
| データベースタイプ | MariaDB。 |

MariaDB は MySQL と類似しており、一般的な業務システムのメインデータベースとして適しています。

## プラグインのインストール

MariaDB は組み込み機能のため、個別にプラグインをインストールする必要はありません。

## 使用方法

1. NocoBase のデプロイ時に、データベース接続設定で MariaDB に対応する接続パラメーターを選択または入力します。
2. NocoBase の起動後、「データソース管理」で「Main」データソースに移動すると、メインデータベース内のデータテーブルとフィールドを管理できます。
3. データベースに既に存在するテーブルを接続する場合は、メインデータベースの管理ページで「データベースから同期」を使用します。
4. データテーブルのフィールドを設定する際は、[データテーブル](../data-modeling/collection.md)および[フィールド](../data-modeling/collection-fields/index.md)ディレクトリを参照して、フィールドタイプとフィールドコンポーネントを選択できます。

## フィールドタイプのマッピング

メインデータベースで NocoBase のページからフィールドを作成すると、NocoBase はフィールド設定に基づいて、対応する MariaDB フィールドを作成します。「データベースから同期」を使用して既存のテーブルを接続する場合、NocoBase は MariaDB のフィールドタイプに基づいて、適切な Field type と Field interface に自動的にマッピングします。MariaDB の一般的なフィールドマッピングは MySQL と基本的に同じです。フィールド設定で画面上の表示方法を調整できます。

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

サポートされていない MariaDB のフィールドタイプは、フィールド設定内に個別に表示されます。このようなフィールドを NocoBase で通常のフィールドとして使用するには、適合対応の開発が必要です。

:::

その他の共通設定については、[メインデータソースの概要](./index.md)を参照してください。