---
pkg: "@nocobase/plugin-data-source-kingbase"
title: "Source de données principale - KingbaseES"
description: "Découvrez les versions prises en charge, l’installation du plugin, les variables d’environnement, le déploiement Docker, les instructions d’utilisation et la correspondance des champs lorsque KingbaseES est utilisé comme base de données principale de NocoBase."
keywords: "source de données principale,人大金仓,KingbaseES,base de données principale,mode compatible PostgreSQL,correspondance des champs,NocoBase"
---

# KingbaseES

## Présentation

KingbaseES peut être utilisé comme base de données principale de NocoBase pour stocker les données des tables système de NocoBase ainsi que les données métier de la source de données principale. La base de données principale est configurée lors du déploiement de NocoBase et ne peut pas être supprimée une fois l’application démarrée.

Pour connecter une base de données KingbaseES existante en tant que base de données externe, consultez [KingbaseES externe](../external/kingbase.md).

| Élément de configuration | Description |
| --- | --- |
| Versions prises en charge | >= V9. |
| Versions commerciales | Prise en charge par les éditions Professional et Enterprise. |
| Type de base de données | Mode compatible PostgreSQL. |

:::warning Attention

Seules les bases de données KingbaseES exécutées en mode compatible PostgreSQL sont actuellement prises en charge.

:::

## Installation

### Utilisation comme base de données principale

Pour le processus d’installation, consultez [Installer une application NocoBase](/ai/install-nocobase-app). La principale différence concerne les variables d’environnement de la base de données.

#### Variables d’environnement

Modifiez le fichier `.env` et ajoutez ou modifiez les variables d’environnement suivantes relatives à la base de données :

```bash
# 根据实际情况调整 DB 相关参数
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### Installation avec Docker

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

#### Installation avec create-nocobase-app

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### Utilisation comme base de données externe

Pour connecter KingbaseES en tant que base de données externe, consultez [KingbaseES externe](../external/kingbase.md) pour connaître le point d’entrée de configuration, les paramètres de connexion et les règles de synchronisation.

## Instructions d’utilisation

La source de données principale KingbaseES est compatible avec le mode PostgreSQL. Pour la gestion quotidienne, vous pouvez consulter [Source de données principale PostgreSQL](../main/postgresql.md).

1. Lors du déploiement de NocoBase, sélectionnez ou renseignez les paramètres de connexion correspondant à KingbaseES dans la configuration de la connexion à la base de données.
2. Après le démarrage de NocoBase, accédez à la source de données « Main » dans « Gestion des sources de données » pour gérer les tables et les champs de la base de données principale.
3. Pour connecter des tables déjà existantes dans la base de données, utilisez « Synchroniser depuis la base de données » dans la page de gestion de la base de données principale.
4. Lors de la configuration des champs d’une table, vous pouvez consulter les catalogues [Tables](../data-modeling/collection.md) et [Champs](../data-modeling/collection-fields/index.md) pour sélectionner les types de champs et les composants de champ.

## Correspondance des types de champs

Dans la base de données principale, lorsque vous créez un champ via une page NocoBase, NocoBase crée le champ KingbaseES correspondant en fonction de la configuration du champ. Lorsque vous connectez une table existante avec « Synchroniser depuis la base de données », NocoBase identifie les types de champs KingbaseES selon la logique de compatibilité PostgreSQL et les associe automatiquement au Field type et au Field interface appropriés. Vous pouvez ajuster le mode d’affichage dans la configuration du champ.

Les correspondances courantes sont les suivantes :

| Type de champ KingbaseES | Field type NocoBase | Field interface disponibles |
| --- | --- | --- |
| `BOOLEAN` | `boolean` | Checkbox、Switch. |
| `SMALLINT`、`INTEGER` | `integer`、`sort` | Integer、Sort、Select、Radio group. |
| `BIGINT` | `bigInt`、`snowflakeId`、`unixTimestamp`、`sort` | Integer、Sort、Unix timestamp、Created at、Updated at. |
| `REAL`、`DOUBLE PRECISION` | `float` | Number、Percent. |
| `DECIMAL`、`NUMERIC` | `decimal` | Number、Percent、Currency. |
| `VARCHAR`、`CHAR` | `string`、`uuid`、`nanoid`、`encryption`、`datetimeNoTz` | Input、Email、Phone、Password、Color、Icon、Select、Radio group、UUID、Nano ID. |
| `TEXT` | `text` | Textarea、Markdown、Vditor、Rich text、URL. |
| `UUID` | `uuid` | UUID. |
| `JSON`、`JSONB` | `json`、`array` | JSON. |
| `TIMESTAMP WITHOUT TIME ZONE` | `datetimeNoTz` | Date、Time、Created at、Updated at. |
| `TIMESTAMP WITH TIME ZONE` | `datetimeTz`、`date` | Date、Time、Created at、Updated at. |
| `DATE` | `dateOnly` | Date. |
| `TIME WITHOUT TIME ZONE` | `time` | Time. |
| `POINT`、`PATH`、`POLYGON`、`CIRCLE` | `json` | JSON. |
| `ARRAY` | `array` | Multiple select、Checkbox group、JSON. |

:::warning Attention

Les types de champs KingbaseES non pris en charge sont affichés séparément dans la configuration des champs. Ces champs doivent être adaptés par développement avant de pouvoir être utilisés comme des champs ordinaires dans NocoBase.

:::

Pour plus d’informations sur la configuration générale, consultez [Présentation de la source de données principale](./index.md).
