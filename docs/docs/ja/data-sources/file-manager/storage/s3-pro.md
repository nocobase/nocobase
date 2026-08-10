---
title: "ファイルストレージ：S3 (Pro)"
description: "S3 Pro ストレージエンジン。S3 互換プロトコルに対応したエンタープライズ向けストレージで、カスタム Endpoint と高度な設定をサポートします。"
keywords: "S3 Pro,オブジェクトストレージ,クラウドストレージ,S3互換,NocoBase"
---

# ファイルストレージ：S3 (Pro)

<PluginInfo commercial="true" name="file-storage-s3-pro"></PluginInfo>

## 概要

ファイル管理プラグインをベースに、S3 互換プロトコルに対応したファイルストレージタイプを追加します。Amazon S3、Alibaba Cloud OSS、Tencent Cloud COS、MinIO、Cloudflare R2 など、S3 プロトコルに対応するあらゆるオブジェクトストレージサービスを簡単に接続でき、ストレージサービスの互換性と柔軟性をさらに高めます。

## 主な機能

1. クライアントアップロード：ファイルのアップロード処理で NocoBase サーバーを経由せず、ファイルストレージサービスに直接接続することで、より効率的かつ高速なアップロードを実現します。

2. プライベートアクセス：ファイルにアクセスする際、すべての URL は署名付きの一時認証 URL となり、ファイルアクセスの安全性と有効性を確保します。


## 利用シーン

1. **ファイルテーブル管理**：アップロードされたすべてのファイルを一元管理・保存し、複数のファイル形式と保存方式に対応します。ファイルの分類や検索にも便利です。

2. **添付ファイルフィールドの保存**：フォームやレコードにアップロードされた添付ファイルのデータ保存に使用し、特定のデータレコードとの関連付けにも対応します。


## プラグイン設定

1. plugin-file-storage-s3-pro プラグインを有効にします

2. 「Setting-> FileManager」をクリックしてファイル管理設定を開きます

3. 「Add new」ボタンをクリックし、「S3 Pro」を選択します

