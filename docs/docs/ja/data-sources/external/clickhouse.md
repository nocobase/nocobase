---
pkg: "@nocobase/plugin-data-source-external-clickhouse"
title: "外部データソース - ClickHouse"
description: "ClickHouse を NocoBase の外部データベースとして接続する方法、MySQL 互換ポート、SSL、テーブル範囲、読み取り専用の分析シナリオ、フィールドマッピングについて説明します。"
keywords: "外部データソース,ClickHouse,外部データベース,MySQL 互換ポート,レポート,フィールドマッピング,NocoBase"
---

# ClickHouse

## はじめに

ClickHouse は外部データベースとして NocoBase に接続できます。接続後、NocoBase は ClickHouse 内のテーブル、フィールド、ビューを読み込み、外部データソース内のデータテーブルとして使用します。

ClickHouse は、分析クエリ、ログ分析、指標集計、レポート表示に適しています。トランザクション型データベースとは異なり、NocoBase で業務レコードを頻繁に追加、編集、削除するデータソースとしては適していません。

| 設定項目 | 説明 |
| --- | --- |
| 対応バージョン | ClickHouse >= 20.2。 |
| 商用版 | エンタープライズ版で利用できます。 |
| 対応プラグイン | `@nocobase/plugin-data-source-external-clickhouse`。 |
| 接続方式 | ClickHouse の MySQL 互換ポートを使用して接続します。 |
| 利用の推奨 | 主に表示、フィルタリング、集計、レポート表示に使用します。 |

外部 ClickHouse の利用に適したシナリオ：

- ログ、トラッキングデータ、指標、リスク管理などの分析データを接続する
- NocoBase で運用ダッシュボード、統計レポート、クエリページを構築する
- 業務担当者に読み取り専用のクエリ入口を提供し、データベースクライアントへの直接アクセスを減らす
- 既存の ClickHouse データに対して権限制御と可視化表示を行う

:::warning 注意

ClickHouse は、NocoBase では読み取り専用の分析データソースとして利用することを推奨します。通常の業務テーブルへの書き込みデータソースとして使用せず、ページ上で追加、編集、削除などの操作を設定することも推奨しません。

:::

## プラグインのインストール

このプラグインは商用プラグインです。詳しい有効化方法については、[商用プラグインの有効化ガイド](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)を参照してください。

## データソースの追加

