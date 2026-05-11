---
title: "nb env status"
description: "Référence de la commande nb env status : afficher l’état de l’env courant, d’un env ou de tous les env."
keywords: "nb env status,NocoBase CLI,état de l’environnement,API Base URL"
---

# nb env status

Affiche l’état d’un env. Par défaut, la commande inspecte l’env courant. Vous pouvez aussi inspecter un env nommé, ou utiliser `--all` pour tous les env.

Cette commande affiche un tableau simplifié avec `Env`, `Status` et `API Base URL`.

## Utilisation


nb env status [name] [flags]

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| [name] | string | Env name to inspect; uses the current env if omitted |
| --all | boolean | Show status for all configured envs |
| --json-output | boolean | Output the result as JSON |

`[name]` and `--all` cannot be used together.

## Status values

`Status` est le résultat renvoyé après la vérification de l’env cible par le CLI. Les valeurs courantes incluent :

- `ok` : l’env est joignable et authentifié
- `auth failed` : l’API est joignable, mais l’authentification a échoué
- `unreachable` : l’adresse cible n’a pas pu être atteinte
- `unconfigured` : la configuration de l’env est incomplète
- `missing` : l’application gérée pour cet env n’existe plus

## Exemples


nb env status
nb env status app1
nb env status --all
nb env status --all --json-output

## Commandes connexes

- [`nb env current`](./current.md)
- [`nb env list`](./list.md)
- [`nb env info`](./info.md)
