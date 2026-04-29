---
title: "nb env info"
description: "Référence de la commande nb env info : consulter la configuration application, base de données, API et authentification d'un env NocoBase CLI."
keywords: "nb env info,NocoBase CLI,détails de l'environnement,configuration"
---

# nb env info

Consulter les détails d'un env, y compris la configuration de l'application, de la base de données, de l'API et de l'authentification.

## Utilisation

```bash
nb env info [name] [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `[name]` | string | Nom de l'env CLI à consulter ; utilise l'env courant si omis |
| `--env`, `-e` | string | Nom de l'env CLI à consulter ; alternative au paramètre positionnel |
| `--json` | boolean | Sortie au format JSON |
| `--show-secrets` | boolean | Afficher en clair les tokens, mots de passe et autres secrets |

Si `[name]` et `--env` sont passés ensemble, ils doivent correspondre.

## Exemples

```bash
nb env info app1
nb env info app1 --json
nb env info app1 --show-secrets
nb env info --env app1
```

## Commandes connexes

- [`nb env list`](./list.md)
- [`nb app start`](../app/start.md)
- [`nb db ps`](../db/ps.md)
