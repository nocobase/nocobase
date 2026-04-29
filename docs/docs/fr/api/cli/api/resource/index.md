---
title: "nb api resource"
description: "Référence de la commande nb api resource : exécuter des opérations CRUD génériques et des requêtes d'agrégation sur n'importe quelle ressource NocoBase."
keywords: "nb api resource,NocoBase CLI,CRUD,ressource,collection"
---

# nb api resource

Exécuter des opérations CRUD génériques et des requêtes d'agrégation sur n'importe quelle ressource NocoBase. Le nom de la ressource peut être une ressource simple comme `users`, ou une ressource d'association comme `posts.comments`.

## Utilisation

```bash
nb api resource <command>
```

## Sous-commandes

| Commande | Description |
| --- | --- |
| [`nb api resource list`](./list.md) | Lister les enregistrements d'une ressource |
| [`nb api resource get`](./get.md) | Récupérer un seul enregistrement de ressource |
| [`nb api resource create`](./create.md) | Créer un enregistrement de ressource |
| [`nb api resource update`](./update.md) | Mettre à jour un enregistrement de ressource |
| [`nb api resource destroy`](./destroy.md) | Supprimer un enregistrement de ressource |
| [`nb api resource query`](./query.md) | Exécuter une requête d'agrégation |

## Paramètres communs

| Paramètre | Type | Description |
| --- | --- | --- |
| `--api-base-url` | string | Adresse de l'API NocoBase, par exemple `http://localhost:13000/api` |
| `--verbose` | boolean | Afficher la progression détaillée |
| `--env`, `-e` | string | Nom de l'environnement |
| `--role` | string | Substitution du rôle, envoyée dans l'en-tête `X-Role` |
| `--token`, `-t` | string | Substitution de l'API key |
| `--json-output`, `-j` / `--no-json-output` | boolean | Renvoyer le JSON brut, activé par défaut |
| `--resource` | string | Nom de la ressource, requis. Par exemple `users`, `orders`, `posts.comments` |
| `--data-source` | string | Clé de la source de données, par défaut `main` |

Les commandes sur ressource d'association acceptent en plus `--source-id` pour spécifier l'ID de l'enregistrement source.

## Exemples

```bash
nb api resource list --resource users
nb api resource get --resource users --filter-by-tk 1
nb api resource create --resource users --values '{"nickname":"Ada"}'
nb api resource list --resource posts.comments --source-id 1 --fields id --fields content
```

## Commandes connexes

- [`nb api`](../index.md)
- [`nb env update`](../../env/update.md)
