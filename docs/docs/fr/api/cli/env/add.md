---
title: "nb env add"
description: "Référence de la commande nb env add : enregistrer une adresse d'API NocoBase et sa méthode d'authentification, puis la définir comme env courant."
keywords: "nb env add,NocoBase CLI,ajouter un environnement,adresse de l'API,authentification"
---

# nb env add

Enregistrer un endpoint d'API NocoBase nommé et faire passer le CLI sur cet env. Si vous choisissez la méthode d'authentification `oauth`, le flux de connexion [`nb env auth`](./auth.md) est lancé automatiquement.

## Utilisation

```bash
nb env add [name] [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `[name]` | string | Nom de l'environnement ; demandé en TTY si omis, requis hors TTY |
| `--verbose` | boolean | Afficher la progression détaillée lors de l'écriture de la configuration |
| `--locale` | string | Langue des messages CLI : `en-US` ou `zh-CN` |
| `--api-base-url`, `-u` | string | Adresse de l'API NocoBase, incluant le préfixe `/api` |
| `--auth-type`, `-a` | string | Méthode d'authentification : `token` ou `oauth` |
| `--access-token`, `-t` | string | API key ou access token utilisé par la méthode `token` |

## Exemples

```bash
nb env add
nb env add local
nb env add local --api-base-url http://localhost:13000/api --auth-type oauth
nb env add local --api-base-url http://localhost:13000/api --auth-type token --access-token <token>
```

## Commandes connexes

- [`nb env auth`](./auth.md)
- [`nb env update`](./update.md)
- [`nb env list`](./list.md)
