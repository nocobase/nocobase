---
pkg: "@nocobase/plugin-data-source-external-postgres"
title: "外部データソース - PostgreSQL"
description: "PostgreSQL を NocoBase の外部データベースとして接続する方法、対応バージョン、プラグインのインストール、接続設定、Schema、SSL、権限、フィールドマッピングについて説明します。"
keywords: "外部データソース,PostgreSQL,外部データベース,Schema,SSL,フィールドマッピング,NocoBase"
---

# PostgreSQL

## はじめに

PostgreSQL は外部データベースとして NocoBase に接続できます。接続すると、NocoBase は PostgreSQL 内のテーブル、フィールド、ビューを読み取り、外部データソースのデータテーブルとして使用できるようにします。

[メインデータベース](../data-source-main/index.md)とは異なり、外部 PostgreSQL の実際のテーブル構造は、引き続き元の業務システム、データベースクライアント、またはマイグレーションスクリプトによって管理されます。NocoBase は構造の読み取り、フィールドメタデータの保存、ページブロック、権限、ワークフロー、API の設定を担当します。

| 設定項目 | 説明 |
| --- | --- |
| 対応バージョン | PostgreSQL >= 9.5。 |
| 商用版 | スタンダード版、プロフェッショナル版、エンタープライズ版に対応しています。 |
| 対応プラグイン | `@nocobase/plugin-data-source-external-postgres`。 |

外部 PostgreSQL は、次のような用途に適しています。

- 既存の ERP、MES、WMS、CRM などの業務システムの PostgreSQL データベースに接続する
- 過去のデータを移行せずに、NocoBase で管理画面を構築する
- 既存のテーブルに対して、権限管理、ワークフロー処理、データ修正、レポート表示を行う
- データベース構造を DBA、マイグレーションスクリプト、または元のシステムで引き続き管理する

:::warning 注意

外部 PostgreSQL は NocoBase のシステムデータベースではありません。NocoBase がバックアップ、復元、マイグレーション、テーブル構造の変更を引き継ぐことはありません。

:::

## プラグインのインストール

このプラグインは商用プラグインです。詳しいアクティベーション方法については、[商用プラグインのアクティベーションガイド](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)を参照してください。

## データソースの追加

