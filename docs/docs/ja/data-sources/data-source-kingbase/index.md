---
pkg: "@nocobase/plugin-data-source-kingbase"
---
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::


# データソース - KingbaseES データベース

## はじめに

KingbaseES データベースは、データソースとして、プライマリデータベースとしても外部データベースとしても使用できます。

:::warning
現在、pg モードで動作する KingbaseES データベースのみをサポートしています。
:::

## インストール

### プライマリデータベースとして使用する場合

インストール手順については、インストールに関するドキュメントをご参照ください。主な違いは環境変数にあります。

#### 環境変数

.env ファイルを編集し、以下の関連する環境変数を追加または変更してください。

```bash
# 実際の状況に応じて DB 関連パラメータを調整してください
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### Docker でのインストール

```yml
networks:
  nocobase:
    driver: bridge

services:
  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest
    restart: always
    networks:
      - nocobase
    depends_on:
      - kingbase
    environment:
      # Application key for generating user tokens, etc.
      # Changing APP_KEY invalidates old tokens
      # Use a random string and keep it confidential
      - APP_KEY=your-secret-key
      # Database type
      - DB_DIALECT=kingbase
      # Database host, replace with existing database server IP if needed
      - DB_HOST=kingbase
      - DB_PORT=54321
      # Database name
      - DB_DATABASE=kingbase
      # Database user
      - DB_USER=nocobase
      # Database password
      - DB_PASSWORD=nocobase
      # Timezone
      - TZ=UTC
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "11000:80"

  # Kingbase service for testing purposes only
  kingbase:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/kingbase:v009r001c001b0030_single_x86
    platform: linux/amd64
    restart: always
    privileged: true
    networks:
      - nocobase
    volumes:
      - ./storage/db/kingbase:/home/kingbase/userdata
    environment:
      ENABLE_CI: no # Must be set to no
      DB_USER: nocobase
      DB_PASSWORD: nocobase
      DB_MODE: pg  # pg only
      NEED_START: yes
    command: ["/usr/sbin/init"]
```

#### create-nocobase-app を使用したインストール

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### 外部データベースとして使用する場合

インストールまたはアップグレードコマンドを実行します。

```bash
yarn nocobase install
# or
yarn nocobase upgrade
```

プラグインを有効化します。

![20241024121815](https://static-docs.nocobase.com/20241024121815.png)

## 利用ガイド

- プライマリデータベース：[メインデータソース](/data-sources/data-source-main/) をご参照ください。
- 外部データベース：[データソース / 外部データベース](/data-sources/data-source-manager/external-database) をご参照ください。