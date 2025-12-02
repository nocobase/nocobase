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
      # Clé de l'application, utilisée pour générer les jetons utilisateur, etc.
      # Si APP_KEY est modifiée, les anciens jetons deviendront invalides.
      # Utilisez une chaîne de caractères aléatoire et assurez-vous qu'elle ne soit pas divulguée.
      - APP_KEY=your-secret-key
      # Type de base de données
      - DB_DIALECT=kingbase
      # Hôte de la base de données, peut être remplacé par l'adresse IP d'un serveur de base de données existant
      - DB_HOST=kingbase
      # Nom de la base de données
      - DB_DATABASE=kingbase
      # Utilisateur de la base de données
      - DB_USER=nocobase
      # Mot de passe de la base de données
      - DB_PASSWORD=nocobase
      # Fuseau horaire
      - TZ=Asia/Shanghai
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "13000:80"

  # Service Kingbase uniquement à des fins de test
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
      ENABLE_CI: no # Doit être défini sur no
      DB_USER: nocobase
      DB_PASSWORD: nocobase
      DB_MODE: pg  # Uniquement pg
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