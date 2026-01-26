---
pkg: "@nocobase/plugin-data-source-kingbase"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Gegevensbron - KingbaseES-database

## Introductie

U kunt de KingbaseES-database gebruiken als gegevensbron, zowel als primaire database als als externe database.

:::warning
Momenteel worden alleen KingbaseES-databases ondersteund die in pg-modus draaien.
:::

## Installatie

### Gebruiken als primaire database

Raadpleeg de installatiedocumentatie voor de installatieprocedures. Het belangrijkste verschil zit in de omgevingsvariabelen.

#### Omgevingsvariabelen

Bewerk het .env-bestand om de volgende omgevingsvariabelen toe te voegen of aan te passen:

```bash
# Pas de DB-parameters aan waar nodig
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### Docker-installatie

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

#### Installatie met create-nocobase-app

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### Gebruiken als externe database

Voer het installatie- of upgradecommando uit:

```bash
yarn nocobase install
# or
yarn nocobase upgrade
```

Activeer de plugin

![20241024121815](https://static-docs.nocobase.com/20241024121815.png)

## Gebruikershandleiding

- Primaire database: Raadpleeg de [Hoofdgegevensbron](/data-sources/data-source-main/)
- Externe database: Zie [Gegevensbron / Externe database](/data-sources/data-source-manager/external-database)