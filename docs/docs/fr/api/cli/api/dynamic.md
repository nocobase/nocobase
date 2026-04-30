---
title: "nb api commandes dynamiques"
description: "Référence des commandes dynamiques nb api : commandes CLI générées à partir du schéma OpenAPI de NocoBase."
keywords: "nb api commandes dynamiques,NocoBase CLI,OpenAPI,swagger"
---

# nb api commandes dynamiques

En complément de [`nb api resource`](./resource/index.md), `nb api` propose un ensemble de commandes générées dynamiquement à partir du schéma OpenAPI de l'application NocoBase. Ces commandes sont produites et mises en cache lors du premier appel à [`nb env add`](../env/add.md) ou [`nb env update`](../env/update.md).

## Groupes courants

| Groupe de commandes | Description |
| --- | --- |
| `nb api acl` | Gestion des permissions : rôles, permissions de ressources et permissions d'opérations |
| `nb api api-keys` | Gestion des API Keys |
| `nb api app` | Gestion de l'application |
| `nb api authenticators` | Gestion de l'authentification : mot de passe, SMS, SSO, etc. |
| `nb api data-modeling` | Modélisation des données : sources, collections et champs |
| `nb api file-manager` | Gestion des fichiers : services de stockage et pièces jointes |
| `nb api flow-surfaces` | Composition de pages : pages, blocks, champs et actions |
| `nb api system-settings` | Paramètres système : titre, logo, langue, etc. |
| `nb api theme-editor` | Gestion des thèmes : couleurs, dimensions et changement de thème |
| `nb api workflow` | Workflow : gestion des processus automatisés |

Les groupes et commandes réellement disponibles dépendent de la version de l'application NocoBase connectée et des plugins activés. Exécutez les commandes suivantes pour consulter celles supportées par l'application courante :

```bash
nb api --help
nb api <topic> --help
```

## Paramètres de corps de requête

Les commandes dynamiques avec corps de requête prennent en charge :

| Paramètre | Type | Description |
| --- | --- | --- |
| `--body` | string | Corps de requête sous forme de chaîne JSON |
| `--body-file` | string | Chemin vers un fichier JSON |

`--body` et `--body-file` sont mutuellement exclusifs.

## Commandes connexes

- [`nb env update`](../env/update.md)
- [`nb api resource`](./resource/index.md)
