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
