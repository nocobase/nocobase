---
pkg: "@nocobase/plugin-data-source-external-oracle"
title: "外部データソース - Oracle"
description: "Oracle を NocoBase の外部データベースとして接続する方法について説明します。サポートバージョン、プラグインのインストール、Thin/Thick 接続モード、Client directory、権限、フィールドマッピングを含みます。"
keywords: "外部データソース,Oracle,外部データベース,Thin,Thick,Client directory,フィールドマッピング,NocoBase"
---

# Oracle

## 概要

Oracle は NocoBase に外部データベースとして接続できます。接続後、NocoBase は Oracle 内のテーブル、フィールド、ビューを読み込み、外部データソースのデータテーブルとして使用できます。

[メインデータベース](../data-source-main/index.md)とは異なり、外部 Oracle の実際のテーブル構造は、引き続き元の業務システム、データベースクライアント、またはマイグレーションスクリプトによって管理されます。NocoBase は構造の読み取り、フィールドメタデータの保存、ページブロック、権限、ワークフロー、API の設定を担当します。

| 設定項目 | 説明 |
| --- | --- |
| サポートバージョン | Oracle >= 11g。 |
| 商用版 | Enterprise Edition でサポートされています。 |
| 対応プラグイン | `@nocobase/plugin-data-source-external-oracle`。 |
| 接続モード | Oracle Database 12.1 以降では通常 Thin モードを使用し、12.1 より前のバージョンでは Thick モードを使用します。 |

外部 Oracle の利用に適したシナリオ：

- 既存の ERP、MES、WMS、CRM などの業務システムで使用している Oracle データベースへの接続
- 履歴データを移行せずに、NocoBase で管理画面を構築する
- 既存のテーブルに対して権限制御、ワークフロー処理、データ修正、レポート表示を行う
- データベース構造を DBA、マイグレーションスクリプト、または元のシステムで引き続き管理する

:::warning 注意

外部 Oracle は NocoBase のシステムデータベースではありません。NocoBase がバックアップ、復元、マイグレーション、テーブル構造の変更を管理することはありません。

:::

## プラグインのインストール

このプラグインは商用プラグインです。詳しい有効化方法については、[商用プラグインの有効化ガイド](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)を参照してください。

接続モードで Thick を選択する場合は、NocoBase の実行環境に Oracle Client libraries をインストールし、データソース設定で「Client directory」を入力する必要があります。

## Oracle クライアントのインストール

Oracle Database 12.1 以降では通常 Thin モードを使用するため、Oracle Client を別途インストールする必要はありません。Oracle Database 12.1 より前のバージョンに接続する場合、または Thick モードを使用する必要がある場合にのみ、NocoBase の実行環境に Oracle Client libraries をインストールしてください。

データソース設定で「Thick」モードを選択した後、NocoBase サービスが実行されているマシンから Oracle Client を読み込めることを確認してください。

