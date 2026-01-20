---
pkg: "@nocobase/plugin-data-source-kingbase"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Źródło danych - Baza danych KingbaseES

## Wprowadzenie

Baza danych KingbaseES może być używana jako źródło danych, zarówno jako główna, jak i zewnętrzna baza danych.

:::warning
Obecnie obsługiwane są wyłącznie bazy danych KingbaseES działające w trybie pg.
:::

## Instalacja

### Użycie jako główna baza danych

Procedura instalacji jest opisana w dokumentacji instalacji; główna różnica polega na zmiennych środowiskowych.

#### Zmienne środowiskowe

Należy edytować plik .env, aby dodać lub zmodyfikować następujące konfiguracje zmiennych środowiskowych:

```bash
# Dostosuj parametry bazy danych według potrzeb.
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### Instalacja Docker

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

#### Instalacja za pomocą create-nocobase-app

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### Użycie jako zewnętrzna baza danych

Należy wykonać polecenie instalacji lub aktualizacji:

```bash
yarn nocobase install
# or
yarn nocobase upgrade
```

Aktywacja wtyczki

![20241024121815](https://static-docs.nocobase.com/20241024121815.png)

## Instrukcja obsługi

- Główna baza danych: Proszę zapoznać się z [Głównym źródłem danych](/data-sources/data-source-main/)
- Zewnętrzna baza danych: Proszę zapoznać się z [Źródło danych / Zewnętrzna baza danych](/data-sources/data-source-manager/external-database)