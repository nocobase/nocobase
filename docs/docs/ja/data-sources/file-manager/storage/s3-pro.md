---
pkg: "@nocobase/plugin-file-storage-s3-pro"
---
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::



pkg: "@nocobase/plugin-file-storage-s3-pro"
---
# ファイルストレージ：S3 (Pro)

## はじめに

ファイル管理プラグインを基盤として、S3 プロトコル互換のファイルストレージタイプを新たに追加しました。Amazon S3、Alibaba Cloud OSS、Tencent Cloud COS、MinIO、Cloudflare R2 など、S3 プロトコルをサポートするあらゆるオブジェクトストレージサービスを簡単に連携でき、ストレージサービスの互換性と柔軟性がさらに向上します。

## 機能

1. クライアントアップロード：ファイルのアップロードは NocoBase サーバーを経由せず、ストレージサービスに直接接続されます。これにより、より効率的で高速なアップロード体験が実現します。
    
2. プライベートアクセス：ファイルにアクセスする際、すべての URL は署名付きの一時的な認証アドレスとなります。これにより、ファイルアクセスのセキュリティと有効期限が保証されます。

## ユースケース

1. **ファイルテーブル管理**：アップロードされたすべてのファイルを一元的に管理・保存し、さまざまなファイルタイプと保存方法をサポートすることで、ファイルの分類と検索を容易にします。
    
2. **添付ファイルフィールドストレージ**：フォームやレコードでアップロードされた添付ファイルのデータストレージとして使用され、特定のデータレコードとの関連付けをサポートします。
  

## プラグイン設定

1. `plugin-file-storage-s3-pro` プラグインを有効にします。
    
2. 「Setting -> FileManager」をクリックして、ファイル管理設定にアクセスします。

3. 「Add new」ボタンをクリックし、「S3 Pro」を選択します。

