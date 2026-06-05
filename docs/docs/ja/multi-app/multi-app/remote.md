---
pkg: '@nocobase/plugin-app-supervisor'
---

# マルチ環境モード

## 紹介

共有メモリ型マルチアプリは、デプロイと運用の面で大きな利点がありますが、アプリ数や業務の複雑性が増すにつれ、単一インスタンスはリソース競合や安定性低下などの課題に直面する可能性があります。こうしたシナリオでは、より複雑な要件を支えるためにマルチ環境ハイブリッドデプロイを採用できます。

このモードでは、システムは 1 つの入口アプリを統合管理・スケジューリングセンターとして配置し、複数の NocoBase インスタンスを独立した実行環境として配置して業務アプリを実際にホストします。各環境は相互に分離されつつ連携し、単一インスタンスの負荷を効果的に分散し、安定性・拡張性・障害分離性を大幅に向上させます。

デプロイ形態としては、各環境を独立プロセス、Docker コンテナ、または複数の Kubernetes Deployment として実行でき、さまざまな規模・アーキテクチャの基盤に柔軟に適応できます。

## デプロイ

マルチ環境ハイブリッドデプロイでは:

- 入口アプリ（Supervisor）がアプリと環境情報を一元管理
- ワーカーアプリ（Worker）が実際の業務実行環境として動作
- アプリ／環境設定は Redis にキャッシュ
- Supervisor と Worker 間の命令配信・状態同期は Redis 通信を利用

現時点では環境作成機能は提供されていません。各 Worker アプリを手動でデプロイし、対応する環境情報を設定した後に、Supervisor から認識されます。

### アーキテクチャ依存関係

デプロイ前に次のサービスを準備してください。

- Redis
  - アプリと環境設定のキャッシュ
  - Supervisor と Worker 間のコマンド通信チャネル

- データベース
  - Supervisor と Worker が接続する DB サービス

### 入口アプリ (Supervisor)

入口アプリは統合管理センターとして、アプリ作成、起動・停止、環境スケジューリング、アクセスプロキシを担います。

Supervisor の環境変数:

```bash
# アプリモード
APP_MODE=supervisor
# アプリ検出アダプタ
APP_DISCOVERY_ADAPTER=remote
# アプリプロセス管理アダプタ
APP_PROCESS_ADAPTER=remote
# アプリ・環境設定キャッシュ用 redis
APP_SUPERVISOR_REDIS_URL=
# アプリコマンド通信方式
APP_COMMAND_ADPATER=redis
# アプリコマンド通信 redis
APP_COMMAND_REDIS_URL=
```

### ワーカーアプリ (Worker)

ワーカーアプリは実際の業務実行環境として、具体的な NocoBase アプリインスタンスをホストして実行します。

Worker の環境変数:

```bash
# アプリモード
APP_MODE=worker
# アプリ検出アダプタ
APP_DISCOVERY_ADAPTER=remote
# アプリプロセス管理アダプタ
APP_PROCESS_ADAPTER=local
# アプリ・環境設定キャッシュ用 redis
APP_SUPERVISOR_REDIS_URL=
# アプリコマンド通信方式
APP_COMMAND_ADPATER=redis
# アプリコマンド通信 redis
APP_COMMAND_REDIS_URL=
# 環境識別子
ENVIRONMENT_NAME=
# 環境アクセス URL
ENVIRONMENT_URL=
# 環境プロキシアクセス URL
ENVIRONMENT_PROXY_URL=
```

### Docker Compose 例

以下は Docker コンテナを実行単位とするマルチ環境ハイブリッドデプロイ例です。Docker Compose で 1 つの Supervisor と 2 つの Worker を同時にデプロイします。

```yaml
networks:
  nocobase:
    driver: bridge

services:
  redis:
    networks:
      - nocobase
    image: redis/redis-stack-server:latest
  supervisor:
    container_name: nocobase-supervisor
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_supervisor
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=supervisor
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=remote
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-supervisor:/app/nocobase/storage
    ports:
      - '14000:80'
  worker_a:
    container_name: nocobase-worker-a
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_worker_a
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=worker
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=local
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT_NAME=env_a
      - ENVIRONMENT_URL=http://localhost:15000
      - ENVIRONMENT_PROXY_URL=http://worker_a
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-worker-a:/app/nocobase/storage
    ports:
      - '15000:80'
  worker_b:
    container_name: nocobase-worker-b
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_worker_b
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=worker
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=local
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT_NAME=env_b
      - ENVIRONMENT_URL=http://localhost:16000
      - ENVIRONMENT_PROXY_URL=http://worker_b
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-worker-b:/app/nocobase/storage
    ports:
      - '16000:80'
```

## 利用ガイド

アプリの基本管理操作は共有メモリモードと同じです。[共有メモリモード](./local.md)を参照してください。ここではマルチ環境設定に関連する内容のみ説明します。

### 環境一覧

デプロイ完了後、入口アプリの「App supervisor」ページで「Environment」タブを開くと、登録済みワーカー環境の一覧を確認できます。環境識別子、ワーカーアプリのバージョン、アクセス URL、状態などが表示されます。ワーカーアプリは 2 分ごとにハートビートを送信し、環境可用性を担保します。

![](https://static-docs.nocobase.com/202512291830371.png)

### アプリ作成

アプリ作成時に、1 つ以上の実行環境を選択できます。通常は 1 つの環境を選べば十分です。ワーカーアプリを[サービス分割](/cluster-mode/services-splitting)しており、同一アプリを複数環境へ配置して負荷分散や機能分離を行う場合のみ、複数環境を選択してください。

![](https://static-docs.nocobase.com/202512291835086.png)

### アプリ一覧

アプリ一覧ページには、各アプリの実行環境と状態が表示されます。1 つのアプリが複数環境に配置されている場合は、複数の実行状態が表示されます。通常、同一アプリは複数環境で同一状態を保つため、起動・停止は一括で制御します。

![](https://static-docs.nocobase.com/202512291842216.png)

### アプリ起動

アプリ起動時には DB へ初期データを書き込む可能性があるため、マルチ環境での競合を避ける目的で、複数環境へ配置されたアプリは起動時にキュー処理されます。

![](https://static-docs.nocobase.com/202512291841727.png)

### アクセスプロキシ

ワーカーアプリは、入口アプリのサブパス `/apps/:appName/admin` を通じてプロキシアクセスできます。

![](https://static-docs.nocobase.com/202601082154230.png)

アプリが複数環境に配置されている場合は、プロキシアクセス先の対象環境を指定する必要があります。

![](https://static-docs.nocobase.com/202601082155146.png)

デフォルトでは、プロキシアクセス先にはワーカーアプリのアクセスアドレス（環境変数 `ENVIRONMENT_URL`）を使います。入口アプリ側ネットワークからその URL に到達できる必要があります。別のプロキシアドレスを使う場合は、環境変数 `ENVIRONMENT_PROXY_URL` で上書きしてください。
