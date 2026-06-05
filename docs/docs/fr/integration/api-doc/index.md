---
pkg: "@nocobase/plugin-api-doc"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::



# Documentation API

## Introduction

Ce plugin génère la documentation de l'API HTTP de NocoBase en se basant sur Swagger.

## Installation

C'est un plugin intégré, aucune installation n'est requise. Il vous suffit de l'activer pour l'utiliser.

## Instructions d'utilisation

### Accéder à la page de documentation de l'API

http://localhost:13000/admin/settings/api-doc/documentation

![](https://static-docs.nocobase.com/8db51cf50e3c666aba5a850a0fb664a0.png)

### Aperçu de la documentation

![](https://static-docs.nocobase.com/5bb4d3e5bba6c6fdfcd830592e72385b.png)

- Documentation API complète : `/api/swagger:get`
- Documentation de l'API du cœur (core) : `/api/swagger:get?ns=core`
- Documentation API de tous les plugins : `/api/swagger:get?ns=plugins`
- Documentation de chaque plugin : `/api/swagger:get?ns=plugins/{name}`
- Documentation API pour les collections personnalisées : `/api/swagger:get?ns=collections`
- Ressources spécifiques pour une `${collection}` et ses associations `${collection}.${association}` : `/api/swagger:get?ns=collections/{name}`

## Guide du développeur

### Comment rédiger la documentation Swagger pour les plugins

Ajoutez un fichier `swagger/index.ts` dans le dossier `src` de votre plugin, avec le contenu suivant :

```typescript
export default {
  info: {
    title: 'NocoBase API - Auth plugin',
  },
  tags: [],
  paths: {},
  components: {
    schemas: {},
  },
};
```

Pour les règles de rédaction détaillées, veuillez consulter la [documentation officielle de Swagger](https://swagger.io/docs/specification/about/).