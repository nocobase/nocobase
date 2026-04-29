---
title: "nb api resource create"
description: "Référence de la commande nb api resource create : créer un enregistrement pour la ressource NocoBase indiquée."
keywords: "nb api resource create,NocoBase CLI,créer un enregistrement,CRUD"
---

# nb api resource create

Créer un enregistrement pour la ressource indiquée. Le contenu de l'enregistrement est passé via `--values` sous forme d'objet JSON.

## Utilisation

```bash
nb api resource create --resource <resource> --values <json> [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--resource` | string | Nom de la ressource, requis |
| `--data-source` | string | Clé de la source de données, par défaut `main` |
| `--source-id` | string | ID de l'enregistrement source pour une ressource d'association |
| `--values` | string | Données de l'enregistrement à créer, objet JSON, requis |
| `--whitelist` | string[] | Champs autorisés en écriture, répétable ou tableau JSON |
| `--blacklist` | string[] | Champs interdits en écriture, répétable ou tableau JSON |

Les paramètres de connexion communs de [`nb api resource`](./index.md) sont également pris en charge.

## Exemples

```bash
nb api resource create --resource users --values '{"nickname":"Ada"}'
nb api resource create --resource posts.comments --source-id 1 --values '{"content":"Hello"}'
```

## Commandes connexes

- [`nb api resource update`](./update.md)
- [`nb api resource destroy`](./destroy.md)