![](https://static-docs.nocobase.com/20250102160704938.png)

4. ポップアップが表示されると、入力が必要なフォーム項目が多いことがわかります。以降のドキュメントを参照して、対象のファイルサービスに対応するパラメータ情報を取得し、フォームに正しく入力してください。

![](https://static-docs.nocobase.com/20250413190828536.png)


## サービスプロバイダーの設定

### Amazon S3

#### Bucket の作成

1. https://ap-southeast-1.console.aws.amazon.com/s3/home を開き、S3 コンソールにアクセスします

2. 右側の「Create bucket」ボタンをクリックします

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

2. Bucket Name（バケット名）を入力します。その他の項目はデフォルト設定のままにし、ページ下部までスクロールして **「**Create**」** ボタンをクリックし、作成を完了します。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### CORS の設定

1. buckets の一覧に移動し、先ほど作成した Bucket を見つけてクリックし、詳細ページを開きます

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. 「Permission」タブをクリックし、下にスクロールして CORS 設定セクションを見つけます

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. 以下の設定を入力します（必要に応じて詳細な設定に変更できます）。その後、保存します

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "POST",
            "PUT"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970494.png)

#### AccessKey、SecretAccessKey の取得

1. ページ右上の「Security credentials」ボタンをクリックします

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. 下にスクロールして「Access Keys」セクションを見つけ、「Create Access Key」ボタンをクリックします。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. 同意をクリックします（ここではルートアカウントを使用して説明していますが、本番環境では IAM の使用を推奨します）。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. ページに表示された Access key と Secret access key を保存します

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### パラメータの取得と設定

1. AccessKey ID と AccessKey Secret には、前の手順で取得した対応する値を正確に入力します

2. Bucket の詳細ページにある properties パネルを開くと、Bucket 名と Region（リージョン）情報を取得できます。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### パブリックアクセス（オプション）

これは必須ではありません。アップロードしたファイルを完全に公開する必要がある場合に設定します。

1. Permissions パネルを開き、下にスクロールして Object Ownership を見つけます。「編集」をクリックし、ACLs を有効にします

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. Block public access までスクロールし、「編集」をクリックして ACLs による制御を許可する設定にします

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. NocoBase で Public access にチェックを入れます


#### サムネイル設定（オプション）

この設定はオプションで、画像プレビューのサイズや表示効果を最適化する場合に使用します。**このデプロイ方法では追加料金が発生する場合があります。具体的な料金については AWS の関連規約を参照してください。**

1. [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls) にアクセスします。

2. ページ下部にある `Launch in the AWS Console` ボタンをクリックし、ソリューションのデプロイを開始します。
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. 画面の指示に従って設定を完了します。以下の項目には特に注意してください：
   1. スタックの作成時に、ソース画像を含む Amazon S3 バケット名を指定する必要があります。先ほど作成したバケット名を入力してください。
   2. デモ UI のデプロイを選択した場合、デプロイ完了後にその画面から画像処理機能をテストできます。AWS CloudFormation コンソールで対象のスタックを選択し、「出力」タブに移動して、DemoUrl キーに対応する値を見つけ、そのリンクをクリックしてデモ画面を開きます。
   3. このソリューションでは、画像を効率的に処理するために `sharp` Node.js ライブラリを使用しています。GitHub リポジトリからソースコードをダウンロードし、必要に応じてカスタマイズできます。

   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. 設定完了後、デプロイステータスが `CREATE_COMPLETE` になるまで待ちます。

5. NocoBase の設定では、以下の点に注意してください：
   1. `Thumbnail rule`：画像処理に関するパラメータを入力します。例：`?width=100`。詳細は [AWS ドキュメント](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html) を参照してください。
   2. `Access endpoint`：デプロイ後の Outputs -> ApiEndpoint の値を入力します。
   3. `Full access URL style`：**Ignore** にチェックを入れる必要があります（設定時にバケット名を入力済みのため、アクセス時には不要です）。

   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### 設定例

![](https://static-docs.nocobase.com/20250414152344959.png)


### Alibaba Cloud OSS

#### Bucket の作成

1. OSS コンソール https://oss.console.aliyun.com/overview を開きます

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. 左側のメニューで「Buckets」を開き、「Create Bucket」ボタンをクリックしてバケットの作成を開始します

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. bucket の関連情報を入力し、最後に Create ボタンをクリックします

    1. Bucket Name は自分の業務内容に合わせて任意に設定します

    2. Region はユーザーに最も近いリージョンを選択します

    3. その他の項目はデフォルトのままにするか、要件に応じて設定します

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)


#### CORS の設定

1. 前の手順で作成した bucket の詳細ページを開きます

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. 中央のメニューで「Content Security -> CORS」をクリックします

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. 「Create Rule」ボタンをクリックして関連項目を入力し、下にスクロールして「OK」をクリックします。下のスクリーンショットを参考にするか、さらに詳細な設定を行うこともできます

![](https://static-docs.nocobase.com/20250219171042784.png)

#### AccessKey、SecretAccessKey の取得

1. 右上のアバター下にある「AccessKey」をクリックします

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. ここでは説明を簡単にするため、メインアカウントで AccessKey を作成します。本番環境では RAM を使用して作成することを推奨します。詳しくは https://help.aliyun.com/zh/ram/user-guide/create-an-accesskey-pair-1?spm=5176.28366559.0.0.1b5c3c2fUI9Ql8#section-rjh-18m-7kp を参照してください

3. 「Create AccessKey」ボタンをクリックします

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. アカウント認証を行います

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. ページに表示された Access key と Secret access key を保存します

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)


#### パラメータの取得と設定

1. AccessKey ID と AccessKey Secret には、前の手順で取得した値を入力します

2. bucket の詳細ページを開き、Bucket を取得します

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. 下にスクロールして Region を取得します（末尾の「.aliyuncs.com」は不要です）

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. endpoint アドレスを取得します。NocoBase に入力する際は、https:// プレフィックスを追加する必要があります

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### サムネイル設定（オプション）

この設定はオプションで、画像プレビューのサイズや表示効果を最適化する場合にのみ使用します。

1. `Thumbnail rule` に関するパラメータを入力します。具体的なパラメータ設定については、[画像処理パラメータ](https://help.aliyun.com/zh/oss/user-guide/img-parameters/?spm=a2c4g.11186623.help-menu-31815.d_4_14_1_1.170243033CdbSm&scm=20140722.H_144582._.OR_help-T_cn~zh-V_1) を参照してください。

2. `Full upload URL style` と `Full access URL style` は同じ値に設定します。

#### 設定例

![](https://static-docs.nocobase.com/20250414152525600.png)


### MinIO

#### Bucket の作成

1. 左側の Buckets メニューをクリックし、Create Bucket をクリックして作成ページを開きます
2. Bucket 名を入力し、保存ボタンをクリックします
#### AccessKey、SecretAccessKey の取得

1. Access Keys に移動し、Create access key ボタンをクリックして作成ページを開きます

![](https://static-docs.nocobase.com/20250106111922957.png)

2. 保存ボタンをクリックします

![](https://static-docs.nocobase.com/20250106111850639.png)

1. ポップアップ内の Access Key と Secret Key を保存し、後の設定で使用します

![](https://static-docs.nocobase.com/20250106112831483.png)

#### パラメータ設定

1. NocoBase -> File manager ページを開きます

2. Add new ボタンをクリックし、S3 Pro を選択します

3. フォームに入力します
   - **AccessKey ID** と **AccessKey Secret** には、前の手順で保存した値を入力します
   - **Region**：プライベートデプロイの MinIO には Region の概念がないため、「auto」に設定できます
   - **Endpoint**：デプロイしたサービスのドメインまたは IP アドレスを入力します
   - Full access URL style を Path-Style に設定する必要があります

#### 設定例

![](https://static-docs.nocobase.com/20250414152700671.png)


### Tencent COS

上記のファイルサービスを参考に設定できます。設定方法はほぼ同じです

#### 設定例

![](https://static-docs.nocobase.com/20250414153252872.png)


### Cloudflare R2

上記のファイルサービスを参考に設定できます。設定方法はほぼ同じです

#### 設定例

![](https://static-docs.nocobase.com/20250414154500264.png)


## ユーザー向け利用方法

file-manager プラグインの使用方法については https://docs.nocobase.com/data-sources/file-manager/ を参照してください。