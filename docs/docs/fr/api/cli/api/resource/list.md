---
title: "nb api resource list"
description: "Référence de la commande nb api resource list : lister les enregistrements de la ressource NocoBase indiquée."
keywords: "nb api resource list,NocoBase CLI,lister,ressource"
---

# nb api resource list

Lister les enregistrements de la ressource indiquée. Utilisez `--filter`, `--fields`, `--sort`, `--page`, etc. pour piloter la requête.

## Utilisation

```bash
nb api resource list --resource <resource> [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--resource` | string | Nom de la ressource, requis |
| `--data-source` | string | Clé de la source de données, par défaut `main` |
| `--source-id` | string | ID de l'enregistrement source pour une ressource d'association |
| `--filter` | string | Conditions de filtre sous forme d'objet JSON |
| `--fields` | string[] | Champs à inclure, répétable ou tableau JSON |
| `--appends` | string[] | Champs d'association à ajouter, répétable ou tableau JSON |
| `--except` | string[] | Champs à exclure, répétable ou tableau JSON |
| `--sort` | string[] | Champs de tri, par exemple `-createdAt`. Répétable ou tableau JSON |
| `--page` | integer | Numéro de page |
| `--page-size` | integer | Nombre d'enregistrements par page |
| `--paginate` / `--no-paginate` | boolean | Activer ou non la pagination |

Les paramètres de connexion communs de [`nb api resource`](./index.md) sont également pris en charge.

## Exemples

```bash
nb api resource list --resource users
nb api resource list --resource posts.comments --source-id 1 --fields id --fields content
nb api resource list --resource users --filter '{"status":"active"}' --sort=-createdAt
```

## Commandes connexes

- [`nb api resource get`](./get.md)
- [`nb api resource query`](./query.md)
