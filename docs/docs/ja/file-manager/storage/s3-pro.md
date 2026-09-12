---
pkg: '@nocobase/plugin-file-storage-s3-pro'
---

# ストレージエンジン：S3 (Pro)

## はじめに

ファイル管理プラグインを基盤として、S3プロトコル互換のファイルストレージタイプが新たに追加されました。Amazon S3、Aliyun OSS、Tencent COS、MinIO、Cloudflare R2など、S3プロトコルをサポートするあらゆるオブジェクトストレージサービスを簡単に連携でき、ストレージサービスの互換性と柔軟性がさらに向上します。

## 機能

1. クライアントサイドアップロード：ファイルアップロードプロセスはNocoBaseサーバーを経由せず、ファイルストレージサービスに直接接続するため、より効率的で高速なアップロード体験を実現します。
    
2. プライベートアクセス：デフォルトでは有効期限付きの署名 URL を使用します。公開 Bucket 向けに署名なし URL を生成することもできます。

## ユースケース

1. **ファイルコレクション管理**：アップロードされたすべてのファイルを一元的に管理・保存し、多様なファイルタイプと保存方法をサポートすることで、ファイルの分類と検索を容易にします。
    
2. **添付ファイルフィールドストレージ**：フォームやレコードにアップロードされる添付ファイルのデータストレージとして利用され、特定のデータレコードとの関連付けをサポートします。
  

## プラグイン設定

1. `plugin-file-storage-s3-pro` プラグインを有効にします。
    
2. 「Setting」->「FileManager」をクリックし、ファイル管理設定画面に進みます。

3. 「Add new」ボタンをクリックし、「S3 Pro」を選択します。

