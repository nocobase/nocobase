---
pkg: '@nocobase/plugin-api-keys'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Clés API

## Introduction

## Utilisation

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### Ajouter une clé API

![](https://static-docs.nocobase.com/46182fc0ad9a6fa5b14e97fcba12.png)

**Remarques**

- La clé API est créée pour l'utilisateur actuel et hérite de son rôle.
- Assurez-vous que la variable d'environnement `APP_KEY` est configurée et qu'elle reste confidentielle. Si la `APP_KEY` est modifiée, toutes les clés API existantes deviendront invalides.

### Comment configurer la APP_KEY

Pour la version Docker, modifiez le fichier `docker-compose.yml` :

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

Pour une installation via le code source ou `create-nocobase-app`, vous pouvez modifier directement la `APP_KEY` dans le fichier `.env` :

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```