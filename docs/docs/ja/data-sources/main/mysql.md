---
pkg: "@nocobase/plugin-data-source-manager"
title: "メインデータソース - MySQL"
description: "MySQLをNocoBaseのメインデータベースとして使用する場合のサポートバージョン、プラグインのインストール方法、使用方法、フィールドマッピングについて説明します。"
keywords: "メインデータソース,MySQL,メインデータベース,フィールドマッピング,NocoBase"
---

# MySQL

## 概要

MySQLはNocoBaseのメインデータベースとして使用でき、NocoBaseのシステムテーブルデータとメインデータソース内の業務データを保存します。メインデータベースはNocoBaseのデプロイ時に設定し、アプリケーションの稼働後に削除することはできません。

| 設定項目 | 説明 |
| --- | --- |
| サポートバージョン | >= 8.0.17。 |
| 商用エディション | コミュニティ版、スタンダード版、プロフェッショナル版、エンタープライズ版のすべてでサポートされています。 |
| データベースタイプ | MySQL。 |

MySQLは一般的な業務システムのメインデータベースに適しています。

## プラグインのインストール

MySQLは標準搭載の機能であるため、個別にプラグインをインストールする必要はありません。

## 使用方法

1. NocoBaseのデプロイ時に、データベース接続設定でMySQLに対応する接続パラメータを選択または入力します。
2. NocoBaseの起動後、「データソース管理」で「Main」データソースに移動すると、メインデータベース内のデータテーブルとフィールドを管理できます。
3. データベースにすでに存在するテーブルを接続する場合は、メインデータベースの管理ページで「データベースから同期」を使用します。
4. データテーブルのフィールドを設定する際は、[データテーブル](../data-modeling/collection.md)、[フィールド](../data-modeling/collection-fields/index.md)ディレクトリを参考にして、フィールドタイプとフィールドコンポーネントを選択できます。

## フィールドタイプのマッピング

メインデータベースでNocoBaseのページからフィールドを作成すると、NocoBaseはフィールド設定に基づいて対応するMySQLフィールドを作成します。「データベースから同期」を使用して既存のテーブルを接続する場合、NocoBaseはMySQLのフィールドタイプに基づいて、適切なField typeとField interfaceに自動的にマッピングします。フィールド設定で画面上の表示方法を調整できます。

一般的なマッピングは以下のとおりです。

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

サポートされていないMySQLフィールドタイプは、フィールド設定内に個別に表示されます。これらのフィールドをNocoBaseで通常のフィールドとして使用するには、開発による対応が必要です。

:::

その他の共通設定については、[メインデータソースの概要](./index.md)を参照してください。