---
title: "nb api resource destroy"
description: "Référence de la commande nb api resource destroy : supprimer un enregistrement pour la ressource NocoBase indiquée."
keywords: "nb api resource destroy,NocoBase CLI,supprimer un enregistrement,CRUD"
---

# nb api resource destroy

Supprimer un enregistrement de la ressource indiquée. Vous pouvez le cibler avec `--filter-by-tk` ou `--filter`.

## Utilisation

```bash
nb api resource destroy --resource <resource> [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--resource` | string | Nom de la ressource, requis |
| `--data-source` | string | Clé de la source de données, par défaut `main` |
| `--source-id` | string | ID de l'enregistrement source pour une ressource d'association |
| `--filter-by-tk` | string | Valeur de la clé primaire ; pour une clé composite ou plusieurs clés, passez un tableau JSON |
| `--filter` | string | Conditions de filtre sous forme d'objet JSON |

Les paramètres de connexion communs de [`nb api resource`](./index.md) sont également pris en charge.

## Exemples

```bash
nb api resource destroy --resource users --filter-by-tk 1
nb api resource destroy --resource posts --filter '{"status":"archived"}'
```

## Commandes connexes

- [`nb api resource list`](./list.md)
- [`nb api resource update`](./update.md)
