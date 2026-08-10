---
pkg: "@nocobase/plugin-data-source-external-doris"
title: "外部データソース - Doris"
description: "Doris を NocoBase の外部データベースとして接続する方法について説明します。MySQL 互換ポート、FE query_port、対象テーブルの範囲、読み取り専用の分析用途、フィールドマッピングを含みます。"
keywords: "外部データソース,Doris,外部データベース,MySQL 互換ポート,FE query_port,レポート,フィールドマッピング,NocoBase"
---

# Doris

## 概要

Doris は外部データベースとして NocoBase に接続できます。接続すると、NocoBase は Doris 内のテーブル、フィールド、ビューを読み取り、外部データソース内のデータテーブルとして使用できます。

Doris は、分析クエリ、ワイドテーブルの明細データ、指標集計、レポート表示に適しています。トランザクション型データベースとは異なり、NocoBase で業務レコードを頻繁に追加、編集、削除するデータソースとしては適していません。

| 設定項目 | 説明 |
| --- | --- |
| 対応バージョン | Doris >= 2.1.0。 |
| 商用版 | Enterprise Edition に対応しています。 |
| 対応プラグイン | `@nocobase/plugin-data-source-external-doris`。 |
| 接続方式 | Doris の MySQL 互換ポート、つまり FE query_port を使用します。 |
| 利用上の推奨 | 主に表示、絞り込み、集計、レポート表示に使用します。 |

外部 Doris の利用に適したシーン：

- データウェアハウスの明細テーブル、集計テーブル、ワイドテーブル、指標テーブルを接続する
- NocoBase で運用ダッシュボード、統計レポート、検索ページを構築する
- 業務担当者に読み取り専用の検索入口を提供し、データベースクライアントへの直接アクセスを減らす
- 既存の Doris データに対して権限制御と可視化表示を行う

:::warning 注意

NocoBase では、Doris を読み取り専用の分析データソースとして使用することを推奨します。通常の業務テーブルへの書き込みデータソースとして使用せず、ページ上で追加、編集、削除などの操作を設定することも推奨しません。

:::

## プラグインのインストール

このプラグインは商用プラグインです。詳しい有効化方法については、[商用プラグインの有効化ガイド](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)を参照してください。

## データソースの追加

