---
title: "nb api resource query"
description: "Référence de la commande nb api resource query : exécuter une requête d'agrégation sur la ressource NocoBase indiquée."
keywords: "nb api resource query,NocoBase CLI,requête d'agrégation,statistiques"
---

# nb api resource query

Exécuter une requête d'agrégation sur la ressource indiquée. `--measures`, `--dimensions` et `--orders` utilisent un format de tableau JSON.

## Utilisation

```bash
nb api resource query --resource <resource> [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--resource` | string | Nom de la ressource, requis |
| `--data-source` | string | Clé de la source de données, par défaut `main` |
| `--measures` | string | Définitions des mesures, sous forme de tableau JSON |
| `--dimensions` | string | Définitions des dimensions, sous forme de tableau JSON |
| `--orders` | string | Définitions de tri, sous forme de tableau JSON |
| `--filter` | string | Conditions de filtre sous forme d'objet JSON |
| `--having` | string | Conditions de filtre post-groupement sous forme d'objet JSON |
| `--limit` | integer | Nombre maximum de lignes retournées |
| `--offset` | integer | Nombre de lignes à ignorer |
| `--timezone` | string | Fuseau horaire utilisé pour la mise en forme de la requête |

Les paramètres de connexion communs de [`nb api resource`](./index.md) sont également pris en charge.

## Exemples

```bash
nb api resource query --resource orders --measures '[{"field":["id"],"aggregation":"count","alias":"count"}]'
nb api resource query --resource orders --dimensions '[{"field":["status"],"alias":"status"}]' --orders '[{"field":["createdAt"],"order":"desc"}]'
```

## Commandes connexes

- [`nb api resource list`](./list.md)
- [`nb api commandes dynamiques`](../dynamic.md)