「データソース管理」で「Add new」をクリックし、ClickHouse を選択して接続情報を入力します。
![20260709211117](https://static-docs.nocobase.com/20260709211117.png)

一般的な接続設定は次のとおりです：

| 設定 | 説明 |
| --- | --- |
| Data source name | ページブロック、権限、ワークフロー、API で参照するデータソース識別名です。作成後は変更できません。 |
| Data source display name | 画面に表示されるデータソース名です。「ClickHouse ログデータベース」「指標データベース」など、業務担当者が理解しやすい名前を使用することを推奨します。 |
| Host / Port | ClickHouse のホストアドレスと MySQL 互換ポートです。HTTP ポートやネイティブ TCP ポートは入力しないでください。 |
| Database | 接続する ClickHouse の database 名です。 |
| Username / Password | ClickHouse への接続に使用するアカウントとパスワードです。NocoBase は、このアカウントにアクセス権限があるオブジェクトのみ読み取ることができ、他のアカウントのプライベートオブジェクトに権限を付与したり、読み取ったりすることはありません。 |
| Table prefix | テーブル名のプレフィックスです。設定すると、NocoBase はこのプレフィックスに一致するテーブルのみを読み込み、NocoBase 内ではプレフィックスを除いたテーブル名を生成します。 |
| Use SSL | SSL を有効にするかどうかを設定します。ClickHouse Cloud または安全な接続環境に接続する場合は、通常有効にする必要があります。 |
| Enabled the data source | このデータソースを有効にするかどうかを設定します。無効にするとデータソース設定は保持されますが、ページブロック、権限、ワークフロー、API からそのデータを読み取れなくなります。 |

:::tip ヒント

ClickHouse プラグインは、MySQL 互換プロトコルを使用して接続します。設定前に、ClickHouse サービスで MySQL 互換ポートが有効になっていること、またネットワーク、ファイアウォール、アカウント権限によって NocoBase からのアクセスが許可されていることを確認してください。

:::

## 接続範囲

ClickHouse のページには「Collections」のテーブル選択欄はありません。接続範囲は主に `Database`、接続アカウントの権限、`Table prefix` によって制御されます。

ClickHouse 内のテーブル数が多い場合は、NocoBase 専用の database、アカウント、またはテーブル名プレフィックスを事前に用意し、現在のアプリケーションで表示・集計する必要があるテーブルのみを公開することを推奨します。

:::warning 注意

1 つの外部データソースで一度に接続できるデータテーブルまたはビューは、最大 500 個です。ClickHouse 内のオブジェクトが多い場合は、database、アカウント権限、または `Table prefix` を使用して、あらかじめ範囲を絞り込むことを推奨します。

:::

## 同期とフィールド設定

外部 ClickHouse のテーブル構造はデータベース側で管理されます。NocoBase は外部 ClickHouse 内にフィールドを作成したり、フィールドの型を変更したり、実際のフィールドを削除したりすることはありません。

ClickHouse 側でテーブル構造が変更された場合は、データソースで「Sync from database」を実行して、テーブルとフィールドのメタデータを再読み込みできます。同期により、NocoBase に保存されているデータテーブル、フィールド、主キー、ユニークキー、フィールド型のマッピング情報が更新されますが、ClickHouse 内の実際のテーブルやデータが削除されることはありません。

フィールドの同期後、NocoBase でフィールドタイトル、フィールドタイプ（Field type）、フィールドコンポーネント（Field interface）を設定できます。NocoBase のリレーションフィールドを作成する場合も、NocoBase 内にリレーションのメタデータが保存されるだけで、ClickHouse のテーブルに実際の外部キーフィールドが自動的に追加されることはありません。

## フィールド型のマッピング

NocoBase は ClickHouse のフィールド型を MySQL 互換形式に変換してから、適切な Field type と Field interface にマッピングします。フィールド設定で画面上の表示方法を調整できます。

一般的なマッピングは次のとおりです：

| ClickHouse フィールド型 | NocoBase Field type | 選択可能な Field interface |
| --- | --- | --- |
| `Int8`、`Int16`、`Int32`、`UInt8`、`UInt16`、`UInt32` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `Int64`、`UInt64` | `bigInt`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `Float32`、`Float64` | `float` | Number、Percent。 |
| `Decimal` | `decimal`、`double` | Number、Percent、Currency。 |
| `String`、`FixedString` | `text`、`string` | Input、Textarea、Markdown、URL。 |
| `Date`、`Date32` | `dateOnly` | Date。 |
| `DateTime`、`DateTime64` | `datetimeNoTz`、`datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `UUID` | `string`、`uuid` | Input、UUID。 |
| `Bool`、`Boolean` | `integer`、`boolean`、`sort` | Checkbox、Switch、Integer。 |
| `Array` | `json`、`array` | JSON。 |
| `Nullable(...)` | 内部フィールド型に応じてマッピング | 内部フィールド型によって異なります。 |
| `LowCardinality(...)` | 内部フィールド型に応じてマッピング | 内部フィールド型によって異なります。 |

:::warning 注意

ClickHouse の一部の分析用型やネスト型は、通常の業務フィールドに直接マッピングできない場合があります。サポートされていないフィールド型の場合は、まず ClickHouse 側で表示に適したビューまたはクエリテーブルを作成してから、NocoBase に接続してください。

:::

## 主キーとレコードの一意識別子

ClickHouse のソートキーやパーティションキーは、業務上の一意識別子と一致するとは限りません。ページブロックで表示するデータテーブルには、レコードを一意に特定できるフィールドを用意することを推奨します。

一意のフィールドがないテーブルまたはビューを接続する場合は、データテーブル設定で「Record unique key」を手動で設定する必要があります。利用可能な一意識別子がない場合、ページブロックでレコード詳細を正しく表示できない可能性があり、編集や削除の操作を設定する用途にも適していません。

![20260709211300](https://static-docs.nocobase.com/20260709211300.png)
![20260709211239](https://static-docs.nocobase.com/20260709211239.png)

## 関連リンク

- [外部データベース](./index.md) — 外部データベースの共通設定と管理方法を確認する
- [データソース管理](../data-source-manager/index.md) — データソースの入口と管理方法を確認する
- [データテーブルのフィールド](../data-modeling/collection-fields/index.md) — フィールド型とフィールドマッピングの説明を確認する