![](https://static-docs.nocobase.com/20250102160704938.png)

4. ポップアップウィンドウが表示されたら、多くのフォーム項目を記入する必要があります。以下のドキュメントを参照して、ご利用のファイルサービスに関連するパラメーター情報を取得し、フォームに正しく入力してください。

![](https://static-docs.nocobase.com/20250413190828536.png)


## サービスプロバイダーの設定

### Amazon S3

#### バケットの作成

1. [Amazon S3 コンソール](https://ap-southeast-1.console.aws.amazon.com/s3/home)にアクセスします。
    
2. 右側の「Create bucket」ボタンをクリックします。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

3. バケット名（Bucket Name）を入力し、その他のフィールドはデフォルト設定のままで構いません。ページ下部までスクロールし、「**Create**」ボタンをクリックして作成を完了します。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### CORS 設定

1. バケットリストから、先ほど作成したバケットを見つけてクリックし、詳細ページにアクセスします。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. 「Permission」タブに移動し、CORS 設定セクションまでスクロールします。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. 以下の設定を入力し（必要に応じてカスタマイズ可能）、保存します。
    
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

#### AccessKey と SecretAccessKey の取得

1. ページ右上の「Security credentials」ボタンをクリックします。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. 「Access Keys」セクションまでスクロールし、「Create Access Key」ボタンをクリックします。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. 規約に同意します（ここではメインアカウントでのデモンストレーションですが、本番環境では IAM の使用を推奨します）。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. 表示された Access Key と Secret Access Key を保存します。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### パラメーターの取得と設定

1. AccessKey ID と AccessKey Secret は、前の手順で取得した値です。正確に入力してください。
    
2. バケットの詳細ページの「Properties」パネルにアクセスすると、バケット名とリージョン（Region）情報を取得できます。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### パブリックアクセス（オプション）

これは必須の設定ではありません。アップロードしたファイルを完全に公開する必要がある場合に設定します。

1. 「Permissions」パネルに移動し、「Object Ownership」までスクロールして「Edit」をクリックし、ACL を有効にします。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. 「Block public access」までスクロールし、「Edit」をクリックして、ACL による制御を許可するように設定します。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. NocoBase で「Public access」にチェックを入れます。

#### サムネイル設定（オプション）

この設定はオプションであり、画像プレビューのサイズや効果を最適化したい場合に使用します。**このデプロイメントには追加費用が発生する可能性があるため、詳細については AWS の関連規約を参照してください。**

1. [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls) にアクセスします。

2. ページ下部の「`Launch in the AWS Console`」ボタンをクリックして、デプロイを開始します。
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. プロンプトに従って設定を完了します。以下のオプションには特に注意が必要です。
   1. スタックを作成する際、ソース画像を含む Amazon S3 バケット名を指定する必要があります。以前に作成したバケット名を入力してください。
   2. デモ UI をデプロイすることを選択した場合、デプロイ完了後にそのインターフェースを使用して画像処理機能をテストできます。AWS CloudFormation コンソールでスタックを選択し、「Outputs」タブに移動して「DemoUrl」キーに対応する値を見つけ、そのリンクをクリックしてデモインターフェースを開きます。
   3. このソリューションは、`sharp` Node.js ライブラリを使用して画像を効率的に処理します。GitHub リポジトリからソースコードをダウンロードし、必要に応じてカスタマイズできます。
   
   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. 設定が完了したら、デプロイステータスが「`CREATE_COMPLETE`」になるまで待ちます。

5. NocoBase の設定では、以下の点に注意してください。
   1. `Thumbnail rule`：画像処理に関連するパラメーター（例：`?width=100`）を入力します。詳細については、[AWS ドキュメント](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html)を参照してください。
   2. `Access endpoint`：デプロイ後の Outputs -> ApiEndpoint の値を入力します。
   3. `Full access URL style`：**Ignore** を選択する必要があります（設定時にバケット名が入力されているため、アクセス時には不要です）。
   
   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### 設定例

![](https://static-docs.nocobase.com/20250414152344959.png)


### Alibaba Cloud OSS

#### バケットの作成

1. [OSS コンソール](https://oss.console.aliyun.com/overview)を開きます。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. 左側メニューの「Buckets」を選択し、「Create Bucket」ボタンをクリックしてバケットの作成を開始します。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. バケット関連情報を入力し、最後に「Create」ボタンをクリックします。
    
    1. バケット名（Bucket Name）：ご自身のビジネス要件に合わせて自由に設定してください。
        
    2. リージョン（Region）：ユーザーに最も近いリージョンを選択してください。
        
    3. その他の設定は、デフォルトのままでも、必要に応じてカスタマイズしても構いません。    

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)


#### CORS 設定

1. 前の手順で作成したバケットの詳細ページに移動します。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. 中央メニューの「Content Security -> CORS」をクリックします。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. 「Create Rule」ボタンをクリックし、関連する内容を入力して下までスクロールし、「OK」をクリックします。以下のスクリーンショットを参考にしたり、より詳細な設定を行ったりすることも可能です。

![](https://static-docs.nocobase.com/20250219171042784.png)

#### AccessKey と SecretAccessKey の取得

1. 右上のアバターの下にある「AccessKey」をクリックします。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. ここではデモンストレーションの便宜上、メインアカウントを使用して AccessKey を作成します。本番環境での使用には RAM を使用して作成することを推奨します。詳細については、[Alibaba Cloud ドキュメント](https://help.aliyun.com/zh/ram/user-guide/create-an-accesskey-pair-1?spm=5176.28366559.0.0.1b5c3c2fUI9Ql8#section-rjh-18m-7kp)を参照してください。
    
3. 「Create AccessKey」ボタンをクリックします。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. アカウント認証を行います。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. 表示された Access Key と Secret Access Key を保存します。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)


#### パラメーターの取得と設定

1. AccessKey ID と AccessKey Secret は、前の手順で取得した値です。
    
2. バケットの詳細ページに移動して、バケット名を取得します。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. 下にスクロールしてリージョン（Region）を取得します（末尾の「.aliyuncs.com」は不要です）。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. エンドポイントアドレスを取得し、NocoBase に入力する際には「https://」プレフィックスを追加する必要があります。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### サムネイル設定（オプション）

この設定はオプションであり、画像プレビューのサイズや効果を最適化する必要がある場合にのみ使用します。

1. `Thumbnail rule` に関連するパラメーターを入力します。具体的なパラメーター設定については、[画像処理パラメーター](https://help.aliyun.com/zh/oss/user-guide/img-parameters/?spm=a2c4g.11186623.help-menu-31815.d_4_14_1_1.170243033CdbSm&scm=20140722.H_144582._.OR_help-T_cn~zh-V_1)に関する Alibaba Cloud ドキュメントを参照してください。

2. `Full upload URL style` と `Full access URL style` は同じ設定のままで構いません。

#### 設定例

![](https://static-docs.nocobase.com/20250414152525600.png)


### MinIO

#### バケットの作成

1. 左側の「Buckets」メニューをクリックし、「Create Bucket」をクリックして作成ページに移動します。
2. バケット名を入力後、「保存」ボタンをクリックします。
#### AccessKey と SecretAccessKey の取得

1. 「Access Keys」に移動し、「Create access key」ボタンをクリックして作成ページに移動します。

![](https://static-docs.nocobase.com/20250106111922957.png)

2. 「保存」ボタンをクリックします。

![](https://static-docs.nocobase.com/20250106111850639.png)

3. ポップアップウィンドウに表示される Access Key と Secret Key を保存し、その後の設定で使用します。

![](https://static-docs.nocobase.com/20250106112831483.png)

#### パラメーター設定

1. NocoBase の「File manager」ページに移動します。

2. 「Add new」ボタンをクリックし、「S3 Pro」を選択します。

3. フォームに記入します。
   - **AccessKey ID** と **AccessKey Secret**：前の手順で保存したテキストを使用します。
   - **Region**：プライベートデプロイされた MinIO にはリージョンの概念がないため、「"auto"」に設定できます。
   - **Endpoint**：デプロイされたサービスのドメイン名または IP アドレスを入力します。
   - Full access URL style を「Path-Style」に設定する必要があります。

#### 設定例

![](https://static-docs.nocobase.com/20250414152700671.png)


### Tencent COS

上記ファイルサービスの設定を参考にしてください。ロジックは同様です。

#### 設定例

![](https://static-docs.nocobase.com/20250414153252872.png)


### Cloudflare R2

上記ファイルサービスの設定を参考にしてください。ロジックは同様です。

#### 設定例

![](https://static-docs.nocobase.com/20250414154500264.png)


## 利用ガイド

[file-manager プラグインのドキュメント](/data-sources/file-manager)を参照してください。