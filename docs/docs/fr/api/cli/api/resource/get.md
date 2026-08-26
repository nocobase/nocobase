---
title: "nb api resource get"
description: "Référence de la commande nb api resource get : récupérer un enregistrement de la ressource NocoBase indiquée."
keywords: "nb api resource get,NocoBase CLI,récupérer un enregistrement,clé primaire"
---

# nb api resource get

Récupérer un enregistrement de la ressource indiquée. Vous identifiez généralement l'enregistrement par sa clé primaire avec `--filter-by-tk`.

## Utilisation

```bash
nb api resource get --resource <resource> [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--resource` | string | Nom de la ressource, requis |
| `--data-source` | string | Clé de la source de données, par défaut `main` |
| `--source-id` | string | ID de l'enregistrement source pour une ressource d'association |
| `--filter-by-tk` | string | Valeur de la clé primaire ; pour une clé composite ou plusieurs clés, passez un tableau JSON |
| `--fields` | string[] | Champs à inclure, répétable ou tableau JSON |
| `--appends` | string[] | Champs d'association à ajouter, répétable ou tableau JSON |
| `--except` | string[] | Champs à exclure, répétable ou tableau JSON |

Les paramètres de connexion communs de [`nb api resource`](./index.md) sont également pris en charge.

## Exemples

```bash
nb api resource get --resource users --filter-by-tk 1
nb api resource get --resource posts.comments --source-id 1 --filter-by-tk 2
```

## Commandes connexes

- [`nb api resource list`](./list.md)
- [`nb api resource update`](./update.md)