「データソース管理」で「Add new」をクリックし、PostgreSQL を選択して接続情報を入力します。
![20260709204045](https://static-docs.nocobase.com/20260709204045.png)

一般的な接続設定は次のとおりです。

| 設定 | 説明 |
| --- | --- |
| Data source name | ページブロック、権限、ワークフロー、API で参照するデータソースの識別名です。作成後は変更できません。 |
| Data source display name | 画面に表示されるデータソース名です。「ERP PostgreSQL」「レポートデータベース」など、業務担当者が理解しやすい名称を使用することをおすすめします。 |
| Host / Port | PostgreSQL のホストアドレスとポートです。デフォルトポートは通常 `5432` です。 |
| Database | 接続する PostgreSQL データベースの名前です。 |
| Username / Password | PostgreSQL への接続に使用するアカウントとパスワードです。NocoBase はこのアカウントがアクセス権を持つオブジェクトのみ読み取ることができ、他のアカウント専用のオブジェクトに権限を付与したり、読み取ったりすることはありません。 |
| Schema | 読み取る PostgreSQL schema です。例：`public`。データベースに複数の schema がある場合は、現在の業務で接続する必要がある schema のみを入力することをおすすめします。 |
| Table prefix | テーブル名のプレフィックスです。設定すると、NocoBase はこのプレフィックスに一致するテーブルとビューのみを読み取り、NocoBase 内ではプレフィックスを除いたデータテーブル名を生成します。 |
| Collections / Add all collections | 接続範囲を制御します。「Add all collections」を有効にすると、NocoBase は現在の範囲内にあるすべてのテーブルとビューを接続します。無効にすると、「Collections」で選択したオブジェクトのみを接続します。 |
| Enabled the data source | このデータソースを有効にするかどうかを設定します。無効にすると、データソースの設定は保持されますが、ページブロック、権限、ワークフロー、API からデータを読み取ることはできなくなります。 |
| SSL options | PostgreSQL の SSL 接続設定です。SSL mode、未承認の証明書を拒否するかどうか、CA 証明書、クライアント証明書、クライアントキーのパスを設定できます。 |

:::tip ヒント

PostgreSQL 内のオブジェクトが多い場合は、`Schema`、`Table prefix`、「Collections」を使って対象範囲を絞り込んでください。現在のアプリケーションで使用するテーブルとビューのみを接続すると、その後の権限設定、ページ構築、同期メンテナンスが容易になります。

:::

## データテーブルの選択

接続情報を入力したら、「Load Collections」をクリックして、PostgreSQL で利用可能なデータテーブルとビューを読み込むことができます。読み込み結果は、接続アカウント、`Schema`、`Table prefix`、「Collections」の設定によって異なります。

デフォルトでは「Add all collections」が有効になっており、現在の範囲内にあるすべてのテーブルとビューが接続されます。一部のオブジェクトのみを接続する場合は、「Add all collections」を無効にして、一覧から必要なデータテーブルまたはビューを選択してください。

![20260709204309](https://static-docs.nocobase.com/20260709204309.png)

:::warning 注意

1 つの外部データソースで一度に接続できるデータテーブルまたはビューは、最大 500 件です。PostgreSQL 内のオブジェクトが多い場合は、`Schema`、`Table prefix`、「Collections」を使って対象範囲を絞り込むことをおすすめします。

:::

## フィールドの同期と設定

外部 PostgreSQL のテーブル構造はデータベース側で管理されます。NocoBase が外部 PostgreSQL にフィールドを作成したり、フィールドの型を変更したり、実際のフィールドを削除したりすることはありません。

PostgreSQL 側でテーブル構造に変更があった場合は、データソースで「Sync from database」を実行し、テーブルとフィールドのメタデータを再読み込みできます。同期によって、NocoBase に保存されているデータテーブル、フィールド、主キー、ユニークキー、フィールド型のマッピング情報が更新されますが、PostgreSQL 内の実際のテーブルやデータが削除されることはありません。

フィールドの同期後、NocoBase でフィールドのタイトル、フィールドタイプ（Field type）、フィールドインターフェース（Field interface）を設定できます。NocoBase のリレーションフィールドを作成する場合も、NocoBase 内にリレーションメタデータが保存されるだけで、PostgreSQL のテーブルに実際の外部キーフィールドが自動的に追加されることはありません。

## フィールドタイプのマッピング

NocoBase は PostgreSQL のフィールドタイプに基づいて、適切な Field type と Field interface に自動的にマッピングします。フィールド設定で画面上の表示方法を調整できます。

一般的なマッピングは次のとおりです。

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

サポートされていない PostgreSQL のフィールドタイプは、フィールド設定で個別に表示されます。これらのフィールドを NocoBase で通常のフィールドとして使用するには、適応対応を開発する必要があります。

:::

## 主キーとレコードの一意識別子

ページブロックで表示・編集するデータテーブルには、主キーまたは一意フィールドを設定することをおすすめします。NocoBase は、レコードの一意識別子として主キーを優先的に使用します。

ビュー、主キーのないテーブル、複合主キーのテーブルを接続する場合は、データテーブルの設定で「Record unique key」を手動で設定する必要があります。使用可能な一意識別子がない場合、ページブロックでレコードを正しく表示、編集、削除できないことがあります。

![20260709204742](https://static-docs.nocobase.com/20260709204742.png)
![20260709204827](https://static-docs.nocobase.com/20260709204827.png)

## 関連リンク

- [外部データベース](./index.md) — 外部データベースの共通設定と管理方法を確認
- [データソース管理](../data-source-manager/index.md) — データソースへの入口と管理方法を確認
- [データテーブルのフィールド](../data-modeling/collection-fields/index.md) — フィールドタイプとフィールドマッピングの説明を確認