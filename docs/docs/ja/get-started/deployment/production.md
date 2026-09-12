# 本番環境へのデプロイ

本番環境でNocoBaseをデプロイする際、システムや環境によってビルド方法が異なるため、依存関係のインストールが煩雑になることがあります。すべての機能を完全にご利用いただくために、**Docker** を使用したデプロイを推奨します。お使いのシステム環境でDockerが使用できない場合は、**create-nocobase-app** を使用してデプロイすることも可能です。

:::warning 注意

本番環境でソースコードから直接デプロイすることは推奨されません。ソースコードは依存関係が多く、サイズが大きいため、フルコンパイルには高いCPUとメモリが要求されます。どうしてもソースコードからデプロイする必要がある場合は、まずカスタムDockerイメージをビルドしてからデプロイすることをお勧めします。

:::

:::warning 注意

独立した複数の NocoBase サービスをデプロイする場合は、サービスごとに異なる `hostname`（別々のサブドメインなど）を使用してください。`https://example.com:13000` と `https://example.com:14000` のように、ポートだけでサービスを区別しないでください。

NocoBase は、ログイン状態と[ファイルアクセス権限](../../file-manager/stable-url.md)を維持するために cookie を使用します。ブラウザーの cookie はポートでは分離されないため、同じ `hostname` の異なるポート上にあるサービスが同名の cookie を共有することがあります。その結果、ログイン状態が上書きされたり、ファイルのプレビューやダウンロードの認証に失敗したりする可能性があります。

同じ NocoBase デプロイ環境内のサブアプリは、この制限の対象外です。ログイン cookie はアプリ名で区別されるため、メインアプリと名前の異なるサブアプリは同じ `hostname` を共有できます。

ただし、独立したサービス間の分離は引き続き必要です。同じ `hostname` の別ポートで別の NocoBase サービスを実行し、その中に同名のメインアプリまたはサブアプリがある場合、cookie が競合する可能性があります。

`app1.example.com` と `app2.example.com` のようなアドレスを使用し、Nginx または Caddy でそれぞれの NocoBase サービスに振り分けてください。

:::

## フロントエンド分離 / クロスオリジン API アクセス

ページと API は同一オリジンに保つことを推奨します。同一ドメイン配下のリバースプロキシで `${APP_PUBLIC_PATH}api/` と `${APP_PUBLIC_PATH}files/` を NocoBase サービスへ転送し、`API_BASE_URL` は空のままにしてください。

ページが API にクロスオリジンでアクセスする必要がある場合（`API_BASE_URL` が別オリジンを指す場合）、ページのオリジンを `CORS_ORIGIN_WHITELIST` に追加してください。そうしないと、ブラウザーは API レスポンス内の `Set-Cookie` を無視し、ログイン cookie が保存されず、stable file URL によるプレビューやダウンロードの認可に失敗します。

あわせて、cookie は `hostname` ごとに保存される点にも注意してください。ページと API が完全に異なるドメインを使っている場合、ページ側ドメインから `/files/` へ送るリクエストには API ドメインに保存されたログイン cookie が含まれません。この種の構成は、同一オリジンのリバースプロキシへ切り替えるべきです。詳しくは[環境変数](../installation/env.md#api_base_url)を参照してください。

## デプロイプロセス

本番環境へのデプロイは、既存のインストールおよびアップグレード手順を参照してください。

### 新規インストール

- [Dockerでのインストール](../installation/docker.mdx)
- [create-nocobase-appでのインストール](../installation/create-nocobase-app.mdx)

### アプリケーションのアップグレード

- [Dockerインストールのアップグレード](../installation/docker.mdx)
- [create-nocobase-appインストールのアップグレード](../installation/create-nocobase-app.mdx)

### サードパーティプラグインのインストールとアップグレード

- [プラグインのインストールとアップグレード](../install-upgrade-plugins.mdx)

## 静的リソースのプロキシ

本番環境では、静的リソースをプロキシサーバーで管理することをお勧めします。例：

- [nginx](./static-resource-proxy/nginx.md) 
- [caddy](./static-resource-proxy/caddy.md)
- [cdn](./static-resource-proxy/cdn.md)

## 一般的な運用コマンド

インストール方法に応じて、以下のコマンドを使用してNocoBaseプロセスを管理できます。

- [docker compose](./common-commands/docker-compose.md)
- [pm2](./common-commands/pm2.md)
