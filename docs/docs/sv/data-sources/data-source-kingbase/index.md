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
      # Applikationsnyckel för att generera användartokens, etc.
      # Om APP_KEY ändras blir gamla tokens ogiltiga.
      # Använd en slumpmässig sträng och se till att den inte läcker ut.
      - APP_KEY=your-secret-key
      # Databastyp
      - DB_DIALECT=kingbase
      # Databasvärd, kan ersättas med befintlig databasserver-IP vid behov.
      - DB_HOST=kingbase
      # Databasnamn
      - DB_DATABASE=kingbase
      # Databasanvändare
      - DB_USER=nocobase
      # Databaslösenord
      - DB_PASSWORD=nocobase
      # Tidszon
      - TZ=Asia/Shanghai
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "13000:80"

  # Kingbase-tjänst endast för teständamål
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
      ENABLE_CI: no # Måste vara inställt på no
      DB_USER: nocobase
      DB_PASSWORD: nocobase
      DB_MODE: pg  # Endast pg
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