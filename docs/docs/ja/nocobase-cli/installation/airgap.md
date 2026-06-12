#イントラネットのインストール

サーバーがパブリック ネットワークにアクセスできない場合、インストール方法では、オフラインでの使用に必要なイメージ、依存関係、およびプラグイン パッケージを事前に準備する必要があります。デフォルトでは、パスが最短で再現が最も簡単な Docker を最初に使用することをお勧めします。

## デフォルトの推奨事項: Docker イメージをオフラインで準備する

パブリック ネットワークにアクセスできるマシンで、まずアプリケーション イメージとデータベース イメージをプルダウンします。

```bash
docker pull registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest-full
docker pull registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
```

次に、オフライン ファイルとしてエクスポートします。

```bash
docker save -o nocobase-app.tar \
  registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest-full

docker save -o nocobase-postgres.tar \
  registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
```

商用プラグインが必要な場合は、外部ネットワーク環境にプラグインパッケージを用意して、まとめてイントラネットに取り込むこともお勧めします。

## ファイルをイントラネット サーバーにコピーします

少なくとも次の書類を準備してください。

- `nocobase-app.tar`
- `nocobase-postgres.tar`
- `docker-compose.yml`
- `.env` または独自の導入手順

## イメージをイントラネット サーバーにインポートします

```bash
docker load -i nocobase-app.tar
docker load -i nocobase-postgres.tar
```

## アプリケーションを開始する

`docker-compose.yml` を準備したら、直接開始します。

```bash
docker compose up -d
docker compose logs -f app
```

構成ファイルをまだ作成していない場合は、まず [Docker Compose によるインストール](./docker-compose.md) を読み、サンプルをローカルに保存します。

## Docker を使用できない場合の対処方法

イントラネット環境で Docker を使用できない場合は、`create-nocobase-app` を使用して外部ネットワーク環境で完全なプロジェクトを作成し、依存関係をインストールしてパッケージ化し、プロジェクト全体をイントラネット サーバーにコピーすることもできます。

このパスは長くなりますが、コンテナー機能のない環境ではより実用的です。全体的なプロセスは通常次のとおりです。

1. 外部ネットワーク環境でプロジェクトを作成し、依存関係をインストールします。
2. プロジェクト ディレクトリをパッケージ化します。
3. イントラネット サーバーにコピーします。
4. イントラネット上でファイルを解凍し、`.env` を完了してアプリケーションを起動します。

## 次にどこを見るべきか

- アプリケーションの構成を確認していない場合は、引き続き「アプリケーション環境変数」(./env.md)を参照してください。
- アプリケーションをビジネス ユーザーに正式に公開する準備ができている場合は、[Nginx](../production/reverse-proxy/nginx.md) または [Caddy](../production/reverse-proxy/caddy.md) を読み続けてください。
