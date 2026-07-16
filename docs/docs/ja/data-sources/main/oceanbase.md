---
pkg: "@nocobase/plugin-data-source-oceanbase"
title: "メインデータソース - OceanBase"
description: "OceanBase を NocoBase のメインデータベースとして使用する場合のサポートバージョン、プラグインのインストール方法、使用方法、フィールドマッピングについて説明します。"
keywords: "メインデータソース,OceanBase,メインデータベース,フィールドマッピング,NocoBase"
---

# OceanBase

## 概要

OceanBase は NocoBase のメインデータベースとして使用でき、NocoBase のシステムテーブルデータおよびメインデータソース内の業務データを保存します。メインデータベースは NocoBase のデプロイ時に設定し、アプリケーションの起動後に削除することはできません。

| 設定項目 | 説明 |
| --- | --- |
| サポートバージョン | >= 4.3。 |
| 商用版 | エンタープライズ版でサポートされています。 |
| データベースタイプ | MySQL 互換モード。 |

:::warning 注意

OceanBase をメインデータベースとして使用する場合、MySQL 互換モードのみサポートされます。

:::

## プラグインのインストール

OceanBase は `@nocobase/plugin-data-source-oceanbase` によって提供され、商用ライセンスが必要です。

## 使用方法

1. NocoBase のデプロイ時に、データベース接続設定で OceanBase に対応する接続パラメータを選択または入力します。
2. NocoBase の起動後、「データソース管理」で「Main」データソースに移動すると、メインデータベース内のテーブルとフィールドを管理できます。
3. データベースにすでに存在するテーブルを接続する場合は、メインデータベースの管理ページで「データベースから同期」を使用します。
4. データテーブルのフィールドを設定する際は、[データテーブル](../data-modeling/collection.md)および[フィールド](../data-modeling/collection-fields/index.md)ディレクトリを参照して、フィールドタイプとフィールドインターフェースを選択できます。

## フィールドタイプのマッピング

メインデータベースで NocoBase のページからフィールドを作成すると、NocoBase はフィールド設定に基づいて、対応する OceanBase のフィールドを作成します。「データベースから同期」を使用して既存のテーブルを接続する場合、NocoBase は MySQL 互換のロジックに従って OceanBase のフィールドタイプを識別し、適切な Field type と Field interface に自動的にマッピングします。フィールド設定で画面上の表示方法を調整できます。

一般的なマッピングは次のとおりです。

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

サポートされていない OceanBase のフィールドタイプは、フィールド設定に個別に表示されます。これらのフィールドを NocoBase で通常のフィールドとして使用するには、適応対応の開発が必要です。

:::

その他の共通設定については、[メインデータソースの概要](./index.md)を参照してください。