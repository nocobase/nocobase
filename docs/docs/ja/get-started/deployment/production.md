:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# 本番環境へのデプロイ

本番環境でNocoBaseをデプロイする際、システムや環境によってビルド方法が異なるため、依存関係のインストールが煩雑になることがあります。すべての機能を完全にご利用いただくために、**Docker** を使用したデプロイを推奨します。お使いのシステム環境でDockerが使用できない場合は、**create-nocobase-app** を使用してデプロイすることも可能です。

:::warning

本番環境でソースコードから直接デプロイすることは推奨されません。ソースコードは依存関係が多く、サイズが大きいため、フルコンパイルには高いCPUとメモリが要求されます。どうしてもソースコードからデプロイする必要がある場合は、まずカスタムDockerイメージをビルドしてからデプロイすることをお勧めします。

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