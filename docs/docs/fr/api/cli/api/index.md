---
title: "nb api"
description: "Référence de la commande nb api : appeler l'API NocoBase via le CLI, avec les commandes resource génériques et les commandes dynamiques."
keywords: "nb api,NocoBase CLI,API,resource,OpenAPI"
---

# nb api

Appeler l'API NocoBase via le CLI. `nb api` regroupe les commandes CRUD génériques [`nb api resource`](./resource/index.md) ainsi que les commandes générées dynamiquement à partir du schéma OpenAPI de l'application courante.

## Utilisation

```bash
nb api <command>
```

## Sous-commandes

| Commande | Description |
| --- | --- |
| [`nb api resource`](./resource/index.md) | Exécuter des opérations CRUD génériques et des requêtes d'agrégation sur n'importe quelle ressource NocoBase |
| [`nb api commandes dynamiques`](./dynamic.md) | Commandes par topic et opération générées à partir du schéma OpenAPI de l'application |

## Paramètres communs

La plupart des commandes `nb api` acceptent les paramètres de connexion suivants :

| Paramètre | Type | Description |
| --- | --- | --- |
| `--api-base-url` | string | Adresse de l'API NocoBase, par exemple `http://localhost:13000/api` |
| `--env`, `-e` | string | Nom de l'environnement |
| `--token`, `-t` | string | Substitution de l'API key |
| `--role` | string | Substitution du rôle, envoyée dans l'en-tête `X-Role` |
| `--verbose` | boolean | Afficher la progression détaillée |
| `--json-output`, `-j` / `--no-json-output` | boolean | Renvoyer le JSON brut, activé par défaut |

## Exemples

```bash
nb api resource list --resource users -e app1
nb api resource get --resource users --filter-by-tk 1 -e app1
nb api resource create --resource users --values '{"nickname":"Ada"}' -e app1
nb api resource list --resource users -e app1 --no-json-output
```

## Commandes connexes

- [`nb env update`](../env/update.md)
- [`nb env add`](../env/add.md)
