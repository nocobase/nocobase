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
      # Klucz aplikacji, używany do generowania tokenów użytkowników itp.
      # Zmiana APP_KEY unieważnia stare tokeny.
      # Może być dowolnym losowym ciągiem znaków; proszę upewnić się, że nie zostanie ujawniony.
      - APP_KEY=your-secret-key
      # Typ bazy danych
      - DB_DIALECT=kingbase
      # Host bazy danych, można zastąpić istniejącym adresem IP serwera bazy danych.
      - DB_HOST=kingbase
      # Nazwa bazy danych
      - DB_DATABASE=kingbase
      # Użytkownik bazy danych
      - DB_USER=nocobase
      # Hasło do bazy danych
      - DB_PASSWORD=nocobase
      # Strefa czasowa
      - TZ=Asia/Shanghai
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "13000:80"

  # Usługa Kingbase wyłącznie do celów testowych
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
      ENABLE_CI: no # Musi być ustawione na 'no'
      DB_USER: nocobase
      DB_PASSWORD: nocobase
      DB_MODE: pg  # Tylko pg
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