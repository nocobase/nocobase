---
pkg: "@nocobase/plugin-data-source-kingbase"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Datakälla - KingbaseES-databas

## Introduktion

Du kan använda KingbaseES-databasen som en datakälla, antingen som den primära databasen eller som en extern databas.

:::warning
För närvarande stöds endast KingbaseES-databaser som körs i pg-läge.
:::

## Installation

### Använda som primär databas

Se installationsdokumentationen för installationsprocedurerna. Den huvudsakliga skillnaden är relaterad till miljövariablerna.

#### Miljövariabler

Redigera .env-filen för att lägga till eller ändra följande miljövariabelkonfigurationer:

```bash
# Justera DB-parametrar vid behov
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### Docker-installation

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

#### Installation med create-nocobase-app

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### Använda som extern databas

Kör installations- eller uppgraderingskommandot

```bash
yarn nocobase install
# or
yarn nocobase upgrade
```

Aktivera plugin

![20241024121815](https://static-docs.nocobase.com/20241024121815.png)

## Användarhandbok

- Primär databas: Se [Huvuddatakälla](/data-sources/data-source-main/)
- Extern databas: Se [Datakälla / Extern databas](/data-sources/data-source-manager/external-database)