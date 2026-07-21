---
pkg: "@nocobase/plugin-data-source-kingbase"
title: "メインデータソース - KingbaseES"
description: "KingbaseES を NocoBase のメインデータベースとして使用する場合の対応バージョン、プラグインのインストール、環境変数、Docker デプロイ、使用方法、フィールドマッピングについて説明します。"
keywords: "メインデータソース,人大金仓,KingbaseES,メインデータベース,PostgreSQL 互換モード,フィールドマッピング,NocoBase"
---

# KingbaseES

## 概要

KingbaseES は NocoBase のメインデータベースとして使用でき、NocoBase のシステムテーブルデータとメインデータソース内の業務データを保存します。メインデータベースは NocoBase のデプロイ時に設定し、アプリケーションの起動後に削除することはできません。

既存の KingbaseES データベースを外部データベースとして接続する場合は、[外部 KingbaseES](../external/kingbase.md)を参照してください。

| 設定項目 | 説明 |
| --- | --- |
| 対応バージョン | >= V9。 |
| 商用版 | プロフェッショナル版、エンタープライズ版に対応。 |
| データベースタイプ | PostgreSQL 互換モード。 |

:::warning 注意

現在、PostgreSQL 互換モードで動作する KingbaseES データベースのみ対応しています。

:::

## インストール

### メインデータベースとして使用する

インストール手順については、[NocoBase アプリケーションのインストール](/ai/install-nocobase-app)を参照してください。主な違いはデータベース環境変数です。

#### 環境変数

`.env` ファイルを変更し、以下のデータベース関連環境変数を追加または変更します。

```bash
# 根据实际情况调整 DB 相关参数
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### Docker によるインストール

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
      # 用于生成用户 token 等内容的应用密钥。
      # 修改 APP_KEY 会导致旧 token 失效，请使用随机字符串并妥善保存。
      - APP_KEY=your-secret-key
      # 数据库类型
      - DB_DIALECT=kingbase
      # 数据库地址，如果使用已有数据库服务，可以替换为对应 IP。
      - DB_HOST=kingbase
      - DB_PORT=54321
      # 数据库名称
      - DB_DATABASE=kingbase
      # 数据库用户
      - DB_USER=nocobase
      # 数据库密码
      - DB_PASSWORD=nocobase
      # 时区
      - TZ=UTC
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "11000:80"

  # Kingbase 测试服务，仅用于本地体验。
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
      DB_MODE: pg  # 仅支持 pg 模式
      NEED_START: yes
    command: ["/usr/sbin/init"]
```

#### create-nocobase-app によるインストール

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### 外部データベースとして使用する

KingbaseES を外部データベースとして接続する場合は、設定画面、接続パラメーター、同期ルールについて[外部 KingbaseES](../external/kingbase.md)を参照してください。

## 使用方法

KingbaseES のメインデータソースは PostgreSQL モードと互換性があるため、日常的な管理方法については[メインデータソース PostgreSQL](../main/postgresql.md)を参照してください。

1. NocoBase のデプロイ時に、データベース接続設定で KingbaseES に対応する接続パラメーターを選択または入力します。
2. NocoBase の起動後、「データソース管理」で「Main」データソースを開くと、メインデータベースのデータテーブルとフィールドを管理できます。
3. データベースにすでに存在するテーブルを接続する場合は、メインデータベースの管理画面で「データベースから同期」を使用します。
4. データテーブルのフィールドを設定する際は、[データテーブル](../data-modeling/collection.md)および[フィールド](../data-modeling/collection-fields/index.md)ディレクトリを参照して、フィールドタイプとフィールドコンポーネントを選択できます。

## フィールドタイプのマッピング

メインデータベースで NocoBase の画面からフィールドを作成すると、NocoBase はフィールド設定に基づいて、対応する KingbaseES フィールドを作成します。「データベースから同期」で既存のテーブルを接続する場合、NocoBase は PostgreSQL 互換ロジックに従って KingbaseES のフィールドタイプを識別し、適切な Field type と Field interface に自動的にマッピングします。フィールド設定で画面上の表示方法を調整できます。

一般的なマッピングは以下のとおりです。

| KingbaseES フィールドタイプ | NocoBase Field type | 選択可能な Field interface |
| --- | --- | --- |
| `BOOLEAN` | `boolean` | Checkbox、Switch。 |
| `SMALLINT`、`INTEGER` | `integer`、`sort` | Integer、Sort、Select、Radio group。 |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at。 |
| `REAL`、`DOUBLE PRECISION` | `float` | Number、Percent。 |
| `DECIMAL`、`NUMERIC` | `decimal` | Number、Percent、Currency。 |
| `VARCHAR`、`CHAR` | `string`、`uuid`、`nanoid`、`encryption`、`datetimeNoTz` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID。 |
| `TEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL。 |
| `UUID` | `uuid` | UUID。 |
| `JSON`、`JSONB` | `json`、`array` | JSON。 |
| `TIMESTAMP WITHOUT TIME ZONE` | `datetimeNoTz` | Date、Time、Created at、Updated at。 |
| `TIMESTAMP WITH TIME ZONE` | `datetimeTz`、`date` | Date、Time、Created at、Updated at。 |
| `DATE` | `dateOnly` | Date。 |
| `TIME WITHOUT TIME ZONE` | `time` | Time。 |
| `POINT`、`PATH`、`POLYGON`、`CIRCLE` | `json` | JSON。 |
| `ARRAY` | `array` | Multiple select、Checkbox group、JSON。 |

:::warning 注意

サポートされていない KingbaseES フィールドタイプは、フィールド設定画面に個別に表示されます。これらのフィールドを NocoBase で通常のフィールドとして使用するには、適応対応の開発が必要です。

:::

その他の共通設定については、[メインデータソースの概要](./index.md)を参照してください。