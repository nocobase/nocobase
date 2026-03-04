---
pkg: "@nocobase/plugin-data-source-kingbase"
---

:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/data-sources/data-source-kingbase/index) voor nauwkeurige informatie.
:::

# Gegevensbron - KingbaseES

## Introductie

Gebruik de KingbaseES-database als gegevensbron; deze kan worden gebruikt als hoofddatabase of als externe database.

:::warning
Momenteel worden alleen KingbaseES-databases ondersteund die in pg-modus draaien.
:::

## Installatie

### Als hoofddatabase gebruiken

Raadpleeg de installatiedocumentatie voor het installatieproces; het verschil zit voornamelijk in de omgevingsvariabelen.

#### Omgevingsvariabelen

Pas het .env-bestand aan om de volgende relevante configuraties voor omgevingsvariabelen toe te voegen of te wijzigen:

```bash
# Pas de DB-gerelateerde parameters aan op basis van de werkelijke situatie
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

### Als externe database gebruiken

Voer het installatie- of upgradecommando uit

```bash
yarn nocobase install
# or
yarn nocobase upgrade
```

Activeer de plugin

![20241024121815](https://static-docs.nocobase.com/20241024121815.png)

## Gebruikershandleiding

- Hoofddatabase: Raadpleeg Hoofdgegevensbron
- Externe database: Raadpleeg [Gegevensbron / Externe database](/data-sources/data-source-manager/external-database)