---
title: 'nb env info'
description: 'Référence de la commande nb env info : affiche la configuration de l’application, de la base de données, de l’API et de l’authentification pour l’env NocoBase CLI spécifié.'
keywords: 'nb env info,NocoBase CLI,détails de l’environnement,configuration'
---

# nb env info

Affiche les informations détaillées d’un seul env, y compris la configuration de l’application, de la base de données, de l’API et de l’authentification.

## Utilisation

```bash
nb env info [name] [flags]
```

## Paramètres

| Paramètre        | Type    | Description                                                                                                              |
| ---------------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| `[name]`         | string  | Nom de l’environnement configuré à afficher ; si omis, l’env actuel est utilisé                                          |
| `--json`         | boolean | Afficher en JSON                                                                                                         |
| `--field`        | string  | Retourne uniquement un champ en utilisant un chemin avec points, par exemple `app.url`, `app.appPath` ou `api.auth.type` |
| `--show-secrets` | boolean | Affiche en clair les tokens, mots de passe et autres secrets                                                             |

## Exemples

```bash
nb env info app1
nb env info app1 --json
nb env info app1 --field app.appPath
nb env info app1 --show-secrets
```

## Commandes associées

- [`nb env list`](./list.md)
- [`nb app start`](../app/start.md)
- [`nb db ps`](../db/ps.md)
