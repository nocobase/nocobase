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
version: "3"

networks:
  nocobase:
    driver: bridge

  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest
    restart: always
    networks:
      - nocobase
    depends_on:
      - postgres
    environment:
      # ユーザーのトークンなどを生成するためのアプリケーションキーです。
      # APP_KEY を変更すると、古いトークンは無効になります。
      # 任意のランダムな文字列を使用し、外部に漏洩しないようにしてください。
      - APP_KEY=your-secret-key
      # データベースの種類
      - DB_DIALECT=kingbase
      # データベースホスト。既存のデータベースサーバーの IP に置き換えることができます。
      - DB_HOST=kingbase
      # データベース名
      - DB_DATABASE=kingbase
      # データベースユーザー
      - DB_USER=nocobase
      # データベースパスワード
      - DB_PASSWORD=nocobase
      # タイムゾーン
      - TZ=Asia/Shanghai
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "13000:80"

  # テスト目的のみの Kingbase サービス
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
      ENABLE_CI: no # 「no」に設定する必要があります
      DB_USER: nocobase
      DB_PASSWORD: nocobase
      DB_MODE: pg  # pg のみ
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