「データソース管理」で「Add new」をクリックし、Doris を選択して接続情報を入力します。
![20260709211333](https://static-docs.nocobase.com/20260709211333.png)

一般的な接続設定は次のとおりです：

| 設定 | 説明 |
| --- | --- |
| Data source name | ページブロック、権限、ワークフロー、API から参照するためのデータソース識別名です。作成後は変更できません。 |
| Data source display name | 画面に表示されるデータソース名です。「Doris データウェアハウス」「指標データベース」など、業務担当者が理解しやすい名前を使用することを推奨します。 |
| Host / Port | Doris FE のアドレスと MySQL 互換ポート、つまり `query_port` です。HTTP ポートは入力しないでください。 |
| Database | 接続する Doris database の名前です。 |
| Username / Password | Doris への接続に使用するアカウントとパスワードです。NocoBase はこのアカウントがアクセス権を持つオブジェクトのみ読み取ることができ、他のアカウントの非公開オブジェクトに権限を付与したり、読み取ったりすることはありません。 |
| Table prefix | テーブル名のプレフィックスです。設定すると、NocoBase はこのプレフィックスに一致するテーブルのみを読み取り、NocoBase ではプレフィックスを除いたテーブル名を生成します。 |
| Enabled the data source | このデータソースを有効にするかどうかを指定します。無効にするとデータソースの設定は保持されますが、ページブロック、権限、ワークフロー、API からそのデータを読み取れなくなります。 |

:::tip ヒント

Doris プラグインは MySQL 互換プロトコルを使用して接続します。設定する前に、Doris FE の `query_port` に NocoBase からアクセスでき、アカウントに対象の database、table、column のメタデータを読み取る権限があることを確認してください。

:::

## 接続範囲

Doris の画面には「Collections」のテーブル選択欄はありません。接続範囲は主に `Database`、接続アカウントの権限、`Table prefix` によって制御されます。

Doris にテーブルが多数ある場合は、NocoBase 専用の database、アカウント、またはテーブルプレフィックスをあらかじめ用意し、現在のアプリケーションで表示・集計する必要があるテーブルのみを公開することを推奨します。

:::warning 注意

1 つの外部データソースで一度に接続できるデータテーブルまたはビューは最大 500 個です。Doris 内のオブジェクトが多い場合は、database、アカウント権限、または `Table prefix` によって範囲をあらかじめ絞り込むことを推奨します。

:::

## フィールドの同期と設定

外部 Doris のテーブル構造はデータベース側で管理されます。NocoBase は外部 Doris にフィールドを作成したり、フィールド型を変更したり、実際のフィールドを削除したりしません。

Doris 側でテーブル構造が変更された場合は、データソースで「Sync from database」を実行して、テーブルとフィールドのメタデータを再読み込みできます。同期によって、NocoBase に保存されているデータテーブル、フィールド、主キー、ユニークキー、フィールド型のマッピング情報が更新されますが、Doris 内の実際のテーブルやデータが削除されることはありません。

フィールドの同期後、NocoBase でフィールドタイトル、フィールドタイプ（Field type）、フィールドコンポーネント（Field interface）を設定できます。NocoBase のリレーションフィールドを作成する場合も、NocoBase にリレーションメタデータが保存されるだけで、Doris のテーブルに実際の外部キーフィールドが自動的に追加されることはありません。

## フィールドタイプのマッピング

NocoBase は、MySQL 互換のロジックと Doris 固有の型に基づいて、Doris のフィールドタイプを適切な Field type と Field interface にマッピングします。フィールド設定で画面上の表示方法を調整できます。

一般的なマッピングは次のとおりです：

| Doris フィールドタイプ | NocoBase Field type | 選択可能な Field interface |
| --- | --- | --- |
| `TINYINT`、`SMALLINT` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `INT`、`INTEGER` | `integer`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Select、Radio group。 |
| `BIGINT` | `bigInt`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `LARGEINT` | `bigInt` | Integer。 |
| `FLOAT` | `float`、`sort` | Number、Percent、Sort。 |
| `DOUBLE` | `double`、`sort` | Number、Percent、Sort。 |
| `DECIMAL`、`DECIMALV3` | `decimal` | Number、Percent、Currency。 |
| `BOOLEAN` | `boolean` | Checkbox、Switch。 |
| `CHAR` | `string` | Input、Email、Phone。 |
| `VARCHAR` | `string`、`uuid`、`nanoid`、`encryption` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TEXT`、`STRING` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `DATE`、`DATEV2` | `date` | Date。 |
| `DATETIME`、`DATETIMEV2` | `datetime` | Date、Time、Created at、Updated at。 |
| `JSON`、`JSONB` | `json` | JSON。 |
| `HLL`、`BITMAP`、`QUANTILE_STATE`、`AGG_STATE` | `json` | JSON。 |
| `VARIANT`、`ARRAY`、`MAP`、`STRUCT` | `json` | JSON。 |
| `IPV4`、`IPV6` | `string` | Input。 |

`VARIANT` は Apache Doris 2.1.0 以降で提供される動的型です。2.1.0 未満の Doris を使用している場合、このタイプのフィールドは接続できません。

:::warning 注意

Doris の集約状態型、半構造化型、複合型は、表示やデバッグには適していますが、フォーム入力フィールドとして適しているとは限りません。複合型を使用する場合は、Doris 側で業務上の閲覧に適したビューまたは明細テーブルを用意してから、NocoBase に接続することを推奨します。

:::

## 主キーとレコードの一意識別子

Doris のデータモデルやキー model は、必ずしも業務上の一意識別子と一致するとは限りません。ページブロックで表示するデータテーブルについては、レコードを一意に特定できるフィールドを用意することを推奨します。

一意のフィールドを持たないテーブルまたはビューを接続する場合は、データテーブルの設定で「Record unique key」を手動で設定する必要があります。利用可能な一意識別子がない場合、ページブロックでレコードの詳細を正しく表示できない可能性があり、編集や削除操作の設定にも適していません。

![20260709211439](https://static-docs.nocobase.com/20260709211439.png)
![20260709211454](https://static-docs.nocobase.com/20260709211454.png)

## 関連リンク

- [外部データベース](./index.md) — 外部データベースの一般的な設定と管理方法を確認します
- [データソース管理](../data-source-manager/index.md) — データソースの入口と管理方法を確認します
- [データテーブルのフィールド](../data-modeling/collection-fields/index.md) — フィールドタイプとフィールドマッピングの説明を確認します