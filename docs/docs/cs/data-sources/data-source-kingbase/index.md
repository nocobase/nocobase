---
pkg: "@nocobase/plugin-data-source-kingbase"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Zdroj dat - KingbaseES

## Úvod

Databázi KingbaseES můžete použít jako zdroj dat, a to buď jako primární, nebo jako externí databázi.

:::warning
V současné době jsou podporovány pouze databáze KingbaseES běžící v režimu pg.
:::

## Instalace

### Použití jako primární databáze

Postup instalace naleznete v dokumentaci k instalaci. Hlavní rozdíl spočívá v proměnných prostředí.

#### Proměnné prostředí

Upravte soubor .env a přidejte nebo upravte následující konfigurace proměnných prostředí:

```bash
# Upravte parametry DB podle potřeby
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### Instalace pomocí Dockeru

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
      # Klíč aplikace pro generování uživatelských tokenů atd.
      # Změna APP_KEY zneplatní staré tokeny.
      # Použijte náhodný řetězec a zajistěte, aby nebyl zveřejněn.
      - APP_KEY=your-secret-key
      # Typ databáze
      - DB_DIALECT=kingbase
      # Hostitel databáze, lze nahradit IP adresou existujícího databázového serveru
      - DB_HOST=kingbase
      # Název databáze
      - DB_DATABASE=kingbase
      # Uživatel databáze
      - DB_USER=nocobase
      # Heslo databáze
      - DB_PASSWORD=nocobase
      # Časové pásmo
      - TZ=Asia/Shanghai
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "13000:80"

  # Služba Kingbase pouze pro testovací účely
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
      ENABLE_CI: no # Musí být nastaveno na 'no'
      DB_USER: nocobase
      DB_PASSWORD: nocobase
      DB_MODE: pg  # Pouze pg
      NEED_START: yes
    command: ["/usr/sbin/init"]
```

#### Instalace pomocí create-nocobase-app

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### Použití jako externí databáze

Spusťte příkaz pro instalaci nebo upgrade.

```bash
yarn nocobase install
# or
yarn nocobase upgrade
```

Aktivujte plugin

![20241024121815](https://static-docs.nocobase.com/20241024121815.png)

## Uživatelská příručka

- Primární databáze: Viz [Hlavní zdroj dat](/data-sources/data-source-main/)
- Externí databáze: Viz [Zdroj dat / Externí databáze](/data-sources/data-source-manager/external-database)