---
title: "nb env update"
description: "Référence de la commande nb env update : rafraîchir le schéma OpenAPI et le cache des commandes runtime d'un env."
keywords: "nb env update,NocoBase CLI,OpenAPI,commandes runtime,swagger"
---

# nb env update

Rafraîchir le schéma OpenAPI depuis l'application NocoBase et mettre à jour le cache des commandes runtime locales. Le cache est enregistré dans `.nocobase/versions/<hash>/commands.json`.

## Utilisation

```bash
nb env update [name] [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `[name]` | string | Nom de l'environnement ; utilise l'env courant si omis |
| `--verbose` | boolean | Afficher la progression détaillée |
| `--api-base-url` | string | Surcharger l'adresse de l'API NocoBase et la persister dans l'env cible |
| `--role` | string | Substitution du rôle, envoyée dans l'en-tête `X-Role` |
| `--token`, `-t` | string | Surcharger l'API key et la persister dans l'env cible |

## Exemples

```bash
nb env update
nb env update prod
nb env update prod --api-base-url http://localhost:13000/api
nb env update prod --token <token>
```

## Commandes connexes

- [`nb api`](../api/index.md)
- [`nb env info`](./info.md)
- [`nb env add`](./add.md)
