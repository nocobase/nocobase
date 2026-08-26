# Docker Compose 経由でインストールする

NocoBase をサーバー上で直接実行したい場合は、やはり `docker compose` が最も直接的な方法です。ほとんどのシナリオでは、`docker-compose.yml` を 1 回分で十分です。

ただし、運用環境では、特定のバージョン番号を修正し、`latest` を長期間直接使用しないことをお勧めします。これにより、アップグレードをより制御しやすくなります。

## 前提条件

- Docker と Docker Compose がインストールされている
- Docker サービスが開始されていることを確認します。
- `13000`など、外部に公開するポートが用意されている

## ステップ 1: プロジェクト ディレクトリを作成する

```bash
mkdir my-nocobase-app
cd my-nocobase-app
```

## ステップ 2: `docker-compose.yml` を作成する

次の例では PostgreSQL を使用しています。これはデフォルトで最も心配のない組み合わせでもあります。

```yml
networks:
  nocobase:
    driver: bridge

services:
  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest-full
    restart: always
    networks:
      - nocobase
    depends_on:
      - postgres
    environment:
      - APP_KEY=replace-with-your-secret-key
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase
      - DB_USER=nocobase
      - DB_PASSWORD=nocobase
      - TZ=Asia/Shanghai
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - '13000:80'

  postgres:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
    restart: always
    command: postgres -c wal_level=logical
    environment:
      POSTGRES_USER: nocobase
      POSTGRES_DB: nocobase
      POSTGRES_PASSWORD: nocobase
    volumes:
      - ./storage/db/postgres:/var/lib/postgresql/data
    networks:
      - nocobase
```

で：

- `APP_KEY` 必ず独自のランダムな文字列に変更してください
- `13000:80` は、ホストの `13000` ポートをコンテナの `80` ポートにマッピングすることを表します
- すでにデータベース サービスがある場合は、`postgres` セクションを削除し、`DB_HOST` を既存のデータベース アドレスに変更できます。

MySQL または MariaDB を使用する場合は、必ず `DB_DIALECT` を対応するタイプに変更し、以下を追加してください。

```bash
DB_UNDERSCORED=true
```

## ステップ 3: アプリケーションを開始する

```bash
docker compose up -d
```

ログを確認します。

```bash
docker compose logs -f app
```

## ステップ 4: アプリケーションにアクセスする

アプリケーションが起動したら、以下を開きます。

```text
http://<服务器IP>:13000
```

初めて起動する場合は、ページの指示に従って管理者アカウントを初期化してください。

## 共通コマンド

コンテナを起動または更新します。

```bash
docker compose up -d
```

アプリケーションを停止します:

```bash
docker compose down
```

ログを確認します。

```bash
docker compose logs -f app
```

## 次にどこを見るべきか

- キー、ポート、データベースなどの構成を調整する場合は、引き続き [アプリケーション環境変数](./env.md) を参照してください。
- 正式にオンラインにする準備ができている場合は、[Nginx](../production/reverse-proxy/nginx.md) または [Caddy](../production/reverse-proxy/caddy.md) を読み続けてください。
- 後でデータをバックアップする場合は、引き続き [バックアップと復元](../operations/backup-restore.md) を参照してください。