![20241204164359](https://static-docs.nocobase.com/20241204164359.png)

Linux 環境では、次の方法で Oracle Instant Client をインストールできます。

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

Oracle Client をシステムのデフォルトの読み込み場所にインストールしていない場合は、「Client directory」にクライアントライブラリのディレクトリを入力する必要があります。たとえば、上記のインストール方法の場合、対応するディレクトリは `/opt/instantclient_19_25` です。

![20241204165940](https://static-docs.nocobase.com/20241204165940.png)

:::tip ヒント

`Client directory` は Thick モードでのみ設定が必要です。Thin モードではこの設定を使用しません。初期化ルールの詳細については、[node-oracledb 初期化ドキュメント](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html)を参照してください。

:::

## データソースの追加

「データソース管理」で「Add new」をクリックし、Oracle を選択して接続情報を入力します。

![20241204164359](https://static-docs.nocobase.com/20241204164359.png)

一般的な接続設定は次のとおりです。

| 設定 | 説明 |
| --- | --- |
| Data source name | データソースの識別名。ページブロック、権限、ワークフロー、API から参照する際に使用します。作成後は変更できません。 |
| Data source display name | 画面上に表示されるデータソース名。担当者が理解しやすい名前（例：「ERP Oracle」「財務データベース」）を使用することを推奨します。 |
| Host / Port | Oracle のホストアドレスとポート。デフォルトポートは通常 `1521` です。 |
| ServerName | Oracle のサービス名。データベースリスナーに設定されている service name を入力します。 |
| Username / Password | Oracle への接続に使用するアカウントとパスワード。NocoBase はこのアカウントの Owner に属するテーブルとビューを読み取ります。ほかの Owner に属するオブジェクトへの権限付与や読み取りは行いません。 |
| Connection mode | Oracle の接続モード。Oracle Database 12.1 以降では通常 Thin モードを使用し、12.1 より前のバージョンでは Thick モードを使用します。 |
| Client directory | Oracle Thick モードで使用する Oracle Client libraries のディレクトリ。Thick モードを選択した場合にのみ設定が必要です。 |
| Table prefix | テーブル名のプレフィックス。設定すると、NocoBase はこのプレフィックスに一致するテーブルとビューのみを読み込み、NocoBase 内ではプレフィックスを除いたデータテーブル名を生成します。 |
| Collections / Add all collections | 接続範囲を制御します。「Add all collections」を有効にすると、NocoBase は現在の Owner とプレフィックスの範囲にあるすべてのテーブルとビューを接続します。無効にすると、「Collections」で選択したオブジェクトのみを接続します。 |
| Enabled the data source | このデータソースを有効にするかどうか。無効にするとデータソース設定は保持されますが、ページブロック、権限、ワークフロー、API からデータを読み取れなくなります。 |

:::tip ヒント

Oracle の接続範囲は、主に接続アカウントの Owner、`Table prefix`、「Collections」によって決まります。同じインスタンス内に多数のオブジェクトがある場合は、業務に必要な schema 専用のアカウントを使用して接続し、不要なオブジェクトが NocoBase に取り込まれないようにすることを推奨します。

:::

## データテーブルの選択

接続情報を入力した後、「Load Collections」をクリックすると、Oracle で利用可能なデータテーブルとビューを読み込めます。読み込み結果は、接続アカウントの Owner、`Table prefix`、「Collections」の設定によって異なります。

デフォルトでは「Add all collections」が有効になっており、現在の範囲内にあるすべてのテーブルとビューが接続対象になります。一部のオブジェクトのみを接続する場合は、「Add all collections」を無効にし、一覧から必要なデータテーブルまたはビューを選択してください。

![add_new_database_configure_load_collection](https://static-docs.nocobase.com/add_new_database_configure_load_collection.png)

:::warning 注意

1 つの外部データソースで接続できるデータテーブルまたはビューは、一度に最大 500 個です。Oracle 内に多数のオブジェクトがある場合は、接続アカウントの Owner、`Table prefix`、または「Collections」を使用して、あらかじめ対象範囲を絞り込むことを推奨します。

:::

## フィールドの同期と設定

外部 Oracle のテーブル構造はデータベース側で管理されます。NocoBase が外部 Oracle にフィールドを作成したり、フィールド型を変更したり、実際のフィールドを削除したりすることはありません。

Oracle 側のテーブル構造に変更があった場合は、データソースで「Sync from database」を実行し、テーブルとフィールドのメタデータを再読み込みできます。同期によって、NocoBase に保存されているデータテーブル、フィールド、主キー、ユニークキー、フィールド型のマッピング情報が更新されますが、Oracle 内の実際のテーブルやデータが削除されることはありません。

フィールドの同期後、NocoBase でフィールドタイトル、フィールドタイプ（Field type）、フィールドコンポーネント（Field interface）を設定できます。NocoBase のリレーションフィールドを作成する場合も、リレーションメタデータは NocoBase に保存され、Oracle のテーブルに実際の外部キーフィールドが自動的に追加されることはありません。

## フィールドタイプのマッピング

NocoBase は Oracle のフィールドタイプに基づいて、適切な Field type と Field interface に自動的にマッピングします。フィールド設定で画面上の表示方法を調整できます。

一般的なマッピングは次のとおりです。

| Oracle フィールドタイプ | NocoBase Field type | 選択可能な Field interface |
| --- | --- | --- |
| `NUMBER` | `integer`、`float`、`boolean`、`bigInt`、`unixTimestamp`、`sort` | Integer、Number、Sort、Checkbox、Switch、Select、Radio group。 |
| `BINARY_FLOAT`、`BINARY_DOUBLE`、`FLOAT` | `float` | Number、Percent。 |
| `INTEGER`、`SMALLINT`、`PLSQL_INTEGER` | `integer`、`boolean`、`sort` | Integer、Sort、Checkbox、Switch、Select、Radio group。 |
| `CHAR`、`NCHAR`、`VARCHAR2`、`NVARCHAR2` | `string`、`uuid`、`nanoid`、`datetimeNoTz` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `LONG`、`NCLOB` | `string`、`text` | Input、Textarea、Markdown、Vditor、Rich text。 |
| `CLOB` | `string` | Input、Textarea、Rich text。 |
| `DATE` | `datetimeNoTz` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP` | `datetimeNoTz` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP WITH TIME ZONE`、`TIMESTAMP WITH LOCAL TIME ZONE` | `datetimeTz` | Date、Time、Created at、Updated at。 |
| `ROWID`、`UROWID` | `string`、`text`、`integer` | Input、Textarea、Integer。 |
| `JSON` | `json` | JSON。 |

:::warning 注意

`BLOB`、`BFILE` などのバイナリオブジェクトタイプは、通常のファイルフィールドとして自動的に使用されません。ページ上で添付ファイルを管理する必要がある場合は、通常、NocoBase のファイルテーブルまたは添付ファイルフィールドを使用してファイルメタデータを保存することを推奨します。

:::

## 主キーとレコードの一意識別子

ページブロックで表示・編集するデータテーブルには、主キーまたは一意フィールドを設定することを推奨します。NocoBase は、レコードの一意識別子として主キーを優先的に使用します。

ビュー、主キーのないテーブル、または複合主キーのテーブルを接続する場合は、データテーブル設定で「Record unique key」を手動で設定する必要があります。利用可能な一意識別子がない場合、ページブロックでレコードを正しく表示、編集、削除できないことがあります。

![20260709210948](https://static-docs.nocobase.com/20260709210948.png)
![20260709211004](https://static-docs.nocobase.com/20260709211004.png)

## 関連リンク

- [外部データベース](./index.md) — 外部データベースの共通設定と管理方法を確認
- [データソース管理](../data-source-manager/index.md) — データソースへのアクセス方法と管理方法を確認
- [データテーブルのフィールド](../data-modeling/collection-fields/index.md) — フィールドタイプとフィールドマッピングの説明を確認
- [node-oracledb 初期化ドキュメント](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html) — Oracle Client libraries の読み込み方法を確認