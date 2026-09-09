# ストレージエンジン：ローカルストレージ

アップロードされたファイルは、サーバーのローカルディスクのディレクトリに保存されます。この方法は、システムで管理するアップロードファイルの総量が少ない場合や、実験的な用途に適しています。


:::warning 注意

ローカルファイルには可能な限り `/files/` の stable URL を使用し、NocoBase がファイルレコードと現在のロールの閲覧権限を確認できるようにしてください。既存の `/storage/uploads/` URL はレコード単位の権限を適用しませんが、Docker、組み込み Nginx、および NocoBase CLI が生成する Nginx 設定では、デフォルトでログイン済みユーザーに制限されます。

契約書、身分証明書、社内資料など公開すべきでないファイルを保存する場合は、[S3 Pro](./s3-pro) を使用してください。既存ファイルがある場合は、[S3 Pro への移行](./migrate-to-s3-pro.md)を参照してください。

カスタム Nginx が `alias` でローカルアップロードを配信する場合、`/storage/uploads/` location で `auth_request` を使用して NocoBase の認証 endpoint を呼び出す必要があります。そうしないと、デフォルトのログインチェックを迂回します。また、`X-Content-Type-Options: nosniff` を設定し、`html`、`svg`、`xhtml`、`pdf` などのアクティブコンテンツを添付ファイルとして返してください。完全な例とサブアプリ設定は [Nginx リバースプロキシ](../../nocobase-cli/production/reverse-proxy/nginx.md)、関連リスクは [セキュリティガイド：ファイルストレージ](../../security/guide.md#ファイルストレージ)を参照してください。

既存の連携が従来 URL への匿名アクセスに依存している場合は、`LEGACY_LOCAL_STORAGE_PUBLIC_ACCESS=true` を設定してアプリケーションを再起動してください。この互換スイッチは `/storage/uploads/` のみに影響し、`/files/` のファイルレコード単位の権限は変更しません。

:::

## 設定パラメーター

![ファイルストレージエンジンの設定例](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=ヒント}
このセクションでは、ローカルストレージエンジン専用のパラメーターのみを紹介します。共通パラメーターについては、[エンジンの共通パラメーター](./index.md#エンジンの共通パラメーター)を参照してください。
:::

### パス

サーバー上でのファイル保存の相対パスとURLアクセスパスの両方を表します。例えば、「`user/avatar`」（先頭と末尾の「`/`」は不要です）は、以下を表します。

1. アップロードファイルがサーバーに保存される相対パス：`/path/to/nocobase-app/storage/uploads/user/avatar`。
2. ファイルにアクセスする際のURLプレフィックス：`http://localhost:13000/storage/uploads/user/avatar`。
