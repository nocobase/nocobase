---
pkg: "@nocobase/plugin-data-source-kingbase"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Source de données - KingbaseES

## Introduction

Vous pouvez utiliser la base de données KingbaseES comme source de données, que ce soit en tant que base de données principale ou externe.

:::warning
Actuellement, seules les bases de données KingbaseES fonctionnant en mode pg sont prises en charge.
:::

## Installation

### Utilisation en tant que base de données principale

Veuillez vous référer à la documentation d'installation pour les procédures de configuration. La principale différence réside dans les variables d'environnement.

#### Variables d'environnement

Modifiez le fichier .env pour ajouter ou modifier les configurations de variables d'environnement suivantes :

```bash
# Ajustez les paramètres DB selon vos besoins
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### Installation Docker

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

### Utilisation en tant que base de données externe

Exécutez la commande d'installation ou de mise à jour :

```bash
yarn nocobase install
# ou
yarn nocobase upgrade
```

Activez le plugin :

![20241024121815](https://static-docs.nocobase.com/20241024121815.png)

## Guide d'utilisation

- Base de données principale : Référez-vous à la [source de données principale](/data-sources/data-source-main/)
- Base de données externe : Consultez la [source de données / base de données externe](/data-sources/data-source-manager/external-database)