![](https://static-docs.nocobase.com/20250102160704938.png)

4. ポップアップが表示されたら、多くの入力項目があるフォームが表示されます。対応するファイルサービスに関するパラメータ情報は、後続のドキュメントを参照し、フォームに正しく入力してください。

![](https://static-docs.nocobase.com/20250413190828536.png)

## URL 設定

S3 Pro では、ファイル管理の共通オプションである「NocoBase URL」「元の URL」「公開アクセスを許可」に加えて、アップロード URL とアクセス URL の形式、および署名付き URL を使用するかどうかを個別に設定できます。共通オプションについては、[ストレージエンジンの概要](./index.md#ファイル-url-とアクセス制御)を参照してください。

各オプションは異なる段階を制御します。

- 「NocoBase URL / 元の URL」は、ファイルレコードが返すアドレスを制御します
- 「公開アクセスを許可」は、NocoBase URL へのアクセス時にファイルレコードの閲覧権限をチェックするかどうかを制御します
- 「署名付き URL を使用しない」は、オブジェクトストレージが URL の署名を検証するかどうかを制御します

これらの設定は独立して組み合わせられます。デフォルトでは、NocoBase URL を使用し、「公開アクセスを許可」をチェックせず、署名付き URL を有効にしておくことを推奨します。

![S3 Pro の URL 設定](https://static-docs.nocobase.com/20260723221441.png)

### 選択方法

| ユースケース | ファイル URL | 公開アクセスを許可 | 署名付き URL を使用しない |
| --- | --- | --- | --- |
| Bucket を非公開のまま、ファイルにロール権限とデータ権限を適用する | NocoBase URL | チェックしない | チェックしない |
| Bucket を非公開のまま、公開用の NocoBase ファイルアドレスを提供する | NocoBase URL | チェックする | チェックしない |
| 外部サービスがストレージアドレスへ一時的にアクセスする | 元の URL | 該当なし | チェックせず、Access URL expiration を設定する |
| 公開 Bucket または CDN で署名なしの元のアドレスを使用する | 元の URL | 該当なし | チェックする |

### アップロード URL 形式

「アップロード URL 形式」は、クライアントがファイルをアップロードするときに使用する S3 URL を制御します。ストレージサービスがサポートする形式を選択してください。設定フォームには、現在の Endpoint、Bucket、パスに基づく例が表示されます。

- 「Bucket as subdomain」：`https://bucket-name.s3.example.com/path/to/object`
- 「Bucket as subpath」：`https://s3.example.com/bucket-name/path/to/object`
- 「Ignore bucket」：`https://upload.example.com/path/to/object`

### アクセス URL 形式

「アクセス URL 形式」は、S3 Pro がファイルアクセスアドレスを生成するときに、Bucket をドメインに含めるか、パスに含めるか、URL に含めないかを制御します。アップロード URL と同じ 3 つの形式がありますが、個別に設定できます。たとえば、アップロードには S3 Endpoint を使用し、アクセスには Bucket を含まない CDN ドメインを使用できます。

このオプションは、元の URL と、NocoBase URL が最終的にリダイレクトするストレージアドレスに影響します。ただし、NocoBase URL 自体の形式は変わりません。

### 署名付き URL を使用しない

S3 Pro はデフォルトで署名付き URL を使用します。生成された元の URL には、次のような署名パラメータが含まれます。

```text
https://bucket-name.s3.example.com/path/to/object?X-Amz-Signature=xxxx
```

署名付き URL は「Access URL expiration」で設定した期間だけ有効で、Bucket は非公開のままにできます。NocoBase URL を使用する場合、権限チェックに成功した後で、NocoBase が署名付きアドレスを生成するか、そのアドレスへリダイレクトします。

「署名付き URL を使用しない」をチェックすると、S3 Pro は署名パラメータのないアドレスを生成します。この場合、Bucket とアップロードされたオブジェクトで公開読み取りを許可する必要があり、「Access URL expiration」は適用されません。

「署名付き URL を使用しない」は、ストレージサービスによる署名検証だけを制御し、NocoBase のファイルレコード権限は変更しません。NocoBase URL を選択し、「公開アクセスを許可」をチェックしていない場合、リクエストは引き続き先に NocoBase の権限チェックを通過する必要があります。

## サービスプロバイダー設定

### Amazon S3

#### バケットの作成

1. https://ap-southeast-1.console.aws.amazon.com/s3/home を開いてS3コンソールにアクセスします。
    
2. 右側の「Create bucket」ボタンをクリックします。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

2. バケット名を入力します。その他のフィールドはデフォルト設定のままで構いません。ページ下部までスクロールし、「**Create**」ボタンをクリックして作成を完了します。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### CORS設定

1. バケットリストに移動し、先ほど作成したバケットを見つけてクリックし、詳細ページに進みます。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. 「Permission」タブをクリックし、下にスクロールしてCORS設定セクションを見つけます。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. 以下の設定を入力し（必要に応じて詳細な設定も可能です）、保存します。
    
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

1. ページ右上の「Security credentials」ボタンをクリックします。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. 下にスクロールして「Access Keys」セクションを見つけ、「Create Access Key」ボタンをクリックします。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. 同意をクリックします（これはルートアカウントでのデモンストレーションです。本番環境ではIAMを使用することをお勧めします）。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. ページに表示されるAccess keyとSecret access keyを保存します。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### パラメータの取得と設定

1. AccessKey IDとAccessKey Secretは、前の手順で取得した値です。正確に入力してください。
    
2. バケット詳細ページの「Properties」パネルに移動すると、バケット名とリージョン（Region）情報を取得できます。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### 署名なしの公開アクセス（オプション）

署名なし URL が必要な場合にのみ設定してください。Bucket とアップロードされたオブジェクトで公開読み取りを許可する必要があります。公開用の NocoBase URL だけが必要な場合は、「公開アクセスを許可」をチェックして署名付き URL を使い続ければ、Bucket を公開する必要はありません。

1. 「Permissions」パネルに移動し、「Object Ownership」までスクロールして「編集」をクリックし、ACLsを有効にします。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. 「Block public access」までスクロールし、「編集」をクリックして、ACLsによる制御を許可するように設定します。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. NocoBase で「署名付き URL を使用しない」にチェックを入れます。

#### サムネイル設定（オプション）

この設定はオプションであり、画像のプレビューサイズや効果を最適化する場合に利用します。**このデプロイソリューションは追加費用が発生する可能性がありますのでご注意ください。具体的な費用については、AWSの関連規約をご参照ください。**

1. [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls) にアクセスします。

2. ページ下部の `Launch in the AWS Console` ボタンをクリックし、ソリューションのデプロイを開始します。
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. プロンプトに従って設定を完了します。以下のオプションには特に注意してください。
   1. スタックを作成する際、ソース画像を含むAmazon S3バケット名を指定する必要があります。以前に作成したバケット名を入力してください。
   2. デモUIのデプロイを選択した場合、デプロイ完了後にこのインターフェースを通じて画像処理機能をテストできます。AWS CloudFormationコンソールでスタックを選択し、「出力」タブに移動してDemoUrlキーに対応する値を見つけ、そのリンクをクリックしてデモインターフェースを開きます。
   3. このソリューションは、`sharp` Node.jsライブラリを使用して画像を効率的に処理します。GitHubリポジトリからソースコードをダウンロードし、必要に応じてカスタマイズできます。
   
   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. 設定が完了したら、デプロイステータスが `CREATE_COMPLETE` になるまで待ちます。

5. NocoBaseの設定には、いくつかの注意点があります。
   1. `Thumbnail rule`：画像処理に関連するパラメータ（例： `?width=100`）を入力します。詳細は [AWSドキュメント](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html) をご参照ください。
   2. `Access endpoint`：デプロイ後のOutputs -> ApiEndpointの値を入力します。
   3. 「アクセス URL 形式」：Bucket 名はすでに設定に含まれており、アクセス URL には不要なため、「Ignore bucket」を選択します。
   
   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### 設定例

![](https://static-docs.nocobase.com/20250414152344959.png)

### Aliyun OSS

#### バケットの作成

1. OSSコンソール https://oss.console.aliyun.com/overview を開きます。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. 左側メニューの「Buckets」をクリックし、次に「Create Bucket」ボタンをクリックしてバケットの作成を開始します。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. バケット関連情報を入力し、最後に「Create」ボタンをクリックします。
    
    1. バケット名はビジネス要件に合わせて自由に設定してください。
        
    2. リージョンは、ユーザーに最も近い地域を選択してください。
        
    3. その他の設定はデフォルトのままで構いませんが、必要に応じてご自身で設定することも可能です。    

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)

#### CORS設定

1. 前の手順で作成したバケットの詳細ページに移動します。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. 中央メニューの「Content Security」->「CORS」をクリックします。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. 「Create Rule」ボタンをクリックし、関連する内容を入力して下にスクロールし、「OK」をクリックします。以下のスクリーンショットを参考にすることも、より詳細な設定を行うことも可能です。

![](https://static-docs.nocobase.com/20250219171042784.png)

#### AccessKey、SecretAccessKey の取得

1. 右上のアバターの下にある「AccessKey」をクリックします。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. ここではデモンストレーションの便宜上、メインアカウントを使用してAccessKeyを作成します。本番環境ではRAMを使用して作成することをお勧めします。詳細は https://www.alibabacloud.com/help/en/ram/user-guide/create-an-accesskey-pair をご参照ください。
    
3. 「Create AccessKey」ボタンをクリックします。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. アカウント認証を行います。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. ページに表示されるAccess keyとSecret access keyを保存します。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)

#### パラメータの取得と設定

1. AccessKey IDとAccessKey Secretは、前の手順で取得した値です。
    
2. バケット詳細ページに移動し、バケット名を取得します。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. 下にスクロールしてリージョンを取得します（末尾の「.aliyuncs.com」は不要です）。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. エンドポイントアドレスを取得し、NocoBaseに入力する際は「https://」のプレフィックスを追加する必要があります。

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### サムネイル設定（オプション）

この設定はオプションであり、画像のプレビューサイズや効果を最適化する必要がある場合にのみ使用します。

1. `Thumbnail rule` に関連するパラメータを入力します。具体的なパラメータ設定は、[画像処理パラメータ](https://www.alibabacloud.com/help/en/object-storage-service/latest/process-images) をご参照ください。

2. 「アップロード URL 形式」と「アクセス URL 形式」は同じ設定にできます。

#### 設定例

![](https://static-docs.nocobase.com/20250414152525600.png)

### MinIO

#### バケットの作成

1. 左側の「Buckets」メニューをクリック -> 「Create Bucket」をクリックし、作成ページに進みます。
2. バケット名を入力後、「保存」ボタンをクリックします。

#### AccessKey、SecretAccessKey の取得

1. 「Access Keys」に移動 -> 「Create access key」ボタンをクリックし、作成ページに進みます。

![](https://static-docs.nocobase.com/20250106111922957.png)

2. 「保存」ボタンをクリックします。

![](https://static-docs.nocobase.com/20250106111850639.png)

1. ポップアップウィンドウに表示されるAccess KeyとSecret Keyを保存し、後続の設定で使用します。

![](https://static-docs.nocobase.com/20250106112831483.png)

#### パラメータ設定

1. NocoBase -> 「File manager」ページに移動します。

2. 「Add new」ボタンをクリックし、「S3 Pro」を選択します。

3. フォームに記入します。
   - **AccessKey ID** と **AccessKey Secret** は、前の手順で保存したテキストです。
   - **Region**：プライベートデプロイされたMinIOにはRegionの概念がないため、「auto」に設定できます。
   - **Endpoint**：デプロイしたサービスドメイン名またはIPアドレスを入力します。
   - 「アクセス URL 形式」を「Bucket as subpath」に設定します。

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
