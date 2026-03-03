---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="AI翻訳通知"}
このドキュメントはAIによって翻訳されました。正確な情報については[英語版](/multi-app/multi-app/remote)をご参照ください。
:::

# 多環境モード

## 紹介

共有メモリモードのマルチアプリケーションは、デプロイと運用において明らかな利点がありますが、アプリケーション数や業務の複雑さが増すにつれて、単一のインスタンスではリソースの競合や安定性の低下といった問題に直面する可能性があります。このようなシナリオに対して、ユーザーはより複雑なビジネスニーズを支えるために、マルチ環境混合デプロイ構成を採用することができます。

このモードでは、システムは統合管理・スケジューリングセンターとして1つの入口アプリケーション（Supervisor）をデプロイし、同時に実際の業務アプリケーションをホストする独立したアプリケーション実行環境として複数の NocoBase インスタンス（Worker）をデプロイします。各環境間は相互に隔離され、連携して動作することで、単一インスタンスの負荷を効果的に分散し、システムの安定性、拡張性、および障害隔離能力を大幅に向上させます。

デプロイレベルでは、異なる環境を独立したプロセスで実行することも、異なる Docker コンテナとしてデプロイすることも、あるいは複数の Kubernetes Deployment 形式で存在させることも可能であり、さまざまな規模やアーキテクチャのインフラ環境に柔軟に適応できます。

## デプロイ

マルチ環境混合デプロイモードでは：

- 入口アプリケーション（Supervisor）は、アプリケーションと環境情報の統合管理を担当します。
- 工作アプリケーション（Worker）は、実際の業務実行環境として機能します。
- アプリケーションと環境の設定は Redis を通じてキャッシュされます。
- 入口アプリケーションと工作アプリケーション間の指示や状態の同期は、Redis 通信に依存します。

現在、環境作成機能は提供されていません。各工作アプリケーションを手動でデプロイし、対応する環境情報を設定した後に、入口アプリケーションによって認識されるようになります。

### アーキテクチャ依存関係

デプロイの前に、以下のサービスを準備してください：

- Redis
  - アプリケーションと環境設定のキャッシュ
  - 入口アプリケーションと工作アプリケーション間のコマンド通信チャネルとして機能

- データベース
  - 入口アプリケーションと工作アプリケーションが接続する必要があるデータベースサービス

### 入口アプリケーション (Supervisor)

入口アプリケーションは統合管理センターとして、アプリケーションの作成、起動、停止、環境のスケジューリング、およびアプリケーションアクセスのプロキシを担当します。

入口アプリケーションの環境変数設定の説明

```bash
# アプリケーションモード
APP_MODE=supervisor
# アプリケーション検出アダプタ
APP_DISCOVERY_ADAPTER=remote
# アプリケーションプロセス管理アダプタ
APP_PROCESS_ADAPTER=remote
# アプリケーション、環境設定キャッシュ用 Redis
APP_SUPERVISOR_REDIS_URL=
# アプリケーションコマンド通信方式
APP_COMMAND_ADPATER=redis
# アプリケーションコマンド通信用 Redis
APP_COMMAND_REDIS_URL=
```

### 工作アプリケーション (Worker)

工作アプリケーションは実際の業務実行環境として、具体的な NocoBase アプリケーションインスタンスのホストと実行を担当します。

工作アプリケーションの環境変数設定の説明

```bash
# アプリケーションモード
APP_MODE=worker
# アプリケーション検出アダプタ
APP_DISCOVERY_ADAPTER=remote
# アプリケーションプロセス管理アダプタ
APP_PROCESS_ADAPTER=local
# アプリケーション、環境設定キャッシュ用 Redis
APP_SUPERVISOR_REDIS_URL=
# アプリケーションコマンド通信方式
APP_COMMAND_ADPATER=redis
# アプリケーションコマンド通信用 Redis
APP_COMMAND_REDIS_URL=
# 環境識別子
ENVIRONMENT_NAME=
# 環境アクセス URL
ENVIRONMENT_URL=
# 環境プロキシアクセス URL
ENVIRONMENT_PROXY_URL=
```

### Docker Compose 示例

以下の例は、Docker コンテナを実行ユニットとしたマルチ環境混合デプロイ構成を示しており、Docker Compose を使用して1つの入口アプリケーションと2つの工作アプリケーションを同時にデプロイします。

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

## 使用手引

アプリケーションの基本的な管理操作は共有メモリモードと変わりません。[共有メモリモード](./local.md)を参照してください。このセクションでは、主にマルチ環境設定に関連する内容について説明します。

### 環境リスト

デプロイ完了後、入口アプリケーションの「アプリケーション管理（App Supervisor）」ページに入り、「環境（Environments）」タブで登録済みの工作環境リストを確認できます。これには、環境識別子、工作アプリケーションのバージョン、アクセス URL、およびステータスなどの情報が含まれます。工作アプリケーションは2分ごとにハートビートを報告し、環境の可用性を確保します。

![](https://static-docs.nocobase.com/202512291830371.png)

### アプリケーション作成

アプリケーションを作成する際、1つまたは複数の実行環境を選択して、そのアプリケーションをどの工作アプリケーションにデプロイするかを指定できます。通常は、1つの環境を選択することをお勧めします。工作アプリケーションで[サービス分割](/cluster-mode/services-splitting)が行われており、負荷分散や機能隔離を実現するために同一のアプリケーションを複数の実行環境にデプロイする必要がある場合にのみ、複数の環境を選択します。

![](https://static-docs.nocobase.com/202512291835086.png)

### アプリケーションリスト

アプリケーションリストページには、各アプリケーションが現在配置されている実行環境とステータス情報が表示されます。アプリケーションが複数の環境にデプロイされている場合は、複数の実行ステータスが表示されます。複数の環境にある同一のアプリケーションは、通常の状態では統一されたステータスを維持し、起動と停止を統一して制御する必要があります。

![](https://static-docs.nocobase.com/202512291842216.png)

### アプリケーション起動

アプリケーションの起動時にデータベースへ初期化データが書き込まれる可能性があるため、マルチ環境下での競合状態を避けるために、複数の環境にデプロイされたアプリケーションは起動時に順番待ち（キューイング）が行われます。

![](https://static-docs.nocobase.com/202512291841727.png)

### アプリケーションアクセスプロキシ

工作アプリケーションは、入口アプリケーションのサブパス `/apps/:appName/admin` を通じてプロキシアクセスが可能です。

![](https://static-docs.nocobase.com/202601082154230.png)

アプリケーションが複数の環境にデプロイされている場合は、プロキシアクセスの対象となる環境を指定する必要があります。

![](https://static-docs.nocobase.com/202601082155146.png)

デフォルトでは、プロキシアクセスアドレスには工作アプリケーションのアクセスアドレス（環境変数 `ENVIRONMENT_URL`）が使用されます。このアドレスが入口アプリケーションのあるネットワーク環境からアクセス可能であることを確認してください。異なるプロキシアクセスアドレスを使用する必要がある場合は、環境変数 `ENVIRONMENT_PROXY_URL` を使用して上書きできます。