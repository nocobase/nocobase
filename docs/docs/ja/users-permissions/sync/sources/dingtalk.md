---
pkg: '@nocobase/plugin-auth-dingtalk'
title: "DingTalk からユーザーデータを同期する"
description: "DingTalk のユーザーと部署を NocoBase に同期し、HTTP コールバックまたは Stream モードで差分変更を受信します。"
keywords: "DingTalk,ユーザー同期,部署同期,Stream モード,イベント購読,NocoBase"
---

# DingTalk からユーザーデータを同期する

<PluginInfo commercial="true" name="auth-dingtalk"></PluginInfo>

## はじめに

**DingTalk** プラグインは、DingTalk 組織のユーザーと部署を NocoBase に同期します。手動の完全同期に加え、HTTP コールバックまたは Stream 接続による差分更新をサポートします。

## 事前準備

1. **DingTalk** と **ユーザーデータ同期** プラグインをインストールして有効化します。
2. DingTalk 開発者コンソールで企業内部アプリを作成します。
3. 以下の連絡先権限を付与し、データ権限範囲を設定します。
4. Client ID と Client Secret をコピーします。[認証：DingTalk](/auth-verification/auth-dingtalk/) も参照してください。

## 連絡先権限とデータ権限範囲を設定する

DingTalk のアプリの **権限管理** で、次の権限を付与します。

| 権限 | 識別子 | 必須 | 用途 |
| --- | --- | --- | --- |
| 部署情報の読み取り | `qyapi_get_department_list` | はい | 部署一覧、名前、階層を読み取ります。 |
| 部署メンバーの読み取り | `qyapi_get_department_member` | はい | 各部署のメンバーを読み取ります。 |
| メンバー情報の読み取り | `qyapi_get_member` | はい | ユーザー詳細と所属部署を読み取ります。 |
| 従業員の携帯電話番号 | `fieldMobile` | 携帯番号使用時 | 電話番号を同期します。一意識別子が `mobile` の場合は必須です。 |
| メールなどの個人情報 | `fieldEmail` | いいえ | メールアドレスを同期する場合に必要です。 |

アプリの **データ権限範囲** に、同期対象の部署と従業員を含めます。組織全体を同期する場合は、すべての従業員を選択します。

:::warning
API 権限は読み取れるフィールドを、データ権限範囲は読み取れる部署と従業員を決定します。両方の設定が必要です。イベント購読は連絡先の読み取り権限の代わりにはなりません。
:::

同じアプリをログインにも使う場合は、[認証：DingTalk](/auth-verification/auth-dingtalk/) に記載された個人情報権限も付与してください。

## DingTalk 同期元を追加する

**ユーザーと権限 > 同期** を開き、**追加** をクリックして **DingTalk** を選択します。

| フィールド | 説明 |
| --- | --- |
| 同期元名 | 同期元の一意な名前です。 |
| 有効 | イベント受信を開始し、同期タスクを実行可能にします。 |
| Client ID | アプリの Client ID。環境変数とシークレットを利用できます。 |
| Client Secret | アプリの Client Secret。環境変数とシークレットを利用できます。 |
| ユーザー一意識別フィールド | `mobile` または `unionId`。初回同期後は変更しないでください。選択した値がないユーザーはスキップされます。 |
| イベント受信モード | 差分変更用の **HTTP コールバック** または **Stream モード**。 |

保存して有効化した後、まず **同期** をクリックして完全同期を実行します。

## イベント受信モードを選択する

### Stream モード

Stream モードは、NocoBase サーバーから DingTalk へ永続的な送信接続を確立します。公開コールバック URL、Token、EncodingAESKey は不要です。

1. DingTalk のイベント購読設定で **Stream モード** を選択します。
2. 必要なユーザーと部署の変更イベントを購読します。
3. NocoBase で **Stream モード** を選択し、保存して有効化します。

同期元を有効にすると Stream クライアントが開始します。更新、無効化、削除時には接続が更新または終了します。

:::info
NocoBase サーバーから DingTalk への外向き接続が必要です。リバースプロキシや公開受信エンドポイントは不要です。
:::

### HTTP コールバック

1. NocoBase で **HTTP コールバック** を選択します。
2. DingTalk で設定した Token と EncodingAESKey を入力します。
3. 同期元を保存し、生成された **イベントコールバック URL** をコピーします。
4. DingTalk に URL を設定し、必要なイベントを購読します。

URL は DingTalk からアクセスできる必要があります。本番環境では HTTPS を使用し、リバースプロキシでパス全体を転送してください。

## 対応する差分イベント

| イベント | NocoBase での処理 |
| --- | --- |
| `user_add_org` | ユーザーを作成または更新します。 |
| `user_modify_org` | ユーザーを更新します。 |
| `user_leave_org` | 同期済みユーザーを削除します。 |
| `org_dept_create` | 部署を作成または更新します。 |
| `org_dept_modify` | 部署を更新し、そのユーザーを同期します。 |
| `org_dept_remove` | 同期済み部署を削除します。 |

## 同期されるフィールド

### 部署フィールド

| DingTalk フィールド | NocoBase のフィールドまたは用途 |
| --- | --- |
| `dept_id` | 同期元内で一意な部署識別子。 |
| `name` | 部署名。 |
| `parent_id` | 親部署。権限範囲外の場合はルート部署として同期されます。 |

### ユーザーフィールド

| DingTalk フィールド | NocoBase のフィールドまたは用途 |
| --- | --- |
| `mobile` または `unionid` | 設定に応じた一意識別子とユーザー名。 |
| `name` | ユーザーのニックネーム。 |
| `mobile` | 電話番号。`fieldMobile` が必要です。 |
| `email`、なければ `org_email` | メールアドレス。`fieldEmail` が必要です。 |
| `dept_id_list` | データ権限範囲内の所属部署。 |
| `dept_order_list` | 主部署。 |
| `leader_in_dept` | 対応する部署の責任者かどうか。 |

### 部署責任者

NocoBase は `leader_in_dept` を部署ごとに同期します。1 人のユーザーが複数の部署責任者になることができ、主部署と一致する必要はありません。DingTalk で責任者指定を解除すると、次回同期で NocoBase 側も解除されます。手動変更は上書きされる場合があります。

完全同期と差分同期は同じフィールドマッピングを使用します。アバター、役職、従業員番号は現在同期されません。

## トラブルシューティング

- データが空または不足する場合は、3 つの必須権限とデータ権限範囲を確認します。
- 電話番号やメールが空の場合は `fieldMobile` と `fieldEmail` を確認します。
- 一意識別子がないユーザーはスキップされます。
- Stream モードでは `Dingtalk stream client starting`、`Dingtalk stream client started`、接続エラーをログで確認します。
- HTTP コールバックでは公開アクセス、Token、EncodingAESKey を確認します。
- 権限や範囲を変更した後は完全同期を再実行します。
