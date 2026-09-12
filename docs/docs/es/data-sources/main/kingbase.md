---
pkg: "@nocobase/plugin-data-source-kingbase"
title: "Fuente de datos principal - KingbaseES"
description: "Conozca las versiones compatibles, la instalación del plugin, las variables de entorno, la implementación con Docker, las instrucciones de uso y la asignación de campos cuando KingbaseES se utiliza como base de datos principal de NocoBase."
keywords: "fuente de datos principal,人大金仓,KingbaseES,base de datos principal,modo compatible con PostgreSQL,asignación de campos,NocoBase"
---

# KingbaseES

## Introducción

KingbaseES puede utilizarse como base de datos principal de NocoBase para almacenar los datos de las tablas del sistema de NocoBase y los datos empresariales de la fuente de datos principal. La base de datos principal se configura al implementar NocoBase y no se puede eliminar una vez que la aplicación está en funcionamiento.

Si desea conectar una base de datos KingbaseES existente como base de datos externa, consulte [KingbaseES externo](../external/kingbase.md).

| Elemento de configuración | Descripción |
| --- | --- |
| Versiones compatibles | >= V9. |
| Versiones comerciales | Compatible con las ediciones Professional y Enterprise. |
| Tipo de base de datos | Modo compatible con PostgreSQL. |

:::warning Nota

Actualmente, solo se admiten bases de datos KingbaseES que se ejecuten en modo compatible con PostgreSQL.

:::

## Instalación

### Uso como base de datos principal

Consulte el proceso de instalación en [Instalar la aplicación NocoBase](/ai/install-nocobase-app). La principal diferencia está en las variables de entorno de la base de datos.

#### Variables de entorno

Modifique el archivo `.env` y añada o modifique las siguientes variables de entorno relacionadas con la base de datos:

```bash
# 根据实际情况调整 DB 相关参数
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### Instalación con Docker

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

#### Instalación mediante create-nocobase-app

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### Uso como base de datos externa

Si desea conectar KingbaseES como base de datos externa, consulte [KingbaseES externo](../external/kingbase.md) para conocer el punto de entrada de configuración, los parámetros de conexión y las reglas de sincronización.

## Instrucciones de uso

La fuente de datos principal KingbaseES es compatible con el modo PostgreSQL. Para la gestión diaria, puede consultar [Fuente de datos principal PostgreSQL](./postgresql.md).

1. Al implementar NocoBase, seleccione o introduzca los parámetros de conexión correspondientes a KingbaseES en la configuración de conexión de la base de datos.
2. Después de iniciar NocoBase, acceda a la fuente de datos «Main» en «Gestión de fuentes de datos» para administrar las tablas y los campos de la base de datos principal.
3. Si necesita conectar tablas que ya existen en la base de datos, puede utilizar «Sincronizar desde la base de datos» en la página de gestión de la base de datos principal.
4. Al configurar los campos de las tablas de datos, puede consultar los directorios [Tabla de datos](../data-modeling/collection.md) y [Campo](../data-modeling/collection-fields/index.md) para seleccionar los tipos de campo y los componentes de campo.

## Asignación de tipos de campo

Al crear campos desde una página de NocoBase en la base de datos principal, NocoBase crea los campos correspondientes de KingbaseES según la configuración del campo. Al conectar tablas existentes mediante «Sincronizar desde la base de datos», NocoBase identifica los tipos de campo de KingbaseES según la lógica de compatibilidad con PostgreSQL y los asigna automáticamente al Field type y Field interface adecuados. Puede ajustar la forma de visualización en la configuración del campo.

Las asignaciones habituales son las siguientes:

| Tipo de campo de KingbaseES | NocoBase Field type | Field interface disponibles |
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

:::warning Nota

Los tipos de campo de KingbaseES no compatibles se mostrarán por separado en la configuración de campos. Estos campos deberán adaptarse mediante desarrollo antes de poder utilizarse como campos normales en NocoBase.

:::

Para consultar más configuraciones generales, vea [Introducción a la fuente de datos principal](./index.md).
