---
pkg: "@nocobase/plugin-data-source-kingbase"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Fonte dati - Database KingbaseES

## Introduzione

Il database KingbaseES può essere utilizzato come fonte dati, sia come database principale che come database esterno.

:::warning
Attualmente, sono supportati solo i database KingbaseES che operano in modalità pg.
:::

## Installazione

### Utilizzo come database principale

Faccia riferimento alla documentazione di installazione per le procedure di configurazione; la differenza principale risiede nelle variabili d'ambiente.

#### Variabili d'ambiente

Modifichi il file .env per aggiungere o modificare le seguenti configurazioni delle variabili d'ambiente:

```bash
# Regoli i parametri del DB in base alle necessità
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### Installazione Docker

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

#### Installazione tramite create-nocobase-app

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### Utilizzo come database esterno

Esegua il comando di installazione o aggiornamento

```bash
yarn nocobase install
# or
yarn nocobase upgrade
```

Attivi il plugin

![20241024121815](https://static-docs.nocobase.com/20241024121815.png)

## Guida per l'utente

- Database principale: Faccia riferimento a [Fonte dati principale](/data-sources/data-source-main/)
- Database esterno: Veda [Fonte dati / Database esterno](/data-sources/data-source-manager/external-database)