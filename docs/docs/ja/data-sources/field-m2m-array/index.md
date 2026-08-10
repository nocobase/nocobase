---
pkg: "@nocobase/plugin-field-m2m-array"
title: "多対多（配列）"
description: "配列フィールドを使用して対象テーブルの複数の一意キーを保存し、中間テーブルなしで多対多の関連を構築します。記事とタグの多対多関連などに利用できます。"
keywords: "多対多配列,M2M Array,配列関連,BelongsToMany,NocoBase"
---
# 多対多（配列）

## 概要

データテーブルで配列フィールドを使用して対象テーブルの複数の一意キーを保存し、対象テーブルとの多対多の関連を構築できます。たとえば、記事とタグという2つのエンティティがあり、1つの記事に複数のタグを関連付ける場合、記事テーブルの配列フィールドにタグテーブルの対応するレコードのIDを保存します。

:::warning{title=注意}

- 標準的な [多対多](../data-modeling/collection-fields/associations/m2m/index.md) 関連を構築するには、できる限り中間テーブルを使用し、この種類の関連の使用は避けてください。
- 配列フィールドで構築した多対多の関連では、現在、PostgreSQLを使用する場合にのみ、対象テーブルのフィールドでソーステーブルのデータをフィルタリングできます。たとえば、上記の例では、タグテーブルのタイトルなどの他のフィールドを使用して記事をフィルタリングできます。
  :::

### フィールド設定

![many-to-many(array) field configuration](https://static-docs.nocobase.com/202407051108180.png)

## パラメータの説明

### Source collection

ソーステーブル。現在のフィールドが存在するテーブルです。

### Target collection

対象テーブル。関連付けるテーブルです。

### Foreign key

ソーステーブルで対象テーブルのTarget keyを保存する配列フィールドです。

配列フィールド型の対応関係：

| NocoBase | PostgreSQL | MySQL  | SQLite |
| -------- | ---------- | ------ | ------ |
| `set`    | `array`    | `JSON` | `JSON` |

### Target key

ソーステーブルの配列フィールドに保存される値に対応するフィールドです。一意性を持つ必要があります。
